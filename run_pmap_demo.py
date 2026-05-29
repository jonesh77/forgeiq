"""Real processing map from AISI4340 data: baseline (sparse) vs smoothed surrogate."""
import warnings; warnings.filterwarnings("ignore")
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy.interpolate import interp1d, griddata
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

df = pd.read_excel("sample_data/_RAW_Processing map_AISI4340.xlsx", sheet_name="Sheet1")
TEMPS = np.array([1200., 1100., 1000., 900.])
LOG_SR = np.log10([0.01, 0.1, 1., 10.])
STRAIN = 0.5

def col(ti, si): return si*4 + ti + 1

# ---- sigma at chosen strain for every (T, SR) cell ----
def sigma_at(ti, si, eps):
    n = col(ti, si)
    s = pd.to_numeric(df[f"strain{n}"], errors="coerce").to_numpy()
    st = pd.to_numeric(df[f"stress{n}"], errors="coerce").to_numpy()
    ok = np.isfinite(s) & np.isfinite(st) & (st > 0)
    f = interp1d(s[ok], st[ok], kind="cubic", fill_value="extrapolate")
    return float(f(eps))

# ---- BASELINE: Prasad via cubic spline over the 4 strain rates (their method) ----
def baseline_fields(eps):
    m = np.zeros((4, 4))
    for ti in range(4):
        logsig = np.array([np.log10(sigma_at(ti, si, eps)) for si in range(4)])
        spl = interp1d(LOG_SR, logsig, kind="cubic", fill_value="extrapolate")
        h = 1e-4
        for si, u in enumerate(LOG_SR):
            m[ti, si] = (spl(u+h) - spl(u-h)) / (2*h)        # m = d log10 sigma / d log10 rate
    eta = 2*m/(m+1)
    ratio = np.log10(np.clip(m/(m+1), 1e-9, None))
    xi = np.gradient(ratio, LOG_SR, axis=1) + m
    return m, eta, xi

m0, eta0, xi0 = baseline_fields(STRAIN)

# ---- SURROGATE: smooth log10(sigma)=f(T,logSR,strain) over ALL strain points ----
rows = []
for ti in range(4):
    for si in range(4):
        n = col(ti, si)
        s = pd.to_numeric(df[f"strain{n}"], errors="coerce").to_numpy()
        st = pd.to_numeric(df[f"stress{n}"], errors="coerce").to_numpy()
        ok = np.isfinite(s) & np.isfinite(st) & (st > 0) & (s <= 1.0)
        for e, v in zip(s[ok], st[ok]):
            rows.append([TEMPS[ti], LOG_SR[si], e, np.log10(v)])
D = np.array(rows)
Xsc = StandardScaler().fit(D[:, :3])
net = MLPRegressor(hidden_layer_sizes=(64, 64), activation="tanh",
                   max_iter=5000, random_state=42)
net.fit(Xsc.transform(D[:, :3]), D[:, 3])
fit_rmse = np.sqrt(np.mean((net.predict(Xsc.transform(D[:, :3])) - D[:, 3])**2))

# dense grid + finite-difference m, eta, xi from the smooth surface
gT = np.linspace(900, 1200, 60); gU = np.linspace(-2, 1, 60)
TT, UU = np.meshgrid(gT, gU, indexing="ij")
def logsig_grid(u_shift=0.0):
    pts = np.stack([TT.ravel(), UU.ravel()+u_shift, np.full(TT.size, STRAIN)], 1)
    return net.predict(Xsc.transform(pts)).reshape(TT.shape)
du = 1e-3
m_s = (logsig_grid(du) - logsig_grid(-du)) / (2*du)
eta_s = 2*m_s/(m_s+1)
ratio_s = np.log10(np.clip(m_s/(m_s+1), 1e-9, None))
xi_s = np.gradient(ratio_s, gU, axis=1) + m_s

# ---- Figure: baseline (sparse 4x4 -> griddata) vs smooth surrogate ----
fig, ax = plt.subplots(1, 2, figsize=(14, 5.6))
# baseline: interpolate the 4x4 onto a grid just for display
bt, bu = np.meshgrid(TEMPS, LOG_SR, indexing="ij")
ETA0 = griddata((bt.ravel(), bu.ravel()), eta0.ravel(), (TT, UU), method="cubic")
XI0  = griddata((bt.ravel(), bu.ravel()), xi0.ravel(),  (TT, UU), method="cubic")

for a, ETA, XI, ttl in [(ax[0], ETA0, XI0, "Baseline (Prasad, 4x4 sparse + griddata)"),
                        (ax[1], eta_s, xi_s, f"Surrogate (smooth, fit RMSE={fit_rmse:.3f})")]:
    cf = a.contourf(UU, TT, ETA, levels=np.linspace(0, .6, 13), cmap="viridis")
    a.contour(UU, TT, ETA, levels=np.linspace(0, .6, 13), colors="k", linewidths=.3, alpha=.4)
    a.contourf(UU, TT, (XI <= 0).astype(float), levels=[.5, 1.5],
               colors="none", hatches=["xxx"], alpha=0)
    a.contour(UU, TT, XI, levels=[0], colors="red", linewidths=2)   # instability boundary
    a.set(xlabel="log10(strain rate) [s$^{-1}$]", ylabel="Temperature [\u00b0C]", title=ttl)
    fig.colorbar(cf, ax=a, label="Dissipation \u03b7")

fig.suptitle(f"AISI 4340 Processing Map at strain={STRAIN}  "
             f"(red line = instability boundary \u03be=0; left of it / hatched = unstable)",
             fontsize=12)
fig.tight_layout(rect=[0, 0, 1, .95])
fig.savefig("processing_map_baseline_vs_surrogate.png", dpi=140)

# ---- auto-detect the safe optimal window from the smooth surrogate ----
safe = xi_s > 0
eta_safe = np.where(safe, eta_s, -1)
i, j = np.unravel_index(np.argmax(eta_safe), eta_s.shape)
print(f"Surrogate fit RMSE on log10(sigma) = {fit_rmse:.4f}")
print(f"Baseline eta range: [{np.nanmin(eta0):.3f}, {np.nanmax(eta0):.3f}]")
print(f"AUTO-DETECTED OPTIMAL WINDOW (max eta in stable zone):")
print(f"   T = {gT[i]:.0f} C,  strain rate = {10**gU[j]:.3g} 1/s,  eta = {eta_s[i,j]:.3f}")
print("Saved: processing_map_baseline_vs_surrogate.png")
