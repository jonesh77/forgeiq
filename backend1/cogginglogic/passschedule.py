# logic/pass_schedule.py

import numpy as np
import pandas as pd
import math
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from scipy.optimize import minimize, Bounds, NonlinearConstraint
from keras.models import load_model
import tempfile
import os
import hashlib

# Cache loaded Keras models by content-hash. Avoids re-loading the same
# uploaded .h5 file on repeat requests (common with the sample mode).
_MODEL_CACHE = {}

def _get_model_from_filestorage(model_file):
    # Read the upload once, hash it, cache the parsed Keras model
    if hasattr(model_file, "path") and os.path.exists(model_file.path):
        with open(model_file.path, "rb") as f:
            data = f.read()
    else:
        try:
            model_file.stream.seek(0)
        except Exception:
            pass
        data = model_file.read() if hasattr(model_file, "read") else None

    if data:
        key = hashlib.sha1(data).hexdigest()
        cached = _MODEL_CACHE.get(key)
        if cached is not None:
            return cached
        with tempfile.NamedTemporaryFile(delete=False, suffix=".h5") as tmp:
            tmp.write(data); tmp_path = tmp.name
        try:
            model = load_model(tmp_path)
        finally:
            try: os.unlink(tmp_path)
            except OSError: pass
        _MODEL_CACHE.clear()  # single-entry cache
        _MODEL_CACHE[key] = model
        return model

    # Fallback: original save-to-temp path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".h5") as tmp:
        model_file.save(tmp.name)
        return load_model(tmp.name)


def process_pass_schedule(model_file, data_file, initial_cross_section, initial_length, cutting_length):
    # Step 1: Load model (cached when possible)
    model = _get_model_from_filestorage(model_file)
    temp_model_file = None

    # Step 2: Load Excel
    column_names = ['Feed', 'Depth Schedule', 'Number of Rotataion',
                    'Pass1', 'Pass2', 'Pass3', 'Pass4', 'Pass5', 'Pass6', 'Pass7', 'ENE']
    df = pd.read_excel(data_file, sheet_name='Sheet1', names=column_names)
    df = round(df, 5)
    X = df.drop('ENE', axis=1)
    y = df['ENE']

    # Step 3: Fit scaler + selector
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    selector = SelectKBest(f_regression, k=10)
    X_selected = selector.fit_transform(X_scaled, y)

    # Step 4: Prediction & Optimization
    def predict_y(x):
        x_scaled = scaler.transform([x])
        x_selected = selector.transform(x_scaled)
        return model.predict(x_selected)[0, 0]

    def minimize_y(x):
        return predict_y(x)

    def constraint_fun(x):
        return predict_y(x) - 0.001

    x0 = np.mean(X, axis=0)
    bounds = Bounds([X[col].min() for col in X.columns],
                    [X[col].max() for col in X.columns])
    constraint = NonlinearConstraint(constraint_fun, lb=0, ub=np.inf)

    result = minimize(minimize_y, x0, method='trust-constr', bounds=bounds,
                      constraints=constraint, tol=1e-1)
    x_min = result.x

    # Step 5: Prepare results
    feed = float(x_min[0])
    depth_schedule = float(x_min[1])
    number_of_rotation = float(x_min[2])
    pass_schedule = [float(x) for x in x_min[3:10]]

    # NxN
    forging_ratios = []
    A0 = (initial_cross_section ** 2) * np.pi / 4
    forging = [math.sqrt(A0 / x_min[3])]
    forging_ratios.append(f"{int(forging[0])}×{int(forging[0])}")
    for i in range(1, 7):
        r = math.sqrt(forging[-1] ** 2 / x_min[3 + i])
        forging.append(r)
        forging_ratios.append(f"{int(r)}×{int(r)}")

    # Length Changes
    length_changes = [x_min[3] * initial_length]
    for i in range(1, 7):
        length = length_changes[-1] * x_min[3 + i]
        length_changes.append(length)
    length_changes = [round(l, 0) for l in length_changes]

    # Cutting Lengths
    cutting_lengths = []
    for l in length_changes:
        qty = 1
        temp_len = l
        while temp_len > cutting_length:
            temp_len /= 2
            qty *= 2
        cutting_lengths.append(f"{int(temp_len)} ({qty})")

    # Void Closure
    B, C, D = -1.521351466, 0.818014592, -0.145775097
    void_closures = []
    for L in length_changes:
        true_strain = np.log((L - initial_length) / initial_length + 1)
        VOID123 = (1 + B * true_strain + C * true_strain ** 2 + D * true_strain ** 3)
        closure = min(abs(VOID123 - 1) * 100, 100)
        void_closures.append(closure)

    # Cleanup any temp file we may have made
    if temp_model_file is not None:
        try:
            os.unlink(temp_model_file.name)
        except OSError:
            pass

    return {
        "feed": feed,
        "depth_schedule": depth_schedule,
        "number_of_rotation": number_of_rotation,
        "pass_schedule": pass_schedule,
        "forging_ratios": forging_ratios,
        "length_changes": length_changes,
        "cutting_lengths": cutting_lengths,
        "void_closure": void_closures
    }
