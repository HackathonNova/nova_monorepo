"""
Model Evaluation and Visualization
====================================
Generates comprehensive evaluation metrics and visualizations for the
Isolation Forest anomaly detection model.

Outputs:
    ml/reports/confusion_matrix.png
    ml/reports/feature_distributions.png
    ml/reports/anomaly_scores.png
    ml/reports/roc_curve.png
    ml/reports/metrics.json
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    precision_recall_curve,
    f1_score
)

warnings.filterwarnings('ignore')

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).resolve().parent
MODEL_DIR    = BASE_DIR / "models"
DATA_DIR     = BASE_DIR / "data"
REPORT_DIR   = BASE_DIR / "reports"
CSV_PATH     = DATA_DIR / "sensor_dataset.csv"

FEATURE_COLS = ["flow_l_min", "temperature_c", "pressure_bar", "ph"]

# ─── Styling ─────────────────────────────────────────────────────────────────
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ─── Load data and model ─────────────────────────────────────────────────────

def load_data():
    if not CSV_PATH.exists():
        print(f"[ERROR] Dataset not found: {CSV_PATH}")
        sys.exit(1)
    return pd.read_csv(CSV_PATH)


def load_model():
    try:
        import joblib
        model  = joblib.load(MODEL_DIR / "anomaly_detector.joblib")
        scaler = joblib.load(MODEL_DIR / "scaler.joblib")
        return model, scaler
    except FileNotFoundError:
        print("[ERROR] Model not found. Run train_anomaly_model.py first.")
        sys.exit(1)


# ─── Predictions ─────────────────────────────────────────────────────────────

def get_predictions(model, scaler, df):
    X = df[FEATURE_COLS].values
    X_scaled = scaler.transform(X)
    
    # Predictions: 1 = inlier, -1 = outlier
    preds_raw = model.predict(X_scaled)
    preds = (preds_raw == -1).astype(int)  # 1 = anomaly, 0 = normal
    
    # Anomaly scores (lower = more anomalous)
    scores = model.decision_function(X_scaled)
    
    y_true = df["anomaly"].astype(int).values
    
    return y_true, preds, scores


# ─── 1. Confusion Matrix ─────────────────────────────────────────────────────

def plot_confusion_matrix(y_true, y_pred, save_path):
    cm = confusion_matrix(y_true, y_pred)
    
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False,
                xticklabels=['Normal', 'Anomaly'],
                yticklabels=['Normal', 'Anomaly'],
                ax=ax, square=True, linewidths=2)
    ax.set_xlabel('Predicted', fontsize=12, fontweight='bold')
    ax.set_ylabel('Actual', fontsize=12, fontweight='bold')
    ax.set_title('Confusion Matrix', fontsize=14, fontweight='bold', pad=20)
    
    # Add metrics text
    tn, fp, fn, tp = cm.ravel()
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    
    metrics_text = f'Accuracy: {accuracy:.3f}\nPrecision: {precision:.3f}\nRecall: {recall:.3f}'
    ax.text(1.6, 0.5, metrics_text, transform=ax.transData, 
            fontsize=11, verticalalignment='center',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[PLOT] Confusion Matrix → {save_path}")


# ─── 2. Feature Distributions ────────────────────────────────────────────────

def plot_feature_distributions(df, y_true, save_path):
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.ravel()
    
    for i, feature in enumerate(FEATURE_COLS):
        ax = axes[i]
        
        # Normal samples
        normal_data = df.loc[y_true == 0, feature]
        # Anomaly samples
        anomaly_data = df.loc[y_true == 1, feature]
        
        ax.hist(normal_data, bins=40, alpha=0.6, label='Normal', color='steelblue', edgecolor='black')
        ax.hist(anomaly_data, bins=40, alpha=0.7, label='Anomaly', color='crimson', edgecolor='black')
        
        ax.set_xlabel(feature.replace('_', ' ').title(), fontsize=11, fontweight='bold')
        ax.set_ylabel('Frequency', fontsize=11, fontweight='bold')
        ax.set_title(f'{feature.replace("_", " ").title()} Distribution', fontsize=12, fontweight='bold')
        ax.legend(loc='upper right')
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[PLOT] Feature Distributions → {save_path}")


# ─── 3. Anomaly Scores Distribution ──────────────────────────────────────────

def plot_anomaly_scores(y_true, scores, save_path):
    fig, ax = plt.subplots(figsize=(10, 6))
    
    normal_scores = scores[y_true == 0]
    anomaly_scores = scores[y_true == 1]
    
    ax.hist(normal_scores, bins=50, alpha=0.6, label='Normal', color='steelblue', edgecolor='black')
    ax.hist(anomaly_scores, bins=50, alpha=0.7, label='Anomaly', color='crimson', edgecolor='black')
    
    ax.axvline(0, color='black', linestyle='--', linewidth=2, label='Decision Boundary')
    ax.set_xlabel('Anomaly Score (decision function)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
    ax.set_title('Anomaly Score Distribution', fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='upper right', fontsize=11)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[PLOT] Anomaly Scores → {save_path}")


# ─── 4. ROC Curve ────────────────────────────────────────────────────────────

def plot_roc_curve(y_true, scores, save_path):
    # Use negative scores for ROC (higher score = more likely anomaly)
    fpr, tpr, _ = roc_curve(y_true, -scores)
    roc_auc = auc(fpr, tpr)
    
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.3f})')
    ax.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random Classifier')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=12, fontweight='bold')
    ax.set_ylabel('True Positive Rate', fontsize=12, fontweight='bold')
    ax.set_title('Receiver Operating Characteristic (ROC) Curve', fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='lower right', fontsize=11)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[PLOT] ROC Curve → {save_path}")
    return roc_auc


# ─── 5. Precision-Recall Curve ──────────────────────────────────────────────

def plot_precision_recall(y_true, scores, save_path):
    precision, recall, _ = precision_recall_curve(y_true, -scores)
    pr_auc = auc(recall, precision)
    
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.plot(recall, precision, color='green', lw=2, label=f'PR curve (AUC = {pr_auc:.3f})')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('Recall', fontsize=12, fontweight='bold')
    ax.set_ylabel('Precision', fontsize=12, fontweight='bold')
    ax.set_title('Precision-Recall Curve', fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='lower left', fontsize=11)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[PLOT] Precision-Recall Curve → {save_path}")
    return pr_auc


# ─── 6. Summary Metrics ──────────────────────────────────────────────────────

def save_metrics(y_true, y_pred, scores, roc_auc, pr_auc, save_path):
    from sklearn.metrics import accuracy_score, precision_score, recall_score
    
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred)),
        "recall": float(recall_score(y_true, y_pred)),
        "f1_score": float(f1_score(y_true, y_pred)),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": {
            "tn": int(confusion_matrix(y_true, y_pred)[0, 0]),
            "fp": int(confusion_matrix(y_true, y_pred)[0, 1]),
            "fn": int(confusion_matrix(y_true, y_pred)[1, 0]),
            "tp": int(confusion_matrix(y_true, y_pred)[1, 1])
        }
    }
    
    with open(save_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"[SAVE] Metrics JSON → {save_path}")
    return metrics


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("  ANOMALY DETECTION MODEL EVALUATION")
    print("=" * 60)
    
    df = load_data()
    model, scaler = load_model()
    
    y_true, y_pred, scores = get_predictions(model, scaler, df)
    
    print(f"\nDataset: {len(df)} samples")
    print(f"  Normal:   {sum(y_true == 0)} ({sum(y_true == 0)/len(df)*100:.1f}%)")
    print(f"  Anomaly:  {sum(y_true == 1)} ({sum(y_true == 1)/len(df)*100:.1f}%)")
    print()
    
    # Generate plots
    plot_confusion_matrix(y_true, y_pred, REPORT_DIR / "confusion_matrix.png")
    plot_feature_distributions(df, y_true, REPORT_DIR / "feature_distributions.png")
    plot_anomaly_scores(y_true, scores, REPORT_DIR / "anomaly_scores.png")
    roc_auc = plot_roc_curve(y_true, scores, REPORT_DIR / "roc_curve.png")
    pr_auc = plot_precision_recall(y_true, scores, REPORT_DIR / "precision_recall_curve.png")
    
    # Save metrics
    metrics = save_metrics(y_true, y_pred, scores, roc_auc, pr_auc, REPORT_DIR / "metrics.json")
    
    print("\n" + "=" * 60)
    print("  SUMMARY METRICS")
    print("=" * 60)
    print(f"  Accuracy:   {metrics['accuracy']:.3f}")
    print(f"  Precision:  {metrics['precision']:.3f}")
    print(f"  Recall:     {metrics['recall']:.3f}")
    print(f"  F1-Score:   {metrics['f1_score']:.3f}")
    print(f"  ROC-AUC:    {metrics['roc_auc']:.3f}")
    print(f"  PR-AUC:     {metrics['pr_auc']:.3f}")
    print("=" * 60)
    print(f"\n✓ All reports saved to {REPORT_DIR}/\n")


if __name__ == "__main__":
    main()
