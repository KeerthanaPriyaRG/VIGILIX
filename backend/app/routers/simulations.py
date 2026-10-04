import uuid
from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.simulation import AttackSimulationRecord
from app.models.log import SecurityLog
from app.models.threat import Threat
from app.models.incident import Incident, IncidentTimeline
from app.schemas.simulation import (
    AttackSimulationScenarioInfo, AttackSimulationRunRequest,
    AttackSimulationRunResponse, AttackSimulationHistoryResponse
)
from app.detection.engine import analyze_security_event, PLAYBOOK_MAPPING

router = APIRouter(prefix="/simulations", tags=["Attack Simulation Sandbox"])

AVAILABLE_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "brute-force",
        "name": "Distributed Brute Force & Password Spray",
        "description": "Simulates rapid unauthorized authentication attempts targeting domain administrative accounts across Kerberos and SSH.",
        "category": "Credential Access",
        "mitre_technique": "T1110.001",
        "severity": "high",
        "target_asset_default": "DC-NORTH-01",
        "source_ip_default": "185.220.101.44",
        "estimated_events": 12,
        "attack_steps": [
            "External adversary discovers exposed service",
            "Launches automated dictionary password spray",
            "Generates 12 rapid failed authentication events",
            "Attempts NTLM fallback negotiation"
        ]
    },
    {
        "id": "port-scan",
        "name": "Horizontal SYN Port Scan & Reconnaissance",
        "description": "Simulates high-speed TCP SYN discovery against enterprise edge firewall and DMZ gateway.",
        "category": "Discovery",
        "mitre_technique": "T1046",
        "severity": "medium",
        "target_asset_default": "EDGE-FIREWALL-01",
        "source_ip_default": "194.26.29.88",
        "estimated_events": 10,
        "attack_steps": [
            "Adversary probes top 100 enterprise ports",
            "TCP SYN packets dispatched to ports 21, 22, 80, 443, 3389, 8080",
            "Edge firewall records dropped unsolicited connections",
            "Scanner attempts service banner grabbing"
        ]
    },
    {
        "id": "suspicious-login",
        "name": "Impossible Travel & Geolocation Anomaly",
        "description": "Simulates concurrent user authentications across disparate continents within a 10-minute window.",
        "category": "Initial Access",
        "mitre_technique": "T1078.004",
        "severity": "high",
        "target_asset_default": "OKTA-IAM-PORTAL",
        "source_ip_default": "45.154.255.19",
        "estimated_events": 6,
        "attack_steps": [
            "Valid user session established from New York (HQ)",
            "Secondary authentication attempt 6 minutes later from Tor exit node (Frankfurt)",
            "MFA challenge bypassed via legacy authentication protocol",
            "User agent mismatch flagged in cloud IAM"
        ]
    },
    {
        "id": "privilege-escalation",
        "name": "Unauthorized Domain Admin Privilege Escalation",
        "description": "Simulates token manipulation and Active Directory security group modification adding standard user to Domain Admins.",
        "category": "Privilege Escalation",
        "mitre_technique": "T1068",
        "severity": "critical",
        "target_asset_default": "WIN-SRV-FINANCE",
        "source_ip_default": "192.168.10.82",
        "estimated_events": 8,
        "attack_steps": [
            "Standard service account invokes 'whoami /priv'",
            "Executes token duplication to acquire SeDebugPrivilege",
            "Runs net localgroup 'Domain Admins' svc_backup /add",
            "Attempts to clear Windows Security Event Log (EventCode 1102)"
        ]
    },
    {
        "id": "malware-execution",
        "name": "Encoded PowerShell C2 Beacon & Ransomware Stager",
        "description": "Simulates execution of obfuscated base64 PowerShell script downloading payload from remote command-and-control server.",
        "category": "Execution",
        "mitre_technique": "T1059.001",
        "severity": "critical",
        "target_asset_default": "WORKSTATION-CEO-01",
        "source_ip_default": "198.51.100.180",
        "estimated_events": 10,
        "attack_steps": [
            "Spawning of powershell.exe with -w hidden -enc flags",
            "Memory-only IEX download cradle fetching payload",
            "C2 beaconing established over outbound port 443",
            "Persistence registry entry created under HKCU\\Run"
        ]
    },
    {
        "id": "data-exfiltration",
        "name": "Encrypted Bulk Data Archive & Cloud Egress",
        "description": "Simulates rapid staging of compressed database archives and high-volume outbound transfer to unclassified external IP.",
        "category": "Exfiltration",
        "mitre_technique": "T1048",
        "severity": "critical",
        "target_asset_default": "DB-PROD-CUSTOMER",
        "source_ip_default": "10.0.4.15",
        "estimated_events": 9,
        "attack_steps": [
            "Large archive 'customer_dump.7z' generated in temp directory",
            "Multiple simultaneous outbound HTTPS sockets opened to unknown cloud VPS",
            "Over 750MB transferred within 4 minutes",
            "Firewall NetFlow monitors anomalous egress bandwidth consumption"
        ]
    }
]

@router.get("/scenarios", response_model=List[AttackSimulationScenarioInfo])
def get_scenarios():
    return AVAILABLE_SCENARIOS

@router.get("/history", response_model=List[AttackSimulationHistoryResponse])
def get_simulation_history(db: Session = Depends(get_db)):
    return db.query(AttackSimulationRecord).order_by(desc(AttackSimulationRecord.created_at)).limit(20).all()

@router.post("/run", response_model=AttackSimulationRunResponse)
def run_simulation(req: AttackSimulationRunRequest, db: Session = Depends(get_db)):
    """
    Executes an Attack Simulation through the REAL VIGILIX pipeline:
    Scenario -> Log Ingestion -> Detection Engine -> AI Analysis & Confidence -> Threat DNA -> Incident Created -> Recommended Playbook.
    """
    scenario = next((s for s in AVAILABLE_SCENARIOS if s["id"] == req.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{req.scenario_id}' not found")

    target_asset = req.target_asset or scenario["target_asset_default"]
    source_ip = req.source_ip or scenario["source_ip_default"]
    now = datetime.utcnow()

    timeline_steps = []
    generated_logs_count = 0

    # Step 1: Attack Execution & Log Generation
    timeline_steps.append({
        "stage": "Scenario Initiated",
        "timestamp": now.isoformat(),
        "detail": f"Launched safe defensive simulation: '{scenario['name']}' against {target_asset} from {source_ip}."
    })

    simulated_event_messages = []
    if req.scenario_id == "brute-force":
        for i in range(1, 10):
            simulated_event_messages.append((
                "ActiveDirectory", "Failed Login", "failure", "Kerberos", 88,
                f"Failed logon attempt {i} for user 'admin' from {source_ip}. Error: STATUS_WRONG_PASSWORD.", "high"
            ))
        simulated_event_messages.append((
            "ActiveDirectory", "Brute Force Pattern", "alert", "Kerberos", 88,
            f"Multiple failed logins ({len(simulated_event_messages)+1}) detected targeting administrative credentials from {source_ip}.", "critical"
        ))
    elif req.scenario_id == "port-scan":
        for port in [21, 22, 23, 80, 443, 3389, 8080]:
            simulated_event_messages.append((
                "Firewall", "Port Scan", "deny", "TCP", port,
                f"Unsolicited TCP SYN connection dropped on port {port} from {source_ip}.", "medium"
            ))
    elif req.scenario_id == "suspicious-login":
        simulated_event_messages.append((
            "CloudTrail", "Suspicious Login", "success", "HTTPS", 443,
            f"User 'finance_director' authenticated from New York (IP: 12.45.67.89).", "info"
        ))
        simulated_event_messages.append((
            "CloudTrail", "Impossible Travel", "alert", "HTTPS", 443,
            f"Impossible travel alert: User 'finance_director' authenticated from Frankfurt Tor Exit Node ({source_ip}) 8 minutes later.", "critical"
        ))
    elif req.scenario_id == "privilege-escalation":
        simulated_event_messages.append((
            "EDR", "Process Creation", "allow", "OS", None,
            f"Process 'cmd.exe' executed 'whoami /priv' under user 'svc_backup' on {target_asset}.", "low"
        ))
        simulated_event_messages.append((
            "ActiveDirectory", "Privilege Escalation", "failure", "RPC", 445,
            f"Unauthorized privilege escalation: User 'svc_backup' attempted to add account to 'Domain Admins' via mimikatz token duplication.", "critical"
        ))
    elif req.scenario_id == "malware-execution":
        simulated_event_messages.append((
            "EDR", "Suspicious PowerShell", "alert", "TCP", 443,
            f"Suspicious encoded powershell execution: 'powershell.exe -w hidden -enc JABjAGwAYQBzAHMA' with memory download cradle on {target_asset}.", "critical"
        ))
    else: # data-exfiltration
        simulated_event_messages.append((
            "Firewall", "Large Outbound Transfer", "allow", "HTTPS", 443,
            f"Anomalous outbound egress: Large outbound transfer of 820MB to unclassified destination {source_ip} from {target_asset}.", "critical"
        ))

    # Step 2: Ingest logs into database
    threat_analysis_input = {}
    for source, ev_type, action, proto, port, msg, sev in simulated_event_messages:
        generated_logs_count += 1
        db_log = SecurityLog(
            timestamp=now,
            source=source,
            source_ip=source_ip,
            destination_ip="10.0.0.15",
            user="admin" if "admin" in msg else "svc_backup",
            hostname=target_asset,
            event_type=ev_type,
            action=action,
            protocol=proto,
            port=port,
            message=msg,
            severity=sev,
            raw_log=f"[SIMULATION] {msg}",
            status="Ingested"
        )
        db.add(db_log)
        # Capture the highest severity event for primary threat analysis
        if sev == "critical" or not threat_analysis_input:
            threat_analysis_input = {
                "source": source,
                "source_ip": source_ip,
                "destination_ip": "10.0.0.15",
                "user": "admin" if "admin" in msg else "svc_backup",
                "hostname": target_asset,
                "event_type": ev_type,
                "action": action,
                "protocol": proto,
                "port": port,
                "message": msg,
                "severity": sev,
                "failed_attempts": 12 if req.scenario_id == "brute-force" else 1
            }

    timeline_steps.append({
        "stage": "Log Ingestion Complete",
        "timestamp": datetime.utcnow().isoformat(),
        "detail": f"Ingested {generated_logs_count} synthetic security events into SIEM event queue."
    })

    # Step 3: Detection Engine & AI Inference
    analysis = analyze_security_event(threat_analysis_input)

    timeline_steps.append({
        "stage": "Detection & AI Scoring",
        "timestamp": datetime.utcnow().isoformat(),
        "detail": f"Hybrid engine detected {analysis['threat_type']} with AI Threat Confidence of {analysis['confidence_score']}%. Threat DNA generated."
    })

    # Step 4: Persist Threat Record
    threat_obj = Threat(
        threat_id=analysis["threat_id"],
        threat_type=analysis["threat_type"],
        severity=analysis["severity"],
        confidence_score=analysis["confidence_score"],
        model_probability=analysis["model_probability"],
        anomaly_score=analysis["anomaly_score"],
        rule_score=analysis["rule_score"],
        correlation_score=analysis["correlation_score"],
        source=source_ip,
        affected_asset=target_asset,
        attack_stage=analysis["attack_stage"],
        mitre_technique=analysis["mitre_technique"],
        indicators=[source_ip, target_asset],
        threat_dna=analysis["threat_dna"],
        explanation=analysis["explanation"],
        recommended_action=analysis["recommended_action"],
        status="Active"
    )
    db.add(threat_obj)

    # Step 5: Automatically Create Incident
    inc_id = f"INC-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    incident_obj = Incident(
        incident_id=inc_id,
        title=f"Automated Alert: {analysis['threat_type']} detected on {target_asset}",
        description=f"Generated via Attack Simulation '{scenario['name']}'. {analysis['explanation']}",
        severity=analysis["severity"],
        priority="P1" if analysis["severity"] == "critical" else "P2",
        status="Investigating",
        threat_id=analysis["threat_id"],
        affected_asset=target_asset,
        assigned_to="SOC Triage Bot",
        playbook_id=analysis["recommended_playbook_id"],
        created_at=now,
        updated_at=now
    )
    db.add(incident_obj)
    db.flush()

    # Timeline entry for incident
    inc_tl = IncidentTimeline(
        incident_id=incident_obj.id,
        action="Simulation Incident Auto-Created",
        actor="VIGILIX Core",
        description=f"Incident {inc_id} automatically opened based on {analysis['threat_type']} detection.",
        status_transition="None -> Investigating"
    )
    db.add(inc_tl)

    timeline_steps.append({
        "stage": "Incident & Playbook Associated",
        "timestamp": datetime.utcnow().isoformat(),
        "detail": f"Incident {inc_id} created in 'Investigating' state. Recommended Playbook: {analysis['recommended_playbook_id']}."
    })

    # Step 6: Record Simulation Entry
    sim_record = AttackSimulationRecord(
        scenario_id=scenario["id"],
        scenario_name=scenario["name"],
        target_asset=target_asset,
        source_ip=source_ip,
        events_generated_count=generated_logs_count,
        threat_id=analysis["threat_id"],
        incident_id=inc_id,
        playbook_id=analysis["recommended_playbook_id"],
        status="Completed",
        pipeline_stage="Playbook Ready",
        details={
            "threat_confidence": analysis["confidence_score"],
            "dna": analysis["threat_dna"],
            "mitre": analysis["mitre_technique"]
        }
    )
    db.add(sim_record)
    db.commit()
    db.refresh(sim_record)

    return {
        "simulation_id": sim_record.id,
        "scenario_id": scenario["id"],
        "scenario_name": scenario["name"],
        "status": "Completed",
        "pipeline_stage": "Playbook Ready",
        "events_generated": generated_logs_count,
        "threat_detected": {
            "threat_id": analysis["threat_id"],
            "threat_type": analysis["threat_type"],
            "severity": analysis["severity"],
            "confidence_score": analysis["confidence_score"],
            "threat_dna": analysis["threat_dna"],
            "mitre_technique": analysis["mitre_technique"]
        },
        "incident_created": {
            "incident_id": inc_id,
            "title": incident_obj.title,
            "status": incident_obj.status,
            "severity": incident_obj.severity
        },
        "recommended_playbook": {
            "playbook_id": analysis["recommended_playbook_id"],
            "name": f"{analysis['threat_type']} Response Playbook"
        },
        "execution_timeline": timeline_steps,
        "created_at": now
    }
