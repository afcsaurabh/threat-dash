# threat-dash — Requirements Specification
**Status**: Draft v1.0
**Date**: 2026-03-27
**Method**: Socratic discovery (sc:brainstorm)

---

## 1. Project Goal

Build a browser-based threat intelligence dashboard that serves two simultaneous purposes:
1. **Working tool**: A real CTI analyst workspace the owner uses daily while learning the domain
2. **Portfolio artifact**: A deployable web application that signals engineering maturity and analytical thinking to hiring managers in CTI roles

The dashboard consolidates three CTI workflows — IOC enrichment, live feed monitoring, and threat actor research — into a single unified interface, and adds an intelligence report generation layer that converts raw data into finished analyst-grade output.

---

## 2. Primary User

**Role**: Transitioning CTI analyst (advertising/strategy background, beginner Python developer)

**Core jobs to be done**:
- Look up a suspicious indicator quickly without switching between multiple browser tabs
- Monitor the current threat landscape passively while studying
- Research a specific threat actor and their TTPs for learning or reporting purposes
- Produce a structured finished intelligence report without starting from scratch each time

---

## 3. Functional Requirements by Phase

### Phase 1 — IOC Enrichment

The foundational workflow. The user pastes one or more indicators (IP addresses, domains, file hashes) and receives an aggregated risk assessment from multiple sources.

**Requirements:**
- FR-01: Accept input of one or more IOCs (IP, domain, MD5/SHA1/SHA256 hash) via a search field
- FR-02: Query VirusTotal v3 API, AbuseIPDB API, and GreyNoise API concurrently for each IOC
- FR-03: Display per-source results in a structured results panel (detection counts, reputation scores, categories, last seen dates)
- FR-04: Calculate and display a normalized risk rating per IOC: Low / Medium / High / Critical — based on detection ratios and abuse confidence scores
- FR-05: Support bulk input (newline-separated list of IOCs)
- FR-06: Persist lookup history in local storage so results are accessible across sessions
- FR-07: Allow the user to tag any enriched IOC (e.g., "investigating", "confirmed malicious", "false positive")
- FR-08: Display a clear "no data" or "API error" state when a source is unavailable

**Out of scope for Phase 1**: Live feeds, actor profiles, report generation

---

### Phase 2 — Live Threat Feed Monitor

A situational awareness view showing what IOCs are being reported in the wild right now.

**Requirements:**
- FR-09: Ingest live IOC feeds: ThreatFox (abuse.ch), URLhaus (abuse.ch), Feodo Tracker (abuse.ch)
- FR-10: Display incoming IOCs in a filterable, sortable table (columns: IOC value, type, source feed, first seen, confidence, tags)
- FR-11: Support filters: IOC type (IP/URL/hash/domain), source feed, date range, confidence threshold
- FR-12: Cross-reference any feed IOC against the Phase 1 enrichment system with one click
- FR-13: Highlight high-confidence IOCs (above user-defined threshold) visually in the feed table
- FR-14: Show a summary panel with feed statistics: total IOCs ingested, breakdown by type, last refresh timestamp
- FR-15: Refresh feeds on a user-triggered basis (manual refresh button); do not auto-poll without user action

**Out of scope for Phase 2**: Actor profiles, report generation

---

### Phase 3 — Threat Actor Explorer

A research mode for studying adversaries using the MITRE ATT&CK framework.

**Requirements:**
- FR-16: Query the MITRE ATT&CK TAXII server (via python-stix2) to retrieve data on threat actors (Groups)
- FR-17: Provide a searchable list of all ATT&CK Groups; selecting one loads their full profile
- FR-18: Per actor profile page display: name, aliases, description, associated campaigns, target sectors/countries, software/tools used, full TTP list mapped to ATT&CK tactics and techniques
- FR-19: Display TTPs in a visual matrix or structured table organized by ATT&CK tactic columns
- FR-20: Allow export of a selected actor's TTP layer as an ATT&CK Navigator-compatible JSON file
- FR-21: Allow the user to annotate an actor profile with personal notes (stored locally)
- FR-22: Show related IOCs from Phase 2 feed data when any overlap with actor campaigns is detected (stretch goal — Phase 3 end state)

**Out of scope for Phase 3**: Report generation

---

### Phase 4 — Intelligence Report Generator

The output layer. Converts data collected in Phases 1–3 into a structured, finished intelligence report.

**Requirements:**
- FR-23: Allow the user to initiate a new report from three entry points: (a) a set of enriched IOCs from Phase 1, (b) a threat actor profile from Phase 3, or (c) a blank template
- FR-24: Report follows the standard intelligence format:
  - Executive Summary (2–3 sentences, non-technical audience)
  - Threat Actor Profile (attribution confidence, motivation, capability)
  - TTPs mapped to MITRE ATT&CK (table format)
  - IOC Table (sanitized indicators — defanged URLs/IPs)
  - Recommended Mitigations (mapped to NIST CSF or CIS Controls)
  - Analyst Notes (freeform)
- FR-25: Report fields are pre-populated from dashboard data where available; user edits/supplements in-browser
- FR-26: **Claude API integration** — the Executive Summary section is AI-drafted by Claude (claude-sonnet-4-6) using structured data from the active session (enriched IOCs, actor profile, ATT&CK mappings) as context. The user reviews and edits before export. Other sections remain template-fill from structured data.
- FR-27: The Claude API prompt is constructed from: IOC risk ratings, actor name + motivation + capability, top 5 TTPs by tactic, and recommended mitigations. The prompt instructs Claude to write for a non-technical executive audience in 2–3 sentences.
- FR-28: Export report as formatted Markdown file (primary format)
- FR-29: Export report as PDF (secondary format, Phase 4 end state)
- FR-30: Reports are saved locally and listed in a "Reports" view with title, date, and associated actor/IOC
- FR-31: IOCs in exported reports are automatically defanged (e.g., `http` → `hxxp`, `.` → `[.]`)

---

## 4. Non-Functional Requirements

- **NFR-01: Deployable** — The application must be containerizable (Docker) and deployable to a free-tier hosting platform (e.g., Render, Railway, Fly.io) so a live demo URL can be shared in a portfolio
- **NFR-02: API key management** — All third-party API keys are configured via environment variables, never hardcoded; a `.env.example` file is included in the repo
- **NFR-03: No authentication required** — The application is a personal tool; user authentication is out of scope unless deployment requirements change
- **NFR-04: Graceful API degradation** — If any external API is unavailable or rate-limited, the dashboard continues to function with a visible error state for the affected source only
- **NFR-05: Rate limit awareness** — The application must respect free-tier API rate limits: VirusTotal (4 req/min), AbuseIPDB (1,000/day), GreyNoise (community tier limits)
- **NFR-06: Portfolio documentation** — The repo must include `SPEC.md` (design intent) and `DECISIONS.md` (reasoning trail) as first-class artifacts alongside code
- **NFR-07: Local data persistence** — IOC history, feed cache, actor annotations, and saved reports are stored locally (SQLite or flat JSON) with no external database dependency for local use

---

## 5. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | CTI analyst | submit an IP address and see its reputation across 3 sources in one view | I don't waste time switching between VirusTotal, AbuseIPDB, and GreyNoise tabs |
| US-02 | CTI analyst | paste a list of 20 IOCs and get bulk results | I can triage a large indicator set efficiently |
| US-03 | CTI student | see what IOCs are being reported in live feeds right now | I stay current on the threat landscape while I'm learning |
| US-04 | CTI student | click a feed IOC and immediately enrich it | I can pivot from awareness to investigation without losing context |
| US-05 | CTI analyst | pull up APT28's full TTP profile from ATT&CK | I can study their behavior and map it to tactics |
| US-06 | CTI analyst | export a threat actor's TTPs as an ATT&CK Navigator JSON | I can visualize the layer in the official Navigator tool |
| US-07 | CTI analyst | generate a finished intelligence report from data I've already collected | I spend my time on analysis, not on formatting |
| US-08 | CTI analyst | export a report as Markdown | I can publish it to my GitHub portfolio as a finished artifact |
| US-09 | Portfolio reviewer | visit a live deployed URL | I can see the tool working without cloning and running it locally |
| US-10 | Portfolio reviewer | read SPEC.md and DECISIONS.md in the repo | I can assess the engineer's design thinking, not just their code |

---

## 6. Out of Scope (All Phases)

- User authentication and multi-user support
- Real-time collaborative features
- Paid API tier integrations (Shodan paid, Recorded Future, Mandiant)
- MISP or OpenCTI platform integration (separate portfolio project)
- Malware analysis or sandbox detonation
- Custom IOC feed creation or TAXII server hosting
- Mobile/responsive design optimization (desktop browser only)

---

## 7. Open Questions

| # | Question | Impact |
|---|---|---|
| OQ-01 | What frontend framework (plain HTML/JS, React, Vue, or a Python-native option like Streamlit)? | Affects build complexity and deployment approach — decision needed before Phase 1 design |
| OQ-02 | What Python web backend (Flask, FastAPI, or none if Streamlit)? | Affects project structure and deployment |
| OQ-03 | SQLite vs. flat JSON for local persistence? | Affects query capability for Phase 2 feed data |
| OQ-04 | Should the live URL be the full app or a read-only demo mode with sample data (to avoid exposing API keys in a shared deployment)? | Affects deployment architecture — API keys cannot be public |
| ~~OQ-05~~ | ~~Does Phase 4 report generation need AI-assisted drafting?~~ | **DECIDED**: Claude API (claude-sonnet-4-6) drafts the Executive Summary from structured session data. User reviews before export. See FR-26, FR-27. |

---

## 8. Phase Summary

| Phase | Core Capability | Entry Criteria |
|---|---|---|
| 1 | IOC Enrichment (VirusTotal + AbuseIPDB + GreyNoise) | API keys obtained; project scaffold exists |
| 2 | Live Feed Monitor (abuse.ch feeds) | Phase 1 enrichment working; local persistence layer in place |
| 3 | Threat Actor Explorer (MITRE ATT&CK via TAXII) | Phase 2 feed table stable |
| 4 | Intelligence Report Generator | All three data layers functional |

---

*Next step: Use `/sc:design` to generate architecture and tech stack decisions that resolve OQ-01 through OQ-05.*
