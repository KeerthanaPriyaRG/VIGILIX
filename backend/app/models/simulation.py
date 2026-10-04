from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.database import Base

class AttackSimulationRecord(Base):
    __tablename__ = "attack_simulations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String(50), nullable=False, index=True) # brute-force, port-scan, privilege-escalation, etc.
    scenario_name = Column(String(100), nullable=False)
    target_asset = Column(String(100), nullable=False)
    source_ip = Column(String(50), nullable=False)
    events_generated_count = Column(Integer, default=0)
    threat_id = Column(String(50), nullable=True)
    incident_id = Column(String(50), nullable=True)
    playbook_id = Column(String(50), nullable=True)
    status = Column(String(50), default="Completed")
    pipeline_stage = Column(String(50), default="Resolved")
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
