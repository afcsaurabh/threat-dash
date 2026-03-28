# threat-dash — Project Context

## Project
A browser-based threat intelligence dashboard. Unified CTI analyst workspace + portfolio artifact.

## Last Session
2026-03-27 — Requirements discovery complete via sc:brainstorm. REQUIREMENTS.md written.

## Decisions Made
- CONFIRMED: Unified web dashboard (not six separate CLI repos)
- CONFIRMED: Browser-based UI (not terminal/TUI)
- CONFIRMED: Working tool the owner uses daily + portfolio piece for hiring managers
- CONFIRMED: Three core workflows: IOC Enrichment, Live Feed Monitor, Threat Actor Explorer
- CONFIRMED: Phase 4 adds Intelligence Report Generator (outputs finished Markdown/PDF reports)
- CONFIRMED: Eventually deployed to free-tier hosting with live demo URL
- CONFIRMED: Phase-based approach, no fixed timeline

## Current Status
Requirements spec complete. Tech stack not yet decided.

## Next
Run `/sc:design` to resolve open questions and produce architecture spec:
- OQ-01: Frontend framework (React / Vue / Streamlit / plain HTML)
- OQ-02: Python backend (Flask / FastAPI / none)
- OQ-03: Persistence layer (SQLite vs flat JSON)
- OQ-04: Demo mode for deployed URL (API key protection)
- OQ-05: AI-assisted report drafting in Phase 4 (Claude API for Exec Summary generation — potential differentiator)

## Key Files
- `REQUIREMENTS.md` — full requirements spec
- `research_threat_intelligence_career_launch_20260323.md` — source research doc
- `context.md` — this file
