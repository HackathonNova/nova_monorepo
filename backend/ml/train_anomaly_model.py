"""
Anomaly Detection Model Trainer
================================
Trains an Isolation Forest (unsupervised) and evaluates it on
the synthetic sensor dataset.

Usage:
    python train_anomaly_model.py

Outputs:
    ml/models/anomaly_detector.joblib   – serialised model
    ml/models/scaler.joblib             – fitted StandardScaler
    Prints classification report on full dataset.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent
DATA_DIR   = BASE_DIR / "data"
MODEL_DIR  = BASE_DIR / "models"
CSV_PATH   = DATA_DIR / "sensor_dataset.csv"

FEATURE_COLS = ["flow_l_min", "temperature_c", "pressure_bar", "ph"]

# ─── Load data ───────────────────────────────────────────────────────────────

def load_data(path: Path = CSV_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"[ERROR] Dataset not found at {path}")
        print("        Run generate_dataset.py first.")
        sys.exit(1)
    df = pd.read_csv(path)
    print(f"[DATA] Loaded {len(df)} samples from {path}")
    return df


# ─── Train ───────────────────────────────────────────────────────────────────

def train(df: pd.DataFrame, contamination: float = 0.10):
    """
    Train Isolation Forest on ALL data (unsupervised).
    `contamination` should match the anomaly ratio in the dataset.
    """
    X = df[FEATURE_COLS].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)
    print("[MODEL] Isolation Forest trained (n_estimators=200)")

    return model, scaler


# ─── Evaluate ────────────────────────────────────────────────────────────────

def evaluate(model, scaler, df: pd.DataFrame):
    X = df[FEATURE_COLS].values
    X_scaled = scaler.transform(X)

    # Isolation Forest returns  1 = inlier, -1 = outlier
    preds_raw = model.predict(X_scaled)
    preds = (preds_raw == -1)  # True = anomaly

    y_true = df["anomaly"].astype(bool).values

    print("\n── Classification Report ──────────────────────────")
    print(classification_report(y_true, preds, target_names=["Normal", "Anomaly"]))
    print("── Confusion Matrix ──────────────────────────────")
    print(confusion_matrix(y_true, preds))
    print()


# ─── Predict helper (for runtime integration) ───────────────────────────────

def predict_single(model, scaler, flow: float, temp: float, pressure: float, ph: float) -> bool:
    """Return True if the reading is anomalous."""
    x = np.array([[flow, temp, pressure, ph]])
    x_scaled = scaler.transform(x)
    return model.predict(x_scaled)[0] == -1


# ─── Save / Load ─────────────────────────────────────────────────────────────

def save_model(model, scaler, model_dir: Path = MODEL_DIR):
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_dir / "anomaly_detector.joblib")
    joblib.dump(scaler, model_dir / "scaler.joblib")
    print(f"[SAVE] Model  → {model_dir / 'anomaly_detector.joblib'}")
    print(f"[SAVE] Scaler → {model_dir / 'scaler.joblib'}")


def load_model(model_dir: Path = MODEL_DIR):
    model  = joblib.load(model_dir / "anomaly_detector.joblib")
    scaler = joblib.load(model_dir / "scaler.joblib")
    return model, scaler


# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    df = load_data()
    model, scaler = train(df)
    evaluate(model, scaler, df)
    save_model(model, scaler)

    # Quick demo prediction
    print("── Demo Predictions ──────────────────────────────")
    normal_reading  = (5.0, 25.0, 9.0, 7.0)
    anomaly_reading = (18.0, 5.0, 14.0, 3.0)
    print(f"  Normal  {normal_reading}  → anomaly={predict_single(model, scaler, *normal_reading)}")
    print(f"  Anomaly {anomaly_reading} → anomaly={predict_single(model, scaler, *anomaly_reading)}")
