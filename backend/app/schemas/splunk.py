from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class SplunkStatusResponse(BaseModel):
    is_connected: bool
    mode: str # "mock" or "live"
    host: str
    port: int
    hec_url: str
    events_imported_count: int
    last_sync_time: Optional[datetime] = None
    server_info: Dict[str, Any] = {}

class SplunkTestConnectionRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    token: Optional[str] = None
    mode: Optional[str] = None

class SplunkTestConnectionResponse(BaseModel):
    success: bool
    message: str
    latency_ms: float
    mode: str

class SplunkSearchRequest(BaseModel):
    query: str
    earliest_time: Optional[str] = "-24h"
    latest_time: Optional[str] = "now"
    limit: Optional[int] = 50

class SplunkSearchResponse(BaseModel):
    query: str
    total_results: int
    execution_time_sec: float
    events: List[Dict[str, Any]]

class SplunkImportRequest(BaseModel):
    events: List[Dict[str, Any]]
    run_detection: bool = True

class SplunkImportResponse(BaseModel):
    imported_count: int
    threats_detected_count: int
    threat_ids: List[str] = []
    message: str

class SplunkSendHecRequest(BaseModel):
    event: Dict[str, Any]
    sourcetype: Optional[str] = "vigilix:alert"
    index: Optional[str] = "main"

class SplunkSendHecResponse(BaseModel):
    success: bool
    message: str
    hec_ack_id: Optional[str] = None
