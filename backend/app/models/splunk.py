from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from app.database import Base

class SplunkConfig(Base):
    __tablename__ = "splunk_configs"

    id = Column(Integer, primary_key=True, index=True)
    host = Column(String(150), default="localhost")
    port = Column(Integer, default=8089)
    username = Column(String(100), default="admin")
    hec_url = Column(String(200), default="http://localhost:8088/services/collector")
    mode = Column(String(20), default="mock") # "mock" or "live"
    is_connected = Column(Boolean, default=True)
    last_tested_at = Column(DateTime, default=datetime.utcnow)

class SplunkSyncLog(Base):
    __tablename__ = "splunk_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    sync_type = Column(String(50), nullable=False) # search, import, hec_send, connection_test
    query = Column(String(500), nullable=True)
    events_count = Column(Integer, default=0)
    status = Column(String(50), default="Success")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSON, default=dict)
