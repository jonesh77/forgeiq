# logic/processor.py

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.model_selection import train_test_split
from keras import Sequential, Input
from keras.layers import Dense
from keras.callbacks import EarlyStopping
import h5py
import base64
from io import BytesIO
import uuid





def process_excel(file_path):
    column_names = ['Feed', 'Depth Schedule', 'Number of Rotataion', 'Pass1', 'Pass2', 'Pass3',
                    'Pass4', 'Pass5', 'Pass6', 'Pass7', 'ENE']
    rawdata = pd.read_excel(file_path, sheet_name='Sheet1', names=column_names)
    dataset = round(rawdata.copy(), 5)

    # Scale
    scaler = StandardScaler()
    X = dataset.drop('ENE', axis=1)
    y = dataset['ENE']
    X_scaled = scaler.fit_transform(X)

    # Feature selection
    k_best = 10
    selector = SelectKBest(f_regression, k=k_best)
    X_selected = selector.fit_transform(X_scaled, y)

    # Augment
    def augment_data(X, y, n_copies=3, noise_std=0.0001):
        X_aug, y_aug = X.copy(), y.copy()
        for _ in range(n_copies):
            noise = np.random.normal(0, noise_std, X.shape)
            X_noisy = X + noise
            X_aug = np.vstack((X_aug, X_noisy))
            y_aug = np.hstack((y_aug, y))
        return X_aug, y_aug

    X_aug, y_aug = augment_data(X_selected, y, 3, 0.01)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X_aug, y_aug, test_size=0.2, random_state=42)

    # Model
    model = Sequential([
        Input(shape=(k_best,)),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])

    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )

    # epochs was 400, I changed to 100 for performance
    history = model.fit(X_train, y_train, epochs=100, batch_size=32, verbose=0, validation_split=0.2, callbacks=[early_stop])

    y_pred_train = model.predict(X_train).flatten()
    y_pred_test = model.predict(X_test).flatten()

    # Save full Keras model (architecture + weights) so Pass Schedule can load it
    import tempfile as _tmp
    with _tmp.NamedTemporaryFile(suffix='.h5', delete=False) as _tf:
        _tmp_path = _tf.name
    model.save(_tmp_path)
    with open(_tmp_path, 'rb') as _f:
        h5_base64 = base64.b64encode(_f.read()).decode('utf-8')
    os.unlink(_tmp_path)

    # Create 4 plots
    images = []

    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(6, 6))

    # Plot 1: Actual vs Predicted
    ax1.scatter(y_train, y_pred_train, s=10, label='Train', marker='*', c='k', alpha=0.75)
    ax1.scatter(y_test, y_pred_test, s=10, label='Test', marker='^', c='r', edgecolor='black', alpha=0.75)
    ax1.plot([min(y_train.min(), y_test.min()), max(y_train.max(), y_test.max())],
             [min(y_train.min(), y_test.min()), max(y_train.max(), y_test.max())], 'k--', lw=0.5)
    ax1.set_title('Actual vs Predicted')
    ax1.set_xlabel('Actual')
    ax1.set_ylabel('Predicted')

    # Plot 2: MAE curve
    ax2.plot(history.history['mae'], label='Train MAE', color='black')
    ax2.plot(history.history['val_mae'], label='Val MAE', color='gray', linestyle='--')
    ax2.set_title('MAE over Epochs')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('MAE')
    ax2.legend()

    # Plot 3: Residuals
    ax3.scatter(y_pred_train, y_train - y_pred_train, s=10, label='Train', marker='*', c='k', alpha=0.75)
    ax3.scatter(y_pred_test, y_test - y_pred_test, s=10, label='Test', marker='^', c='r', edgecolor='black', alpha=0.75)
    ax3.axhline(0, color='k', linestyle='--', lw=0.5)
    ax3.set_title('Residuals')
    ax3.set_xlabel('Predicted')
    ax3.set_ylabel('Residuals')
    ax3.legend()

    # Plot 4: Feature importances
    importances = selector.scores_
    indices = np.argsort(importances)[::-1]
    ax4.bar(range(X.shape[1]), importances[indices], color='black')
    ax4.set_xticks(range(X.shape[1]))
    ax4.set_xticklabels(np.array(X.columns)[indices], rotation=90)
    ax4.set_title('Feature Importances')
    ax4.set_xlabel('Feature')
    ax4.set_ylabel('Score')

    plt.tight_layout()

    # Convert each subplot to base64
    for i, ax in enumerate(fig.axes):
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_b64 = base64.b64encode(buf.read()).decode('utf-8')
        images.append(image_b64)
        buf.close()
        break  # Save once — whole fig includes all 4 subplots

    plt.close(fig)

    return {
        'images': images,
        'h5': h5_base64
    }
