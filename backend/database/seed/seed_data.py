import random
from datetime import datetime, timedelta
from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.log import SecurityLog
from app.models.threat import Threat
from app.models.incident import Incident, IncidentTimeline, IncidentResponseAction
from app.models.playbook import Playbook, PlaybookExecution
from app.models.maturity import SecurityMaturityRecord
from app.models.simulation import AttackSimulationRecord
from app.models.splunk import SplunkConfig
from app.playbooks.engine import DEFAULT_PLAYBOOKS
from app.ai.adaptive_confidence import calculate_threat_confidence
from app.ai.threat_dna import generate_threat_dna
from app.routers.auth import get_password_hash

def seed_database():
    init_db()
    db = SessionLocal()

    # Check if database already has logs
    if db.query(SecurityLog).count() >= 100:
        print("Database already seeded with logs. Skipping duplicate seeding.")
        db.close()
        return

    print("Seeding VIGILIX database with realistic SOC & SIEM intelligence telemetry...")

    now = datetime.utcnow()

    # 1. Seed Users
    admin_user = User(
        username="admin",
        email="admin@vigilix.internal",
        hashed_password=get_password_hash("admin123"),
        full_name="SOC Administrator",
        role="Admin"
    )
    analyst_user = User(
        username="analyst",
        email="analyst@vigilix.internal",
        hashed_password=get_password_hash("analyst123"),
        full_name="Alex Mercer (Lead Responder)",
        role="Lead SOC Analyst"
    )
    db.add(admin_user)
    db.add(analyst_user)

    # 2. Seed Playbooks
    for pb_data in DEFAULT_PLAYBOOKS:
        existing = db.query(Playbook).filter(Playbook.playbook_id == pb_data["playbook_id"]).first()
        if not existing:
            pb = Playbook(**pb_data)
            db.add(pb)
    db.flush()

    # 3. Seed 24 Realistic Threats with AI confidence & Threat DNA
    threat_templates = [
        ("Brute Force", "critical", 94.5, 92.0, 88.0, 96.0, "185.220.101.5", "DC-NORTH-01", "Credential Access", "T1110.001",
         "Distributed Kerberos authentication burst exceeding 45 failed logons within 3 minutes.", "Lock account and blackhole source IP."),
        ("Malware", "critical", 98.2, 96.0, 94.0, 98.0, "198.51.100.22", "WORKSTATION-CEO-01", "Execution", "T1059.001",
         "Obfuscated PowerShell memory cradle executing Trojan beacon communicating with foreign IP.", "Isolate host and kill process tree."),
        ("Privilege Escalation", "critical", 96.0, 91.0, 89.0, 95.0, "192.168.10.82", "WIN-SRV-FINANCE", "Privilege Escalation", "T1068",
         "Standard user manipulated SeDebugPrivilege to duplicate LSASS token and join Domain Admins.", "Revoke elevation and purge Kerberos tickets."),
        ("Data Exfiltration", "critical", 95.4, 94.0, 92.0, 93.0, "10.0.4.15", "DB-PROD-CUSTOMER", "Exfiltration", "T1048",
         "Encrypted 750MB payload transfer outbound to untrusted foreign cloud endpoint.", "Null-route destination IP and quarantine host."),
        ("Suspicious Login", "high", 88.5, 84.0, 82.0, 86.0, "45.154.255.19", "OKTA-IAM-PORTAL", "Initial Access", "T1078.004",
         "Impossible travel anomaly detected: Session initiated from Frankfurt 7 minutes after New York login.", "Revoke active OAuth tokens and challenge MFA."),
        ("Reconnaissance", "medium", 76.0, 72.0, 68.0, 80.0, "194.26.29.88", "EDGE-FIREWALL-01", "Discovery", "T1046",
         "Automated TCP SYN scan targeting enterprise DMZ across ports 21, 22, 443, 3389.", "Add IP to perimeter drop list."),
        ("Credential Attack", "high", 91.0, 88.0, 84.0, 92.0, "193.32.162.40", "EXCHANGE-CAS-01", "Credential Access", "T1558.003",
         "Kerberoasting attack querying high-privilege SPN service tickets.", "Rotate SPN service account passwords."),
        ("Web Attack", "high", 84.2, 80.0, 75.0, 85.0, "185.190.141.22", "WAF-GATEWAY-PUBLIC", "Initial Access", "T1190",
         "Path traversal and remote command injection attempt on public API endpoint /api/v1/export.", "Block source IP on WAF and inspect audit log."),
        ("Insider Threat", "high", 87.0, 82.0, 86.0, 85.0, "192.168.1.105", "FILE-SERVER-HR", "Collection", "T1098",
         "Off-hours bulk access to confidential HR compensation directory followed by USB drive attachment.", "Disable USB ports and audit active access rights."),
        ("Brute Force", "high", 89.4, 85.0, 80.0, 90.0, "194.26.29.112", "VPN-CONC-01", "Credential Access", "T1110.003",
         "Password spraying against 60 Active Directory users on VPN gateway.", "Enforce temporary lockout and MFA requirement."),
        ("Malware", "high", 92.0, 90.0, 85.0, 92.0, "198.51.100.80", "ENG-WORKSTATION-09", "Defense Evasion", "T1562.001",
         "Adversary script attempted disabling Windows Defender real-time protection.", "Re-enable Defender via GPO and trigger offline scan."),
        ("Suspicious Login", "medium", 74.5, 70.0, 65.0, 78.0, "104.244.42.1", "O365-MAIL-SERVICE", "Initial Access", "T1078.002",
         "Authentication attempt from Tor Exit node to executive executive mailbox.", "Block Tor exit node ranges on Azure AD conditional access.")
    ]

    # Duplicate & vary to reach 24 threats
    created_threats = []
    for i in range(24):
        tmpl = threat_templates[i % len(threat_templates)]
        t_type, sev, conf, ml_p, anom, rule, src_ip, asset, stage, mitre, exp, action = tmpl
        t_id = f"THR-2026-{(i+1):03d}"
        created_at_date = now - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))

        dna = generate_threat_dna(
            threat_type=t_type,
            severity=sev,
            confidence_score=conf,
            mitre_technique=mitre,
            target_asset=asset,
            source=src_ip,
            behavior_summary=f"{t_type} targeting {asset} with {conf}% confidence.",
            anomaly_score=anom,
            attack_vector=f"Network/{'HTTPS' if 'WEB' in asset else 'Auth'}"
        )

        threat_obj = Threat(
            threat_id=t_id,
            threat_type=t_type,
            severity=sev,
            confidence_score=conf,
            model_probability=ml_p,
            anomaly_score=anom,
            rule_score=rule,
            correlation_score=random.uniform(70.0, 95.0),
            source=src_ip,
            affected_asset=asset,
            attack_stage=stage,
            mitre_technique=mitre,
            indicators=[src_ip, asset, "compromised_token"],
            threat_dna=dna,
            explanation=f"AI Threat Engine flagged {t_type} because: 1. Multiple telemetry violations matched signature {mitre}. 2. Anomaly score {anom:.1f}% exceeds baseline. 3. Target {asset} is high-value asset.",
            recommended_action=action,
            created_at=created_at_date,
            status="Resolved" if i < 10 else "Active" if i < 18 else "Under Investigation"
        )
        db.add(threat_obj)
        created_threats.append(threat_obj)

    db.flush()

    # 4. Seed 12 Incidents with realistic lifecycle states
    incident_configs = [
        ("INC-2026-001", "Active Kerberos Password Spray Against DC-NORTH-01", "Brute force attack targeting 45 accounts.", "critical", "P1", "Resolved", "THR-2026-001", "DC-NORTH-01", "Alex Mercer", "PB-BRUTE-01"),
        ("INC-2026-002", "Cobalt Strike Memory Beacon on WORKSTATION-CEO-01", "EDR detected memory injection and C2 beaconing.", "critical", "P1", "Contained", "THR-2026-002", "WORKSTATION-CEO-01", "Alex Mercer", "PB-MAL-03"),
        ("INC-2026-003", "Unauthorized Domain Admin Group Escalation", "svc_backup elevated permissions to Domain Admins.", "critical", "P1", "Resolved", "THR-2026-003", "WIN-SRV-FINANCE", "Alex Mercer", "PB-PRIV-04"),
        ("INC-2026-004", "Database Archive Egress to Foreign Cloud VPS", "Large outbound file transfer from production database.", "critical", "P1", "Investigating", "THR-2026-004", "DB-PROD-CUSTOMER", "Alex Mercer", "PB-EXFIL-05"),
        ("INC-2026-005", "Impossible Travel Authentication Anomaly", "Concurrent login from New York and Frankfurt.", "high", "P2", "Resolved", "THR-2026-005", "OKTA-IAM-PORTAL", "Alex Mercer", "PB-LOGIN-06"),
        ("INC-2026-006", "Perimeter Port Sweep on DMZ Gateway", "Horizontal TCP SYN scan against edge router.", "medium", "P3", "Resolved", "THR-2026-006", "EDGE-FIREWALL-01", "Alex Mercer", "PB-SCAN-07"),
        ("INC-2026-007", "Kerberoasting SPN Ticket Extraction", "Multiple TGS tickets requested for administrative accounts.", "high", "P2", "Contained", "THR-2026-007", "EXCHANGE-CAS-01", "Alex Mercer", "PB-CRED-02"),
        ("INC-2026-008", "WAF Path Traversal on Public Export API", "Automated fuzzer scanning for directory traversal.", "high", "P2", "Resolved", "THR-2026-008", "WAF-GATEWAY-PUBLIC", "Alex Mercer", "PB-WEB-08"),
        ("INC-2026-009", "Unauthorized Bulk HR File Access via USB", "Mass copy of compensation data to removable storage.", "high", "P2", "Investigating", "THR-2026-009", "FILE-SERVER-HR", "Alex Mercer", "PB-INSIDER-09"),
        ("INC-2026-010", "Distributed Password Spray Across VPN Concentrator", "Multi-source credential stuffing against corporate VPN.", "high", "P2", "Resolved", "THR-2026-010", "VPN-CONC-01", "Alex Mercer", "PB-BRUTE-01"),
        ("INC-2026-011", "Windows Defender Real-time Protection Disabled", "Adversary script attempted tampering with antivirus.", "high", "P2", "Eradicated", "THR-2026-011", "ENG-WORKSTATION-09", "Alex Mercer", "PB-MAL-03"),
        ("INC-2026-012", "Tor Exit Node Access to Executive Mailbox", "Webmail session opened through anonymous proxy.", "medium", "P3", "Detected", "THR-2026-012", "O365-MAIL-SERVICE", "Unassigned", "PB-LOGIN-06"),
    ]

    for inc_id, title, desc, sev, pri, stat, t_ref, asset, assignee, pb_ref in incident_configs:
        c_time = now - timedelta(hours=random.randint(6, 72))
        cont_time = c_time + timedelta(minutes=random.randint(8, 25)) if stat in ["Contained", "Eradicated", "Resolved"] else None
        res_time = cont_time + timedelta(minutes=random.randint(15, 45)) if stat == "Resolved" else None

        incident = Incident(
            incident_id=inc_id,
            title=title,
            description=desc,
            severity=sev,
            priority=pri,
            status=stat,
            threat_id=t_ref,
            affected_asset=asset,
            assigned_to=assignee,
            playbook_id=pb_ref,
            created_at=c_time,
            updated_at=now,
            containment_time=cont_time,
            resolution_time=res_time,
            root_cause="External adversary exploited exposed service." if "Brute" in title else "Malicious script execution via phishing vector.",
            notes="Triage completed by SOC Level 2 analyst."
        )
        db.add(incident)
        db.flush()

        # Add realistic timeline
        db.add(IncidentTimeline(
            incident_id=incident.id,
            timestamp=c_time,
            action="Alert Ingested",
            actor="VIGILIX Engine",
            description=f"Initial alert ingested for {asset}.",
            status_transition="None -> Detected"
        ))
        if stat != "Detected":
            db.add(IncidentTimeline(
                incident_id=incident.id,
                timestamp=c_time + timedelta(minutes=3),
                action="Analyst Assigned",
                actor="System Dispatcher",
                description=f"Assigned incident to {assignee} for immediate investigation.",
                status_transition="Detected -> Investigating"
            ))
        if cont_time:
            db.add(IncidentTimeline(
                incident_id=incident.id,
                timestamp=cont_time,
                action="Containment Executed",
                actor=assignee,
                description="Perimeter drop rule and account lockout successfully applied.",
                status_transition="Investigating -> Contained"
            ))
        if res_time:
            db.add(IncidentTimeline(
                incident_id=incident.id,
                timestamp=res_time,
                action="Incident Resolved",
                actor=assignee,
                description="Threat fully eradicated and system integrity verified.",
                status_transition="Contained -> Resolved"
            ))

    # 5. Seed 130 Realistic Security Logs
    sources = ["Firewall", "ActiveDirectory", "EDR", "Splunk", "WAF", "CloudTrail"]
    hosts = ["DC-NORTH-01", "WORKSTATION-CEO-01", "WIN-SRV-FINANCE", "DB-PROD-CUSTOMER", "EDGE-FIREWALL-01", "OKTA-IAM-PORTAL", "VPN-CONC-01"]
    users = ["admin", "jsmith", "cfo_assistant", "svc_backup", "analyst", "mclark", "deploy_bot"]

    log_event_types = [
        ("Failed Login", "failure", "Kerberos", 88, "User logon failed due to bad password or locked account.", "high"),
        ("Successful Login", "success", "Kerberos", 88, "User authenticated successfully.", "info"),
        ("Port Scan", "deny", "TCP", 445, "Inbound connection dropped by perimeter access list.", "medium"),
        ("Process Creation", "allow", "OS", None, "New process spawned by svchost.exe.", "low"),
        ("Outbound HTTPS", "allow", "HTTPS", 443, "Standard SSL traffic to content distribution network.", "info"),
        ("Suspicious PowerShell", "alert", "TCP", 443, "Obfuscated powershell -enc execution detected.", "critical"),
        ("Privilege Escalation", "failure", "RPC", 445, "Unauthorized token duplication attempt blocked.", "critical"),
        ("Large Outbound Transfer", "alert", "HTTPS", 443, "Data egress of 640MB to external IP address.", "critical"),
        ("DNS Query", "allow", "UDP", 53, "Standard recursive domain name resolution.", "info"),
        ("Access Denied", "deny", "HTTPS", 443, "HTTP 403 Forbidden on protected admin route.", "low")
    ]

    for i in range(130):
        src = random.choice(sources)
        host = random.choice(hosts)
        usr = random.choice(users)
        ev_type, action, proto, port, msg_base, sev = random.choice(log_event_types)
        src_ip = f"192.168.{random.randint(1, 20)}.{random.randint(1, 250)}" if random.random() > 0.3 else f"185.220.{random.randint(100, 200)}.{random.randint(1, 250)}"
        dest_ip = f"10.0.{random.randint(1, 5)}.{random.randint(10, 80)}"
        log_time = now - timedelta(hours=random.randint(0, 48), minutes=random.randint(0, 59))

        msg = f"[{src}] {msg_base} Host: {host}, User: {usr}, Source: {src_ip}"
        
        log_entry = SecurityLog(
            timestamp=log_time,
            source=src,
            source_ip=src_ip,
            destination_ip=dest_ip,
            user=usr,
            hostname=host,
            event_type=ev_type,
            action=action,
            protocol=proto,
            port=port,
            message=msg,
            severity=sev,
            raw_log=f"SYSLOG <134> 1 {log_time.isoformat()} {host} {src} - - - {msg}",
            status="Flagged" if sev in ["critical", "high"] else "Clean"
        )
        db.add(log_entry)

    # 6. Seed Splunk Configuration
    db.add(SplunkConfig(
        host="localhost",
        port=8089,
        username="admin",
        hec_url="http://localhost:8088/services/collector",
        mode="mock",
        is_connected=True,
        last_tested_at=now
    ))

    # 7. Seed Initial Security Maturity Record
    db.add(SecurityMaturityRecord(
        timestamp=now,
        overall_score=78.2,
        level="Managed",
        categories={
            "detection": 82.0,
            "response": 76.0,
            "visibility": 84.0,
            "coverage": 78.0,
            "access_control": 80.0,
            "automation": 68.0,
            "intelligence": 82.0,
            "efficiency": 80.0,
            "resilience": 76.0,
            "exposure": 76.0
        },
        score_trend=3.8,
        strengths=[
            "Log Visibility & Diversity (84%): Strong coverage across firewall, AD, and EDR sources.",
            "Threat Detection Capability (82%): 12 SOC detection rules actively correlating attacks."
        ],
        weaknesses=[
            "Security Automation & SOAR (68%): Only 68% of incidents currently have automated playbooks executed."
        ],
        recommendations=[
            "Increase automated incident response coverage by enabling auto-containment triggers on critical playbooks."
        ]
    ))

    db.commit()
    print("Database seeding completed successfully! Ingested 130+ logs, 24 threats, 12 incidents, 7 playbooks.")
    db.close()

if __name__ == "__main__":
    seed_database()
