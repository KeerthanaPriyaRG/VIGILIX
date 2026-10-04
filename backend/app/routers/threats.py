from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models.threat import Threat
from app.schemas.threat import (
    ThreatResponse, ThreatAnalyzeRequest
)
from app.detection.engine import analyze_security_event

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])

@router.get("", response_model=List[ThreatResponse])
def get_threats(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Threat)

    if severity and severity.lower() != "all":
        query = query.filter(Threat.severity == severity.lower())
    if threat_type and threat_type.lower() != "all":
        query = query.filter(Threat.threat_type == threat_type)
    if status and status.lower() != "all":
        query = query.filter(Threat.status == status)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Threat.threat_id.ilike(search_fmt),
                Threat.threat_type.ilike(search_fmt),
                Threat.affected_asset.ilike(search_fmt),
                Threat.source.ilike(search_fmt),
                Threat.mitre_technique.ilike(search_fmt),
            )
        )

    return query.order_by(desc(Threat.created_at)).offset(skip).limit(limit).all()

@router.get("/{threat_id}", response_model=ThreatResponse)
def get_threat_detail(threat_id: str, db: Session = Depends(get_db)):
    # Can query by integer ID or threat_id string like "THR-2026-001"
    threat = None
    if threat_id.isdigit():
        threat = db.query(Threat).filter(Threat.id == int(threat_id)).first()
    if not threat:
        threat = db.query(Threat).filter(Threat.threat_id == threat_id).first()

    if not threat:
        raise HTTPException(status_code=404, detail=f"Threat {threat_id} not found")
    return threat

@router.post("/analyze")
def manual_threat_analysis(req: ThreatAnalyzeRequest):
    """Executes on-demand AI threat analysis pipeline on arbitrary parameters."""
    event_payload = {
        "event_type": req.event_type,
        "source_ip": req.source_ip or "198.51.100.77",
        "user": req.target_user or "admin",
        "hostname": req.hostname or "CORP-APP-01",
        "failed_attempts": req.failed_attempts or 1,
        "frequency": req.frequency or 1.0,
        "message": req.payload or f"Observed {req.event_type} activity against target {req.target_user or 'host'}.",
        "severity": "high" if req.failed_attempts and req.failed_attempts >= 5 else "medium"
    }
    return analyze_security_event(event_payload)

@router.patch("/{threat_id}/status")
def update_threat_status(threat_id: str, status: str = Query(...), db: Session = Depends(get_db)):
    threat = None
    if threat_id.isdigit():
        threat = db.query(Threat).filter(Threat.id == int(threat_id)).first()
    if not threat:
        threat = db.query(Threat).filter(Threat.threat_id == threat_id).first()

    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")

    threat.status = status
    db.commit()
    db.refresh(threat)
    return {"status": "success", "threat_id": threat.threat_id, "new_status": threat.status}
