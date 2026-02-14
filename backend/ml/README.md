# Anomaly Detection Model – Evaluation Metrics

## Overview

This anomaly detection system uses an **Isolation Forest** algorithm to identify abnormal sensor readings in real-time industrial IoT telemetry (flow, temperature, pressure, pH). The model achieves **97.5% accuracy** with strong anomaly detection capabilities.

---

## Model Performance Summary

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **Accuracy** | 0.975 | 97.5% of all predictions are correct |
| **Precision** | 0.876 | 87.6% of flagged anomalies are true anomalies |
| **Recall** | 0.876 | 87.6% of actual anomalies are detected |
| **F1-Score** | 0.876 | Balanced precision-recall performance |
| **ROC-AUC** | 0.993 | Excellent class separation (near-perfect) |
| **PR-AUC** | 0.951 | Strong performance on imbalanced data |

---

## Why These Metrics Matter

### 1. **Accuracy (97.5%)**
**What it measures:** Percentage of correct predictions (both normal and anomalous).

**Why it's relevant:**  
In industrial monitoring, high accuracy ensures that operators can trust the system's overall predictions. However, because anomalies are rare (10% in our dataset), accuracy alone can be misleading — a system that always predicts "normal" would still achieve 90% accuracy while missing all failures.

**Our result:**  
97.5% accuracy means the model correctly classifies 4,875 out of 5,000 samples, significantly outperforming a naive baseline.

---

### 2. **Precision (87.6%)**
**What it measures:** Of all samples flagged as anomalies, what percentage are actually anomalous?

**Why it's relevant:**  
**False positives** (normal events flagged as anomalies) cause unnecessary alerts, leading to:
- Operator fatigue from false alarms
- Wasted time investigating non-issues
- Reduced trust in the system

**Our result:**  
87.6% precision means **12.4% of alerts are false positives** — a manageable rate for industrial IoT, where some false alarms are acceptable to avoid missing critical failures.

---

### 3. **Recall / Sensitivity (87.6%)**
**What it measures:** Of all actual anomalies, what percentage are detected?

**Why it's relevant:**  
**False negatives** (missed anomalies) are **critical** in industrial settings because they represent:
- Undetected equipment failures
- Safety hazards (pressure spikes, temperature deviations)
- Potential production downtime or damage

**Our result:**  
87.6% recall means the model catches **87.6% of real anomalies**. The remaining 12.4% are missed — this is a trade-off between catching all issues and avoiding excessive false alarms. For safety-critical systems, this could be improved by adjusting the contamination threshold or adding domain-specific rules.

---

### 4. **F1-Score (0.876)**
**What it measures:** Harmonic mean of precision and recall (balances both metrics).

**Why it's relevant:**  
The F1-score is critical when you need to **balance** false positives and false negatives. For anomaly detection:
- Too high precision → misses anomalies (low recall)
- Too high recall → too many false alarms (low precision)

**Our result:**  
0.876 shows the model achieves a **strong balance** between catching anomalies and minimizing false alerts.

---

### 5. **ROC-AUC (0.993)**
**What it measures:** Area Under the Receiver Operating Characteristic curve — evaluates the model's ability to distinguish between normal and anomalous samples across all possible thresholds.

**Why it's relevant:**  
- **1.0** = Perfect separation (100% correct at all thresholds)
- **0.5** = Random guessing (useless model)

ROC-AUC is **threshold-agnostic**, meaning it shows how well the model ranks anomalies higher than normal samples, regardless of where you set the decision boundary.

**Our result:**  
**0.993** is **near-perfect** — the model almost always assigns higher anomaly scores to true anomalies than to normal samples. This means:
- We can tune the decision threshold to favor precision or recall without degrading overall performance
- The model has learned meaningful patterns

---

### 6. **PR-AUC (0.951)**
**What it measures:** Area Under the Precision-Recall curve — especially important for **imbalanced datasets** (like ours, with 90% normal, 10% anomalies).

**Why it's relevant:**  
ROC-AUC can be optimistic on imbalanced data because it's influenced by the large number of true negatives. PR-AUC focuses **only** on how well the model handles the minority class (anomalies), making it a **more realistic metric** for rare event detection.

**Our result:**  
**0.951** confirms that the model maintains **excellent precision and recall** even when anomalies are rare. This is critical for industrial IoT, where failures are infrequent but must be caught reliably.

---

## Confusion Matrix Breakdown

|                  | **Predicted Normal** | **Predicted Anomaly** |
|------------------|----------------------|-----------------------|
| **Actual Normal**   | 4,438 (True Negative) | 62 (False Positive) |
| **Actual Anomaly**  | 62 (False Negative)   | 438 (True Positive) |

### Interpretation:
- **True Negatives (4,438):** Normal samples correctly identified → 98.6% of normal cases
- **True Positives (438):** Anomalies correctly detected → 87.6% of anomalies caught
- **False Positives (62):** Normal samples incorrectly flagged → 1.4% false alarm rate
- **False Negatives (62):** Anomalies missed → 12.4% of failures undetected

---

## Why Isolation Forest?

**Isolation Forest** is ideal for anomaly detection because:
1. **Unsupervised** — doesn't require labeled "normal" vs. "anomaly" data (learns patterns from the data itself)
2. **Fast training & inference** — efficient for real-time IoT telemetry
3. **Works well on multi-dimensional data** — captures complex interactions between flow, temperature, pressure, and pH
4. **Robust to noise** — based on ensemble learning (200 decision trees in our model)

**How it works:**  
Anomalies are "easier to isolate" — they require fewer random splits in a decision tree to be separated from the bulk of normal data. The algorithm exploits this by measuring how quickly each sample can be isolated.

---

## Trade-offs and Recommendations

### Current Performance
✅ Excellent overall accuracy (97.5%)  
✅ High ROC-AUC (0.993) — strong class separation  
✅ Balanced precision/recall (87.6% each)  
✅ Low false alarm rate (1.4%)  

### Potential Improvements
⚠️ **12.4% of anomalies are missed** (62 false negatives)

**For safety-critical systems**, consider:
1. **Lower the contamination threshold** → increases recall (catches more anomalies) at the cost of more false alarms
2. **Add rule-based checks** → hard thresholds for critical values (e.g., pH < 6 always triggers an alert)
3. **Ensemble methods** → combine Isolation Forest with other models (One-Class SVM, Autoencoders)
4. **Feature engineering** → add time-series features (rate of change, moving averages, derivatives)

---

## Visualizations

The following plots are generated in `ml/reports/`:

- **`confusion_matrix.png`** — Visual breakdown of predictions vs. actual labels
- **`feature_distributions.png`** — Histograms showing how anomalies differ from normal data
- **`anomaly_scores.png`** — Distribution of model decision scores (separation quality)
- **`roc_curve.png`** — ROC curve showing true positive vs. false positive trade-off
- **`precision_recall_curve.png`** — Precision-Recall curve for imbalanced data evaluation

---

## Usage

### Generate Synthetic Dataset
```bash
python ml/generate_dataset.py
```
Outputs: `ml/data/sensor_dataset.csv` (5,000 samples with 10% anomalies)

### Train Model
```bash
python ml/train_anomaly_model.py
```
Outputs: `ml/models/anomaly_detector.joblib`, `ml/models/scaler.joblib`

### Evaluate Model
```bash
python ml/evaluate_model.py
```
Outputs: All metrics and plots in `ml/reports/`

---

## Real-Time Integration

The trained model can be integrated into the FastAPI backend to provide real-time anomaly detection:

```python
from ml.train_anomaly_model import load_model, predict_single

model, scaler = load_model()
is_anomalous = predict_single(model, scaler, flow=18.0, temp=5.0, pressure=14.0, ph=3.0)
# Returns: True (anomaly detected)
```

For production deployment:
- Load the model once at server startup
- Call `predict_single()` for each incoming sensor reading
- Send alerts to operators if anomalies are detected
- Log predictions for continuous model monitoring and retraining

---

**Model Version:** 1.0  
**Last Updated:** February 15, 2026  
**Dataset Size:** 5,000 samples (90% normal, 10% anomalies)  
**Algorithm:** Isolation Forest (n_estimators=200, contamination=0.10)

---

## Script Reference

### File Roles

| Script | Purpose |
|--------|---------|
| `ml/generate_dataset.py` | Generates a synthetic sensor dataset (CSV + JSON) with configurable anomaly injection. This is the data foundation — it creates realistic flow, temperature, pressure, and pH readings with 10% anomalies (spikes, drops, outliers). Run this **first** whenever you need fresh training data. |
| `ml/train_anomaly_model.py` | Trains an Isolation Forest model on the dataset, fits a StandardScaler, evaluates on the full dataset, and serialises both to `.joblib` files. Also exposes `predict_single()` and `load_model()` for runtime integration. Run this **after** generating the dataset. |
| `ml/evaluate_model.py` | Produces all evaluation artefacts: confusion matrix, feature distributions, anomaly score histogram, ROC curve, Precision-Recall curve, and a `metrics.json` summary. Run this **after** training to assess model quality. |
| `backend/main.py` | FastAPI application that serves the REST API, WebSocket feeds, and RAG chatbot. When extended, it can load the trained model and classify incoming telemetry in real time. |
| `esp32_BOOTCAMP/src/main.cpp` | ESP32 firmware: reads a Hall-effect flow sensor + DS18B20 temperature sensor, computes mock pressure and pH, performs threshold-based anomaly detection, and publishes JSON telemetry over TLS MQTT every second. |
| `frontend/src/components/Dashboard.tsx` | React dashboard with three views — 3D reactor, AI chatbot, and ESP telemetry. The ESP view subscribes to MQTT over WebSocket, renders live sensor cards, time-series graphs, anomaly alerts, and model diagnostics. |

---

### How to Launch

#### 1. Generate the dataset
```bash
cd nova_monorepo/backend
python ml/generate_dataset.py
```
Creates `ml/data/sensor_dataset.csv` and `ml/data/sensor_dataset.json` (5,000 samples).

#### 2. Train the model
```bash
python ml/train_anomaly_model.py
```
Outputs `ml/models/anomaly_detector.joblib` and `ml/models/scaler.joblib`. Prints a classification report.

#### 3. Evaluate the model and generate graphs
```bash
python ml/evaluate_model.py
```
Generates all plots + `ml/reports/metrics.json`. Open the PNGs in any image viewer.

#### 4. Start the backend
```bash
cd nova_monorepo/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The API is available at `http://localhost:8000`. Swagger docs at `/docs`.

#### 5. Start the frontend
```bash
cd nova_monorepo/frontend
npm install   # first time only
npm run dev
```
Opens at `http://localhost:5173` (or next available port). Navigate to **ESP Telemetry** in the sidebar.

#### 6. Flash the ESP32
```bash
cd esp32_BOOTCAMP
pio run -t upload            # build + flash
pio device monitor --baud 115200   # view serial output
```
The ESP32 connects to WiFi, then publishes to `factory/reactor1/sensors` via MQTT over TLS. The frontend auto-subscribes and shows live data.

---

### How to Test

| What to test | Command | Expected result |
|---|---|---|
| **Dataset generation** | `python ml/generate_dataset.py` | Prints sample counts; CSV + JSON created in `ml/data/` |
| **Model training** | `python ml/train_anomaly_model.py` | Prints classification report with ~97% accuracy; model files in `ml/models/` |
| **Model evaluation** | `python ml/evaluate_model.py` | 5 PNG plots + `metrics.json` in `ml/reports/`; summary printed to terminal |
| **Prediction sanity** | `python -c "from ml.train_anomaly_model import load_model, predict_single; m,s=load_model(); print(predict_single(m,s,5,25,9,7)); print(predict_single(m,s,18,5,14,3))"` | Prints `False` (normal), then `True` (anomaly) |
| **Backend API** | `curl http://localhost:8000/docs` | Swagger UI loads |
| **Frontend build** | `cd frontend && npx tsc --noEmit` | No TypeScript errors |
| **Frontend tests** | `cd frontend && npm test` | Vitest suite passes |
| **ESP32 compile** | `cd esp32_BOOTCAMP && pio run` | Build succeeds with 0 errors |

---

### End-to-End Workflow

```
generate_dataset.py  →  sensor_dataset.csv
                              ↓
                    train_anomaly_model.py  →  anomaly_detector.joblib + scaler.joblib
                              ↓
                    evaluate_model.py  →  reports/ (plots + metrics)
                              ↓
                    main.py (backend)  ←  loads model for real-time scoring
                              ↓
ESP32 → MQTT → frontend (Dashboard.tsx)  ←  live sensor display + anomaly alerts
```
