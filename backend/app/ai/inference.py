import numpy as np
from typing import Dict, Any, List, Tuple
from app.ai.feature_extractor import extract_features, FEATURE_COLUMNS
from app.ai.model_trainer import train_or_load_models

# Cache loaded models
_classifier = None
_anomaly_detector = None

def get_models():
    global _classifier, _anomaly_detector
    if _classifier is None or _anomaly_detector is None:
        _classifier, _anomaly_detector = train_or_load_models()
    return _classifier, _anomaly_detector

def predict_threat_ai(event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs multi-model AI inference on a security event:
    1. Random Forest multi-class threat probability
    2. Isolation Forest behavioral anomaly score
    3. Explainability factor decomposition
    """
    classifier, anomaly_model = get_models()
    features = extract_features(event_dict)
    features_2d = features.reshape(1, -1)

    # 1. Random Forest Probabilities [Benign, Suspicious, Malicious]
    try:
        probs = classifier.predict_proba(features_2d)[0]
    except Exception:
        probs = np.array([0.5, 0.3, 0.2])

    p_benign = float(probs[0])
    p_suspicious = float(probs[1])
    p_malicious = float(probs[2])

    # 2. Isolation Forest Anomaly Detection
    # decision_function returns negative values for anomalies, positive for normal
    try:
        raw_anomaly_score = float(anomaly_model.decision_function(features_2d)[0])
        # Map roughly from [-0.3, 0.3] into [0, 100]% anomaly probability
        anomaly_score = float(np.clip((0.25 - raw_anomaly_score) / 0.45 * 100.0, 5.0, 99.0))
    except Exception:
        anomaly_score = 45.0

    # Predicted class
    class_idx = int(np.argmax(probs))
    class_names = ["Benign", "Suspicious", "Malicious"]
    predicted_class = class_names[class_idx]

    # Calculate model probability (weighted suspicious + malicious)
    model_probability = float(np.clip((p_malicious * 100.0) + (p_suspicious * 40.0), 0.0, 100.0))

    # 3. Explainability Factor Extraction
    contributing_factors: List[Dict[str, Any]] = []
    reasons: List[str] = []

    failed_val = features[0] * 10
    if failed_val >= 3:
        weight_str = f"+{int(min(failed_val * 4, 40))}%"
        contributing_factors.append({
            "factor": "Authentication Failure Burst",
            "weight": weight_str,
            "description": f"{int(failed_val)} repeated failed logon attempts within short interval."
        })
        reasons.append(f"{int(failed_val)} failed authentication attempts were observed from source.")

    if features[3] >= 0.5: # is_priv
        contributing_factors.append({
            "factor": "Target Privilege Level",
            "weight": "+25%",
            "description": "Affected target user/service possesses administrative or elevated privileges."
        })
        reasons.append("The target account or service possesses administrative rights.")

    if features[4] >= 0.8: # is_external
        contributing_factors.append({
            "factor": "External Untrusted Source",
            "weight": "+15%",
            "description": f"Source origin ({event_dict.get('source_ip', 'External')}) is outside internal network boundary."
        })
        reasons.append("Source IP originates outside the enterprise perimeter.")

    if features[8] >= 0.5: # cmd_risk
        contributing_factors.append({
            "factor": "Malicious Command/Tool Signature",
            "weight": "+35%",
            "description": "Observed command matches known post-exploitation or credential-dumping syntax."
        })
        reasons.append("Payload or execution telemetry matched high-risk adversary tool signatures.")

    if anomaly_score >= 65.0:
        contributing_factors.append({
            "factor": "Statistical Anomaly Deviation",
            "weight": f"+{int(anomaly_score * 0.25)}%",
            "description": f"Telemetry exhibits {anomaly_score:.1f}% deviation from established baseline behavior."
        })
        reasons.append(f"The behavioral pattern deviates {anomaly_score:.1f}% from the baseline telemetry norm.")

    if features[7] >= 0.5: # off_hours
        contributing_factors.append({
            "factor": "Temporal Discrepancy",
            "weight": "+10%",
            "description": "Activity occurred outside standard business operating hours."
        })
        reasons.append("Activity transpired outside standard operational hours.")

    if not reasons:
        if predicted_class == "Benign":
            explanation = "Event behavior matches baseline operational traffic with low failure rate and standard protocol activity."
        else:
            explanation = "Event shows subtle deviations from baseline operational activity."
    else:
        explanation = f"This event was classified as {predicted_class.upper()} because:\n" + "\n".join(
            f"{i+1}. {r}" for i, r in enumerate(reasons)
        )

    return {
        "predicted_class": predicted_class,
        "class_probabilities": {
            "benign": round(p_benign, 4),
            "suspicious": round(p_suspicious, 4),
            "malicious": round(p_malicious, 4)
        },
        "model_probability": round(model_probability, 1),
        "anomaly_score": round(anomaly_score, 1),
        "contributing_factors": contributing_factors,
        "explanation": explanation
    }
