from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class SecurityLogBase(BaseModel):
    source: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    user: Optional[str] = None
    hostname: Optional[str] = None
    event_type: str
    action: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = None
    message: str
    severity: str = "low"
    raw_log: Optional[str] = None
    status: str = "Ingested"
    threat_id: Optional[str] = None

class SecurityLogCreate(SecurityLogBase):
    pass

class SecurityLogBatchCreate(BaseModel):
    logs: List[SecurityLogCreate]

class SecurityLogResponse(SecurityLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class LogAnalysisRequest(BaseModel):
    log_id: Optional[int] = None
    raw_log: Optional[str] = None
    source: Optional[str] = None
    event_type: Optional[str] = None
    source_ip: Optional[str] = None
    user: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
