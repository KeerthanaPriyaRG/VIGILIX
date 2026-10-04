from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class ThreatDNAModel(BaseModel):
    threat_type: str
    attack_vector: str
    severity: str
    confidence: float
    mitre: str
    behavior: str
    target: str
    source: str
    anomaly: str
    persistence: Optional[str] = "None"
    exfiltration: Optional[str] = "None"

class ThreatBase(BaseModel):
    threat_id: str
    threat_type: str
    severity: str
    confidence_score: float
    model_probability: float
    anomaly_score: float
    rule_score: float
    correlation_score: float
    source: Optional[str] = None
    affected_asset: str
    attack_stage: str
    mitre_technique: Optional[str] = None
    indicators: List[str] = []
    threat_dna: Dict[str, Any] = {}
    explanation: str
    recommended_action: str
    status: str = "Active"

class ThreatCreate(ThreatBase):
    pass

class ThreatResponse(ThreatBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ThreatAnalyzeRequest(BaseModel):
    event_type: str
    source_ip: Optional[str] = None
    target_user: Optional[str] = None
    hostname: Optional[str] = None
    failed_attempts: Optional[int] = 1
    frequency: Optional[float] = 1.0
    payload: Optional[str] = None
