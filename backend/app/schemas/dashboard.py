from datetime import datetime
from typing import Dict, List, Any
from pydantic import BaseModel
from app.schemas.threat import ThreatResponse
from app.schemas.incident import IncidentResponse
from app.schemas.log import SecurityLogResponse

class DashboardMetrics(BaseModel):
    security_maturity_score: float
    maturity_level: str
    active_threats: int
    critical_incidents: int
    events_analyzed: int
    threats_detected: int
    avg_ai_confidence: float
    incidents_resolved: int
    incident_resolution_rate: float
    mean_response_time_minutes: float

class ThreatDistribution(BaseModel):
    by_severity: Dict[str, int]
    by_type: Dict[str, int]

class AIInsight(BaseModel):
    id: str
    type: str # warning, recommendation, detection, pattern
    title: str
    description: str
    impact: str
    suggested_action: str

class DashboardSummaryResponse(BaseModel):
    metrics: DashboardMetrics
    threat_distribution: ThreatDistribution
    recent_threats: List[ThreatResponse]
    recent_incidents: List[IncidentResponse]
    recent_logs: List[SecurityLogResponse]
    ai_insights: List[AIInsight]
    recommended_actions: List[str]
    system_status: Dict[str, Any]
