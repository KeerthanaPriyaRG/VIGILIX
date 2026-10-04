from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "INC-2026-001"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="high", index=True) # critical, high, medium, low
    priority = Column(String(20), default="P2", index=True) # P1 - Urgent, P2 - High, P3 - Medium, P4 - Low
    status = Column(String(30), default="Detected", index=True) # Detected -> Investigating -> Contained -> Eradicated -> Resolved
    
    threat_id = Column(String(50), nullable=True, index=True)
    affected_asset = Column(String(100), nullable=False)
    assigned_to = Column(String(100), default="Unassigned")
    playbook_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    containment_time = Column(DateTime, nullable=True)
    resolution_time = Column(DateTime, nullable=True)
    
    root_cause = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    response_actions = Column(JSON, default=list) # List of actions applied

    timeline = relationship("IncidentTimeline", back_populates="incident", cascade="all, delete-orphan")
    action_records = relationship("IncidentResponseAction", back_populates="incident", cascade="all, delete-orphan")

class IncidentTimeline(Base):
    __tablename__ = "incident_timelines"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String(100), nullable=False)
    actor = Column(String(100), default="System")
    description = Column(Text, nullable=False)
    status_transition = Column(String(100), nullable=True)

    incident = relationship("Incident", back_populates="timeline")

class IncidentResponseAction(Base):
    __tablename__ = "incident_response_actions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    action_name = Column(String(150), nullable=False)
    status = Column(String(30), default="Pending") # Pending, Executing, Completed, Failed
    executed_by = Column(String(100), default="Automated Playbook")
    executed_at = Column(DateTime, default=datetime.utcnow)
    output_log = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="action_records")
