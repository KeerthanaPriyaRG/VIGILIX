from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.incident import Incident, IncidentTimeline, IncidentResponseAction
from app.models.playbook import Playbook, PlaybookExecution

DEFAULT_PLAYBOOKS = [
    {
        "playbook_id": "PB-BRUTE-01",
        "name": "Brute Force Authentication Response",
        "description": "Standard operating procedure for containing distributed and single-source password spraying and brute force attacks.",
        "threat_type": "Brute Force",
        "severity": "high",
        "estimated_response_time": "12 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Detect Threshold Breach", "description": "Verify authentication failure burst exceeding 8 attempts in 5 minutes.", "action_type": "Automated", "command_simulation": "GET /api/logs?event_type=Failed+Login&timeframe=5m"},
            {"step_number": 2, "phase": "Investigation", "title": "Extract Source & Target Telemetry", "description": "Identify attacker IP, ASN reputation, targeted username, and protocol (SSH/RDP/Web).", "action_type": "Automated", "command_simulation": "whois ${SOURCE_IP} && query-threat-intel --ip ${SOURCE_IP}"},
            {"step_number": 3, "phase": "Containment", "title": "Block Source IP on Firewall", "description": "Push immediate ACL drop rule to edge and cloud perimeter firewalls.", "action_type": "Automated", "command_simulation": "iptables -A INPUT -s ${SOURCE_IP} -j DROP && aws-waf-cli block-ip --ip ${SOURCE_IP}"},
            {"step_number": 4, "phase": "Eradication", "title": "Temporary Account Lockout & Session Termination", "description": "Lock compromised directory user account and terminate all active Kerberos/OAuth tokens.", "action_type": "Automated", "command_simulation": "Revoke-AzureADUserAllRefreshToken -ObjectId ${USER} && Lock-ADAccount -Identity ${USER}"},
            {"step_number": 5, "phase": "Recovery", "title": "Enforce MFA & Password Reset", "description": "Require out-of-band password change upon next authentication with mandatory FIDO2/MFA challenge.", "action_type": "Manual", "command_simulation": "Set-MfaEnforcement -User ${USER} -State Required"},
            {"step_number": 6, "phase": "Closure", "title": "Review Access Logs & Close Incident", "description": "Verify no residual connections remain and document findings in incident summary.", "action_type": "Manual", "command_simulation": "generate-incident-report --id ${INCIDENT_ID}"}
        ]
    },
    {
        "playbook_id": "PB-MAL-03",
        "name": "Malware & Ransomware Containment",
        "description": "Rapid host isolation, C2 termination, and memory forensics playbook for malicious execution alerts.",
        "threat_type": "Malware",
        "severity": "critical",
        "estimated_response_time": "8 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "EDR Alert Verification", "description": "Confirm high-severity endpoint detection or anomalous binary hash execution.", "action_type": "Automated", "command_simulation": "edr-agent query-alert --host ${HOSTNAME}"},
            {"step_number": 2, "phase": "Investigation", "title": "Process Tree & Network Analysis", "description": "Map parent process lineage, outbound socket connections, and loaded DLLs.", "action_type": "Automated", "command_simulation": "Get-ProcessTree -Pid ${SUSPECT_PID} && netstat -ano"},
            {"step_number": 3, "phase": "Containment", "title": "Network Host Isolation", "description": "Sever all host network interfaces except secure EDR management tunnel.", "action_type": "Automated", "command_simulation": "isolate-endpoint --hostname ${HOSTNAME} --allow-mgmt"},
            {"step_number": 4, "phase": "Eradication", "title": "Process Termination & Hash Quarantine", "description": "Kill malicious process trees and place binary in encrypted quarantine vault.", "action_type": "Automated", "command_simulation": "taskkill /F /PID ${SUSPECT_PID} /T && edr-quarantine --hash ${MALWARE_HASH}"},
            {"step_number": 5, "phase": "Recovery", "title": "Persistence Audit & System Restoration", "description": "Inspect scheduled tasks, services, RunOnce registry keys, and restore from trusted snapshot.", "action_type": "Manual", "command_simulation": "audit-persistence-mechanisms --host ${HOSTNAME}"},
            {"step_number": 6, "phase": "Closure", "title": "IOC Dissemination & Incident Sign-off", "description": "Push extracted hashes and C2 IPs to global threat intelligence feeds.", "action_type": "Automated", "command_simulation": "push-iocs-to-misp --hashes ${MALWARE_HASH}"}
        ]
    },
    {
        "playbook_id": "PB-PRIV-04",
        "name": "Privilege Escalation Containment",
        "description": "Response procedure for unauthorized group elevation, token manipulation, or sudo abuse.",
        "threat_type": "Privilege Escalation",
        "severity": "critical",
        "estimated_response_time": "15 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Privileged Event Triage", "description": "Alert fired on unauthorized user joining Domain Admins or executing Mimikatz commands.", "action_type": "Automated", "command_simulation": "audit-security-event-4728 --user ${USER}"},
            {"step_number": 2, "phase": "Investigation", "title": "Identify Elevation Mechanism", "description": "Trace whether token impersonation, vulnerable driver, or misconfigured sudo was utilized.", "action_type": "Automated", "command_simulation": "sysinternals-log-query --event 4672 --user ${USER}"},
            {"step_number": 3, "phase": "Containment", "title": "Revoke Admin Group Membership", "description": "Remove compromised identity from administrative groups immediately.", "action_type": "Automated", "command_simulation": "Remove-ADGroupMember -Identity 'Domain Admins' -Members ${USER} -Confirm:$false"},
            {"step_number": 4, "phase": "Eradication", "title": "Purge Kerberos Tickets & Invalidate Sessions", "description": "Invalidate Golden/Silver ticket cache and kill active remote desktop sessions.", "action_type": "Automated", "command_simulation": "klist purge && qwinsta | logoff"},
            {"step_number": 5, "phase": "Recovery", "title": "Privilege Audit & Service Account Rotation", "description": "Rotate local administrator password solution (LAPS) and verify sudoers integrity.", "action_type": "Manual", "command_simulation": "Reset-LapsPassword -ComputerName ${HOSTNAME}"},
            {"step_number": 6, "phase": "Closure", "title": "Post-Mortem Root Cause Analysis", "description": "Document attack path and schedule patch remediation for exploited vector.", "action_type": "Manual", "command_simulation": "export-forensic-report --id ${INCIDENT_ID}"}
        ]
    },
    {
        "playbook_id": "PB-EXFIL-05",
        "name": "Data Exfiltration & Egress Response",
        "description": "Playbook for identifying and halting unauthorized bulk data egress, cloud uploads, or DNS tunneling.",
        "threat_type": "Data Exfiltration",
        "severity": "critical",
        "estimated_response_time": "10 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Abnormal Outbound Traffic Spike", "description": "Detect egress transfer exceeding baseline volume by > 500MB to unclassified IP.", "action_type": "Automated", "command_simulation": "netflow-query --min-bytes 500MB --direction egress"},
            {"step_number": 2, "phase": "Investigation", "title": "Payload & Destination Triage", "description": "Identify destination country, protocol (HTTPS/DNS/FTP), and local archiving process.", "action_type": "Automated", "command_simulation": "pcap-dump --destination ${DEST_IP} --duration 30s"},
            {"step_number": 3, "phase": "Containment", "title": "Null-Route Destination IP & Drop Egress", "description": "Apply blackhole routing on edge routers to block destination instantly.", "action_type": "Automated", "command_simulation": "route add ${DEST_IP} mask 255.255.255.255 127.0.0.1"},
            {"step_number": 4, "phase": "Eradication", "title": "Suspend Compromised Host Egress", "description": "Block local endpoint network adapter and kill bulk archiving/transfer utilities.", "action_type": "Automated", "command_simulation": "quarantine-host-network --ip ${SOURCE_IP}"},
            {"step_number": 5, "phase": "Recovery", "title": "Data Impact Assessment", "description": "Audit file access logs to determine sensitivity classification of exfiltrated data.", "action_type": "Manual", "command_simulation": "dlp-scan --target ${HOSTNAME} --since -2h"},
            {"step_number": 6, "phase": "Closure", "title": "Regulatory Notification & Case Finalization", "description": "Prepare regulatory disclosure brief if sensitive PII or compliance data was impacted.", "action_type": "Manual", "command_simulation": "generate-compliance-brief --incident ${INCIDENT_ID}"}
        ]
    },
    {
        "playbook_id": "PB-CRED-02",
        "name": "Credential Compromise Response",
        "description": "Response procedure for leaked credentials, Pass-the-Hash, and Kerberoasting attacks.",
        "threat_type": "Credential Attack",
        "severity": "high",
        "estimated_response_time": "15 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Identify Suspicious Auth Pattern", "description": "Detect abnormal ticket granting or concurrent credential usage.", "action_type": "Automated", "command_simulation": "query-auth-telemetry --user ${USER}"},
            {"step_number": 2, "phase": "Investigation", "title": "Scope Compromised Accounts", "description": "Determine if multiple accounts share credential patterns or were accessed from same origin.", "action_type": "Automated", "command_simulation": "audit-logon-sessions --user ${USER}"},
            {"step_number": 3, "phase": "Containment", "title": "Immediate Credential Invalidation", "description": "Revoke directory session tokens and expire passwords across all enterprise realms.", "action_type": "Automated", "command_simulation": "Revoke-UserSession -Identity ${USER}"},
            {"step_number": 4, "phase": "Eradication", "title": "Clear Cached Credentials", "description": "Purge LSASS cached hashes and enforce immediate Kerberos ticket expiration.", "action_type": "Automated", "command_simulation": "Invoke-PurgeCredentialCache -Host ${HOSTNAME}"},
            {"step_number": 5, "phase": "Recovery", "title": "Hardware Token MFA Provisioning", "description": "Require user to re-register security key or biometric authenticator.", "action_type": "Manual", "command_simulation": "Provision-SecurityKey -User ${USER}"},
            {"step_number": 6, "phase": "Closure", "title": "Credential Exposure Review", "description": "Verify external breach feeds to confirm source of credential leak.", "action_type": "Manual", "command_simulation": "check-hibp-feed --email ${USER_EMAIL}"}
        ]
    },
    {
        "playbook_id": "PB-LOGIN-06",
        "name": "Suspicious Login & Geo-Anomaly Response",
        "description": "Triage and remediation for impossible travel, Tor exit node authentication, and unfamiliar devices.",
        "threat_type": "Suspicious Login",
        "severity": "medium",
        "estimated_response_time": "10 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Geographic Velocity Anomaly", "description": "User logged in from two countries within time span violating physical travel constraints.", "action_type": "Automated", "command_simulation": "geo-distance-calculator --user ${USER}"},
            {"step_number": 2, "phase": "Investigation", "title": "User Confirmation Out-of-Band", "description": "Send automated push prompt to registered mobile device asking 'Did you just log in?'.", "action_type": "Automated", "command_simulation": "send-push-verification --user ${USER}"},
            {"step_number": 3, "phase": "Containment", "title": "Terminate Anomaly Session", "description": "Drop active session associated with abnormal geolocation IP.", "action_type": "Automated", "command_simulation": "kill-web-session --session-id ${SESSION_ID}"},
            {"step_number": 4, "phase": "Eradication", "title": "Block Malicious ASN / Country CIDR", "description": "Temporarily geofence authentication requests from suspicious country code.", "action_type": "Automated", "command_simulation": "waf-add-geofence --country ${COUNTRY_CODE}"},
            {"step_number": 5, "phase": "Recovery", "title": "Device Trust Re-evaluation", "description": "Verify endpoint certificate and compliance posture before allowing re-login.", "action_type": "Manual", "command_simulation": "intune-compliance-check --device ${DEVICE_ID}"},
            {"step_number": 6, "phase": "Closure", "title": "Record Resolution & Unblock If False Positive", "description": "Log user travel schedule or close incident with resolution status.", "action_type": "Manual", "command_simulation": "close-ticket --id ${INCIDENT_ID} --resolution 'Session Terminated'"}
        ]
    },
    {
        "playbook_id": "PB-SCAN-07",
        "name": "Port Scan & Perimeter Reconnaissance",
        "description": "Defensive response for automated adversary port mapping, TCP SYN scans, and service enumeration.",
        "threat_type": "Reconnaissance",
        "severity": "medium",
        "estimated_response_time": "5 mins",
        "status": "Active",
        "steps": [
            {"step_number": 1, "phase": "Trigger", "title": "Port Sweep Threshold Exceeded", "description": "Over 20 unique destination ports hit within 30 seconds from single source IP.", "action_type": "Automated", "command_simulation": "check-flow-table --src ${SOURCE_IP}"},
            {"step_number": 2, "phase": "Investigation", "title": "Threat Actor IP Reputation Check", "description": "Check Shodan/GreyNoise/AbuseIPDB reputation score for the source scanner.", "action_type": "Automated", "command_simulation": "greynoise-query --ip ${SOURCE_IP}"},
            {"step_number": 3, "phase": "Containment", "title": "Automated Edge Firewall IP Drop", "description": "Add IP to dynamic blackhole group across all perimeter firewalls for 72 hours.", "action_type": "Automated", "command_simulation": "firewall-cli --add-blacklist-ip ${SOURCE_IP} --ttl 72h"},
            {"step_number": 4, "phase": "Eradication", "title": "Exposed Service Audit", "description": "Confirm no vulnerable internal ports (SMB, RDP, DB) leaked responses during scan.", "action_type": "Automated", "command_simulation": "scan-audit --target-hosts ${SCANNED_TARGETS}"},
            {"step_number": 5, "phase": "Recovery", "title": "Verify Perimeter Inbound Policies", "description": "Ensure default-deny ingress policy remains intact on edge routers.", "action_type": "Manual", "command_simulation": "verify-perimeter-rules"},
            {"step_number": 6, "phase": "Closure", "title": "Archive Scan Telemetry", "description": "Save scan packets for threat attribution and mark incident as mitigated.", "action_type": "Manual", "command_simulation": "archive-recon-event --id ${INCIDENT_ID}"}
        ]
    }
]

def execute_playbook_simulation(
    db: Session,
    playbook_id: str,
    incident_id: Optional[str] = None,
    target_asset: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes a response playbook in safe simulation mode,
    advancing through all phases and updating incident lifecycle in real-time.
    """
    playbook = db.query(Playbook).filter(Playbook.playbook_id == playbook_id).first()
    if not playbook:
        # Fallback to in-memory definition
        pb_dict = next((p for p in DEFAULT_PLAYBOOKS if p["playbook_id"] == playbook_id), DEFAULT_PLAYBOOKS[0])
        steps = pb_dict["steps"]
        pb_name = pb_dict["name"]
    else:
        steps = playbook.steps
        pb_name = playbook.name

    now = datetime.utcnow()
    execution_logs = []

    incident = None
    if incident_id:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()

    for idx, step in enumerate(steps):
        phase = step.get("phase", "Execution")
        title = step.get("title", f"Step {idx+1}")
        cmd = step.get("command_simulation", "echo 'Executing step'")
        
        # Replace template placeholders
        cmd_rendered = cmd.replace("${HOSTNAME}", target_asset or "CORP-HOST-01")
        cmd_rendered = cmd_rendered.replace("${SOURCE_IP}", "198.51.100.45")
        cmd_rendered = cmd_rendered.replace("${USER}", "svc_backup")
        cmd_rendered = cmd_rendered.replace("${INCIDENT_ID}", incident_id or "INC-SIM-01")

        log_entry = {
            "step_number": idx + 1,
            "phase": phase,
            "title": title,
            "status": "Completed",
            "timestamp": now.isoformat(),
            "simulated_command": cmd_rendered,
            "output": f"Success: [{phase.upper()}] {title} executed successfully in simulation sandbox."
        }
        execution_logs.append(log_entry)

        # Update real incident status and timeline as phases execute
        if incident:
            # Add action record
            action_rec = IncidentResponseAction(
                incident_id=incident.id,
                action_name=title,
                status="Completed",
                executed_by="VIGILIX Playbook Engine",
                output_log=f"Command: {cmd_rendered}\nResult: Executed successfully."
            )
            db.add(action_rec)

            if phase == "Containment":
                incident.status = "Contained"
                incident.containment_time = now
                tl = IncidentTimeline(
                    incident_id=incident.id,
                    action="Containment Executed",
                    actor="VIGILIX Playbook SOAR",
                    description=f"Playbook '{pb_name}' executed containment step: {title}",
                    status_transition="Investigating -> Contained"
                )
                db.add(tl)
            elif phase == "Eradication":
                incident.status = "Eradicated"
                tl = IncidentTimeline(
                    incident_id=incident.id,
                    action="Threat Eradicated",
                    actor="VIGILIX Playbook SOAR",
                    description=f"Eradication action completed: {title}",
                    status_transition="Contained -> Eradicated"
                )
                db.add(tl)
            elif phase == "Closure":
                incident.status = "Resolved"
                incident.resolution_time = now
                incident.root_cause = f"Attack mitigated via automated execution of {pb_name}."
                tl = IncidentTimeline(
                    incident_id=incident.id,
                    action="Incident Closed",
                    actor="VIGILIX Playbook SOAR",
                    description=f"All {len(steps)} steps of '{pb_name}' completed. Incident resolved.",
                    status_transition="Eradicated -> Resolved"
                )
                db.add(tl)

    # Save PlaybookExecution record
    exec_record = PlaybookExecution(
        playbook_id=playbook_id,
        incident_id=incident_id,
        execution_status="Completed",
        current_step_index=len(steps),
        logs=execution_logs,
        started_at=now,
        completed_at=now
    )
    db.add(exec_record)
    db.commit()
    db.refresh(exec_record)

    return {
        "execution_id": exec_record.id,
        "playbook_id": playbook_id,
        "incident_id": incident_id,
        "execution_status": "Completed",
        "completed_steps": len(steps),
        "total_steps": len(steps),
        "logs": execution_logs,
        "started_at": now,
        "completed_at": now
    }
