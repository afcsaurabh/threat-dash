# threat-dash — Project Instructions

## QA Protocol

At the end of every **major phase** (5a, 5b, 5c, etc.), run a Playwright QA pass before committing.

**Steps:**
1. Start dev server in demo mode: `cd frontend && VITE_DEMO_MODE=true npm run dev -- --port 5174`
2. Use Playwright MCP tools to verify:
   - Page loads with no console errors
   - All nav links route correctly (check URL)
   - Data panels populate (not stuck on "Loading…")
   - Any interactive elements (filters, toggles, pills) work and update URL state
   - Take a full-page screenshot for the record
3. Fix all bugs found before committing
4. Kill the dev server: `kill $(lsof -ti:5174)`

**Do NOT run QA between sub-phases** (5a→5b, etc.) — only at major phase boundaries.

## Versioning
Before modifying any file, the versioning hook creates a backup automatically. Do not skip it.
