import time
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import requests

from app.config import settings

logger = logging.getLogger("vigilix.splunk")

# Realistic Mock Splunk Events Dataset
MOCK_SPLUNK_INDEXES = ["wineventlog", "pan_logs", "auth", "_internal", "aws:cloudtrail"]

MOCK_SPLUNK_EVENTS = [
    {
        "_time": (datetime.utcnow() - timedelta(minutes=14)).isoformat() + "Z",
        "sourcetype": "WinEventLog:Security",
        "index": "wineventlog",
        "host": "DC-NORTH-01",
        "source": "WinEventLog:Security",
        "EventCode": 4625,
        "user": "Administrator",
        "src_ip": "185.220.101.5",
        "action": "failure",
        "message": "An account failed to log on. Subject: Security ID: NULL SID, Account Name: Administrator. Failure Reason: Unknown user name or bad password.",
        "severity": "high"
    },
    {
        "_time": (datetime.utcnow() - timedelta(minutes=12)).isoformat() + "Z",
        "sourcetype": "WinEventLog:Security",
        "index": "wineventlog",
        "host": "DC-NORTH-01",
        "source": "WinEventLog:Security",
        "EventCode": 4625,
        "user": "Administrator",
        "src_ip": "185.220.101.5",
        "action": "failure",
        "message": "An account failed to log on. Failure Reason: Unknown user name or bad password. SubStatus: 0xc000006a",
        "severity": "high"
    },
    {
        "_time": (datetime.utcnow() - timedelta(minutes=10)).isoformat() + "Z",
        "sourcetype": "pan:traffic",
        "index": "pan_logs",
        "host": "PA-5220-EDGE",
        "source": "pan:traffic",
        "src_ip": "192.168.10.45",
        "dest_ip": "104.244.42.1",
        "dest_port": 443,
        "protocol": "TCP",
        "action": "allow",
        "bytes_out": 850000000,
        "message": "Palo Alto Networks traffic log: session terminated after outbound transfer exceeding 850MB to unclassified destination IP.",
        "severity": "critical"
    },
    {
        "_time": (datetime.utcnow() - timedelta(minutes=8)).isoformat() + "Z",
        "sourcetype": "WinEventLog:Microsoft-Windows-PowerShell/Operational",
        "index": "wineventlog",
        "host": "FINANCE-PC-04",
        "source": "PowerShell",
        "EventCode": 4104,
        "user": "cfo_assistant",
        "message": "Creating Scriptblock text: powershell.exe -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==",
        "severity": "critical"
    },
    {
        "_time": (datetime.utcnow() - timedelta(minutes=5)).isoformat() + "Z",
        "sourcetype": "cisco:asa",
        "index": "auth",
        "host": "VPN-CONC-01",
        "source": "Cisco ASA",
        "src_ip": "194.26.29.112",
        "user": "jsmith",
        "action": "deny",
        "message": "%ASA-6-113039: Group <RemoteVPN> User <jsmith> IP <194.26.29.112> Connection rejected: Certificate verification failed or IP blacklisted.",
        "severity": "medium"
    },
    {
        "_time": (datetime.utcnow() - timedelta(minutes=2)).isoformat() + "Z",
        "sourcetype": "suricata",
        "index": "pan_logs",
        "host": "NIDS-SENSOR-02",
        "source": "Suricata",
        "src_ip": "185.190.141.22",
        "dest_ip": "192.168.1.50",
        "dest_port": 3389,
        "protocol": "TCP",
        "action": "drop",
        "message": "ET SCAN Suspicious inbound to RDP port 3389 with invalid cookie",
        "severity": "high"
    }
]

class SplunkClient:
    def __init__(self):
        self.mode = settings.SPLUNK_MODE.lower()
        self.host = settings.SPLUNK_HOST
        self.port = settings.SPLUNK_PORT
        self.username = settings.SPLUNK_USERNAME
        self.password = settings.SPLUNK_PASSWORD
        self.token = settings.SPLUNK_TOKEN
        self.hec_url = settings.SPLUNK_HEC_URL
        self.base_url = f"https://{self.host}:{self.port}"

    def test_connection(self) -> Dict[str, Any]:
        """Tests connection to Splunk instance or simulates connection in mock mode."""
        start = time.time()
        if self.mode == "mock":
            # Simulate quick local network roundtrip
            time.sleep(0.08)
            latency = (time.time() - start) * 1000
            return {
                "success": True,
                "message": f"Splunk Mock Instance responding on {self.host}:{self.port} (Emulated v9.2.1 Enterprise)",
                "latency_ms": round(latency, 2),
                "mode": "mock",
                "server_info": {
                    "version": "9.2.1",
                    "build": "e47e0346d2f3",
                    "license": "Enterprise SOC Evaluation",
                    "active_indexes": MOCK_SPLUNK_INDEXES
                }
            }
        
        # Real Live Connection
        try:
            headers = {}
            auth = (self.username, self.password)

            resp = requests.get(
                f"{self.base_url}/services/server/info?output_mode=json",
                headers=headers,
                auth=auth,
                verify=False,
                timeout=5
            )
            latency = (time.time() - start) * 1000
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "message": f"Successfully connected to Splunk at {self.host}:{self.port}",
                    "latency_ms": round(latency, 2),
                    "mode": "live",
                    "server_info": data
                }
            else:
                return {
                    "success": False,
                    "message": f"Splunk returned HTTP {resp.status_code}: {resp.text[:100]}",
                    "latency_ms": round(latency, 2),
                    "mode": "live"
                }
        except Exception as e:
            latency = (time.time() - start) * 1000
            return {
                "success": False,
                "message": f"Failed to connect to Splunk ({self.host}:{self.port}): {str(e)}",
                "latency_ms": round(latency, 2),
                "mode": "live"
            }

    def search_events(
        self,
        query: str,
        earliest_time: str = "-24h",
        latest_time: str = "now",
        limit: int = 50
    ) -> Dict[str, Any]:
        """Runs SPL query against Splunk (or returns filtered mock events)."""
        start = time.time()
        
        if self.mode == "mock":
            # Filter mock events matching terms in query
            time.sleep(0.12) # Realistic query latency
            q_lower = query.lower()
            filtered = []
            
            for ev in MOCK_SPLUNK_EVENTS:
                ev_str = f"{ev.get('index', '')} {ev.get('sourcetype', '')} {ev.get('message', '')} {ev.get('user', '')} {ev.get('src_ip', '')}".lower()
                # If query contains search keywords or index=*
                if (not query) or (query.strip() == "*") or ("index" in q_lower and ev.get("index") in q_lower) or any(term in ev_str for term in q_lower.split() if len(term) > 2):
                    filtered.append(ev)

            # If filtered is empty and query wasn't specific, return all mock events
            results = filtered if filtered else MOCK_SPLUNK_EVENTS
            return {
                "query": query,
                "total_results": len(results),
                "execution_time_sec": round(time.time() - start, 3),
                "events": results[:limit]
            }

        # Live Splunk Search implementation
        try:
            headers = {}
            auth = (self.username, self.password)

            search_payload = {
                "search": f"search {query}" if not query.startswith("search") else query,
                "earliest_time": earliest_time,
                "latest_time": latest_time,
                "output_mode": "json",
                "count": limit,
                "exec_mode": "oneshot"
            }
            resp = requests.post(
                f"{self.base_url}/services/search/jobs",
                data=search_payload,
                headers=headers,
                auth=auth,
                verify=False,
                timeout=15
            )
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                return {
                    "query": query,
                    "total_results": len(results),
                    "execution_time_sec": round(time.time() - start, 3),
                    "events": results
                }
            else:
                return {
                    "query": query,
                    "total_results": 0,
                    "execution_time_sec": round(time.time() - start, 3),
                    "events": [],
                    "error": f"Splunk HTTP {resp.status_code}: {resp.text[:150]}"
                }
        except Exception as e:
            return {
                "query": query,
                "total_results": 0,
                "execution_time_sec": round(time.time() - start, 3),
                "events": [],
                "error": str(e)
            }

    def send_hec_event(self, event: Dict[str, Any], sourcetype: str = "vigilix:alert", index: str = "main") -> Dict[str, Any]:
        """Sends security alert/log to Splunk HTTP Event Collector."""
        if self.mode == "mock":
            ack_id = f"MOCK-ACK-{uuid.uuid4().hex[:8].upper()}"
            return {
                "success": True,
                "message": "Event received by Splunk Mock HEC receiver.",
                "hec_ack_id": ack_id
            }

        try:
            headers = {
                "Authorization": f"Splunk {self.token}",
                "Content-Type": "application/json"
            }
            payload = {
                "time": time.time(),
                "sourcetype": sourcetype,
                "index": index,
                "event": event
            }
            resp = requests.post(self.hec_url, json=payload, headers=headers, verify=False, timeout=5)
            if resp.status_code == 200:
                return {
                    "success": True,
                    "message": "Event successfully posted to Splunk HEC.",
                    "hec_ack_id": resp.json().get("ackId", "ACK-OK")
                }
            else:
                return {
                    "success": False,
                    "message": f"Splunk HEC returned HTTP {resp.status_code}: {resp.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error posting to Splunk HEC: {str(e)}"
            }

splunk_client = SplunkClient()
