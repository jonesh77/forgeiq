"""
Cogging ENE predictor — modern Gradient Boosting variant.

A drop-in alternative to fourimages1h5.process_excel that replaces the small
Keras MLP with a gradient-boosted-tree regressor. On the small tabular cogging
datasets this almost always beats a deep net, trains in <1 s, and is far easier
to interpret (per-feature importances + optional SHAP).

Design choices that keep it compatible with the rest of backend1:
  * Same 11-column Excel layout and the same StandardScaler + SelectKBest(k=10)
    front end, so the Pass-Schedule optimizer can reuse the identical transform.
  * Honest evaluation: k-fold cross-validation (not a single 80/20 split),
    reporting mean +/- std for RMSE / MAE / R^2.
  * Model artifact saved with joblib (.pkl), returned base64-encoded.
"""

import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import io
import base64
import tempfile

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib

from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.inspection import permutation_importance

# Prefer XGBoost if available; otherwise fall back to scikit-learn's
# HistGradientBoostingRegressor (no extra dependency, already shipped with sklearn).
try:
    from xgboost import XGBRegressor
    _HAS_XGB = True
except Exception:
    from sklearn.ensemble import HistGradientBoostingRegressor
    _HAS_XGB = False

COLUMN_NAMES = ["Feed", "Depth Schedule", "Number of Rotataion",
                "Pass1", "Pass2", "Pass3", "Pass4", "Pass5", "Pass6", "Pass7", "ENE"]


def _make_regressor(n_samples: int = 50):
    # Auto-tune trees and depth to dataset size — heavy boosters overfit
    # tabular data with <100 rows, which is the main cause of negative
    # cross-validated R² on the cogging dataset.
    if n_samples < 80:
        n_est, depth, lr = 150, 2, 0.05
    elif n_samples < 200:
        n_est, depth, lr = 250, 3, 0.05
    else:
        n_est, depth, lr = 400, 3, 0.05

    if _HAS_XGB:
        return XGBRegressor(
            n_estimators=n_est, learning_rate=lr, max_depth=depth,
            subsample=0.9, colsample_bytree=0.9, reg_lambda=2.0,
            min_child_weight=2, random_state=42, n_jobs=-1,
        )
    return HistGradientBoostingRegressor(
        max_iter=n_est, learning_rate=lr, max_depth=depth,
        l2_regularization=2.0, min_samples_leaf=5,
        random_state=42,
    )


def _make_quantile_regressor(q: float, n_samples: int = 50):
    from sklearn.ensemble import HistGradientBoostingRegressor as _HGBR
    depth = 2 if n_samples < 80 else 3
    n_est = 150 if n_samples < 80 else 250
    return _HGBR(
        max_iter=n_est, learning_rate=0.05, max_depth=depth,
        l2_regularization=2.0, min_samples_leaf=5,
        loss="quantile", quantile=q, random_state=42,
    )


def _leakage_diagnostic(X: pd.DataFrame, y: np.ndarray) -> dict:
    # Pearson correlation between each feature and the target. |r| > 0.95
    # almost always means the feature carries the target — flag it so the
    # frontend can warn the user instead of silently shipping a leaky model.
    diag = {}
    for col in X.columns:
        col_vals = X[col].to_numpy(dtype=float)
        if np.std(col_vals) < 1e-12:
            diag[col] = 0.0
            continue
        diag[col] = float(np.corrcoef(col_vals, y)[0, 1])
    suspect = {k: v for k, v in diag.items() if abs(v) > 0.95}
    return {"feature_target_corr": diag, "suspected_leakage": suspect}


def process_excel_gb(file_path, n_splits=5):
    """Train a gradient-boosted ENE predictor and return a base64 payload.

    Returns a dict mirroring the Keras version's shape so the frontend needs
    minimal changes:
        {
          "status": "good",
          "model_b64": <base64 joblib .pkl>,
          "image": <base64 PNG, 4-panel diagnostics>,
          "metrics": {"rmse_mean":..,"rmse_std":..,"mae_mean":..,"r2_mean":..},
          "backend": "xgboost" | "hist_gbr",
        }
    """
    raw = pd.read_excel(file_path, sheet_name="Sheet1", names=COLUMN_NAMES)
    data = raw.round(5)

    X = data.drop("ENE", axis=1)
    y = data["ENE"].to_numpy()
    feat_names = list(X.columns)
    n_samples = len(y)

    leakage = _leakage_diagnostic(X, y)

    # Identical feature front end to the Keras path (kept for parity / optimizer reuse)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    k = min(10, X_scaled.shape[1])
    selector = SelectKBest(f_regression, k=k)
    X_sel = selector.fit_transform(X_scaled, y)
    kept = selector.get_support()
    kept_names = [n for n, m in zip(feat_names, kept) if m]

    # ---- Honest cross-validated metrics (no noise augmentation needed) ----
    n_splits = max(2, min(n_splits, len(y)))         # guard for tiny datasets
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    rmse_folds, mae_folds, r2_folds = [], [], []
    for tr, te in kf.split(X_sel):
        m = _make_regressor(n_samples)
        m.fit(X_sel[tr], y[tr])
        p = m.predict(X_sel[te])
        rmse_folds.append(np.sqrt(mean_squared_error(y[te], p)))
        mae_folds.append(mean_absolute_error(y[te], p))
        r2_folds.append(r2_score(y[te], p) if len(te) > 1 else np.nan)

    # Out-of-fold predictions for an honest "actual vs predicted" scatter
    oof_pred = cross_val_predict(_make_regressor(n_samples), X_sel, y, cv=kf)

    metrics = {
        "rmse_mean": float(np.mean(rmse_folds)), "rmse_std": float(np.std(rmse_folds)),
        "mae_mean":  float(np.mean(mae_folds)),  "mae_std":  float(np.std(mae_folds)),
        "r2_mean":   float(np.nanmean(r2_folds)),
    }

    # ---- Uncertainty quantification: 80% prediction interval via OOF quantile regression ----
    # Train q=0.1 and q=0.9 regressors on each fold, build the OOF interval, then
    # report (a) average interval width and (b) empirical coverage (% of true y
    # values that fall inside their predicted band). Well-calibrated → coverage ≈ 80%.
    q_lo, q_hi = np.full_like(y, np.nan, dtype=float), np.full_like(y, np.nan, dtype=float)
    for tr, te in kf.split(X_sel):
        lo = _make_quantile_regressor(0.1, n_samples); lo.fit(X_sel[tr], y[tr])
        hi = _make_quantile_regressor(0.9, n_samples); hi.fit(X_sel[tr], y[tr])
        q_lo[te] = lo.predict(X_sel[te])
        q_hi[te] = hi.predict(X_sel[te])
    # Numerical guard — make sure lo ≤ hi (quantile crossing is rare but possible)
    pi_low, pi_high = np.minimum(q_lo, q_hi), np.maximum(q_lo, q_hi)
    pi_width = float(np.mean(pi_high - pi_low))
    coverage = float(np.mean((y >= pi_low) & (y <= pi_high))) * 100.0  # %

    metrics["pi_width_mean"] = pi_width
    metrics["pi_coverage_pct"] = coverage

    # ---- Final model on ALL data (this is what gets deployed) ----
    model = _make_regressor(n_samples)
    model.fit(X_sel, y)

    # ---- Interpretability: built-in importance + permutation importance ----
    if hasattr(model, "feature_importances_"):
        imp = np.asarray(model.feature_importances_, dtype=float)
    else:
        imp = permutation_importance(model, X_sel, y, n_repeats=10,
                                     random_state=42).importances_mean

    # ---- 4-panel diagnostic figure ----
    fig, ax = plt.subplots(2, 2, figsize=(11, 9))

    # Show the 80% prediction interval as vertical error bars on each point.
    err_lo = np.clip(oof_pred - pi_low,  0, None)
    err_hi = np.clip(pi_high - oof_pred, 0, None)
    ax[0, 0].errorbar(y, oof_pred, yerr=[err_lo, err_hi],
                      fmt="o", ms=4, alpha=0.55, ecolor="#9ca3af",
                      elinewidth=0.8, capsize=2, mfc="#3b6ea5", mec="k", mew=0.3)
    lo, hi = float(min(y.min(), oof_pred.min())), float(max(y.max(), oof_pred.max()))
    ax[0, 0].plot([lo, hi], [lo, hi], "r--", lw=1)
    ax[0, 0].set(xlabel="Actual ENE", ylabel="Predicted ENE (out-of-fold)",
                 title=f"Actual vs Predicted (CV)  ·  80% PI coverage {coverage:.0f}%")

    ax[0, 1].bar(range(1, len(rmse_folds) + 1), rmse_folds, color="#3b6ea5")
    ax[0, 1].set(xlabel="Fold", ylabel="RMSE", title="Per-fold RMSE")

    resid = y - oof_pred
    ax[1, 0].scatter(oof_pred, resid, alpha=0.7, edgecolor="k", linewidth=0.3)
    ax[1, 0].axhline(0, color="r", ls="--", lw=1)
    ax[1, 0].set(xlabel="Predicted ENE", ylabel="Residual", title="Residuals")

    order = np.argsort(imp)
    ax[1, 1].barh(np.array(kept_names)[order], imp[order], color="#5a9367")
    ax[1, 1].set(xlabel="Importance", title="Feature importance")

    fig.suptitle(f"Cogging ENE — Gradient Boosting ({'XGBoost' if _HAS_XGB else 'HistGBR'})  "
                 f"R\u00b2={metrics['r2_mean']:.3f}  RMSE={metrics['rmse_mean']:.3f}",
                 fontsize=12)
    fig.tight_layout(rect=[0, 0, 1, 0.97])

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130)
    plt.close(fig)
    image_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    # ---- Save model bundle (regressor + scaler + selector) for the optimizer ----
    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as tmp:
        tmp_path = tmp.name
    bundle = {"model": model, "scaler": scaler, "selector": selector,
              "feature_names": feat_names, "kept_names": kept_names}
    joblib.dump(bundle, tmp_path)
    with open(tmp_path, "rb") as f:
        model_b64 = base64.b64encode(f.read()).decode("ascii")
    os.unlink(tmp_path)

    return {
        "status": "good",
        "model_b64": model_b64,
        "image": image_b64,
        "metrics": metrics,
        "backend": "xgboost" if _HAS_XGB else "hist_gbr",
        "diagnostics": leakage,
        "n_samples": n_samples,
    }


# ---------------------------------------------------------------------------
# Pass-Schedule integration helper.
# The existing optimizer calls model.predict(x)[0, 0] (a Keras habit).
# Wrap a GB bundle so the same call works unchanged.
# ---------------------------------------------------------------------------
def make_keras_like_predictor(bundle):
    """Return an object exposing .predict(X_selected) -> shape (n, 1),
    so passschedule.py can use it exactly like the old Keras model."""
    gb = bundle["model"]

    class _Adapter:
        def predict(self, X):
            X = np.atleast_2d(np.asarray(X, dtype=float))
            return gb.predict(X).reshape(-1, 1)

    return _Adapter()
