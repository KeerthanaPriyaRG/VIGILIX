from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class IncidentTimelineResponse(BaseModel):
    id: int
    timestamp: datetime
    action: str
    actor: str
    description: str
    status_transition: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class IncidentResponseActionModel(BaseModel):
    id: int
    action_name: str
    status: str
    executed_by: str
    executed_at: datetime
    output_log: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class IncidentBase(BaseModel):
    incident_id: str
    title: str
    description: str
    severity: str = "high"
    priority: str = "P2"
    status: str = "Detected"
    threat_id: Optional[str] = None
    affected_asset: str
    assigned_to: str = "Unassigned"
    playbook_id: Optional[str] = None
    root_cause: Optional[str] = None
    notes: Optional[str] = None
    response_actions: List[str] = []

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    root_cause: Optional[str] = None
    containment_time: Optional[datetime] = None
    resolution_time: Optional[datetime] = None

class IncidentActionRequest(BaseModel):
    action_name: str
    executed_by: Optional[str] = "SOC Analyst"
    notes: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    containment_time: Optional[datetime] = None
    resolution_time: Optional[datetime] = None
    timeline: List[IncidentTimelineResponse] = []
    action_records: List[IncidentResponseActionModel] = []

    model_config = ConfigDict(from_attributes=True)
