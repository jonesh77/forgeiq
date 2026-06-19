"""
Pass-Schedule optimizer — output-structure, math-invariant and
equipment-feasibility tests.

The optimizer in ``cogginglogic/passschedule.py`` loads a Keras model, so these
tests need TensorFlow/Keras. They are skipped automatically if it is not
installed (``pytest.importorskip``). We build a tiny throwaway 10→1 model: the
ML accuracy is irrelevant here — we are verifying that the deterministic
post-processing math (forging ratios, length changes, cutting lengths, void
closure) and the equipment feasibility logic are correct for ANY model.
"""
import base64
import io
import math
import tempfile

import numpy as np
import pandas as pd
import pytest

keras = pytest.importorskip("keras", reason="TensorFlow/Keras not installed")

from traindatacorrection import correct_train_data
from passschedule import process_pass_schedule


# ── helpers ──────────────────────────────────────────────────────────────────
class _MemFile:
    """Minimal FileStorage-like shim exposing .read()/.save() like Werkzeug's."""
    def __init__(self, data: bytes):
        self._data = data
        self.stream = io.BytesIO(data)

    def read(self):
        return self._data

    def save(self, dest):
        with open(dest, "wb") as f:
            f.write(self._data)


@pytest.fixture(scope="module")
def corrected_xlsx_bytes(cogging_xlsx):
    payload = correct_train_data(str(cogging_xlsx), target_astm=6.0, weight_factor=0.1)
    return base64.b64decode(payload["file"])


@pytest.fixture(scope="module")
def tiny_h5_model():
    """A small 10→1 Keras model saved as .h5 bytes."""
    from keras.models import Sequential
    from keras.layers import Dense, Input

    # Inference-only: do NOT compile (avoids serializing a loss/metric that some
    # Keras versions refuse to deserialize on load_model). The optimizer only
    # ever calls model.predict(), so weights alone are enough.
    m = Sequential([Input(shape=(10,)), Dense(8, activation="relu"), Dense(1)])
    with tempfile.NamedTemporaryFile(suffix=".h5", delete=False) as tmp:
        m.save(tmp.name, include_optimizer=False)
        path = tmp.name
    with open(path, "rb") as f:
        return f.read()


@pytest.fixture(scope="module")
def schedule_result(tiny_h5_model, corrected_xlsx_bytes):
    return process_pass_schedule(
        _MemFile(tiny_h5_model),
        io.BytesIO(corrected_xlsx_bytes),
        initial_cross_section=110.0,
        initial_length=1500.0,
        cutting_length=800.0,
    )


# ── output structure ─────────────────────────────────────────────────────────
def test_result_has_all_keys(schedule_result):
    for key in ("feed", "depth_schedule", "number_of_rotation", "pass_schedule",
                "forging_ratios", "length_changes", "cutting_lengths",
                "void_closure", "feasibility"):
        assert key in schedule_result, f"missing key {key}"


def test_seven_passes_everywhere(schedule_result):
    for key in ("pass_schedule", "forging_ratios", "length_changes",
                "cutting_lengths", "void_closure"):
        assert len(schedule_result[key]) == 7, f"{key} must have 7 entries"


# ── math invariants ──────────────────────────────────────────────────────────
def test_void_closure_in_physical_range(schedule_result):
    for v in schedule_result["void_closure"]:
        assert 0.0 <= v <= 100.0, f"void closure {v} outside [0,100]%"


def test_void_closure_matches_polynomial(schedule_result):
    """Recompute closure from returned lengths with the documented polynomial
    V(ε)=1+Bε+Cε²+Dε³ and confirm the shipped code produced exactly that."""
    B, C, D = -1.521351466, 0.818014592, -0.145775097
    L0 = 1500.0
    for L, got in zip(schedule_result["length_changes"], schedule_result["void_closure"]):
        eps = math.log((L - L0) / L0 + 1)
        V = 1 + B * eps + C * eps**2 + D * eps**3
        expected = min(abs(V - 1) * 100, 100)
        assert got == pytest.approx(expected, abs=1e-6)


def test_forging_ratios_are_NxN_strings(schedule_result):
    for s in schedule_result["forging_ratios"]:
        assert "×" in s
        a, b = s.split("×")
        assert a == b, "square cross-section sides must match"
        int(a)  # parses as int


def test_cutting_lengths_format(schedule_result):
    for s in schedule_result["cutting_lengths"]:
        # format "<len> (<qty>)"
        assert "(" in s and s.endswith(")")


# ── equipment feasibility logic ──────────────────────────────────────────────
def test_temperatures_decay_by_drop_per_pass(tiny_h5_model, corrected_xlsx_bytes):
    res = process_pass_schedule(
        _MemFile(tiny_h5_model), io.BytesIO(corrected_xlsx_bytes),
        initial_cross_section=110.0, initial_length=1500.0, cutting_length=800.0,
        initial_temp_C=1200.0, temp_drop_per_pass_C=50.0,
    )
    temps = res["feasibility"]["temperatures_C"]
    assert temps[0] == pytest.approx(1200.0)
    for i in range(1, 7):
        assert temps[i] == pytest.approx(1200.0 - 50.0 * i)


def test_low_min_temp_triggers_temp_warning(tiny_h5_model, corrected_xlsx_bytes):
    """With a steep temp drop, later passes fall below min_temp_C and must be
    flagged — this is the safety check a buyer cares about."""
    res = process_pass_schedule(
        _MemFile(tiny_h5_model), io.BytesIO(corrected_xlsx_bytes),
        initial_cross_section=110.0, initial_length=1500.0, cutting_length=800.0,
        initial_temp_C=1000.0, temp_drop_per_pass_C=100.0, min_temp_C=900.0,
    )
    f = res["feasibility"]
    assert f["any_temp_too_low"] is True
    assert any(f["temp_warnings"])
    assert f["all_passes_feasible"] is False


def test_feasibility_arrays_length_seven(schedule_result):
    f = schedule_result["feasibility"]
    assert len(f["force_tons_per_pass"]) == 7
    assert len(f["temperatures_C"]) == 7
    assert len(f["force_warnings"]) == 7
    assert len(f["temp_warnings"]) == 7
