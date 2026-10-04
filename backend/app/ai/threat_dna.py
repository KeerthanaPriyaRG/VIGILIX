from typing import Dict, Any

def generate_threat_dna(
    threat_type: str,
    severity: str,
    confidence_score: float,
    mitre_technique: str,
    target_asset: str,
    source: str,
    behavior_summary: str,
    anomaly_score: float,
    attack_vector: str = "Network Protocol",
    persistence: str = "None Observed",
    exfiltration: str = "None Observed"
) -> Dict[str, Any]:
    """
    Generates a structured, standardized Threat DNA fingerprint card.
    """
    # Characterize anomaly level
    if anomaly_score >= 80.0:
        anomaly_desc = "Critical (Upper 95th Percentile)"
    elif anomaly_score >= 60.0:
        anomaly_desc = "High Deviation"
    elif anomaly_score >= 40.0:
        anomaly_desc = "Moderate Deviation"
    else:
        anomaly_desc = "Baseline Normal"

    return {
        "threat_type": threat_type,
        "attack_vector": attack_vector,
        "severity": severity.capitalize(),
        "confidence": f"{confidence_score:.1f}%",
        "mitre": mitre_technique or "T1078",
        "behavior": behavior_summary,
        "target": target_asset,
        "source": source or "Unknown Origin",
        "anomaly": anomaly_desc,
        "persistence": persistence,
        "exfiltration": exfiltration,
        "dna_signature": f"VIGILIX-DNA::{threat_type[:3].upper()}-{mitre_technique or 'GEN'}-{int(confidence_score)}"
    }
