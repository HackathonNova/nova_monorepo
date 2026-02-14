"""
Synthetic Dataset Generator for ESP32 Sensor Telemetry
=======================================================
Generates 5,000 samples mimicking flow, temperature, pressure, and pH
readings. ~10 % of samples are injected anomalies:
  - Flow spikes      > 2× normal
  - Temperature shift ± 10 °C
  - Pressure spikes  ± 5 bar
  - pH outliers      < 6 or > 9

Outputs:
  ml/data/sensor_dataset.csv
  ml/data/sensor_dataset.json
"""

import os
import json
import random
import csv
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────────────────────
NUM_SAMPLES           = 5_000
ANOMALY_RATIO         = 0.10   # 10 % anomalies
OUTPUT_DIR            = Path(__file__).resolve().parent / "data"

# Normal ranges (baselines)
FLOW_MEAN, FLOW_STD         = 5.0, 1.0       # L/min
TEMP_MEAN, TEMP_STD         = 25.0, 2.0      # °C
PRESSURE_BASE               = 5.0            # bar
PH_BASE                     = 7.0

random.seed(42)

# ─── Helpers ─────────────────────────────────────────────────────────────────

def normal_sample() -> dict:
    flow = round(random.gauss(FLOW_MEAN, FLOW_STD), 2)
    temp = round(random.gauss(TEMP_MEAN, TEMP_STD), 2)
    noise_p = round(random.uniform(-0.25, 0.25), 3)
    pressure = round(PRESSURE_BASE + flow * 0.8 + (temp - 25) * 0.02 + noise_p, 2)
    noise_ph = round(random.uniform(-0.1, 0.1), 3)
    ph = round(PH_BASE + (flow - 5) * 0.05 + (temp - 25) * 0.02 + noise_ph, 2)
    ph = max(0.0, min(14.0, ph))
    return {
        "flow_l_min": flow,
        "temperature_c": temp,
        "pressure_bar": pressure,
        "ph": ph,
        "anomaly": False,
    }


def anomaly_sample() -> dict:
    sample = normal_sample()
    anomaly_type = random.choice(["flow", "temperature", "pressure", "ph"])

    if anomaly_type == "flow":
        # Spike > 2× normal
        sample["flow_l_min"] = round(random.uniform(10.5, 20.0), 2)
    elif anomaly_type == "temperature":
        # Shift ± 10 °C
        if random.random() < 0.5:
            sample["temperature_c"] = round(random.uniform(0.0, 14.9), 2)
        else:
            sample["temperature_c"] = round(random.uniform(35.1, 50.0), 2)
    elif anomaly_type == "pressure":
        # Spike ± 5 bar
        if random.random() < 0.5:
            sample["pressure_bar"] = round(random.uniform(-5.0, -0.1), 2)
        else:
            sample["pressure_bar"] = round(random.uniform(10.1, 15.0), 2)
    elif anomaly_type == "ph":
        # Outlier < 6 or > 9
        if random.random() < 0.5:
            sample["ph"] = round(random.uniform(0.0, 5.9), 2)
        else:
            sample["ph"] = round(random.uniform(9.1, 14.0), 2)

    sample["anomaly"] = True
    return sample


# ─── Main ────────────────────────────────────────────────────────────────────

def generate_dataset(num_samples: int = NUM_SAMPLES) -> list[dict]:
    num_anomalies = int(num_samples * ANOMALY_RATIO)
    num_normal    = num_samples - num_anomalies

    data = [normal_sample() for _ in range(num_normal)]
    data += [anomaly_sample() for _ in range(num_anomalies)]
    random.shuffle(data)

    # Add sequential timestamp
    for i, row in enumerate(data):
        row["timestamp"] = i * 1000  # ms, 1-second intervals

    return data


def save_csv(data: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = ["timestamp", "flow_l_min", "temperature_c", "pressure_bar", "ph", "anomaly"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(data)
    print(f"[CSV]  Saved {len(data)} samples → {path}")


def save_json(data: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"[JSON] Saved {len(data)} samples → {path}")


if __name__ == "__main__":
    dataset = generate_dataset()
    save_csv(dataset, OUTPUT_DIR / "sensor_dataset.csv")
    save_json(dataset, OUTPUT_DIR / "sensor_dataset.json")

    n_anom = sum(1 for d in dataset if d["anomaly"])
    print(f"\nTotal: {len(dataset)} | Normal: {len(dataset)-n_anom} | Anomalies: {n_anom}")
