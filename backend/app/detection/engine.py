import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.detection.rules import evaluate_all_rules, DetectionRuleResult
from app.ai.inference import predict_threat_ai
from app.ai.adaptive_confidence import calculate_threat_confidence
from app.ai.threat_dna import generate_threat_dna

# Mapping threat types to recommended playbook IDs
PLAYBOOK_MAPPING = {
    "Brute Force": "PB-BRUTE-01",
    "Credential Attack": "PB-CRED-02",
    "Malware": "PB-MAL-03",
    "Privilege Escalation": "PB-PRIV-04",
    "Data Exfiltration": "PB-EXFIL-05",
    "Suspicious Login": "PB-LOGIN-06",
    "Reconnaissance": "PB-SCAN-07",
    "Web Attack": "PB-WEB-08",
    "Insider Threat": "PB-INSIDER-09",
}

def analyze_security_event(event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Unified VIGILIX Hybrid Threat Analysis Pipeline:
    
    1. Rule Engine Evaluation (12+ SOC rules)
    2. Statistical & Machine Learning Model Inference (Random Forest + Isolation Forest)
    3. Multimodal Threat Confidence Calculation (Decomposed & Adaptive)
    4. Structured Threat DNA Fingerprint Generation
    5. Playbook Recommendation & Incident Correlation
    """
    # 1. Rule Evaluation
    matched_rules: List[DetectionRuleResult] = evaluate_all_rules(event_dict)
    
    if matched_rules:
        # Sort by rule score descending
        top_rule = sorted(matched_rules, key=lambda r: r.rule_score, reverse=True)[0]
        rule_score = top_rule.rule_score
        threat_type = top_rule.threat_type
        severity = top_rule.severity
        mitre_technique = top_rule.mitre_technique
        attack_stage = top_rule.attack_stage
        recommended_action = top_rule.recommended_action
    else:
        rule_score = 15.0 # Low baseline
        threat_type = event_dict.get("event_type", "Suspicious Activity")
        # Source log severity is not detection severity; only detection evidence may promote it.
        severity = "low"
        mitre_technique = "N/A"
        attack_stage = "Initial Access"
        recommended_action = "Conduct analyst log review and check asset baseline activity."

    # 2. AI Model Inference
    ai_result = predict_threat_ai(event_dict)
    model_prob = ai_result["model_probability"]
    anomaly_score = ai_result["anomaly_score"]

    # 3. Correlation Score (Evaluates multi-source or multi-event indicators)
    # Simulated correlation factor based on target and event volume
    has_priv = 1.0 if "admin" in str(event_dict.get("user", "")).lower() else 0.0
    has_burst = 1.0 if float(event_dict.get("failed_attempts", 0)) >= 5 else 0.0
    corr_score = min(98.0, 50.0 + (has_priv * 25.0) + (has_burst * 20.0))

    # 4. Multimodal Threat Confidence Score
    confidence_data = calculate_threat_confidence(
        model_probability=model_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        correlation_score=corr_score,
        threat_type=threat_type
    )
    final_confidence = confidence_data["confidence_score"]

    # Determine if event is an actionable threat (e.g. confidence >= 60% or critical severity or strong rule match)
    is_threat = (final_confidence >= 60.0) or (rule_score >= 80.0) or (severity in ["critical", "high"])

    # Apply confidence-driven severity from the highest threshold down.
    if final_confidence >= 95.0:
        severity = "critical"
    elif final_confidence >= 85.0 and severity not in ["critical", "high"]:
        severity = "high"

    # 5. Threat DNA Generation
    target_asset = event_dict.get("hostname") or event_dict.get("affected_asset") or event_dict.get("user") or "CORP-ENDPOINT"
    source_origin = event_dict.get("source_ip") or event_dict.get("source") or "192.168.1.100"
    behavior_summary = f"{threat_type} behavior detected on {target_asset} with {final_confidence:.0f}% AI confidence."

    dna = generate_threat_dna(
        threat_type=threat_type,
        severity=severity,
        confidence_score=final_confidence,
        mitre_technique=mitre_technique,
        target_asset=target_asset,
        source=source_origin,
        behavior_summary=behavior_summary,
        anomaly_score=anomaly_score,
        attack_vector=f"{event_dict.get('protocol', 'TCP')}/{event_dict.get('port', 'Auth')}",
        persistence="Registry Key / RunOnce" if threat_type in ["Malware", "Privilege Escalation"] else "None Observed",
        exfiltration="Encrypted Outbound Egress" if threat_type == "Data Exfiltration" else "None Observed"
    )

    # 6. Playbook Association
    recommended_playbook_id = PLAYBOOK_MAPPING.get(threat_type, "PB-BRUTE-01")

    # Generate composite explanation
    rule_names = [r.rule_name for r in matched_rules]
    explanation = ai_result["explanation"]
    confidence_classification = confidence_data["classification"]
    if is_threat:
        if final_confidence < 40.0:
            confidence_classification = "THREAT DETECTED (LOW CONFIDENCE)"
        if rule_score >= 80.0:
            verdict_reason = f"a strong detection rule (score {rule_score:.1f})"
        else:
            verdict_reason = f"the {severity} detection severity"
        explanation = (
            f"VIGILIX classified this event as a THREAT based on {verdict_reason}. "
            f"Overall confidence is {final_confidence:.1f}% ({confidence_classification}). "
            f"AI model assessment: {explanation}"
        )
    else:
        explanation = f"VIGILIX did not classify this event as a threat. AI model assessment: {explanation}"
    if rule_names:
        explanation += f"\n\nActive Detection Rules Triggered:\n- " + "\n- ".join(rule_names)

    threat_id = f"THR-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    return {
        "is_threat": is_threat,
        "threat_id": threat_id,
        "threat_type": threat_type,
        "severity": severity,
        "confidence_score": final_confidence,
        "confidence_breakdown": confidence_data["breakdown"],
        "confidence_classification": confidence_classification,
        "adaptive_modifier": confidence_data["adaptive_modifier"],
        "model_probability": model_prob,
        "anomaly_score": anomaly_score,
        "rule_score": rule_score,
        "correlation_score": corr_score,
        "source": source_origin,
        "affected_asset": target_asset,
        "attack_stage": attack_stage,
        "mitre_technique": mitre_technique,
        "indicators": [source_origin, target_asset, event_dict.get("user", "unknown")],
        "threat_dna": dna,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "recommended_playbook_id": recommended_playbook_id,
        "matched_rules_count": len(matched_rules),
        "ai_contributing_factors": ai_result["contributing_factors"]
    }
