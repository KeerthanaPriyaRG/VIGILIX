from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from app.database import Base

class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    threat_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "THR-2026-001"
    threat_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default="medium", index=True) # critical, high, medium, low
    
    # Confidence Decomposition
    confidence_score = Column(Float, nullable=False, default=0.0) # Final AI Threat Confidence (0-100)
    model_probability = Column(Float, default=0.0) # ML model output %
    anomaly_score = Column(Float, default=0.0) # Isolation forest / statistical anomaly %
    rule_score = Column(Float, default=0.0) # Heuristic / signature strength %
    correlation_score = Column(Float, default=0.0) # Event & historical correlation %
    
    # Target & Context
    source = Column(String(100), nullable=True) # Source IP / User
    affected_asset = Column(String(100), nullable=False) # Hostname / Server
    attack_stage = Column(String(100), default="Initial Access") # MITRE ATT&CK Tactic
    mitre_technique = Column(String(50), nullable=True) # e.g. T1110.001
    
    # Detailed Security Analytics
    indicators = Column(JSON, default=list) # List of IOCs: hashes, IPs, domains, commands
    threat_dna = Column(JSON, default=dict) # Structured Threat DNA dictionary
    explanation = Column(Text, nullable=False) # Multi-factor AI explainability rationale
    recommended_action = Column(Text, nullable=False) # Prescribed SOC response actions
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(30), default="Active", index=True) # Active, Under Investigation, Mitigated, False Positive, Resolved
