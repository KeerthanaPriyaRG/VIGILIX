from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.log import SecurityLog
from app.models.threat import Threat
from app.models.splunk import SplunkSyncLog
from app.models.incident import Incident, IncidentTimeline
from app.schemas.splunk import (
    SplunkStatusResponse, SplunkTestConnectionRequest, SplunkTestConnectionResponse,
    SplunkSearchRequest, SplunkSearchResponse, SplunkImportRequest,
    SplunkImportResponse, SplunkSendHecRequest, SplunkSendHecResponse
)
from app.integrations.splunk import splunk_client
from app.detection.engine import analyze_security_event

router = APIRouter(prefix="/splunk", tags=["Splunk SIEM Integration"])

@router.get("/status", response_model=SplunkStatusResponse)
def get_splunk_status(db: Session = Depends(get_db)):
    imported_count = db.query(func.count(SecurityLog.id)).filter(SecurityLog.source == "Splunk").scalar() or 0
    last_sync = db.query(SplunkSyncLog).order_by(SplunkSyncLog.timestamp.desc()).first()
    test_res = splunk_client.test_connection()

    return {
        "is_connected": test_res["success"],
        "mode": splunk_client.mode,
        "host": splunk_client.host,
        "port": splunk_client.port,
        "hec_url": splunk_client.hec_url,
        "events_imported_count": imported_count,
        "last_sync_time": last_sync.timestamp if last_sync else None,
        "server_info": test_res.get("server_info", {})
    }

@router.post("/test", response_model=SplunkTestConnectionResponse)
def test_connection(req: SplunkTestConnectionRequest, db: Session = Depends(get_db)):
    res = splunk_client.test_connection()
    # Log test
    log = SplunkSyncLog(
        sync_type="connection_test",
        query=None,
        events_count=0,
        status="Success" if res["success"] else "Failed",
        timestamp=datetime.utcnow(),
        details=res
    )
    db.add(log)
    db.commit()
    return res

@router.post("/search", response_model=SplunkSearchResponse)
def search_splunk(req: SplunkSearchRequest, db: Session = Depends(get_db)):
    res = splunk_client.search_events(
        query=req.query,
        earliest_time=req.earliest_time or "-24h",
        latest_time=req.latest_time or "now",
        limit=req.limit or 50
    )
    # Record sync log
    log = SplunkSyncLog(
        sync_type="search",
        query=req.query,
        events_count=res["total_results"],
        status="Success",
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    return res

@router.post("/import", response_model=SplunkImportResponse)
def import_splunk_events(req: SplunkImportRequest, db: Session = Depends(get_db)):
    """Imports events from Splunk, runs detection, creates threats and incidents."""
    imported_count = 0
    threats_detected = 0
    threat_ids = []

    for item in req.events:
        msg = item.get("message") or item.get("_raw") or "Imported from Splunk"
        ev_type = item.get("sourcetype") or item.get("source") or "Splunk Ingestion"
        src_ip = item.get("src_ip") or item.get("src")
        dest_ip = item.get("dest_ip") or item.get("dest")
        user = item.get("user") or item.get("src_user")
        host = item.get("host") or "SPLUNK-INDEXER"
        sev = str(item.get("severity", "medium")).lower()

        log_payload = {
            **item,
            "source": "Splunk",
            "source_ip": src_ip,
            "destination_ip": dest_ip,
            "user": user,
            "hostname": host,
            "event_type": item.get("event_type") or ev_type,
            "message": msg,
            "severity": sev
        }

        analysis = (
            analyze_security_event(log_payload)
            if req.run_detection
            else {"is_threat": False}
        )

        db_log = SecurityLog(
            timestamp=datetime.utcnow(),
            source="Splunk",
            source_ip=src_ip,
            destination_ip=dest_ip,
            user=user,
            hostname=host,
            event_type=ev_type,
            message=msg,
            severity=analysis.get("severity", sev),
            raw_log=str(item),
            status="Flagged" if analysis.get("is_threat") else "Ingested",
            threat_id=analysis.get("threat_id") if analysis.get("is_threat") else None
        )

        db.add(db_log)
        imported_count += 1

        if analysis.get("is_threat"):
            threats_detected += 1

            t_id = analysis["threat_id"]
            threat_ids.append(t_id)

            # Create Threat
            threat_obj = Threat(
                threat_id=t_id,
                threat_type=analysis["threat_type"],
                severity=analysis["severity"],
                confidence_score=analysis["confidence_score"],
                model_probability=analysis["model_probability"],
                anomaly_score=analysis["anomaly_score"],
                rule_score=analysis["rule_score"],
                correlation_score=analysis["correlation_score"],
                source=src_ip,
                affected_asset=host,
                attack_stage=analysis["attack_stage"],
                mitre_technique=analysis["mitre_technique"],
                indicators=[src_ip, host],
                threat_dna=analysis["threat_dna"],
                explanation=analysis["explanation"],
                recommended_action=analysis["recommended_action"],
                status="Active"
            )

            db.add(threat_obj)

            # Automatically create Incident
            incident_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{t_id[-6:]}"

            incident = Incident(
                incident_id=incident_id,
                title=f"{analysis['threat_type']} Attack Detected",
                description=analysis["explanation"],
                severity=analysis["severity"],
                priority=(
                    "P1" if analysis["severity"].lower() == "critical"
                    else "P2" if analysis["severity"].lower() == "high"
                    else "P3"
                ),
                status="Detected",
                threat_id=t_id,
                affected_asset=host,
                assigned_to="Unassigned",
                playbook_id=analysis.get("recommended_playbook_id"),
                root_cause=analysis.get("explanation"),
                notes=(
                    f"Threat confidence score: "
                    f"{analysis['confidence_score']}%. "
                    f"MITRE ATT&CK technique: "
                    f"{analysis['mitre_technique']}."
                ),
                response_actions=[]
            )

            db.add(incident)

            # Add initial incident timeline
            timeline = IncidentTimeline(
                incident=incident,
                action="Incident Declared",
                actor="System",
                description=(
                    f"Incident '{incident.title}' was automatically "
                    f"created from Splunk threat {t_id}."
                ),
                status_transition="None -> Detected"
            )

            db.add(timeline)

    db.commit()

    return {
        "imported_count": imported_count,
        "threats_detected_count": threats_detected,
        "threat_ids": threat_ids,
        "message": (
            f"Successfully ingested {imported_count} events from Splunk. "
            f"Detected {threats_detected} threats and created corresponding incidents."
        )
    }

@router.post("/send", response_model=SplunkSendHecResponse)
def send_to_splunk_hec(req: SplunkSendHecRequest):
    return splunk_client.send_hec_event(
        event=req.event,
        sourcetype=req.sourcetype or "vigilix:alert",
        index=req.index or "main"
    )
