from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models.incident import Incident, IncidentTimeline, IncidentResponseAction
from app.schemas.incident import (
    IncidentResponse, IncidentCreate, IncidentUpdate, IncidentActionRequest
)

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if status and status.lower() != "all":
        query = query.filter(Incident.status == status)
    if severity and severity.lower() != "all":
        query = query.filter(Incident.severity == severity.lower())
    if priority and priority.lower() != "all":
        query = query.filter(Incident.priority == priority)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Incident.incident_id.ilike(search_fmt),
                Incident.title.ilike(search_fmt),
                Incident.description.ilike(search_fmt),
                Incident.affected_asset.ilike(search_fmt),
                Incident.assigned_to.ilike(search_fmt),
            )
        )

    return query.order_by(desc(Incident.created_at)).offset(skip).limit(limit).all()

@router.post("", response_model=IncidentResponse)
def create_incident(inc_in: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(
        incident_id=inc_in.incident_id,
        title=inc_in.title,
        description=inc_in.description,
        severity=inc_in.severity,
        priority=inc_in.priority,
        status=inc_in.status,
        threat_id=inc_in.threat_id,
        affected_asset=inc_in.affected_asset,
        assigned_to=inc_in.assigned_to,
        playbook_id=inc_in.playbook_id,
        root_cause=inc_in.root_cause,
        notes=inc_in.notes,
        response_actions=inc_in.response_actions,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(incident)
    db.flush()

    # Initial timeline entry
    timeline_entry = IncidentTimeline(
        incident_id=incident.id,
        action="Incident Declared",
        actor="System",
        description=f"Incident '{incident.title}' was formally declared with severity {incident.severity}.",
        status_transition="None -> Detected"
    )
    db.add(timeline_entry)
    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    incident = None
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    if not incident:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: str, patch: IncidentUpdate, db: Session = Depends(get_db)):
    incident = None
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    if not incident:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = incident.status
    now = datetime.utcnow()

    if patch.status and patch.status != incident.status:
        incident.status = patch.status
        if patch.status == "Contained" and not incident.containment_time:
            incident.containment_time = now
        elif patch.status == "Resolved" and not incident.resolution_time:
            incident.resolution_time = now
            if not incident.containment_time:
                incident.containment_time = now

        # Add timeline record
        tl = IncidentTimeline(
            incident_id=incident.id,
            action=f"Status Changed: {patch.status}",
            actor="SOC Analyst",
            description=f"Incident lifecycle state changed from {old_status} to {patch.status}.",
            status_transition=f"{old_status} -> {patch.status}"
        )
        db.add(tl)

    if patch.assigned_to is not None:
        incident.assigned_to = patch.assigned_to
    if patch.priority is not None:
        incident.priority = patch.priority
    if patch.severity is not None:
        incident.severity = patch.severity
    if patch.notes is not None:
        incident.notes = patch.notes
    if patch.root_cause is not None:
        incident.root_cause = patch.root_cause

    incident.updated_at = now
    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/actions")
def add_incident_action(incident_id: str, action_req: IncidentActionRequest, db: Session = Depends(get_db)):
    incident = None
    if incident_id.isdigit():
        incident = db.query(Incident).filter(Incident.id == int(incident_id)).first()
    if not incident:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.utcnow()
    action_rec = IncidentResponseAction(
        incident_id=incident.id,
        action_name=action_req.action_name,
        status="Completed",
        executed_by=action_req.executed_by or "SOC Analyst",
        executed_at=now,
        output_log=f"Action '{action_req.action_name}' executed. Notes: {action_req.notes or 'None'}"
    )
    db.add(action_rec)

    # Timeline update
    tl = IncidentTimeline(
        incident_id=incident.id,
        action="Response Action Applied",
        actor=action_req.executed_by or "SOC Analyst",
        description=f"Executed containment/remediation action: '{action_req.action_name}'."
    )
    db.add(tl)
    db.commit()
    return {"status": "success", "action": action_req.action_name, "executed_at": now.isoformat()}
