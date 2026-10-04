from typing import Dict, Any

# Historical performance baseline per threat category (True Positives, False Positives)
# In production, this can be queried dynamically from the database.
HISTORICAL_ACCURACY_BASELINE = {
    "Brute Force": {"tp": 142, "fp": 8, "fn": 4},
    "Credential Attack": {"tp": 98, "fp": 6, "fn": 5},
    "Privilege Escalation": {"tp": 64, "fp": 5, "fn": 2},
    "Malware": {"tp": 85, "fp": 4, "fn": 1},
    "Data Exfiltration": {"tp": 42, "fp": 3, "fn": 3},
    "Suspicious Login": {"tp": 115, "fp": 18, "fn": 9},
    "Port Scanning": {"tp": 210, "fp": 12, "fn": 7},
    "Web Attack": {"tp": 130, "fp": 14, "fn": 6},
    "Insider Threat": {"tp": 35, "fp": 7, "fn": 4},
    "Reconnaissance": {"tp": 175, "fp": 15, "fn": 8},
}

def calculate_adaptive_modifier(threat_type: str) -> float:
    """
    Mathematical Logic for Adaptive Threat Confidence:
    
    1. Precision = TP / (TP + FP)
    2. Precision Benchmark = 0.90 (90%)
    3. Modifier = 1.0 + 0.3 * (Precision - 0.90)
       - If precision is 95% (high trust): Modifier = 1.0 + 0.3 * (0.05) = 1.015 (+1.5% boost)
       - If precision is 75% (noisy rule): Modifier = 1.0 + 0.3 * (-0.15) = 0.955 (-4.5% dampener)
    4. Modifier is bounded strictly between [0.85, 1.15].
    """
    stats = HISTORICAL_ACCURACY_BASELINE.get(
        threat_type, 
        {"tp": 50, "fp": 5, "fn": 2}
    )
    tp = stats["tp"]
    fp = stats["fp"]
    total = tp + fp
    if total == 0:
        return 1.0

    precision = tp / total
    modifier = 1.0 + 0.3 * (precision - 0.90)
    return max(0.85, min(modifier, 1.15))

def calculate_threat_confidence(
    model_probability: float,
    anomaly_score: float,
    rule_score: float,
    correlation_score: float,
    threat_type: str
) -> Dict[str, Any]:
    """
    Transparent Multimodal Threat Confidence Calculation:
    
    Base Formula:
      Confidence_Base = 
          (0.35 * Model_Probability) + 
          (0.20 * Anomaly_Score) + 
          (0.30 * Rule_Match_Score) + 
          (0.15 * Historical_Correlation_Score)
          
    Adaptive Adjustment:
      Confidence_Final = min(100.0, max(0.0, Confidence_Base * Adaptive_Modifier))
    """
    w_model = 0.35
    w_anomaly = 0.20
    w_rule = 0.30
    w_corr = 0.15

    base_score = (
        (w_model * model_probability) +
        (w_anomaly * anomaly_score) +
        (w_rule * rule_score) +
        (w_corr * correlation_score)
    )

    modifier = calculate_adaptive_modifier(threat_type)
    final_score = round(min(100.0, max(0.0, base_score * modifier)), 1)

    # Classification tier
    if final_score >= 85.0:
        classification = "HIGH CONFIDENCE MALICIOUS ACTIVITY"
    elif final_score >= 65.0:
        classification = "SUSPICIOUS ACTIVITY REQUIRING TRIAGE"
    elif final_score >= 40.0:
        classification = "ELEVATED RISK ANOMALY"
    else:
        classification = "BENIGN OPERATIONAL TELEMETRY"

    return {
        "confidence_score": final_score,
        "classification": classification,
        "breakdown": {
            "ai_model": round(model_probability, 1),
            "anomaly_detection": round(anomaly_score, 1),
            "rule_match": round(rule_score, 1),
            "historical_correlation": round(correlation_score, 1)
        },
        "weights": {
            "ai_model_pct": 35,
            "anomaly_pct": 20,
            "rule_pct": 30,
            "correlation_pct": 15
        },
        "adaptive_modifier": round(modifier, 3),
        "threat_type": threat_type
    }
