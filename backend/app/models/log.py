from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class SecurityLog(Base):
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String(50), nullable=False, index=True) # Firewall, ActiveDirectory, EDR, Splunk, WAF, CloudTrail
    source_ip = Column(String(45), nullable=True, index=True)
    destination_ip = Column(String(45), nullable=True, index=True)
    user = Column(String(100), nullable=True, index=True)
    hostname = Column(String(100), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True) # Failed Login, Privilege Escalation, Port Scan, Connection, etc.
    action = Column(String(50), nullable=True) # Allow, Block, Deny, Success, Failure
    protocol = Column(String(20), nullable=True) # TCP, UDP, ICMP, HTTPS, SSH
    port = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="low", index=True) # critical, high, medium, low, info
    raw_log = Column(Text, nullable=True)
    status = Column(String(30), default="Ingested", index=True) # Ingested, Analyzed, Flagged, Clean
    threat_id = Column(String(50), nullable=True, index=True)
