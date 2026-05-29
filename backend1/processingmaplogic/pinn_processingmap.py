"""
Processing-map surrogate via a Physics-Informed Neural Network (backend1).

WHY A PINN (not a plain 2D CNN):
A 2D CNN that "generates" processing maps needs MANY maps (many alloys/tests)
to train on. Most labs have one alloy's data. A PINN instead learns the flow-
stress surface from the SAME 16 sparse compression curves you already use, and
then derives the Prasad quantities (m, eta, xi) from that smooth differentiable
surface by automatic differentiation. So it gives dense, noise-smoothed maps
from limited data -- the realistic modern upgrade for this module.

It is fully consistent with processingmap.py:
    m   = d(log10 sigma) / d(log10 strain_rate)
    eta = 2m / (m + 1)
    xi  = d( log10( m/(m+1) ) ) / d(log10 strain_rate)  +  m
The optional physics term softly enforces m >= 0 (flow stress rises with rate).

Output dense (50x50) eta/xi fields drop straight into the existing Plotly code.
"""

import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, Model, Input

# Same experiment grid the project assumes (see processingmap.py / the docs)
TEMPS = np.array([1200.0, 1100.0, 1000.0, 900.0])          # temp_idx 0..3
LOG_SR = np.log10(np.array([0.01, 0.1, 1.0, 10.0]))        # sr_idx 0..3 -> [-2,-1,0,1]


def _column_index(temp_idx, sr_idx):
    """Map (temperature, strain-rate) cell to the 1-based column number n,
    matching the layout: n = sr_idx*4 + temp_idx + 1."""
    return sr_idx * 4 + temp_idx + 1


def load_training_points(file_path, max_strain=1.0):
    """Read the 16 strain/stress columns into flat training samples.

    Returns arrays:
        feats : (N, 3)  columns = [T, log10(strain_rate), strain]
        logsig: (N,)     target = log10(stress)
    plus the normalization stats used to scale `feats`.
    """
    df = pd.read_excel(file_path, sheet_name="Sheet1")
    feats, logsig = [], []
    for ti, T in enumerate(TEMPS):
        for si, u in enumerate(LOG_SR):
            n = _column_index(ti, si)
            scol, stcol = f"strain{n}", f"stress{n}"
            if scol not in df.columns or stcol not in df.columns:
                continue
            eps = pd.to_numeric(df[scol], errors="coerce").to_numpy()
            sig = pd.to_numeric(df[stcol], errors="coerce").to_numpy()
            ok = np.isfinite(eps) & np.isfinite(sig) & (sig > 0) & (eps <= max_strain)
            for e, s in zip(eps[ok], sig[ok]):
                feats.append([T, u, e])
                logsig.append(np.log10(s))
    feats = np.asarray(feats, dtype="float32")
    logsig = np.asarray(logsig, dtype="float32")
    if len(feats) == 0:
        raise ValueError("No valid strain/stress samples found (check column layout).")
    mu, sd = feats.mean(0), feats.std(0) + 1e-8
    return feats, logsig, mu.astype("float32"), sd.astype("float32")


def build_pinn(hidden=(64, 64, 64)):
    """Small MLP: normalized (T, log strain_rate, strain) -> log10(stress)."""
    inp = Input(shape=(3,))
    x = inp
    for h in hidden:
        x = layers.Dense(h, activation="tanh")(x)     # tanh -> smooth derivatives
    out = layers.Dense(1)(x)
    return Model(inp, out, name="flow_stress_pinn")


def _m_field(model, mu, sd, T_grid, u_grid, strain):
    """m = d(log10 sigma)/d(log10 strain_rate) on a (T, u) grid, via autodiff."""
    TT, UU = np.meshgrid(T_grid, u_grid, indexing="ij")
    flat = np.stack([TT.ravel(), UU.ravel(),
                     np.full(TT.size, strain, dtype="float32")], axis=1).astype("float32")
    norm = (flat - mu) / sd
    x = tf.convert_to_tensor(norm)
    with tf.GradientTape() as tape:
        tape.watch(x)
        y = model(x)                       # log10(sigma), normalized inputs
    grads = tape.gradient(y, x).numpy()    # d y / d (normalized inputs)
    # chain rule back to physical log10(strain_rate): divide by sd of the u column
    m = grads[:, 1] / sd[1]
    return m.reshape(TT.shape), TT, UU


def train_processing_pinn(file_path, epochs=3000, lr=1e-3,
                          physics_weight=0.1, grid_n=50, strain=0.5):
    """Train the PINN and return dense eta/xi fields at the chosen strain.

    Returns dict:
        T_axis, logSR_axis : (grid_n,) grid coordinates
        eta, xi            : (grid_n, grid_n) fields  [indexed T x logSR]
        rmse_logsigma      : training fit quality on log10(stress)
    """
    feats, logsig, mu, sd = load_training_points(file_path)
    Xn = (feats - mu) / sd

    model = build_pinn()
    opt = tf.keras.optimizers.Adam(lr)
    Xt = tf.convert_to_tensor(Xn)
    yt = tf.convert_to_tensor(logsig.reshape(-1, 1))
    sd_u = float(sd[1])

    @tf.function
    def step():
        with tf.GradientTape() as outer:
            with tf.GradientTape() as inner:
                inner.watch(Xt)
                pred = model(Xt)
            data_loss = tf.reduce_mean((pred - yt) ** 2)
            # physics prior: m = d(log10 sigma)/d(log10 rate) should be >= 0
            dpred = inner.gradient(pred, Xt)
            m = dpred[:, 1:2] / sd_u
            phys = tf.reduce_mean(tf.nn.relu(-m) ** 2)
            loss = data_loss + physics_weight * phys
        grads = outer.gradient(loss, model.trainable_variables)
        opt.apply_gradients(zip(grads, model.trainable_variables))
        return data_loss

    for ep in range(epochs):
        dl = step()
        if ep % 500 == 0:
            print(f"[PINN] epoch {ep:5d}  data_mse(log10 sigma)={float(dl):.5f}")

    rmse = float(np.sqrt(model.evaluate(Xn, logsig.reshape(-1, 1), verbose=0)
                         if False else np.mean((model(Xn).numpy().ravel() - logsig) ** 2)))

    # ---- Dense fields over (T, logSR) at the chosen strain ----
    T_axis = np.linspace(TEMPS.min(), TEMPS.max(), grid_n).astype("float32")
    u_axis = np.linspace(LOG_SR.min(), LOG_SR.max(), grid_n).astype("float32")
    m_grid, TT, UU = _m_field(model, mu, sd, T_axis, u_axis, strain)

    eta = 2.0 * m_grid / (m_grid + 1.0)

    # xi = d( log10(m/(m+1)) ) / d(log10 rate) + m   (matches processingmap.py)
    ratio = m_grid / (m_grid + 1.0)
    with np.errstate(divide="ignore", invalid="ignore"):
        log_ratio = np.log10(np.clip(ratio, 1e-9, None))
    # derivative along the logSR axis (axis=1)
    d_log_ratio = np.gradient(log_ratio, u_axis, axis=1)
    xi = d_log_ratio + m_grid

    return {
        "T_axis": T_axis, "logSR_axis": u_axis,
        "eta": eta, "xi": xi, "m": m_grid,
        "rmse_logsigma": rmse, "model": model,
    }


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Train PINN processing-map surrogate.")
    ap.add_argument("--excel", required=True, help="16-column strain/stress .xlsx")
    ap.add_argument("--strain", type=float, default=0.5)
    ap.add_argument("--epochs", type=int, default=3000)
    args = ap.parse_args()

    res = train_processing_pinn(args.excel, epochs=args.epochs, strain=args.strain)
    print(f"[PINN] fit RMSE on log10(sigma) = {res['rmse_logsigma']:.4f}")
    print(f"[PINN] eta range  = [{res['eta'].min():.3f}, {res['eta'].max():.3f}]")
    print(f"[PINN] xi  range  = [{res['xi'].min():.3f}, {res['xi'].max():.3f}]  "
          f"(xi<=0 marks unstable zones)")
