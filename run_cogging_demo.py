"""Real-data comparison: baseline MLP vs Gradient Boosting on the cogging dataset."""
import warnings; warnings.filterwarnings("ignore")
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.neural_network import MLPRegressor
from xgboost import XGBRegressor

# 1) Real data + the project's own correction step -> target modify_BQI
df = pd.read_excel("sample_data/Cogging data.xlsx", sheet_name="Sheet1")
TARGET_ASTM, W = 7.0, 0.1
df["modify_BQI"] = (df["Strain"]*df["St.Dev"]*df["ASTM.dev"]/df["ASTM"]
                    + W*(TARGET_ASTM - df["ASTM"])**2)
df = df.drop(["Strain", "St.Dev", "ASTM", "ASTM.dev"], axis=1)
y = df["modify_BQI"].to_numpy()
X = df.drop("modify_BQI", axis=1)
feat = list(X.columns)
print(f"Dataset: {X.shape[0]} rows, {X.shape[1]} features -> target=modify_BQI")
print(f"Features: {feat}")

# Drop zero-variance features (constant columns help nothing)
nz = X.std(0) > 1e-9
X = X.loc[:, nz]; feat = list(X.columns)
print(f"Non-constant features used: {feat}")

scaler = StandardScaler(); Xs = scaler.fit_transform(X)
k = min(10, Xs.shape[1])
sel = SelectKBest(f_regression, k=k); Xsel = sel.fit_transform(Xs, y)

kf = KFold(n_splits=5, shuffle=True, random_state=42)

def evaluate(make):
    rmse, mae, r2 = [], [], []
    for tr, te in kf.split(Xsel):
        m = make(); m.fit(Xsel[tr], y[tr]); p = m.predict(Xsel[te])
        rmse.append(np.sqrt(mean_squared_error(y[te], p)))
        mae.append(mean_absolute_error(y[te], p))
        r2.append(r2_score(y[te], p))
    oof = cross_val_predict(make(), Xsel, y, cv=kf)
    return dict(rmse=np.mean(rmse), rmse_s=np.std(rmse),
                mae=np.mean(mae), r2=np.mean(r2)), oof

mk_mlp = lambda: MLPRegressor(hidden_layer_sizes=(64,32), activation="relu",
                              solver="adam", max_iter=2000, random_state=42)
mk_xgb = lambda: XGBRegressor(n_estimators=400, learning_rate=0.05, max_depth=3,
                              subsample=0.9, colsample_bytree=0.9, reg_lambda=1.0,
                              random_state=42, n_jobs=-1)

m_mlp, oof_mlp = evaluate(mk_mlp)
m_xgb, oof_xgb = evaluate(mk_xgb)

print("\n================  5-FOLD CROSS-VALIDATION  ================")
print(f"{'Model':<22}{'RMSE':>10}{'MAE':>10}{'R2':>10}")
print(f"{'MLP (64-32, baseline)':<22}{m_mlp['rmse']:>10.4f}{m_mlp['mae']:>10.4f}{m_mlp['r2']:>10.4f}")
print(f"{'Gradient Boosting':<22}{m_xgb['rmse']:>10.4f}{m_xgb['mae']:>10.4f}{m_xgb['r2']:>10.4f}")
imp = ((m_mlp['rmse']-m_xgb['rmse'])/m_mlp['rmse']*100)
print(f"\n-> Gradient Boosting RMSE is {imp:.1f}% lower than the MLP baseline")

# Feature importance from final GB
gb = mk_xgb(); gb.fit(Xsel, y)
kept = [f for f, s in zip(feat, sel.get_support()) if s]

# ---- Comparison figure ----
fig, ax = plt.subplots(1, 3, figsize=(15, 4.6))
for a, oof, mm, name, c in [(ax[0], oof_mlp, m_mlp, "MLP baseline", "#c0504d"),
                            (ax[1], oof_xgb, m_xgb, "Gradient Boosting", "#4f81bd")]:
    a.scatter(y, oof, alpha=.75, edgecolor="k", lw=.3, color=c)
    lo, hi = min(y.min(), oof.min()), max(y.max(), oof.max())
    a.plot([lo, hi], [lo, hi], "k--", lw=1)
    a.set(xlabel="Actual modify_BQI", ylabel="Predicted (out-of-fold)",
          title=f"{name}\nR2={mm['r2']:.3f}  RMSE={mm['rmse']:.3f}")
order = np.argsort(gb.feature_importances_)
ax[2].barh(np.array(kept)[order], gb.feature_importances_[order], color="#5a9367")
ax[2].set(xlabel="Importance", title="GB feature importance")
fig.suptitle("Cogging predictor — MLP baseline vs Gradient Boosting (real sample data)", fontsize=13)
fig.tight_layout(rect=[0,0,1,.93])
fig.savefig("cogging_mlp_vs_gb.png", dpi=140)
print("\nSaved: cogging_mlp_vs_gb.png  (in the project root)")
