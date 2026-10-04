from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class PlaybookStepModel(BaseModel):
    step_number: int
    phase: str # Trigger, Investigation, Containment, Eradication, Recovery, Closure
    title: str
    description: str
    action_type: str # Automated, Manual, Approval
    command_simulation: Optional[str] = None

class PlaybookBase(BaseModel):
    playbook_id: str
    name: str
    description: str
    threat_type: str
    severity: str = "high"
    steps: List[Dict[str, Any]]
    estimated_response_time: str = "15 mins"
    status: str = "Active"

class PlaybookCreate(PlaybookBase):
    pass

class PlaybookResponse(PlaybookBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class PlaybookExecutionRequest(BaseModel):
    incident_id: Optional[str] = None
    target_asset: Optional[str] = None
    simulation_mode: bool = True

class PlaybookExecutionResponse(BaseModel):
    execution_id: int
    playbook_id: str
    incident_id: Optional[str] = None
    execution_status: str
    completed_steps: int
    total_steps: int
    logs: List[Dict[str, Any]]
    started_at: datetime
    completed_at: Optional[datetime] = None
