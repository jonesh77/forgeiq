"""
Cogging pipeline — end-to-end integration test.

Real production data flow:

    Cogging data.xlsx
        → traindatacorrection.correct_train_data   (adds modify_BQI, drops 4 cols)
        → 11-column training file
        → gradient_boosting.process_excel_gb        (trains ENE/BQI regressor)

This is the most valuable single test in the suite: it exercises the actual
chain a user clicks through, on the actual shipped sample data, and asserts the
trainer returns a well-formed, deployable model bundle plus honest
cross-validated metrics.

Runs without TensorFlow (the GB path uses XGBoost if present, else sklearn's
HistGradientBoostingRegressor).
"""
import base64
import io
import tempfile

import joblib
import numpy as np
import pytest

from traindatacorrection import correct_train_data
from gradient_boosting import process_excel_gb, make_keras_like_predictor


@pytest.fixture(scope="module")
def corrected_training_file(cogging_xlsx, tmp_path_factory):
    """Run the correction step and write the 11-column result to a temp .xlsx."""
    payload = correct_train_data(str(cogging_xlsx), target_astm=6.0, weight_factor=0.1)
    raw = base64.b64decode(payload["file"])
    out = tmp_path_factory.mktemp("cog") / "corrected.xlsx"
    out.write_bytes(raw)
    return str(out)


def test_corrected_file_has_11_columns(corrected_training_file):
    import pandas as pd
    df = pd.read_excel(corrected_training_file)
    # 14 original − 4 merged + 1 modify_BQI = 11 → matches the trainer's layout
    assert df.shape[1] == 11, f"trainer expects 11 cols, got {df.shape[1]}"


def test_gb_trainer_returns_wellformed_payload(corrected_training_file):
    res = process_excel_gb(corrected_training_file, n_splits=5)

    assert res["status"] == "good"
    assert res["backend"] in ("xgboost", "hist_gbr")
    assert res["n_samples"] > 0

    # metrics block present and finite
    m = res["metrics"]
    for key in ("rmse_mean", "rmse_std", "mae_mean", "r2_mean",
                "pi_width_mean", "pi_coverage_pct"):
        assert key in m, f"missing metric {key}"
        assert np.isfinite(m[key]), f"metric {key} is not finite"

    # uncertainty coverage is a percentage
    assert 0.0 <= m["pi_coverage_pct"] <= 100.0
    assert m["pi_width_mean"] >= 0.0

    # leakage diagnostic present
    assert "feature_target_corr" in res["diagnostics"]


def test_gb_diagnostic_image_is_valid_png(corrected_training_file):
    res = process_excel_gb(corrected_training_file, n_splits=5)
    png = base64.b64decode(res["image"])
    # PNG magic number
    assert png[:8] == b"\x89PNG\r\n\x1a\n", "diagnostic image is not a valid PNG"


def test_gb_model_bundle_loads_and_predicts(corrected_training_file):
    """The saved bundle must be loadable and the keras-like adapter must
    produce an (n, 1) prediction — this is exactly what the pass-schedule
    optimizer relies on."""
    res = process_excel_gb(corrected_training_file, n_splits=5)
    raw = base64.b64decode(res["model_b64"])

    with tempfile.NamedTemporaryFile(suffix=".pkl") as tmp:
        tmp.write(raw)
        tmp.flush()
        bundle = joblib.load(tmp.name)

    for key in ("model", "scaler", "selector", "feature_names", "kept_names"):
        assert key in bundle, f"bundle missing {key}"

    predictor = make_keras_like_predictor(bundle)
    n_feat = len(bundle["kept_names"])
    X = np.zeros((3, n_feat), dtype=float)
    pred = predictor.predict(X)
    assert pred.shape == (3, 1), f"adapter must return (n,1), got {pred.shape}"
    assert np.isfinite(pred).all()


def test_gb_is_deterministic(corrected_training_file):
    """Fixed random_state=42 everywhere → identical metrics across runs.
    Non-determinism here would make results unreproducible for a buyer/reviewer."""
    a = process_excel_gb(corrected_training_file, n_splits=5)["metrics"]
    b = process_excel_gb(corrected_training_file, n_splits=5)["metrics"]
    assert a["rmse_mean"] == pytest.approx(b["rmse_mean"], rel=1e-9)
    assert a["r2_mean"] == pytest.approx(b["r2_mean"], rel=1e-9)
