"""
3D U-Net training for the preform-prediction model (backend2).

Produces a .h5 that is fully compatible with giveStlModelBase64.run_pipeline:
  - input / output voxel grid : 128^3, single channel
  - loss / metric             : weighted_folding_loss / dice_coef
  - custom objects on load     : voxel_loss, folding_loss,
                                 weighted_folding_loss, dice_coef

----------------------------------------------------------------------------
IMPORTANT — WHERE TO RUN THIS
----------------------------------------------------------------------------
A 128^3 3D U-Net is VERY heavy. Each float32 voxel is ~8.4 MB, and the
network activations need several GB of VRAM. Train this on a GPU machine
(your lab workstation, or free Google Colab GPU) — NOT on the Railway /
Cloud Run web container, which has no GPU and limited RAM. Deploy only the
inference path (run_pipeline) to the web; keep training offline.
----------------------------------------------------------------------------
"""

import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import glob
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model, Input
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau,
)

# Reuse the EXACT loss/metric and voxel pipeline already in the project, so the
# trained model reloads with the same custom_objects used by _load_or_cache_model.
from .giveStlModelBase64 import (
    dice_coef,
    voxel_loss,            # noqa: F401  (kept for custom_objects parity)
    folding_loss,          # noqa: F401
    weighted_folding_loss,
    convert_single_dat_to_voxel,
    resize_voxel,
    load_bbox_from_csv,
    grid_size,             # (128, 128, 128)
)

GRID = grid_size


# ---------------------------------------------------------------------------
# 1) Model architecture — a compact 3D U-Net (billet voxel -> preform voxel)
# ---------------------------------------------------------------------------
def build_unet_3d(input_shape=(128, 128, 128, 1), base_filters=16):
    """Standard encoder-decoder 3D U-Net with skip connections.

    NOTE: the original .h5 architecture is unknown (it is only loaded, never
    defined in code). This is a clean, compatible reconstruction: it accepts a
    128^3 input and outputs a 128^3 sigmoid occupancy map, so the resulting
    model drops straight into the existing inference pipeline. If you know the
    original layer layout, mirror it here for best fidelity.
    """
    def conv_block(x, f):
        x = layers.Conv3D(f, 3, padding="same")(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation("relu")(x)
        x = layers.Conv3D(f, 3, padding="same")(x)
        x = layers.BatchNormalization()(x)
        x = layers.Activation("relu")(x)
        return x

    inp = Input(shape=input_shape)

    # Encoder
    c1 = conv_block(inp, base_filters)
    p1 = layers.MaxPooling3D(2)(c1)
    c2 = conv_block(p1, base_filters * 2)
    p2 = layers.MaxPooling3D(2)(c2)
    c3 = conv_block(p2, base_filters * 4)
    p3 = layers.MaxPooling3D(2)(c3)

    # Bottleneck
    b = conv_block(p3, base_filters * 8)

    # Decoder
    u3 = layers.UpSampling3D(2)(b)
    u3 = layers.concatenate([u3, c3])
    c4 = conv_block(u3, base_filters * 4)
    u2 = layers.UpSampling3D(2)(c4)
    u2 = layers.concatenate([u2, c2])
    c5 = conv_block(u2, base_filters * 2)
    u1 = layers.UpSampling3D(2)(c5)
    u1 = layers.concatenate([u1, c1])
    c6 = conv_block(u1, base_filters)

    out = layers.Conv3D(1, 1, activation="sigmoid")(c6)
    return Model(inp, out, name="preform_unet3d")


# ---------------------------------------------------------------------------
# 2) Dataset preparation — build (X, Y) voxel pairs
# ---------------------------------------------------------------------------
def voxel_from_dat(dat1_path, dat2_path, csv_path):
    """Build a 128^3 billet voxel from a node/element .dat pair.

    Mirrors the inference preprocessing exactly (same bbox, same resize),
    so training and serving see identical inputs.
    """
    min_c, max_c = load_bbox_from_csv(csv_path)
    vd = convert_single_dat_to_voxel(dat1_path, dat2_path, min_c, max_c)
    return resize_voxel(vd["voxels"], GRID).astype("float32")


def build_dataset_from_npy(input_dir, target_dir):
    """Recommended path: precompute voxels offline and save as .npy.

    Layout:
        input_dir/X_<name>.npy   -> initial billet voxel  (128^3, values 0/1)
        target_dir/Y_<name>.npy  -> target preform voxel  (128^3, values 0/1)

    Returns X, Y shaped (N, 128, 128, 128, 1) float32.
    """
    X, Y = [], []
    for xf in sorted(glob.glob(os.path.join(input_dir, "X_*.npy"))):
        name = os.path.basename(xf)[2:]                       # strip "X_"
        yf = os.path.join(target_dir, "Y_" + name)
        if not os.path.exists(yf):
            print(f"[WARN] no target for {name}, skipping")
            continue
        X.append(resize_voxel(np.load(xf).astype("float32"), GRID))
        Y.append(resize_voxel(np.load(yf).astype("float32"), GRID))
    if not X:
        raise ValueError("No matching X_/Y_ .npy pairs found.")
    X = np.asarray(X)[..., np.newaxis]
    Y = np.asarray(Y)[..., np.newaxis]
    return X, Y


# ---------------------------------------------------------------------------
# 3) Training entry point
# ---------------------------------------------------------------------------
def train_model(X, Y, out_path="preform_unet3d.h5",
                epochs=100, batch_size=2, lr=1e-3,
                val_split=0.15, base_filters=16):
    """Train the 3D U-Net and save a .h5 compatible with the inference code."""
    model = build_unet_3d(input_shape=X.shape[1:], base_filters=base_filters)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(lr),
        loss=weighted_folding_loss,        # same loss the inference model used
        metrics=[dice_coef],
    )

    callbacks = [
        EarlyStopping(monitor="val_dice_coef", mode="max",
                      patience=15, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5,
                          patience=6, min_lr=1e-6),
        ModelCheckpoint(out_path, monitor="val_dice_coef", mode="max",
                        save_best_only=True),
    ]

    history = model.fit(
        X, Y,
        validation_split=val_split,
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=2,
    )
    model.save(out_path)                   # final save (best epoch already checkpointed)
    return out_path, history.history


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Train the 3D preform U-Net.")
    ap.add_argument("--inputs",  required=True, help="dir of X_*.npy billet voxels")
    ap.add_argument("--targets", required=True, help="dir of Y_*.npy preform voxels")
    ap.add_argument("--out",     default="preform_unet3d.h5")
    ap.add_argument("--epochs",  type=int,   default=100)
    ap.add_argument("--batch",   type=int,   default=2)
    ap.add_argument("--lr",      type=float, default=1e-3)
    args = ap.parse_args()

    X, Y = build_dataset_from_npy(args.inputs, args.targets)
    print(f"[INFO] dataset: X={X.shape}  Y={Y.shape}")
    path, hist = train_model(
        X, Y, out_path=args.out,
        epochs=args.epochs, batch_size=args.batch, lr=args.lr,
    )
    best = max(hist.get("val_dice_coef", [0.0]))
    print(f"[INFO] saved {path}  |  best val dice = {best:.4f}")
