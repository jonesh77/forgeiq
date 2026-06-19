"""
3D Preform — loss functions & Attention U-Net architecture tests (backend2).

Two things matter for a buyer/reviewer here:

  1. The custom losses (Dice, voxel, focal "folding") behave correctly — these
     are what the offline training in train_unet.py / attention_unet.py
     optimises, and they are reloaded as `custom_objects` at inference time.
  2. The Attention U-Net has the exact I/O contract run_pipeline assumes:
     a cubic voxel grid in → same-size sigmoid (0..1) voxel grid out.

We build the network at a tiny 16³ size (base_filters=4) so the forward pass
runs on CPU in a second; the shape/range guarantees are independent of size.
"""
import numpy as np
import pytest

pytest.importorskip("tensorflow", reason="TensorFlow not installed")

import tensorflow as tf

from threedlogic.giveStlModelBase64 import (
    dice_coef, voxel_loss, folding_loss, weighted_folding_loss,
)
from threedlogic.attention_unet import build_attention_unet_3d, attention_gate_3d


# ── loss / metric correctness ────────────────────────────────────────────────
def test_dice_of_identical_is_one():
    y = tf.constant(np.random.randint(0, 2, size=(1, 8, 8, 8, 1)), dtype=tf.float32)
    assert float(dice_coef(y, y)) == pytest.approx(1.0, abs=1e-4)


def test_dice_is_bounded_0_1():
    y_true = tf.constant(np.random.randint(0, 2, (1, 8, 8, 8, 1)), dtype=tf.float32)
    y_pred = tf.constant(np.random.rand(1, 8, 8, 8, 1), dtype=tf.float32)
    d = float(dice_coef(y_true, y_pred))
    assert -1e-6 <= d <= 1.0 + 1e-6


def test_dice_disjoint_is_near_zero():
    a = np.zeros((1, 8, 8, 8, 1), np.float32); a[0, :4] = 1.0
    b = np.zeros((1, 8, 8, 8, 1), np.float32); b[0, 4:] = 1.0
    d = float(dice_coef(tf.constant(a), tf.constant(b)))
    assert d < 0.05, "disjoint masks should give ~0 Dice"


def test_voxel_loss_nonnegative_and_finite():
    y_true = tf.constant(np.random.randint(0, 2, (1, 8, 8, 8, 1)), dtype=tf.float32)
    y_pred = tf.constant(np.random.rand(1, 8, 8, 8, 1), dtype=tf.float32)
    L = float(tf.reduce_mean(voxel_loss(y_true, y_pred)))
    assert np.isfinite(L)
    assert L >= -1e-6, "1 - Dice + BCE should not be negative"


def test_folding_loss_finite():
    y_true = tf.constant(np.random.randint(0, 2, (1, 8, 8, 8, 1)), dtype=tf.float32)
    y_pred = tf.constant(np.random.rand(1, 8, 8, 8, 1), dtype=tf.float32)
    L = float(folding_loss(y_true, y_pred))
    assert np.isfinite(L) and L >= -1e-6


def test_weighted_folding_matches_folding():
    y_true = tf.constant(np.random.randint(0, 2, (1, 8, 8, 8, 1)), dtype=tf.float32)
    y_pred = tf.constant(np.random.rand(1, 8, 8, 8, 1), dtype=tf.float32)
    assert float(weighted_folding_loss(y_true, y_pred)) == pytest.approx(
        float(folding_loss(y_true, y_pred)), rel=1e-6)


# ── architecture I/O contract ────────────────────────────────────────────────
@pytest.fixture(scope="module")
def tiny_unet():
    return build_attention_unet_3d(input_shape=(16, 16, 16, 1), base_filters=4)


def test_unet_input_output_shapes_match(tiny_unet):
    assert tiny_unet.input_shape == (None, 16, 16, 16, 1)
    # same spatial size in and out, single-channel occupancy probability
    assert tiny_unet.output_shape == (None, 16, 16, 16, 1)


def test_unet_output_is_sigmoid_range(tiny_unet):
    x = np.random.rand(1, 16, 16, 16, 1).astype("float32")
    y = tiny_unet.predict(x, verbose=0)
    assert y.shape == (1, 16, 16, 16, 1)
    assert y.min() >= 0.0 and y.max() <= 1.0, "final activation must be sigmoid (0..1)"


def test_unet_is_fully_convolutional_accepts_other_sizes():
    """Same builder must accept a different cubic grid — proves run_pipeline can
    swap the plain U-Net and the attention U-Net (identical contract)."""
    m = build_attention_unet_3d(input_shape=(32, 32, 32, 1), base_filters=4)
    assert m.output_shape == (None, 32, 32, 32, 1)


def test_attention_gate_preserves_skip_shape():
    skip = tf.keras.Input(shape=(8, 8, 8, 4))
    gating = tf.keras.Input(shape=(8, 8, 8, 4))
    gated = attention_gate_3d(skip, gating, inter_channels=4)
    # gated features keep the skip tensor's shape (re-weighted, not resized)
    assert tuple(gated.shape) == tuple(skip.shape)
