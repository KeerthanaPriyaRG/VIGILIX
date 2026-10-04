from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.database import Base

class SecurityMaturityRecord(Base):
    __tablename__ = "security_maturity_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    overall_score = Column(Float, nullable=False) # 0.0 to 100.0
    level = Column(String(50), nullable=False) # Initial, Developing, Defined, Managed, Optimized
    categories = Column(JSON, nullable=False) # { "detection": 82, "response": 74, ... }
    score_trend = Column(Float, default=0.0) # e.g. +3.5%
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)

class MaturityMetric(Base):
    __tablename__ = "maturity_metrics"

    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(50), nullable=False, index=True)
    score = Column(Float, nullable=False) # points earned (0-10)
    max_score = Column(Float, default=10.0)
    percentage = Column(Float, nullable=False) # 0-100%
    sub_metrics = Column(JSON, default=dict)
    calculated_at = Column(DateTime, default=datetime.utcnow)
