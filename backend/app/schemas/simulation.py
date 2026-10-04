from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class AttackSimulationScenarioInfo(BaseModel):
    id: str
    name: str
    description: str
    category: str
    mitre_technique: str
    severity: str
    target_asset_default: str
    source_ip_default: str
    estimated_events: int
    attack_steps: List[str]

class AttackSimulationRunRequest(BaseModel):
    scenario_id: str
    target_asset: Optional[str] = None
    source_ip: Optional[str] = None
    intensity: Optional[str] = "standard" # standard, high

class AttackSimulationRunResponse(BaseModel):
    simulation_id: int
    scenario_id: str
    scenario_name: str
    status: str
    pipeline_stage: str
    events_generated: int
    threat_detected: Optional[Dict[str, Any]] = None
    incident_created: Optional[Dict[str, Any]] = None
    recommended_playbook: Optional[Dict[str, Any]] = None
    execution_timeline: List[Dict[str, Any]] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttackSimulationHistoryResponse(BaseModel):
    id: int
    scenario_id: str
    scenario_name: str
    target_asset: str
    source_ip: str
    events_generated_count: int
    threat_id: Optional[str] = None
    incident_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
