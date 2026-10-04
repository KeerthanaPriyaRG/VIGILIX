from typing import Dict, Any
from fastapi import APIRouter
from app.ai.inference import predict_threat_ai, get_models
from app.ai.feature_extractor import FEATURE_COLUMNS
from app.schemas.threat import ThreatAnalyzeRequest

router = APIRouter(prefix="/ai", tags=["AI Threat Analysis"])

@router.post("/analyze")
def analyze_with_ai(req: ThreatAnalyzeRequest) -> Dict[str, Any]:
    event_payload = {
        "event_type": req.event_type,
        "source_ip": req.source_ip or "198.51.100.44",
        "user": req.target_user or "admin",
        "hostname": req.hostname or "CORP-AUTH-01",
        "failed_attempts": req.failed_attempts or 1,
        "frequency": req.frequency or 1.0,
        "message": req.payload or f"Observed {req.event_type} on {req.hostname or 'system'}.",
        "severity": "high" if req.failed_attempts and req.failed_attempts >= 5 else "medium"
    }
    return predict_threat_ai(event_payload)

@router.get("/model-status")
def get_ai_model_status() -> Dict[str, Any]:
    rf, iso = get_models()
    return {
        "status": "Operational",
        "classifier": {
            "algorithm": "Random Forest Classifier",
            "n_estimators": getattr(rf, "n_estimators", 100),
            "classes": ["Benign", "Suspicious", "Malicious"],
            "max_depth": getattr(rf, "max_depth", 12),
        },
        "anomaly_detector": {
            "algorithm": "Isolation Forest",
            "contamination": getattr(iso, "contamination", 0.10),
            "n_estimators": getattr(iso, "n_estimators", 100)
        },
        "feature_dimensions": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "confidence_methodology": "Ensemble (35% ML Prob + 20% Anomaly + 30% Rule Match + 15% Correlation) * Adaptive History Modifier"
    }
