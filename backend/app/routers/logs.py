from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.log import SecurityLog
from app.models.threat import Threat
from app.schemas.log import (
    SecurityLogResponse, SecurityLogCreate, SecurityLogBatchCreate, LogAnalysisRequest
)
from app.detection.engine import analyze_security_event

router = APIRouter(prefix="/logs", tags=["Log Management"])

@router.get("", response_model=List[SecurityLogResponse])
def get_security_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityLog)

    if severity and severity.lower() != "all":
        query = query.filter(SecurityLog.severity == severity.lower())
    if source and source.lower() != "all":
        query = query.filter(SecurityLog.source == source)
    if event_type and event_type.lower() != "all":
        query = query.filter(SecurityLog.event_type == event_type)
    if status and status.lower() != "all":
        query = query.filter(SecurityLog.status == status)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                SecurityLog.message.ilike(search_fmt),
                SecurityLog.source_ip.ilike(search_fmt),
                SecurityLog.destination_ip.ilike(search_fmt),
                SecurityLog.user.ilike(search_fmt),
                SecurityLog.hostname.ilike(search_fmt),
                SecurityLog.event_type.ilike(search_fmt),
            )
        )

    return query.order_by(desc(SecurityLog.timestamp)).offset(skip).limit(limit).all()

@router.post("", response_model=SecurityLogResponse)
def ingest_security_log(log_in: SecurityLogCreate, db: Session = Depends(get_db)):
    """Ingests a new security event and automatically routes it through the Detection & AI engine."""
    # Run analysis
    analysis = analyze_security_event(log_in.dict())
    
    status_val = "Flagged" if analysis["is_threat"] else "Clean"
    threat_ref = analysis["threat_id"] if analysis["is_threat"] else None

    db_log = SecurityLog(
        timestamp=datetime.utcnow(),
        source=log_in.source,
        source_ip=log_in.source_ip,
        destination_ip=log_in.destination_ip,
        user=log_in.user,
        hostname=log_in.hostname,
        event_type=log_in.event_type,
        action=log_in.action,
        protocol=log_in.protocol,
        port=log_in.port,
        message=log_in.message,
        severity=analysis["severity"] if analysis["is_threat"] else log_in.severity,
        raw_log=log_in.raw_log or log_in.message,
        status=status_val,
        threat_id=threat_ref
    )
    db.add(db_log)

    # If it meets actionable threat criteria, persist Threat record
    if analysis["is_threat"]:
        threat = Threat(
            threat_id=analysis["threat_id"],
            threat_type=analysis["threat_type"],
            severity=analysis["severity"],
            confidence_score=analysis["confidence_score"],
            model_probability=analysis["model_probability"],
            anomaly_score=analysis["anomaly_score"],
            rule_score=analysis["rule_score"],
            correlation_score=analysis["correlation_score"],
            source=analysis["source"],
            affected_asset=analysis["affected_asset"],
            attack_stage=analysis["attack_stage"],
            mitre_technique=analysis["mitre_technique"],
            indicators=analysis["indicators"],
            threat_dna=analysis["threat_dna"],
            explanation=analysis["explanation"],
            recommended_action=analysis["recommended_action"],
            status="Active"
        )
        db.add(threat)

    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/batch", response_model=dict)
def batch_ingest_logs(batch: SecurityLogBatchCreate, db: Session = Depends(get_db)):
    threats_created = 0
    for log_item in batch.logs:
        analysis = analyze_security_event(log_item.dict())
        db_log = SecurityLog(
            timestamp=datetime.utcnow(),
            source=log_item.source,
            source_ip=log_item.source_ip,
            destination_ip=log_item.destination_ip,
            user=log_item.user,
            hostname=log_item.hostname,
            event_type=log_item.event_type,
            action=log_item.action,
            protocol=log_item.protocol,
            port=log_item.port,
            message=log_item.message,
            severity=analysis["severity"] if analysis["is_threat"] else log_item.severity,
            raw_log=log_item.raw_log or log_item.message,
            status="Flagged" if analysis["is_threat"] else "Clean",
            threat_id=analysis["threat_id"] if analysis["is_threat"] else None
        )
        db.add(db_log)
        if analysis["is_threat"]:
            threats_created += 1
            threat = Threat(
                threat_id=analysis["threat_id"],
                threat_type=analysis["threat_type"],
                severity=analysis["severity"],
                confidence_score=analysis["confidence_score"],
                model_probability=analysis["model_probability"],
                anomaly_score=analysis["anomaly_score"],
                rule_score=analysis["rule_score"],
                correlation_score=analysis["correlation_score"],
                source=analysis["source"],
                affected_asset=analysis["affected_asset"],
                attack_stage=analysis["attack_stage"],
                mitre_technique=analysis["mitre_technique"],
                indicators=analysis["indicators"],
                threat_dna=analysis["threat_dna"],
                explanation=analysis["explanation"],
                recommended_action=analysis["recommended_action"],
                status="Active"
            )
            db.add(threat)
    db.commit()
    return {"ingested": len(batch.logs), "threats_detected": threats_created}

@router.get("/{log_id}", response_model=SecurityLogResponse)
def get_log_by_id(log_id: int, db: Session = Depends(get_db)):
    log_item = db.query(SecurityLog).filter(SecurityLog.id == log_id).first()
    if not log_item:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return log_item

@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log_item = db.query(SecurityLog).filter(SecurityLog.id == log_id).first()
    if not log_item:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log_item)
    db.commit()
    return {"status": "success", "message": f"Log {log_id} deleted"}

@router.post("/analyze")
def analyze_log_content(req: LogAnalysisRequest, db: Session = Depends(get_db)):
    """Runs on-demand hybrid detection & AI scoring on a log payload."""
    event_data = {}
    if req.log_id:
        existing = db.query(SecurityLog).filter(SecurityLog.id == req.log_id).first()
        if existing:
            event_data = {
                "message": existing.message,
                "raw_log": existing.raw_log,
                "source": existing.source,
                "event_type": existing.event_type,
                "source_ip": existing.source_ip,
                "destination_ip": existing.destination_ip,
                "user": existing.user,
                "hostname": existing.hostname,
                "severity": existing.severity,
                "port": existing.port,
                "action": existing.action
            }
    if not event_data:
        event_data = {
            "message": req.message or req.raw_log or "Unknown security event",
            "raw_log": req.raw_log,
            "source": req.source or "Manual Analysis",
            "event_type": req.event_type or "Generic Event",
            "source_ip": req.source_ip or "192.168.1.100",
            "user": req.user or "analyst",
            "severity": req.severity or "medium"
        }

    analysis_result = analyze_security_event(event_data)
    return analysis_result
