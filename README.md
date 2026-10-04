# VIGILIX
### Intelligent Security Monitoring and Threat Response Platform

![VIGILIX Architecture](https://img.shields.io/badge/Security-SOC%2FSIEM-cyan?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Design-Tailwind%20Dark%20SOC-38B2AC?style=for-the-badge&logo=tailwind-css)
![scikit-learn](https://img.shields.io/badge/AI%2FML-Random%20Forest%20%2B%20Isolation%20Forest-F7931E?style=for-the-badge&logo=scikit-learn)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20SQLAlchemy-336791?style=for-the-badge&logo=postgresql)

---

## 1. Overview & Vision

**VIGILIX** is a full-stack, enterprise-grade Security Operations Center (SOC) intelligence and Security Information and Event Management (SIEM) platform. It provides an intelligent, automated reasoning and response layer on top of raw enterprise security telemetry.

Unlike traditional SIEM dashboards that function merely as search indexes or CRUD logs, VIGILIX:
1. **Ingests & Normalizes** events across Firewalls, Active Directory, Endpoint Detection & Response (EDR), Web Application Firewalls (WAF), and Splunk.
2. **Detects Suspicious Activity** via a hybrid engine combining rule-based heuristics and behavioral statistical aggregations.
3. **Applies Offline Explainable AI** using Random Forest multi-class threat classifiers and Isolation Forest anomaly detectors.
4. **Calculates Transparent Threat Confidence** using an adaptive formula that decomposes AI probability, anomaly scores, rule strength, and correlation.
5. **Generates Threat DNA**: Compact, standardized fingerprints encapsulating attack vectors, MITRE ATT&CK techniques, behavior, and persistence indicators.
6. **Orchestrates Incident Response**: Manages full SOC lifecycles (*Detected → Investigating → Contained → Eradicated → Resolved*) with automated SOAR playbooks.
7. **Computes a 100% Algorithmic Security Maturity Score**: A 10-domain mathematical score ($0 - 100$) evaluated directly from live database state.
8. **Offers Safe Defensive Attack Simulations**: 6 pre-built scenarios that exercise the full end-to-end detection, AI scoring, and response pipeline.
9. **Integrates with Splunk**: Bi-directional telemetry integration supporting live REST/HEC connections and realistic Mock Splunk mode.

---

## 2. Architecture & Data Flow

```
                ┌──────────────────────────────────────────────┐
                │          Security Telemetry Sources          │
                │ (Syslog, Auth, EDR, Firewall, Splunk HEC)    │
                └──────────────────────┬───────────────────────┘
                                       │
                             ┌─────────▼─────────┐
                             │ Log Ingestion API │
                             │  POST /api/logs   │
                             └─────────┬─────────┘
                                       │
                             ┌─────────▼─────────┐
                             │ Log Normalization │
                             └─────────┬─────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │       Hybrid Detection Engine       │
                    │ Rules + Statistical Aggregations    │
                    └──────────────────┬──────────────────┘
                                       │
                             ┌─────────▼─────────┐
                             │ AI Threat Scoring │
                             │ Random Forest &   │
                             │ Isolation Forest  │
                             └─────────┬─────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │      Threat Confidence Engine       │
                    │  AI + Anomaly + Rule + Correlation  │
                    └──────────────────┬──────────────────┘
                                       │
                             ┌─────────▼─────────┐
                             │    Threat DNA     │
                             │ Compact Signature │
                             └─────────┬─────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │    Incident Correlation & SOAR      │
                    │     Automated Playbook Engine       │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │   Algorithmic Maturity Engine       │
                    │   (10 Operational Categories)       │
                    └──────────────────┬──────────────────┘
                                       │
                             ┌─────────▼─────────┐
                             │ Modern Dark SOC   │
                             │ React 18 UI       │
                             └───────────────────┘
```

---

## 3. Technology Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, Passlib / Native Bcrypt, Python-JOSE.
- **Database**: PostgreSQL (Primary) with automated SQLite graceful fallback (`sqlite:///./vigilix.db`) for zero-friction local setup.
- **Machine Learning**: `scikit-learn`, `numpy`, `pandas`, `joblib`.
  - *Threat Classifier*: `RandomForestClassifier` (100 estimators, max depth 12, balanced weights).
  - *Anomaly Detector*: `IsolationForest` (100 estimators, contamination 0.10).
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React icons, Recharts, Axios, React Router 6.
- **SIEM Integration**: Splunk REST API (`/services/search/jobs`), Splunk HTTP Event Collector (`/services/collector`), Mock Splunk Server.
- **Deployment**: Docker, Docker Compose, Multi-stage builds, Nginx.

---

## 4. Project Structure

```
vigilix/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & lifespan events
│   │   ├── config.py                # Pydantic Settings & environment config
│   │   ├── database.py              # Database engine & fallback sessionmaker
│   │   ├── models/                  # SQLAlchemy relational models
│   │   │   ├── user.py              # SOC analyst authentication & roles
│   │   │   ├── log.py               # Normalized SecurityLog model
│   │   │   ├── threat.py            # Threat & Confidence decomposition
│   │   │   ├── incident.py          # Incident lifecycle & timeline
│   │   │   ├── playbook.py          # Playbook catalog & execution records
│   │   │   ├── maturity.py          # Security maturity records
│   │   │   ├── simulation.py        # Attack simulation records
│   │   │   └── splunk.py            # Splunk configs & sync logs
│   │   ├── schemas/                 # Pydantic validation & serialization
│   │   ├── ai/                      # Machine learning pipeline
│   │   │   ├── feature_extractor.py # 10-dimensional event feature vectors
│   │   │   ├── model_trainer.py     # Synthetic dataset generator & model trainer
│   │   │   ├── inference.py         # Multi-model prediction & explainability
│   │   │   ├── adaptive_confidence.py # Transparent Threat Confidence engine
│   │   │   └── threat_dna.py        # Threat DNA fingerprint generator
│   │   ├── detection/
│   │   │   ├── rules.py             # 12+ concrete SOC detection rules
│   │   │   └── engine.py            # Unified hybrid detection engine
│   │   ├── algorithms/
│   │   │   └── maturity_engine.py   # Algorithmic Security Maturity Engine
│   │   ├── playbooks/
│   │   │   └── engine.py            # 7 SOAR playbooks & simulation runner
│   │   ├── integrations/
│   │   │   └── splunk.py            # Splunk REST API / HEC client & mock mode
│   │   └── routers/                 # REST API endpoints
│   │       ├── auth.py              # Authentication
│   │       ├── logs.py              # Log ingestion & analysis
│   │       ├── threats.py           # Threat intelligence & detail
│   │       ├── incidents.py         # Incident lifecycle & actions
│   │       ├── playbooks.py         # Playbook catalog & execution
│   │       ├── ai.py                # AI model status & on-demand scoring
│   │       ├── maturity.py          # Dynamic security maturity
│   │       ├── simulations.py       # Attack simulation scenarios
│   │       ├── splunk.py            # Splunk sync, search, and import
│   │       └── dashboard.py         # SOC executive intelligence summary
│   ├── database/
│   │   └── seed/seed_data.py        # 130+ logs, 24 threats, 12 incidents
│   ├── ml/
│   │   └── models/                  # Trained .joblib models
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # MetricCard, SeverityBadge, ConfidenceGauge, Modal
│   │   │   ├── layout/              # Navbar, Sidebar, AppLayout
│   │   │   ├── threats/             # ThreatDNA, AIExplanationCard
│   │   │   ├── incidents/           # IncidentTimeline
│   │   │   ├── maturity/            # MaturityGauge
│   │   │   ├── playbooks/           # PlaybookExecutionModal
│   │   │   └── simulation/          # PipelineProgress
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Top KPI metrics & distribution charts
│   │   │   ├── LogsPage.jsx         # Multi-filter log explorer & analysis
│   │   │   ├── ThreatsPage.jsx      # Active threats & DNA inspection
│   │   │   ├── IncidentsPage.jsx    # Incident response lifecycle board
│   │   │   ├── ThreatIntelligencePage.jsx # MITRE ATT&CK taxonomy & IOCs
│   │   │   ├── PlaybooksPage.jsx    # Automated SOAR playbook catalog
│   │   │   ├── SecurityMaturityPage.jsx # 10-domain scorecard & radar
│   │   │   ├── AttackSimulationPage.jsx # 6 defensive attack scenarios
│   │   │   ├── SplunkIntegrationPage.jsx # Splunk query, import & HEC
│   │   │   └── SettingsPage.jsx     # Thresholds, AI weights & diagnostics
│   │   ├── services/api.js          # Unified Axios client
│   │   ├── context/NotificationContext.jsx # Cyber toast notifications
│   │   ├── App.jsx                  # React Router mapping
│   │   ├── main.jsx                 # DOM Mount
│   │   └── index.css                # Tailwind cyber theme
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── README.md
```

---

## 5. Mathematical & Algorithmic Logic

### A. Threat Confidence Score
The Threat Confidence score ($0 - 100\%$) is derived from a transparent, defensible formula rather than an arbitrary number:

$$\text{Confidence}_{\text{Base}} = \Big(0.35 \times P_{\text{ML Malicious}} + 0.20 \times \text{Anomaly Score} + 0.30 \times \text{Rule Match Strength} + 0.15 \times \text{Correlation Score}\Big)$$

$$\text{Confidence}_{\text{Final}} = \min\Big(100.0, \, \max\big(0.0, \, \text{Confidence}_{\text{Base}} \times \text{Adaptive Modifier}\big)\Big)$$

Where:
- $P_{\text{ML Malicious}}$: Random Forest probability of the event being malicious ($0 - 100$).
- $\text{Anomaly Score}$: Isolation Forest behavioral deviation from normal baseline ($0 - 100$).
- $\text{Rule Match Strength}$: Quantitative heuristic score from matched SOC detection rules ($0 - 100$).
- $\text{Correlation Score}$: Evaluates multi-source indicators, target privilege levels, and burst rates.
- $\text{Adaptive Modifier}$: Historically tuned trust factor based on True Positive vs False Positive resolution ratios for the given threat category ($0.85$ to $1.15$).

### B. Security Maturity Score (0 - 100)
**Security Maturity does NOT use AI.** It is a strictly deterministic, mathematical score calculated directly from database records evaluating 10 key security categories where each contributes up to **10.0 points**, totaling **exactly 100.0 points**:

$$\text{Maturity Score} = \sum_{i=1}^{10} \text{Category Score}_i \in [0.0, \, 100.0]$$

| # | Domain | Max Points | Evaluation Metric Basis |
|---|---|---|---|
| 1 | **Threat Detection Capability** | 10 pts | Active detection rule coverage, MITRE technique breadth, and detection diversity |
| 2 | **Incident Response Readiness** | 10 pts | Playbook availability, assigned responders, and containment capability |
| 3 | **Log Visibility & Diversity** | 10 pts | Telemetry diversity (Auth, EDR, Network, Cloud, Web) & ingestion volume |
| 4 | **Monitoring Coverage** | 10 pts | Ratio of monitored assets and services vs active threat vectors |
| 5 | **Access Control & Auth** | 10 pts | Failed auth ratio, brute-force mitigation rate, MFA enforcement telemetry |
| 6 | **Security Automation** | 10 pts | Automated playbook execution rate and automated containment speed |
| 7 | **Threat Intelligence** | 10 pts | IOC indicator matches, external feed integration, and reputation scoring |
| 8 | **Response Efficiency (MTTR)** | 10 pts | Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR) performance |
| 9 | **Security Resilience** | 10 pts | True positive vs false positive handling and eradication rate |
| 10 | **Exposure Management** | 10 pts | Uncontained critical incidents count and lingering exposure penalties |
| **Total** | **All 10 Categories** | **100 pts** | **Strict Normalized 0 - 100 Scale** |

**Maturity Levels:**
- **0–20**: *Initial* (Ad-hoc, reactive)
- **21–40**: *Developing* (Basic logging & manual triage)
- **41–60**: *Defined* (Standardized rules & procedures)
- **61–80**: *Managed* (Automated workflows & metrics-driven)
- **81–100**: *Optimized* (Continuous adaptation & proactive defense)

---

## 6. Installation & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js 24)
- **npm** (or yarn/pnpm)
- *Optional*: PostgreSQL 14+ (If PostgreSQL credentials are not provided or PostgreSQL is stopped, VIGILIX automatically falls back to local SQLite without crashing).

---

### Step 1: Backend Setup

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Environment Variables (`.env`):
   A pre-configured `.env` is already created. To use PostgreSQL, configure `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vigilix
   SPLUNK_MODE=mock
   SECRET_KEY=vigilix-super-secure-soc-siem-secret-key-2026-xyz789
   ```

5. Train ML Models & Seed Database:
   ```bash
   python -c "from app.ai.model_trainer import train_or_load_models; from database.seed.seed_data import seed_database; train_or_load_models(); seed_database()"
   ```

6. Start FastAPI Backend:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Server: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`
   - Alternative ReDoc: `http://localhost:8000/redoc`

---

### Step 2: Frontend Setup

1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite Development Server:
   ```bash
   npm run dev
   ```
   - Access the platform in your browser at: **`http://localhost:5173`**

---

### Step 3 (Optional): Docker Deployment

To run the entire stack with PostgreSQL, Backend, and Frontend containers:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 7. Complete Demonstration Flow

To demonstrate the full end-to-end capabilities of VIGILIX for evaluators, project reviews, or portfolio presentations:

1. **Open Dashboard (`http://localhost:5173`)**:
   - Inspect the top 8 KPI metric cards, Security Maturity score ($78.2 / 100$), Threat distribution charts, and live security telemetry stream.
2. **Navigate to Attack Simulation (`/simulation`)**:
   - Select the **"Distributed Brute Force & Password Spray"** scenario.
   - Click **Run Attack Simulation**.
   - Watch the live visual pipeline advance through:
     $$\text{Scenario Trigger} \to \text{Telemetry Ingestion} \to \text{Rules Fired} \to \text{AI Threat Scoring} \to \text{Threat DNA} \to \text{Incident Created} \to \text{Playbook Ready}$$
3. **Inspect the Result**:
   - Notice the generated **Threat DNA Fingerprint** (`VIGILIX-DNA::BRU-T1110.001-94`).
   - Notice the AI Threat Confidence score decomposed into ML probability, anomaly score, rule match, and correlation.
   - Notice the automatically declared Incident in the `Investigating` state.
4. **Execute the Recommended Playbook**:
   - Click **Execute Playbook: PB-BRUTE-01**.
   - Watch the automated SOAR execution run through all 6 phases (*Trigger $\to$ Investigation $\to$ Containment $\to$ Eradication $\to$ Recovery $\to$ Closure*).
   - The incident automatically transitions:
     $$\text{Investigating} \to \text{Contained} \to \text{Eradicated} \to \text{Resolved}$$
5. **Inspect Live Updates**:
   - Open **Active Threats (`/threats`)** to inspect the active and mitigated threat board.
   - Open **Logs Management (`/logs`)** to see the 12 synthetic brute force logs that were ingested.
   - Open **Security Maturity (`/maturity`)** to observe the updated score reflecting the mitigated threat posture.
6. **Explore Splunk Integration (`/splunk`)**:
   - Click **Test Connection** to verify connection to the Splunk connector.
   - Click **Search Splunk** with preset SPL `index=wineventlog EventCode=4625`.
   - Click **Import Events into VIGILIX Pipeline** to ingest events directly from Splunk into the VIGILIX detection engine.

---

## 8. API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Platform status and metadata |
| `GET` | `/api/health` | System health check (DB dialect, Splunk status, AI state) |
| `GET` | `/api/dashboard/summary` | Executive SOC dashboard metrics and chart series |
| `GET` | `/api/logs` | Query, filter, sort, and paginate normalized security logs |
| `POST` | `/api/logs` | Ingest new security log (automatically analyzed) |
| `POST` | `/api/logs/analyze` | On-demand rule & AI threat analysis on raw payload |
| `GET` | `/api/threats` | List active threats with AI confidence and filters |
| `GET` | `/api/threats/{id}` | Full threat profile with Threat DNA and explainability |
| `PATCH`| `/api/threats/{id}/status` | Update threat lifecycle status |
| `GET` | `/api/incidents` | List incidents with lifecycle filtering |
| `POST` | `/api/incidents` | Declare new security incident |
| `PATCH`| `/api/incidents/{id}` | Update incident lifecycle state, assignee, notes |
| `POST` | `/api/incidents/{id}/actions` | Execute or log response containment action |
| `GET` | `/api/playbooks` | Catalog of 7 standard SOAR playbooks |
| `POST` | `/api/playbooks/{id}/execute` | Execute playbook through 6 phases in simulation mode |
| `GET` | `/api/maturity` | Compute dynamic 10-domain Security Maturity Score (0-100) |
| `GET` | `/api/maturity/history` | Historical maturity evaluation trend records |
| `GET` | `/api/simulations/scenarios` | List 6 available defensive attack scenarios |
| `POST` | `/api/simulations/run` | Execute attack simulation through complete SIEM pipeline |
| `GET` | `/api/splunk/status` | Splunk connection status and server metadata |
| `POST` | `/api/splunk/test` | Test connection to Splunk instance |
| `POST` | `/api/splunk/search` | Execute SPL search query |
| `POST` | `/api/splunk/import` | Import Splunk events into VIGILIX detection engine |
| `POST` | `/api/splunk/send` | Send security alert to Splunk HTTP Event Collector |

---

## 9. Default Credentials (Demo Mode)

- **SOC Administrator**: `admin` / `admin123`
- **Lead SOC Analyst**: `analyst` / `analyst123`

---

## 10. License
Academic and Portfolio License - Built for advanced cybersecurity monitoring, research, and defensive threat response.
