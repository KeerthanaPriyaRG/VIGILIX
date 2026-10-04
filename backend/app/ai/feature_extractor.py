import re
import ipaddress
from typing import Dict, Any, List
import numpy as np

# Common high-risk ports
SENSITIVE_PORTS = {
    21: 0.6, 22: 0.7, 23: 0.9, 25: 0.5, 53: 0.4, 80: 0.3, 110: 0.5,
    135: 0.8, 139: 0.8, 443: 0.3, 445: 0.9, 1433: 0.8, 3306: 0.7,
    3389: 0.9, 5985: 0.85, 5986: 0.85, 8080: 0.4, 8443: 0.4
}

SEVERITY_MAP = {
    "info": 0.1,
    "low": 0.25,
    "medium": 0.55,
    "high": 0.85,
    "critical": 1.0
}

FEATURE_COLUMNS = [
    "failed_attempts",
    "request_frequency",
    "port_risk",
    "is_privileged_user",
    "is_external_ip",
    "severity_weight",
    "message_entropy",
    "is_off_hours",
    "command_risk_score",
    "anomaly_traffic_ratio"
]

def is_private_ip(ip_str: str) -> bool:
    if not ip_str:
        return False
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private or ip.is_loopback
    except ValueError:
        return False

def calculate_shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(list(text))]
    return -sum([p * np.log2(p) for p in prob if p > 0])

def check_privileged_user(user: str) -> float:
    if not user:
        return 0.0
    user_lower = user.lower()
    priv_keywords = ["admin", "root", "system", "superuser", "service", "svc", "backup", "dbadmin"]
    return 1.0 if any(k in user_lower for k in priv_keywords) else 0.1

def evaluate_command_risk(message: str) -> float:
    if not message:
        return 0.0
    msg = message.lower()
    high_risk_tokens = [
        "mimikatz", "powershell -enc", "invoke-expression", "iex", "wget", "curl",
        "certutil", "vssadmin delete shadows", "rundll32", "net user", "reg add",
        "chmod 777", "whoami /priv", "bash -i", "nc -e", "nmap", "sqlmap"
    ]
    for token in high_risk_tokens:
        if token in msg:
            return 1.0
    medium_risk_tokens = ["powershell", "sudo", "cmd.exe", "reg.exe", "taskkill", "psexec", "sc.exe"]
    for token in medium_risk_tokens:
        if token in msg:
            return 0.6
    return 0.0

def extract_features(event: Dict[str, Any]) -> np.ndarray:
    """
    Extract a normalized 10-dimensional numerical feature vector from a security event dict.
    """
    failed_attempts = float(event.get("failed_attempts", event.get("failed_count", 0)))
    if "fail" in str(event.get("event_type", "")).lower() or "deny" in str(event.get("action", "")).lower():
        failed_attempts = max(failed_attempts, 1.0)
    
    # Normalized failure metric (0-15+)
    norm_failed = min(failed_attempts / 10.0, 1.5)
    
    # Request frequency (requests per second / burst)
    frequency = float(event.get("frequency", event.get("rate", 1.0)))
    norm_freq = min(frequency / 20.0, 1.5)
    
    # Port risk
    port = event.get("port")
    port_risk = SENSITIVE_PORTS.get(int(port), 0.2) if port else 0.2
    
    # Privileged user
    user = event.get("user", "")
    is_priv = check_privileged_user(user)
    
    # External IP origin
    source_ip = event.get("source_ip", "")
    is_external = 0.0 if is_private_ip(source_ip) else 1.0
    
    # Severity weight
    sev_str = str(event.get("severity", "low")).lower()
    sev_weight = SEVERITY_MAP.get(sev_str, 0.25)
    
    # Message / payload entropy (high entropy indicates encoded shellcode or base64)
    raw_text = str(event.get("message", "")) + " " + str(event.get("raw_log", ""))
    entropy = calculate_shannon_entropy(raw_text)
    norm_entropy = min(entropy / 5.0, 1.0)
    
    # Time anomaly (e.g. 1 AM - 5 AM off-hours)
    is_off_hours = float(event.get("is_off_hours", 0.3))
    
    # Command & execution risk
    cmd_risk = evaluate_command_risk(raw_text)
    
    # Anomaly traffic ratio
    traffic_ratio = float(event.get("traffic_ratio", 0.2))
    
    vector = np.array([
        norm_failed,
        norm_freq,
        port_risk,
        is_priv,
        is_external,
        sev_weight,
        norm_entropy,
        is_off_hours,
        cmd_risk,
        traffic_ratio
    ], dtype=np.float32)
    
    return vector
