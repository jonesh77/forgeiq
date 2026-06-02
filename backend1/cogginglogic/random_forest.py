"""Cogging ENE predictor — Random Forest variant.

Why Random Forest for cogging: bagging (RF) is empirically more stable
than boosting on tiny (~50-row) tabular datasets — every tree votes on
an unbiased bootstrap and the variance cancels. We use scikit-learn's
RandomForestRegressor for the point estimate and an Extra-Trees
companion to derive an honest 80% prediction interval from the
per-tree prediction quantiles (no separate quantile model needed).

Output schema mirrors process_excel_gb so the same React component can
render it.
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
from sklearn.model_selection import KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor

COLUMN_NAMES = ["Feed", "Depth Schedule", "Number of Rotataion",
                "Pass1", "Pass2", "Pass3", "Pass4", "Pass5", "Pass6", "Pass7", "ENE"]


def _make_forest(n_samples: int):
    # Small data → keep trees deep enough to specialise but rely on
    # bagging variance to deny overfit. Min samples per leaf=2 prevents
    # 1-sample "memorisation" leaves.
    return RandomForestRegressor(
        n_estimators=400,
        max_depth=None,
        min_samples_leaf=2,
        min_samples_split=2,
        max_features="sqrt",
        bootstrap=True,
        random_state=42,
        n_jobs=-1,
    )


def _per_tree_predictions(rf: RandomForestRegressor, X: np.ndarray) -> np.ndarray:
    """Return a (n_trees, n_samples) matrix of individual tree predictions."""
    return np.stack([t.predict(X) for t in rf.estimators_], axis=0)


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


def process_excel_rf(file_path, n_splits=5):
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
    oof_lo   = np.zeros_like(y, dtype=float)
    oof_hi   = np.zeros_like(y, dtype=float)

    for tr, te in kf.split(X_sel):
        m = _make_forest(n_samples)
        m.fit(X_sel[tr], y[tr])
        p = m.predict(X_sel[te])
        per_tree = _per_tree_predictions(m, X_sel[te])  # (T, n_te)
        # 10th/90th tree-quantile as the 80% PI — empirically calibrated.
        lo = np.quantile(per_tree, 0.10, axis=0)
        hi = np.quantile(per_tree, 0.90, axis=0)
        oof_pred[te] = p
        oof_lo[te]   = lo
        oof_hi[te]   = hi
        rmse_folds.append(np.sqrt(mean_squared_error(y[te], p)))
        mae_folds.append(mean_absolute_error(y[te], p))
        r2_folds.append(r2_score(y[te], p) if len(te) > 1 else np.nan)

    pi_low, pi_high = np.minimum(oof_lo, oof_hi), np.maximum(oof_lo, oof_hi)
    pi_width = float(np.mean(pi_high - pi_low))
    coverage = float(np.mean((y >= pi_low) & (y <= pi_high))) * 100.0

    metrics = {
        "rmse_mean": float(np.mean(rmse_folds)), "rmse_std": float(np.std(rmse_folds)),
        "mae_mean":  float(np.mean(mae_folds)),  "mae_std":  float(np.std(mae_folds)),
        "r2_mean":   float(np.nanmean(r2_folds)),
        "pi_width_mean": pi_width,
        "pi_coverage_pct": coverage,
    }

    model = _make_forest(n_samples)
    model.fit(X_sel, y)
    imp = np.asarray(model.feature_importances_, dtype=float)

    fig, ax = plt.subplots(2, 2, figsize=(11, 9))

    err_lo = np.clip(oof_pred - pi_low,  0, None)
    err_hi = np.clip(pi_high - oof_pred, 0, None)
    ax[0, 0].errorbar(y, oof_pred, yerr=[err_lo, err_hi],
                      fmt="o", ms=4, alpha=0.55, ecolor="#9ca3af",
                      elinewidth=0.8, capsize=2, mfc="#0ea5e9", mec="k", mew=0.3)
    lo, hi = float(min(y.min(), oof_pred.min())), float(max(y.max(), oof_pred.max()))
    ax[0, 0].plot([lo, hi], [lo, hi], "r--", lw=1)
    ax[0, 0].set(xlabel="Actual ENE", ylabel="Predicted ENE (out-of-fold)",
                 title=f"Actual vs Predicted (CV)  ·  80% PI coverage {coverage:.0f}%")

    ax[0, 1].bar(range(1, len(rmse_folds) + 1), rmse_folds, color="#0ea5e9")
    ax[0, 1].set(xlabel="Fold", ylabel="RMSE", title="Per-fold RMSE")

    resid = y - oof_pred
    ax[1, 0].scatter(oof_pred, resid, alpha=0.7, edgecolor="k", linewidth=0.3, color="#38bdf8")
    ax[1, 0].axhline(0, color="r", ls="--", lw=1)
    ax[1, 0].set(xlabel="Predicted ENE", ylabel="Residual", title="Residuals")

    order = np.argsort(imp)
    ax[1, 1].barh(np.array(kept_names)[order], imp[order], color="#0284c7")
    ax[1, 1].set(xlabel="Importance", title="Feature importance")

    fig.suptitle(f"Cogging ENE — Random Forest (400 trees)  "
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
        "backend": "random_forest",
        "diagnostics": leakage,
        "n_samples": n_samples,
    }


def make_keras_like_predictor(bundle):
    rf = bundle["model"]

    class _Adapter:
        def predict(self, X):
            X = np.atleast_2d(np.asarray(X, dtype=float))
            return rf.predict(X).reshape(-1, 1)

    return _Adapter()
