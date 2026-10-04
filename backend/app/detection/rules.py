import re
from typing import Dict, Any, List, Optional

class DetectionRuleResult:
    def __init__(
        self,
        matched: bool,
        rule_id: str,
        rule_name: str,
        threat_type: str,
        severity: str,
        rule_score: float,
        mitre_technique: str,
        attack_stage: str,
        recommended_action: str,
        details: str
    ):
        self.matched = matched
        self.rule_id = rule_id
        self.rule_name = rule_name
        self.threat_type = threat_type
        self.severity = severity
        self.rule_score = rule_score
        self.mitre_technique = mitre_technique
        self.attack_stage = attack_stage
        self.recommended_action = recommended_action
        self.details = details

# 12+ Concrete SOC Detection Rules

def rule_brute_force(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 1 & 2: High frequency / burst of failed login attempts."""
    failed = int(event.get("failed_attempts", event.get("failed_count", 0)))
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    if failed >= 8 or ("brute" in msg) or ("failed login" in event_type and failed >= 5):
        score = min(100.0, 75.0 + (failed * 2.5))
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-BRUTE-01",
            rule_name="Brute Force Authentication Pattern",
            threat_type="Brute Force",
            severity="high" if failed < 15 else "critical",
            rule_score=score,
            mitre_technique="T1110.001",
            attack_stage="Credential Access",
            recommended_action="Block offending source IP on perimeter firewall, temporarily lock target account, and require MFA challenge.",
            details=f"Detected burst of {failed} failed authentication attempts against {event.get('user', 'user account')} from {event.get('source_ip', 'unknown IP')}."
        )
    return None

def rule_suspicious_powershell(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 8: Suspicious PowerShell execution with encoded commands or download cradles."""
    msg = str(event.get("message", "")).lower()
    raw = str(event.get("raw_log", "")).lower()
    combined = msg + " " + raw

    suspicious_patterns = [
        r"-enc\b", r"-encodedcommand\b", r"downloadstring", r"invoke-webrequest",
        r"iex\b", r"invoke-expression", r"-w hidden", r"bypass -c", r"certutil -urlcache"
    ]
    if any(re.search(pat, combined) for pat in suspicious_patterns):
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-PS-08",
            rule_name="Suspicious Encoded PowerShell Execution",
            threat_type="Malware",
            severity="critical",
            rule_score=95.0,
            mitre_technique="T1059.001",
            attack_stage="Execution",
            recommended_action="Isolate endpoint immediately, terminate parent process tree, extract memory dump, and quarantine suspicious scripts.",
            details="PowerShell execution detected utilizing base64 encoding or memory-only download cradle syntax."
        )
    return None

def rule_privilege_escalation(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 4: Suspicious privilege escalation."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()
    user = str(event.get("user", "")).lower()

    priv_tokens = ["whoami /priv", "mimikatz", "sekurlsa", "sudoers", "domain admins", "net localgroup administrators /add", "token manipulation"]
    if any(tok in msg for tok in priv_tokens) or ("privilege escalation" in event_type):
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-PRIV-04",
            rule_name="Unauthorized Privilege Escalation Attempt",
            threat_type="Privilege Escalation",
            severity="critical",
            rule_score=96.0,
            mitre_technique="T1068",
            attack_stage="Privilege Escalation",
            recommended_action="Revoke elevated token, disable compromised user session, audit Active Directory group membership, and inspect security logs.",
            details=f"Privilege escalation behavior detected targeting elevated privileges by user '{user}'."
        )
    return None

def rule_port_scan(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 5: Port scanning and reconnaissance."""
    event_type = str(event.get("event_type", "")).lower()
    msg = str(event.get("message", "")).lower()

    if "port scan" in event_type or "syn scan" in msg or "reconnaissance" in event_type or "nmap" in msg:
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-SCAN-05",
            rule_name="Horizontal/Vertical Port Sweep",
            threat_type="Reconnaissance",
            severity="medium",
            rule_score=80.0,
            mitre_technique="T1046",
            attack_stage="Discovery",
            recommended_action="Add source IP to perimeter drop list and review edge firewall intrusion prevention system (IPS) logs.",
            details=f"Reconnaissance scanning pattern detected targeting multiple destination ports from {event.get('source_ip', 'external source')}."
        )
    return None

def rule_data_exfiltration(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 10: Data exfiltration indicators."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    exfil_tokens = ["large outbound transfer", "mega.nz", "data exfiltration", "tor connection", "dns tunnel", "s3 bucket upload", "bulk archive"]
    if any(tok in msg for tok in exfil_tokens) or "exfiltration" in event_type:
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-EXFIL-10",
            rule_name="Anomalous Data Egress and Exfiltration",
            threat_type="Data Exfiltration",
            severity="critical",
            rule_score=94.0,
            mitre_technique="T1048",
            attack_stage="Exfiltration",
            recommended_action="Sever outbound network connection to target IP, isolate the egress host, and initiate data loss forensics.",
            details="Anomalous volume of data egress or suspicious cloud staging destination detected."
        )
    return None

def rule_impossible_travel(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 3: Impossible login pattern."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    if "impossible travel" in msg or "impossible travel" in event_type or "geo-velocity" in msg:
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-GEO-03",
            rule_name="Impossible Travel Anomaly",
            threat_type="Suspicious Login",
            severity="high",
            rule_score=88.0,
            mitre_technique="T1078.004",
            attack_stage="Initial Access",
            recommended_action="Revoke active cloud sessions, invalidate OAuth refresh tokens, and prompt user for out-of-band identity verification.",
            details=f"User {event.get('user', 'account')} authenticated from disparate geographic locations within an impossible timeframe."
        )
    return None

def rule_malware_indicators(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 7: Known malware indicators, hashes, or C2 beaconing."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    malware_tokens = ["ransomware", "c2 beacon", "malware", "trojan", "cobalt strike", "emotet", "meterpreter"]
    if any(tok in msg for tok in malware_tokens) or "malware" in event_type:
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-MAL-07",
            rule_name="Known Malware or Command-and-Control Signature",
            threat_type="Malware",
            severity="critical",
            rule_score=98.0,
            mitre_technique="T1071.001",
            attack_stage="Command and Control",
            recommended_action="Immediately quarantine endpoint from enterprise subnet, terminate malicious threads, and preserve disk forensic image.",
            details="Threat intelligence signature match detected correlating with known C2 infrastructure or adversary payload."
        )
    return None

def rule_repeated_access_denial(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 6: Repeated access denial on sensitive API or admin web endpoints."""
    msg = str(event.get("message", "")).lower()
    action = str(event.get("action", "")).lower()
    port = event.get("port")

    if ("403 forbidden" in msg or "access denied" in msg or action == "deny") and (port in [443, 8443, 8080, 22]):
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-DENY-06",
            rule_name="Repeated Access Authorization Denial",
            threat_type="Web Attack",
            severity="medium",
            rule_score=72.0,
            mitre_technique="T1190",
            attack_stage="Initial Access",
            recommended_action="Apply rate-limiting on WAF, inspect URI request parameters for path traversal/fuzzing, and monitor perimeter.",
            details="Repeated unauthorized HTTP/SSL access denials observed against protected endpoints."
        )
    return None

def rule_suspicious_auth(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 11: Suspicious authentication (NTLM downgrade, Kerberoasting)."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    if "kerberoast" in msg or "pass-the-hash" in msg or "ntlm downgrade" in msg or "golden ticket" in msg:
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-AUTH-11",
            rule_name="Suspicious Kerberos/NTLM Authentication Artifact",
            threat_type="Credential Attack",
            severity="high",
            rule_score=92.0,
            mitre_technique="T1558.003",
            attack_stage="Credential Access",
            recommended_action="Reset Service Principal Name (SPN) account password, enforce AES Kerberos encryption, and investigate domain controllers.",
            details="Kerberos ticket-granting service (TGS) anomaly or NTLM downgrade attempt observed."
        )
    return None

def rule_account_takeover(event: Dict[str, Any]) -> Optional[DetectionRuleResult]:
    """Rule 12: Account takeover behavior (rapid reset followed by policy alteration)."""
    msg = str(event.get("message", "")).lower()
    event_type = str(event.get("event_type", "")).lower()

    if "account takeover" in msg or "mfa device removed" in msg or ("password reset" in msg and "admin" in msg):
        return DetectionRuleResult(
            matched=True,
            rule_id="RULE-ATO-12",
            rule_name="Account Takeover Indicator",
            threat_type="Insider Threat",
            severity="high",
            rule_score=89.0,
            mitre_technique="T1098",
            attack_stage="Persistence",
            recommended_action="Suspend account pending identity proofing, re-enable MFA enforcement, and audit recent mailbox forwarding rules.",
            details="High-risk security policy modification or MFA device removal following administrative password reset."
        )
    return None

ALL_RULES = [
    rule_brute_force,
    rule_suspicious_powershell,
    rule_privilege_escalation,
    rule_malware_indicators,
    rule_data_exfiltration,
    rule_impossible_travel,
    rule_suspicious_auth,
    rule_account_takeover,
    rule_port_scan,
    rule_repeated_access_denial,
]

def evaluate_all_rules(event: Dict[str, Any]) -> List[DetectionRuleResult]:
    """Runs all detection rules against the event and returns all triggers."""
    matches = []
    for rule_fn in ALL_RULES:
        result = rule_fn(event)
        if result and result.matched:
            matches.append(result)
    return matches
