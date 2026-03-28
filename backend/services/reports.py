"""
Intelligence Report Service — Phase 4.
Assembles report data from actor profiles and IOC history, then
calls Claude API to draft an Executive Summary.
"""

import json
from datetime import datetime, timezone

from backend.database import get_connection
from backend.config import settings
from backend.services import attck


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def create_report(
    title: str,
    actor_id: str | None = None,
    ioc_text: str = "",
    analyst_notes: str = "",
) -> dict:
    """
    Create a new report. If actor_id is provided, pre-fills actor profile
    and technique data from the ATT&CK database.
    ioc_text is newline-separated raw IOC values pasted by the analyst.
    """
    actor_profile_json = ""
    ttps_json = ""

    if actor_id:
        actor = attck.get_actor(actor_id)
        if actor:
            profile = {
                "name": actor.get("name"),
                "aliases": actor.get("aliases", []),
                "country": actor.get("country", ""),
                "description": actor.get("description", ""),
            }
            actor_profile_json = json.dumps(profile)
            # techniques from attck use key "id" (e.g. "T1566")
            techniques = [
                {
                    "technique_id": t.get("id", ""),
                    "name": t.get("name", ""),
                    "tactics": t.get("tactics", []),
                }
                for t in actor.get("techniques", [])
            ]
            ttps_json = json.dumps(techniques)

    # Parse pasted IOC list
    iocs = []
    if ioc_text.strip():
        for line in ioc_text.splitlines():
            line = line.strip()
            if line:
                iocs.append({"ioc": line, "type": _guess_ioc_type(line), "risk": "unknown"})
    iocs_json = json.dumps(iocs) if iocs else ""

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO reports
                (title, actor_id, actor_profile, ttps_json, iocs_json, analyst_notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (title, actor_id, actor_profile_json, ttps_json, iocs_json, analyst_notes),
        )
        report_id = cursor.lastrowid

    return get_report(report_id)


def list_reports() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, title, actor_id, created_at, updated_at,
                   CASE WHEN exec_summary IS NOT NULL AND exec_summary != '' THEN 1 ELSE 0 END AS has_summary
            FROM reports ORDER BY created_at DESC
            """
        ).fetchall()
    return [dict(r) for r in rows]


def get_report(report_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        return None
    r = dict(row)
    for field in ("actor_profile", "ttps_json", "iocs_json"):
        if r.get(field):
            try:
                r[field] = json.loads(r[field])
            except Exception:
                pass
        else:
            r[field] = {} if field == "actor_profile" else []
    return r


def update_report(report_id: int, fields: dict) -> dict | None:
    allowed = {"title", "analyst_notes", "exec_summary", "mitigations"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return get_report(report_id)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [
        datetime.now(timezone.utc).isoformat(),
        report_id,
    ]
    with get_connection() as conn:
        conn.execute(
            f"UPDATE reports SET {set_clause}, updated_at = ? WHERE id = ?",
            values,
        )
    return get_report(report_id)


# ---------------------------------------------------------------------------
# Claude API — Executive Summary
# ---------------------------------------------------------------------------

async def generate_exec_summary(report_id: int) -> dict:
    """Call Claude API to draft the Executive Summary. Stores result in DB."""
    if not settings.anthropic_api_key:
        return {
            "error": (
                "Anthropic API key not configured. "
                "Add it via Settings → API Keys in any page, "
                "or set ANTHROPIC_API_KEY in your .env file."
            )
        }

    report = get_report(report_id)
    if not report:
        return {"error": "Report not found."}

    prompt = _build_prompt(report)

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        summary = message.content[0].text
    except Exception as exc:
        return {"error": f"Claude API error: {exc}"}

    with get_connection() as conn:
        conn.execute(
            "UPDATE reports SET exec_summary = ?, updated_at = ? WHERE id = ?",
            (summary, datetime.now(timezone.utc).isoformat(), report_id),
        )

    return {"exec_summary": summary}


def _build_prompt(report: dict) -> str:
    actor = report.get("actor_profile") or {}
    techniques = report.get("ttps_json") or []
    iocs = report.get("iocs_json") or []

    aliases = actor.get("aliases") or []
    aliases_str = ", ".join(aliases) if isinstance(aliases, list) and aliases else "none documented"

    ttp_lines = []
    for t in (techniques if isinstance(techniques, list) else [])[:15]:
        tid = t.get("technique_id", "")
        name = t.get("name", "")
        tactics = t.get("tactics") or []
        if isinstance(tactics, list):
            tactics = ", ".join(tactics)
        ttp_lines.append(f"  - {tid} {name} ({tactics})")
    ttp_text = "\n".join(ttp_lines) if ttp_lines else "  (no technique data loaded)"

    ioc_lines = []
    for ioc in (iocs if isinstance(iocs, list) else [])[:10]:
        if isinstance(ioc, dict):
            ioc_lines.append(
                f"  - {ioc.get('ioc', '')} [{ioc.get('type', '')}] risk: {ioc.get('risk', '')}"
            )
    ioc_text = "\n".join(ioc_lines) if ioc_lines else "  (none provided)"

    description = (actor.get("description") or "No description available.")[:600]
    notes = (report.get("analyst_notes") or "").strip() or "(none)"
    actor_name = actor.get("name") or report.get("title") or "Unknown"

    return f"""You are a Cyber Threat Intelligence (CTI) analyst assistant. Write a professional intelligence report executive summary based on the structured data below.

Threat Actor: {actor_name}
Also Known As: {aliases_str}
Attributed Origin: {actor.get("country") or "Unknown"}
Description: {description}

Top Techniques ({len(techniques) if isinstance(techniques, list) else 0} total):
{ttp_text}

IOCs Under Investigation:
{ioc_text}

Analyst Notes:
{notes}

Write a 3-5 paragraph executive summary covering:
1. Threat overview and attribution
2. Primary tactics and high-impact techniques
3. Indicators of compromise and their significance
4. Recommended defensive actions

Requirements:
- Professional tone, suitable for both technical security analysts and non-technical executives
- Plain language — briefly explain any jargon used
- Do not invent facts not present in the data above
- Keep it under 450 words"""


# ---------------------------------------------------------------------------
# Markdown export
# ---------------------------------------------------------------------------

def export_markdown(report_id: int) -> str | None:
    report = get_report(report_id)
    if not report:
        return None

    actor = report.get("actor_profile") or {}
    techniques = report.get("ttps_json") or []
    iocs = report.get("iocs_json") or []

    lines = [
        f"# Intelligence Report: {report.get('title', 'Untitled')}",
        f"*Generated: {report.get('updated_at', '')}*",
        "",
    ]

    if report.get("exec_summary"):
        lines += ["## Executive Summary", "", report["exec_summary"], ""]

    if actor and isinstance(actor, dict):
        aliases = actor.get("aliases") or []
        if isinstance(aliases, list):
            aliases = ", ".join(aliases)
        lines += [
            "## Threat Actor Profile",
            "",
            f"**Name:** {actor.get('name', '')}",
            f"**Also Known As:** {aliases}",
            f"**Attributed Origin:** {actor.get('country', 'Unknown')}",
            "",
            actor.get("description", ""),
            "",
        ]

    if techniques and isinstance(techniques, list):
        lines += ["## Tactics, Techniques & Procedures (TTPs)", ""]
        lines += ["| ID | Technique | Tactics |", "|---|---|---|"]
        for t in techniques:
            tid = t.get("technique_id", "")
            name = t.get("name", "")
            tactics = t.get("tactics") or []
            if isinstance(tactics, list):
                tactics = ", ".join(tactics)
            lines.append(f"| {tid} | {name} | {tactics} |")
        lines.append("")

    if iocs and isinstance(iocs, list):
        lines += ["## Indicators of Compromise", ""]
        lines += ["| IOC | Type | Risk |", "|---|---|---|"]
        for ioc in iocs:
            if isinstance(ioc, dict):
                lines.append(
                    f"| `{ioc.get('ioc', '')}` | {ioc.get('type', '')} | {ioc.get('risk', '')} |"
                )
        lines.append("")

    if report.get("mitigations"):
        lines += ["## Mitigations", "", report["mitigations"], ""]

    if report.get("analyst_notes"):
        lines += ["## Analyst Notes", "", report["analyst_notes"], ""]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _guess_ioc_type(value: str) -> str:
    import re
    value = value.strip()
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", value):
        return "ip"
    if re.match(r"^[0-9a-fA-F]{32,64}$", value):
        return "hash"
    if value.startswith("http://") or value.startswith("https://") or value.startswith("hxxp"):
        return "url"
    if re.match(r"^[a-zA-Z0-9._\-]+\.[a-zA-Z]{2,}$", value):
        return "domain"
    return "unknown"
