"""Cogging ENE predictor — Gaussian Process Regression variant.

Why GPR for cogging: the cogging dataset is small (~50 rows) and noisy.
Gradient boosting / MLP overfit at that scale; GPR is a probabilistic
kernel method specifically suited to <100 samples and gives *native*
prediction intervals from the posterior variance — no extra quantile
regressors needed.

Kernel: Constant * (Matern-2.5 + RBF) + WhiteKernel. Hyperparameters are
fit by marginal-likelihood maximisation per fold, so the model adapts
its length-scales to the data without manual tuning.

API shape matches gradient_boosting.process_excel_gb so the frontend
component template can be reused with minimal changes.
"""

import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import io
import base64
import tempfile
import warnings

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib

from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.model_selection import KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import (
    ConstantKernel, RBF, Matern, WhiteKernel,
)
from sklearn.exceptions import ConvergenceWarning

COLUMN_NAMES = ["Feed", "Depth Schedule", "Number of Rotataion",
                "Pass1", "Pass2", "Pass3", "Pass4", "Pass5", "Pass6", "Pass7", "ENE"]


def _make_kernel(n_features: int):
    # Constant * (Matern + RBF) + WhiteKernel. Matern handles non-smooth
    # response surfaces; RBF the smooth ones. WhiteKernel models
    # observation noise — without it GPR collapses to interpolation on
    # the (noisy) training points and generalises poorly.
    ls = np.ones(n_features)
    return (
        ConstantKernel(1.0, (1e-3, 1e3))
        * (Matern(length_scale=ls, length_scale_bounds=(1e-2, 1e2), nu=2.5)
           + RBF(length_scale=ls, length_scale_bounds=(1e-2, 1e2)))
        + WhiteKernel(noise_level=1e-2, noise_level_bounds=(1e-5, 1e1))
    )


def _make_gpr(n_features: int):
    return GaussianProcessRegressor(
        kernel=_make_kernel(n_features),
        normalize_y=True,
        n_restarts_optimizer=4,
        alpha=1e-6,
        random_state=42,
    )


def _leakage_diagnostic(X: pd.DataFrame, y: np.ndarray) -> dict:
    diag = {}
    for col in X.columns:
        col_vals = X[col].to_numpy(dtype=float)
        if np.std(col_vals) < 1e-12:
            diag[col] = 0.0
            continue
        diag[col] = float(np.corrcoef(col_vals, y)[0, 1])
    suspect = {k: v for k, v in diag.items() if abs(v) > 0.95}
    return {"feature_target_corr": diag, "suspected_leakage": suspect}


def process_excel_gpr(file_path, n_splits=5):
    raw = pd.read_excel(file_path, sheet_name="Sheet1", names=COLUMN_NAMES)
    data = raw.round(5)

    X = data.drop("ENE", axis=1)
    y = data["ENE"].to_numpy()
    feat_names = list(X.columns)
    n_samples = len(y)

    leakage = _leakage_diagnostic(X, y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    k = min(10, X_scaled.shape[1])
    selector = SelectKBest(f_regression, k=k)
    X_sel = selector.fit_transform(X_scaled, y)
    kept = selector.get_support()
    kept_names = [n for n, m in zip(feat_names, kept) if m]

    n_splits = max(2, min(n_splits, len(y)))
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    rmse_folds, mae_folds, r2_folds = [], [], []
    oof_pred = np.zeros_like(y, dtype=float)
    oof_std  = np.zeros_like(y, dtype=float)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=ConvergenceWarning)
        for tr, te in kf.split(X_sel):
            m = _make_gpr(X_sel.shape[1])
            m.fit(X_sel[tr], y[tr])
            mu, sd = m.predict(X_sel[te], return_std=True)
            oof_pred[te] = mu
            oof_std[te]  = sd
            rmse_folds.append(np.sqrt(mean_squared_error(y[te], mu)))
            mae_folds.append(mean_absolute_error(y[te], mu))
            r2_folds.append(r2_score(y[te], mu) if len(te) > 1 else np.nan)

    # 80% PI from the posterior — z=1.2816 covers ~80% of a Normal.
    z = 1.2815515655446004
    pi_low  = oof_pred - z * oof_std
    pi_high = oof_pred + z * oof_std
    pi_width = float(np.mean(pi_high - pi_low))
    coverage = float(np.mean((y >= pi_low) & (y <= pi_high))) * 100.0

    metrics = {
        "rmse_mean": float(np.mean(rmse_folds)), "rmse_std": float(np.std(rmse_folds)),
        "mae_mean":  float(np.mean(mae_folds)),  "mae_std":  float(np.std(mae_folds)),
        "r2_mean":   float(np.nanmean(r2_folds)),
        "pi_width_mean": pi_width,
        "pi_coverage_pct": coverage,
    }

    # Final model on all data
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=ConvergenceWarning)
        model = _make_gpr(X_sel.shape[1])
        model.fit(X_sel, y)

    # Permutation importance — GPR has no built-in feature_importance.
    from sklearn.inspection import permutation_importance
    imp = permutation_importance(model, X_sel, y, n_repeats=10,
                                 random_state=42).importances_mean

    fig, ax = plt.subplots(2, 2, figsize=(11, 9))

    err_lo = np.clip(oof_pred - pi_low,  0, None)
    err_hi = np.clip(pi_high - oof_pred, 0, None)
    ax[0, 0].errorbar(y, oof_pred, yerr=[err_lo, err_hi],
                      fmt="o", ms=4, alpha=0.55, ecolor="#9ca3af",
                      elinewidth=0.8, capsize=2, mfc="#7c3aed", mec="k", mew=0.3)
    lo, hi = float(min(y.min(), oof_pred.min())), float(max(y.max(), oof_pred.max()))
    ax[0, 0].plot([lo, hi], [lo, hi], "r--", lw=1)
    ax[0, 0].set(xlabel="Actual ENE", ylabel="Predicted ENE (out-of-fold)",
                 title=f"Actual vs Predicted (CV)  ·  80% PI coverage {coverage:.0f}%")

    ax[0, 1].bar(range(1, len(rmse_folds) + 1), rmse_folds, color="#7c3aed")
    ax[0, 1].set(xlabel="Fold", ylabel="RMSE", title="Per-fold RMSE")

    resid = y - oof_pred
    ax[1, 0].scatter(oof_pred, resid, alpha=0.7, edgecolor="k", linewidth=0.3, color="#a78bfa")
    ax[1, 0].axhline(0, color="r", ls="--", lw=1)
    ax[1, 0].set(xlabel="Predicted ENE", ylabel="Residual", title="Residuals")

    order = np.argsort(imp)
    ax[1, 1].barh(np.array(kept_names)[order], imp[order], color="#7c3aed")
    ax[1, 1].set(xlabel="Permutation importance", title="Feature importance")

    fig.suptitle(f"Cogging ENE — Gaussian Process Regression  "
                 f"R²={metrics['r2_mean']:.3f}  RMSE={metrics['rmse_mean']:.3f}",
                 fontsize=12)
    fig.tight_layout(rect=[0, 0, 1, 0.97])

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130)
    plt.close(fig)
    image_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as tmp:
        tmp_path = tmp.name
    bundle = {"model": model, "scaler": scaler, "selector": selector,
              "feature_names": feat_names, "kept_names": kept_names,
              "kernel": "Const * (Matern2.5 + RBF) + White"}
    joblib.dump(bundle, tmp_path)
    with open(tmp_path, "rb") as f:
        model_b64 = base64.b64encode(f.read()).decode("ascii")
    os.unlink(tmp_path)

    return {
        "status": "good",
        "model_b64": model_b64,
        "image": image_b64,
        "metrics": metrics,
        "backend": "gpr_sklearn",
        "diagnostics": leakage,
        "n_samples": n_samples,
    }


def make_keras_like_predictor(bundle):
    """Adapter so passschedule.py can call model.predict(x)[0, 0] as before."""
    gpr = bundle["model"]

    class _Adapter:
        def predict(self, X):
            X = np.atleast_2d(np.asarray(X, dtype=float))
            return gpr.predict(X).reshape(-1, 1)

    return _Adapter()
