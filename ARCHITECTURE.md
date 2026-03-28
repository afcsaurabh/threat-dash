# threat-dash — Architecture Design
**Status**: Draft v1.0
**Date**: 2026-03-27
**Resolves**: OQ-01 through OQ-04 from REQUIREMENTS.md

---

## 1. Tech Stack Decisions

### OQ-01 + OQ-02 — Frontend + Backend

**Two viable paths. One recommendation.**

| | Option A: Streamlit | Option B: FastAPI + React |
|---|---|---|
| Language | 100% Python | Python backend + JavaScript frontend |
| Learning curve | Low — you write Python, it renders as a web app | Higher — two separate codebases, React concepts |
| UI quality | Functional but templated — looks like a Streamlit app | Professional, customizable — looks like a real product |
| Portfolio signal | "Built a tool" | "Built an application" |
| Deployment | Streamlit Community Cloud (free, 1-click) | Docker + Render/Railway (free tier) |
| API handling | Python async works, but Streamlit re-runs entire app on interaction | FastAPI handles concurrent requests cleanly |
| Hiring signal | Adequate | Stronger — shows you can operate across a full stack |

**DECISION: Option B — FastAPI + React**

Rationale: The portfolio goal requires this to look like something a team built, not a script with a UI. React with Tailwind CSS produces a professional dark-mode dashboard that reads as a real product. The Python backend stays in your primary skill domain — React is the new layer, but it's learnable incrementally alongside the Python work, and we'll build it spec-first so you always have a clear target.

**If React becomes a blocker at any point**, Streamlit is a valid fallback for Phase 1 — the backend Python code is identical and reusable.

---

### OQ-03 — Persistence Layer

**Decision: SQLite** (via Python's built-in `sqlite3`, no ORM needed initially)

Rationale:
- Feed data (Phase 2) is structured and benefits from queryable tables — flat JSON makes filtering slow and messy
- IOC history, tags, reports, and actor annotations all have relationships that JSON can't express cleanly
- SQLite is a single file, zero-config, ships with Python — no external database to manage locally or on deployment
- Upgrade path to PostgreSQL (for Render hosted DB) is straightforward when needed

---

### OQ-04 — Demo Mode for Deployment

**Decision: `DEMO_MODE` environment variable + cached sample dataset**

When `DEMO_MODE=true`:
- API calls to VirusTotal, AbuseIPDB, GreyNoise are intercepted and return pre-cached sample responses stored in `demo/fixtures/`
- Feed monitor displays a static snapshot of abuse.ch data (refreshed manually by the developer)
- ATT&CK data loads from a bundled JSON file instead of live TAXII query
- A visible banner reads: "Demo Mode — showing sample data. Deploy locally with your own API keys for live data."
- No API keys are required or exposed in the deployed instance

This lets the live URL be fully functional for portfolio purposes without key exposure.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                           │
│                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│   │   IOC    │  │   Feed   │  │  Actor   │  │Reports│  │
│   │Enrichment│  │ Monitor  │  │Explorer  │  │  Gen  │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘  │
│        │             │             │             │       │
│        └─────────────┴─────────────┴─────────────┘       │
│                           │                              │
│                    React Frontend                        │
│                   (Tailwind CSS)                         │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP (REST)
                            │
┌───────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend                        │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  /api/enrich│  │ /api/feeds   │  │  /api/actors   │  │
│  │  (Phase 1)  │  │  (Phase 2)   │  │  (Phase 3)     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                  │            │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌───────▼────────┐  │
│  │  Enrichment │  │  Feed        │  │  ATT&CK        │  │
│  │  Service    │  │  Ingestion   │  │  Service       │  │
│  │  (async)    │  │  Service     │  │  (python-stix2)│  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                  │            │
│  ┌──────▼────────────────▼──────────────────▼────────┐   │
│  │                  /api/reports                      │   │
│  │           Report Generation Service               │   │
│  │           (Claude API integration)                │   │
│  └──────────────────────┬────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼────────────────────────────┐   │
│  │                SQLite Database                     │   │
│  │  tables: ioc_history, ioc_tags, feed_cache,        │   │
│  │          actor_notes, reports                      │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼──────┐  ┌────────▼──────┐  ┌────────▼──────┐
│  VirusTotal   │  │  abuse.ch     │  │  MITRE ATT&CK  │
│  AbuseIPDB    │  │  ThreatFox    │  │  TAXII Server  │
│  GreyNoise    │  │  URLhaus      │  │  (python-stix2)│
│  (Phase 1)    │  │  Feodo Track  │  │  (Phase 3)     │
└───────────────┘  └───────────────┘  └────────────────┘
                            │
                   ┌────────▼──────┐
                   │  Claude API   │
                   │  (Phase 4)    │
                   │  Exec Summary │
                   └───────────────┘
```

---

## 3. Project Structure

```
threat-dash/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Settings (env vars, API keys)
│   ├── database.py                # SQLite connection + table init
│   ├── services/
│   │   ├── enrichment.py          # VirusTotal + AbuseIPDB + GreyNoise (async)
│   │   ├── feeds.py               # abuse.ch feed ingestion + normalization
│   │   ├── attck.py               # MITRE ATT&CK TAXII queries via python-stix2
│   │   └── reports.py             # Claude API integration + report assembly
│   └── routers/
│       ├── enrich.py              # POST /api/enrich
│       ├── feeds.py               # GET /api/feeds
│       ├── actors.py              # GET /api/actors, GET /api/actors/{id}
│       └── reports.py             # POST /api/reports, GET /api/reports
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component + routing
│   │   ├── pages/
│   │   │   ├── Enrich.jsx         # Phase 1: IOC Enrichment view
│   │   │   ├── Feeds.jsx          # Phase 2: Live Feed Monitor view
│   │   │   ├── Actors.jsx         # Phase 3: Threat Actor Explorer view
│   │   │   └── Reports.jsx        # Phase 4: Intelligence Report Generator
│   │   └── components/
│   │       ├── RiskBadge.jsx      # Low/Medium/High/Critical pill
│   │       ├── IocTable.jsx       # Reusable IOC table with filter/sort
│   │       ├── ActorProfile.jsx   # ATT&CK TTP matrix component
│   │       └── ReportEditor.jsx   # In-browser report assembly + export
│   ├── index.html
│   └── package.json
├── demo/
│   └── fixtures/                  # Cached sample API responses for DEMO_MODE
├── .env.example                   # API key template (committed)
├── .env                           # API keys (gitignored)
├── docker-compose.yml             # Local dev: backend + frontend
├── Dockerfile                     # Production build (backend serves built frontend)
├── REQUIREMENTS.md
├── ARCHITECTURE.md                # This file
├── SPEC.md                        # Per-phase spec (written before each phase)
├── DECISIONS.md                   # Running log of reasoning trail
└── .gitignore
```

---

## 4. API Contracts (Summary)

### Phase 1 — Enrichment
```
POST /api/enrich
Body: { "iocs": ["1.2.3.4", "malware.com", "abc123hash"] }
Response: [{ "ioc": "1.2.3.4", "type": "ip", "risk": "High",
             "sources": { "virustotal": {...}, "abuseipdb": {...}, "greynoise": {...} } }]

GET  /api/enrich/history
GET  /api/enrich/history/{ioc}
POST /api/enrich/{ioc}/tag       Body: { "tag": "investigating" }
```

### Phase 2 — Feeds
```
GET  /api/feeds?type=ip&source=threatfox&since=2026-03-20&confidence=75
POST /api/feeds/refresh           Triggers manual feed pull
GET  /api/feeds/stats
```

### Phase 3 — Actors
```
GET  /api/actors                  List all ATT&CK Groups
GET  /api/actors/{id}             Full actor profile + TTPs
GET  /api/actors/{id}/navigator   ATT&CK Navigator layer JSON export
POST /api/actors/{id}/notes       Save analyst notes locally
```

### Phase 4 — Reports
```
POST /api/reports                 Create new report (from iocs / actor_id / blank)
GET  /api/reports                 List saved reports
GET  /api/reports/{id}
PUT  /api/reports/{id}            Save edits
GET  /api/reports/{id}/export     Returns Markdown file
POST /api/reports/{id}/generate   Calls Claude API → drafts Executive Summary
```

---

## 5. Data Model (SQLite Tables)

```sql
-- IOC lookup history
CREATE TABLE ioc_history (
    id INTEGER PRIMARY KEY,
    ioc TEXT NOT NULL,
    ioc_type TEXT,              -- 'ip', 'domain', 'hash'
    risk_rating TEXT,           -- 'Low', 'Medium', 'High', 'Critical'
    vt_result JSON,
    abuseipdb_result JSON,
    greynoise_result JSON,
    queried_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-applied tags on IOCs
CREATE TABLE ioc_tags (
    id INTEGER PRIMARY KEY,
    ioc TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingested feed IOCs (deduped by ioc + source)
CREATE TABLE feed_cache (
    id INTEGER PRIMARY KEY,
    ioc TEXT NOT NULL,
    ioc_type TEXT,
    source TEXT,                -- 'threatfox', 'urlhaus', 'feodo'
    confidence INTEGER,
    first_seen TIMESTAMP,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ioc, source)
);

-- User notes on ATT&CK actors
CREATE TABLE actor_notes (
    id INTEGER PRIMARY KEY,
    actor_id TEXT NOT NULL,     -- MITRE ATT&CK Group ID (e.g., 'G0007')
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved intelligence reports
CREATE TABLE reports (
    id INTEGER PRIMARY KEY,
    title TEXT,
    actor_id TEXT,
    exec_summary TEXT,          -- Claude API output (editable)
    actor_profile TEXT,
    ttps_json JSON,
    iocs_json JSON,
    mitigations TEXT,
    analyst_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Deployment Architecture

```
Local Development:
  docker-compose up
    → backend: FastAPI on :8000
    → frontend: Vite dev server on :5173 (proxies /api → :8000)
    → .env: real API keys

Production (Render.com free tier):
  Single Docker container
    → FastAPI serves the built React app as static files (/static)
    → FastAPI handles all /api routes
    → SQLite file persists at /data/threat-dash.db (Render disk mount)
    → DEMO_MODE=true (no API keys needed in production)
    → Real API keys only in local .env
```

**Why single container for production**: Render free tier supports one service. Serving the React build as static files from FastAPI eliminates the need for a separate static host.

---

## 7. Claude API Integration Design (Phase 4)

The Executive Summary generation flow:

```
1. User clicks "Generate Executive Summary" in ReportEditor
2. Frontend → POST /api/reports/{id}/generate
3. Backend assembles prompt:
   - Enriched IOC list with risk ratings (from ioc_history)
   - Actor name, motivation, capability (from ATT&CK data)
   - Top 5 TTPs by tactic (from report ttps_json)
   - Recommended mitigations
4. Backend calls Claude API:
   model: claude-sonnet-4-6
   system: "You are a CTI analyst writing for a non-technical executive audience."
   user: [assembled context prompt]
   max_tokens: 200
5. Response streamed back to frontend
6. User reviews and edits in ReportEditor before saving
7. Final report exports with user-edited version
```

API key: `ANTHROPIC_API_KEY` in `.env` — not exposed in `DEMO_MODE`.

---

## 8. Open Questions — Resolved

| # | Question | Decision |
|---|---|---|
| OQ-01 | Frontend framework | **React + Tailwind CSS** |
| OQ-02 | Python backend | **FastAPI** |
| OQ-03 | Persistence layer | **SQLite** (built-in, zero-config) |
| OQ-04 | Demo mode | **`DEMO_MODE=true` env var** — cached fixtures, no API keys |
| OQ-05 | AI-assisted reporting | **Claude API (claude-sonnet-4-6)** — drafts Executive Summary from structured session data |

---

## 9. Phase Build Order

| Phase | What Gets Built | New Dependencies |
|---|---|---|
| 0: Scaffold | Project structure, FastAPI skeleton, React app shell, SQLite init, Docker setup, .env.example | fastapi, uvicorn, httpx, react, tailwindcss |
| 1: Enrich | Enrichment service, /api/enrich routes, IOC input UI, results panel, risk scoring, history | python-dotenv, aiohttp |
| 2: Feeds | Feed ingestion service, feed_cache table, feed table UI with filters, manual refresh | (no new deps) |
| 3: Actors | python-stix2 TAXII client, /api/actors routes, actor profile UI, TTP matrix, Navigator export | python-stix2 |
| 4: Reports | Report data model, /api/reports routes, ReportEditor UI, Claude API call, Markdown export | anthropic |
| 5: Deploy | DEMO_MODE fixtures, Dockerfile production build, Render deploy | (no new deps) |

---

*Next step: Use `/sc:implement` starting with Phase 0 (scaffold) to build the project structure.*
