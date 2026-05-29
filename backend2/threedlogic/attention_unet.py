"""
3D Attention U-Net for preform prediction (backend2).

An upgrade of the plain 3D U-Net: attention gates on each skip connection let
the decoder suppress irrelevant background voxels and focus on the regions that
actually matter for the preform shape. It is a drop-in replacement for
build_unet_3d in train_unet.py -- same 128^3 input/output, same loss/metric,
same custom_objects -- so the trained .h5 loads straight into run_pipeline.

Train this OFFLINE on a GPU (lab workstation or free Google Colab GPU). A 128^3
attention U-Net is heavier than the plain one and is not suitable for the
CPU-only Railway/Cloud Run web container.
"""

import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import tensorflow as tf
from tensorflow.keras import layers, Model, Input

# Reuse the EXACT loss/metric definitions and the dataset/training helpers
# already in the project, so nothing about the inference contract changes.
from .giveStlModelBase64 import (
    dice_coef,
    voxel_loss,             # noqa: F401  (custom_objects parity)
    folding_loss,           # noqa: F401
    weighted_folding_loss,
)
from .train_unet import build_dataset_from_npy, train_model  # reuse data + loop


# ---------------------------------------------------------------------------
# Attention gate (Oktay et al., 2018) — 3D version
# ---------------------------------------------------------------------------
def attention_gate_3d(skip, gating, inter_channels):
    """Gate the encoder skip features `skip` using decoder context `gating`.

    Returns `skip` re-weighted by a learned spatial attention coefficient in
    [0, 1], so uninformative regions are damped before concatenation.
    """
    theta = layers.Conv3D(inter_channels, 1, strides=1, padding="same")(skip)
    phi = layers.Conv3D(inter_channels, 1, strides=1, padding="same")(gating)
    add = layers.add([theta, phi])
    act = layers.Activation("relu")(add)
    psi = layers.Conv3D(1, 1, strides=1, padding="same")(act)
    alpha = layers.Activation("sigmoid")(psi)            # attention coefficients
    return layers.multiply([skip, alpha])


def build_attention_unet_3d(input_shape=(128, 128, 128, 1), base_filters=16):
    """Encoder-decoder 3D U-Net with attention gates on every skip connection."""
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

    # Decoder with attention-gated skips
    g3 = layers.UpSampling3D(2)(b)
    a3 = attention_gate_3d(c3, g3, base_filters * 4)
    u3 = layers.concatenate([g3, a3])
    c4 = conv_block(u3, base_filters * 4)

    g2 = layers.UpSampling3D(2)(c4)
    a2 = attention_gate_3d(c2, g2, base_filters * 2)
    u2 = layers.concatenate([g2, a2])
    c5 = conv_block(u2, base_filters * 2)

    g1 = layers.UpSampling3D(2)(c5)
    a1 = attention_gate_3d(c1, g1, base_filters)
    u1 = layers.concatenate([g1, a1])
    c6 = conv_block(u1, base_filters)

    out = layers.Conv3D(1, 1, activation="sigmoid")(c6)
    return Model(inp, out, name="preform_attention_unet3d")


# ---------------------------------------------------------------------------
# Training entry point — reuses train_unet.train_model but swaps the builder
# ---------------------------------------------------------------------------
def train_attention_model(X, Y, out_path="preform_attention_unet3d.h5",
                          epochs=100, batch_size=2, lr=1e-3,
                          val_split=0.15, base_filters=16):
    """Same training loop as train_unet, with the attention architecture.

    We monkey-build the model here and hand it to a compiled fit, mirroring
    train_model's callbacks/metrics so results are directly comparable to the
    plain U-Net baseline.
    """
    from tensorflow.keras.callbacks import (
        EarlyStopping, ModelCheckpoint, ReduceLROnPlateau,
    )

    model = build_attention_unet_3d(input_shape=X.shape[1:], base_filters=base_filters)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(lr),
        loss=weighted_folding_loss,
        metrics=[dice_coef],
    )
    callbacks = [
        EarlyStopping(monitor="val_dice_coef", mode="max",
                      patience=15, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=6, min_lr=1e-6),
        ModelCheckpoint(out_path, monitor="val_dice_coef", mode="max",
                        save_best_only=True),
    ]
    history = model.fit(
        X, Y, validation_split=val_split, epochs=epochs,
        batch_size=batch_size, callbacks=callbacks, verbose=2,
    )
    model.save(out_path)
    return out_path, history.history


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Train the 3D Attention U-Net.")
    ap.add_argument("--inputs",  required=True, help="dir of X_*.npy billet voxels")
    ap.add_argument("--targets", required=True, help="dir of Y_*.npy preform voxels")
    ap.add_argument("--out",     default="preform_attention_unet3d.h5")
    ap.add_argument("--epochs",  type=int,   default=100)
    ap.add_argument("--batch",   type=int,   default=2)
    ap.add_argument("--lr",      type=float, default=1e-3)
    args = ap.parse_args()

    X, Y = build_dataset_from_npy(args.inputs, args.targets)
    print(f"[INFO] dataset: X={X.shape}  Y={Y.shape}")
    path, hist = train_attention_model(
        X, Y, out_path=args.out,
        epochs=args.epochs, batch_size=args.batch, lr=args.lr,
    )
    best = max(hist.get("val_dice_coef", [0.0]))
    print(f"[INFO] saved {path}  |  best val dice = {best:.4f}")
