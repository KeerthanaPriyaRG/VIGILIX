from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.database import Base

class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "PB-BRUTE-FORCE-01"
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    threat_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default="high")
    steps = Column(JSON, nullable=False) # Structured list of steps with phase, action, automated (bool), command
    estimated_response_time = Column(String(50), default="15 mins")
    status = Column(String(30), default="Active") # Active, Draft, Inactive

class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"

    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(String(50), nullable=False, index=True)
    incident_id = Column(String(50), nullable=True, index=True)
    execution_status = Column(String(30), default="Completed") # Running, Completed, Failed
    current_step_index = Column(Integer, default=0)
    logs = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)
