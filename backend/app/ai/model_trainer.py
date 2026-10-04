import os
import logging
from pathlib import Path
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from app.config import settings

logger = logging.getLogger("vigilix.ai")

MODELS_DIR = Path(settings.ML_MODELS_DIR)
CLASSIFIER_PATH = MODELS_DIR / "threat_detector.joblib"
ANOMALY_PATH = MODELS_DIR / "anomaly_detector.joblib"

def generate_synthetic_cybersecurity_dataset(n_samples: int = 1500):
    """
    Generates realistic cybersecurity feature vectors and ground truth labels.
    Labels: 0 = Benign, 1 = Suspicious, 2 = Malicious
    Features:
    [norm_failed, norm_freq, port_risk, is_priv, is_external, sev_weight, norm_entropy, is_off_hours, cmd_risk, traffic_ratio]
    """
    np.random.seed(42)
    n_benign = int(n_samples * 0.70)
    n_suspicious = int(n_samples * 0.15)
    n_malicious = n_samples - n_benign - n_suspicious

    # Benign data distribution (Normal corporate user activity)
    benign_X = np.column_stack([
        np.random.uniform(0.0, 0.2, n_benign),      # norm_failed (0-2 failed logins)
        np.random.uniform(0.05, 0.3, n_benign),     # norm_freq
        np.random.choice([0.3, 0.4], n_benign),     # port_risk (80, 443, 53)
        np.random.choice([0.0, 0.1], n_benign, p=[0.9, 0.1]), # is_priv
        np.random.choice([0.0, 1.0], n_benign, p=[0.75, 0.25]), # is_external
        np.random.choice([0.1, 0.25], n_benign, p=[0.8, 0.2]),  # sev_weight
        np.random.uniform(0.2, 0.5, n_benign),      # norm_entropy
        np.random.choice([0.0, 0.2], n_benign, p=[0.85, 0.15]), # is_off_hours
        np.zeros(n_benign),                         # cmd_risk
        np.random.uniform(0.05, 0.25, n_benign)     # traffic_ratio
    ])
    benign_y = np.zeros(n_benign, dtype=int)

    # Suspicious data distribution (Policy anomalies, repeated errors, abnormal off-hours)
    suspicious_X = np.column_stack([
        np.random.uniform(0.3, 0.7, n_suspicious),   # norm_failed (3-7 failures)
        np.random.uniform(0.3, 0.7, n_suspicious),   # norm_freq
        np.random.choice([0.5, 0.7], n_suspicious),  # port_risk (SSH, DB, RDP)
        np.random.choice([0.1, 1.0], n_suspicious, p=[0.5, 0.5]), # is_priv
        np.random.choice([0.0, 1.0], n_suspicious, p=[0.3, 0.7]), # is_external
        np.random.choice([0.25, 0.55], n_suspicious, p=[0.4, 0.6]), # sev_weight
        np.random.uniform(0.4, 0.7, n_suspicious),   # norm_entropy
        np.random.choice([0.5, 0.8], n_suspicious, p=[0.4, 0.6]), # is_off_hours
        np.random.choice([0.0, 0.6], n_suspicious, p=[0.7, 0.3]), # cmd_risk
        np.random.uniform(0.3, 0.65, n_suspicious)   # traffic_ratio
    ])
    suspicious_y = np.ones(n_suspicious, dtype=int)

    # Malicious data distribution (Brute force, exploit execution, exfiltration, mimikatz)
    malicious_X = np.column_stack([
        np.random.uniform(0.7, 1.5, n_malicious),    # norm_failed (8-15+ failures)
        np.random.uniform(0.7, 1.5, n_malicious),    # norm_freq (Burst)
        np.random.choice([0.8, 0.9, 1.0], n_malicious), # port_risk (SMB, RDP, WinRM)
        np.random.choice([0.5, 1.0], n_malicious, p=[0.2, 0.8]), # target is_priv
        np.random.choice([0.0, 1.0], n_malicious, p=[0.1, 0.9]), # is_external
        np.random.choice([0.85, 1.0], n_malicious, p=[0.3, 0.7]), # critical severity
        np.random.uniform(0.65, 1.0, n_malicious),   # high entropy / shellcode
        np.random.choice([0.5, 1.0], n_malicious, p=[0.3, 0.7]), # is_off_hours
        np.random.choice([0.6, 1.0], n_malicious, p=[0.3, 0.7]), # cmd_risk (mimikatz, powershell)
        np.random.uniform(0.7, 1.2, n_malicious)    # abnormal outbound traffic
    ])
    malicious_y = np.full(n_malicious, 2, dtype=int)

    X = np.vstack([benign_X, suspicious_X, malicious_X])
    y = np.concatenate([benign_y, suspicious_y, malicious_y])

    # Shuffle
    indices = np.arange(len(y))
    np.random.shuffle(indices)
    return X[indices], y[indices], benign_X

def train_and_save_models():
    """Trains the Random Forest classifier and Isolation Forest anomaly detector."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Generating realistic cybersecurity dataset (1,500 events)...")
    X, y, benign_X = generate_synthetic_cybersecurity_dataset(n_samples=1500)

    # 1. Train Random Forest Classifier
    logger.info("Training Random Forest Threat Classifier...")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        random_state=42
    )
    rf.fit(X, y)
    joblib.dump(rf, CLASSIFIER_PATH)
    logger.info(f"Saved Threat Classifier to {CLASSIFIER_PATH}")

    # 2. Train Isolation Forest Anomaly Detector on benign telemetry
    logger.info("Training Isolation Forest Anomaly Detector...")
    iso = IsolationForest(
        n_estimators=100,
        contamination=0.10,
        random_state=42
    )
    iso.fit(benign_X)
    joblib.dump(iso, ANOMALY_PATH)
    logger.info(f"Saved Anomaly Detector to {ANOMALY_PATH}")

    return rf, iso

def train_or_load_models():
    """Loads existing models or triggers initial training."""
    if CLASSIFIER_PATH.exists() and ANOMALY_PATH.exists():
        try:
            rf = joblib.load(CLASSIFIER_PATH)
            iso = joblib.load(ANOMALY_PATH)
            logger.info("Successfully loaded existing ML models.")
            return rf, iso
        except Exception as e:
            logger.warning(f"Error loading saved models: {e}. Retraining...")
    
    return train_and_save_models()
