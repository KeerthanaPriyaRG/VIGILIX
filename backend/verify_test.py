import sys
sys.path.insert(0, '.')
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("========================================")
    print("VIGILIX END-TO-END VERIFICATION TEST SUITE")
    print("========================================")

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print(f"[PASS] Health Check: {health['status']} (DB: {health['database_dialect']}, Splunk: {health['splunk_mode']})")

    # 2. Dashboard Summary
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200, f"Dashboard summary failed: {res.text}"
    dash = res.json()
    metrics = dash["metrics"]
    print(f"[PASS] Dashboard Metrics: Maturity={metrics['security_maturity_score']}/100 ({metrics['maturity_level']}), Threats={metrics['threats_detected']}, Logs={metrics['events_analyzed']}")

    # 3. Security Maturity Score
    res = client.get("/api/maturity")
    assert res.status_code == 200, f"Maturity endpoint failed: {res.text}"
    maturity = res.json()
    assert 0 <= maturity["overall_score"] <= 100, "Maturity score out of 0-100 range!"
    assert len(maturity["category_details"]) == 10, f"Expected 10 categories, got {len(maturity['category_details'])}"
    print(f"[PASS] Security Maturity: {maturity['overall_score']:.1f}/100 across 10 distinct categories. Level: {maturity['level']}")

    # 4. Logs Endpoint
    res = client.get("/api/logs?limit=5")
    assert res.status_code == 200, f"Logs failed: {res.text}"
    logs = res.json()
    assert len(logs) > 0, "No logs returned!"
    print(f"[PASS] Logs Ingestion & Retrieval: Retrieved {len(logs)} logs. First event: '{logs[0]['event_type']}' ({logs[0]['source']})")

    # 5. Log Analysis
    sample_attack_log = {
        "event_type": "Failed Login",
        "failed_attempts": 18,
        "source_ip": "185.220.101.44",
        "user": "Administrator",
        "hostname": "DC-NORTH-01",
        "message": "18 failed Kerberos logons within 60 seconds",
        "severity": "high"
    }
    res = client.post("/api/logs/analyze", json=sample_attack_log)
    assert res.status_code == 200, f"Log analysis failed: {res.text}"
    analysis = res.json()
    assert analysis["is_threat"] is True, "Detection engine failed to detect attack!"
    print(f"[PASS] Threat Detection Engine: Classified '{analysis['threat_type']}' with AI Confidence {analysis['confidence_score']:.1f}%")
    print(f"  Threat DNA Signature: {analysis['threat_dna']['dna_signature']}")

    # 6. Active Threats
    res = client.get("/api/threats?limit=5")
    assert res.status_code == 200, f"Threats failed: {res.text}"
    threats = res.json()
    assert len(threats) > 0, "No threats returned!"
    print(f"[PASS] Active Threats Board: {len(threats)} sample threats loaded. Top: {threats[0]['threat_id']} ({threats[0]['threat_type']})")

    # 7. Incident Lifecycle
    res = client.get("/api/incidents?limit=5")
    assert res.status_code == 200, f"Incidents failed: {res.text}"
    incidents = res.json()
    assert len(incidents) > 0, "No incidents returned!"
    inc_id = incidents[0]["incident_id"]
    print(f"[PASS] Incident Response: Found {len(incidents)} incidents. Testing lifecycle update on {inc_id}...")

    res = client.patch(f"/api/incidents/{inc_id}", json={"status": "Contained"})
    assert res.status_code == 200
    assert res.json()["status"] == "Contained"
    print(f"[PASS] Incident Lifecycle Transition: {inc_id} successfully updated to 'Contained'")

    # 8. Playbook Execution
    res = client.post("/api/playbooks/PB-BRUTE-01/execute", json={"incident_id": inc_id, "simulation_mode": True})
    assert res.status_code == 200, f"Playbook execution failed: {res.text}"
    exec_res = res.json()
    assert exec_res["execution_status"] == "Completed"
    print(f"[PASS] Automated SOAR Playbook: Executed PB-BRUTE-01 ({exec_res['completed_steps']}/{exec_res['total_steps']} steps completed)")

    # 9. Attack Simulation
    print("Testing End-to-End Defensive Attack Simulation...")
    sim_payload = {"scenario_id": "brute-force", "target_asset": "DC-NORTH-01"}
    res = client.post("/api/simulations/run", json=sim_payload)
    assert res.status_code == 200, f"Attack simulation failed: {res.text}"
    sim_res = res.json()
    print(f"[PASS] Attack Simulation Pipeline: Emulated '{sim_res['scenario_name']}'. Generated {sim_res['events_generated']} logs -> Threat Detected -> Incident '{sim_res['incident_created']['incident_id']}' opened -> Recommended Playbook: {sim_res['recommended_playbook']['playbook_id']}")

    # 10. Splunk Integration
    test_conn = client.post("/api/splunk/test", json={})
    assert test_conn.status_code == 200
    print(f"[PASS] Splunk Connection Test: {test_conn.json()['message']}")

    search_res = client.post("/api/splunk/search", json={"query": "index=wineventlog EventCode=4625", "limit": 5})
    assert search_res.status_code == 200
    print(f"[PASS] Splunk SPL Search: Retrieved {len(search_res.json()['events'])} events in {search_res.json()['execution_time_sec']}s")

    import_res = client.post("/api/splunk/import", json={"events": search_res.json()["events"][:2], "run_detection": True})
    assert import_res.status_code == 200
    print(f"[PASS] Splunk Event Ingestion: {import_res.json()['message']}")

    # 11. Authentication & Zero-Trust Token Verification
    # 11a: Valid Admin Login
    admin_auth = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert admin_auth.status_code == 200, f"Admin login failed: {admin_auth.text}"
    admin_token = admin_auth.json()["access_token"]
    print(f"[PASS] Authentication: Successfully authenticated operator '{admin_auth.json()['user']['username']}' (Role: {admin_auth.json()['user']['role']})")

    # 11b: Valid Analyst Login
    analyst_auth = client.post("/api/auth/login", json={"username": "analyst@vigilix.internal", "password": "analyst123"})
    assert analyst_auth.status_code == 200, f"Analyst login failed: {analyst_auth.text}"
    print(f"[PASS] Authentication: Validated analyst login via email '{analyst_auth.json()['user']['email']}'")

    # 11c: Reject Invalid Password
    bad_auth = client.post("/api/auth/login", json={"username": "admin", "password": "invalid_password_xyz"})
    assert bad_auth.status_code == 401, f"Expected 401 for bad password, got {bad_auth.status_code}"
    print(f"[PASS] Authentication Security: Rejected invalid password with HTTP 401 Unauthorized")

    # 11d: Token Session Validation (/me)
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me_res.status_code == 200 and me_res.json()["username"] == "admin"
    print(f"[PASS] Token Verification: Bearer token successfully verified for '{me_res.json()['username']}'")

    # 11e: Reject Unauthenticated /me
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401
    print(f"[PASS] Access Control: Unauthenticated session properly blocked with HTTP 401")

    print("========================================")
    print("ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    run_tests()
