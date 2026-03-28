"""
Feed Ingestion Service — Phase 2.
Ingests ThreatFox, URLhaus, and Feodo Tracker from abuse.ch.
All three feeds are free and require no API keys.
"""

import asyncio
from datetime import datetime, timezone

import httpx

from backend.database import get_connection

THREATFOX_API = "https://threatfox-api.abuse.ch/api/v1/"
URLHAUS_RECENT = "https://urlhaus-api.abuse.ch/v1/urls/recent/"
FEODO_BLOCKLIST = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"

TIMEOUT = httpx.Timeout(30.0)


# ---------------------------------------------------------------------------
# Per-source ingestors
# ---------------------------------------------------------------------------

async def _ingest_threatfox(client: httpx.AsyncClient) -> int:
    """
    ThreatFox — community IOC sharing platform.
    Returns IOCs (IPs, URLs, domains, hashes) with malware family and confidence.
    Fetches the last 3 days of submissions.
    """
    resp = await client.post(THREATFOX_API, json={"query": "get_iocs", "days": 3}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    if data.get("query_status") != "ok":
        return 0

    items = data.get("data") or []
    count = 0
    with get_connection() as conn:
        for item in items:
            raw_ioc = item.get("ioc", "")
            ioc_type = item.get("ioc_type", "unknown")

            # ThreatFox represents IP IOCs as "1.2.3.4:port"
            if ioc_type == "ip:port":
                raw_ioc = raw_ioc.split(":")[0]
                ioc_type = "ip"

            if not raw_ioc:
                continue

            try:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO feed_cache
                        (ioc, ioc_type, source, confidence, threat_type, malware_family, first_seen)
                    VALUES (?, ?, 'threatfox', ?, ?, ?, ?)
                    """,
                    (
                        raw_ioc,
                        ioc_type,
                        item.get("confidence_level", 0),
                        item.get("threat_type", ""),
                        item.get("malware", ""),
                        item.get("first_seen", ""),
                    ),
                )
                count += 1
            except Exception:
                pass
    return count


async def _ingest_urlhaus(client: httpx.AsyncClient) -> int:
    """
    URLhaus — abuse.ch malicious URL feed.
    Returns recently submitted URLs hosting malware payloads.
    """
    resp = await client.get(URLHAUS_RECENT, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    if data.get("query_status") != "ok":
        return 0

    urls = data.get("urls") or []
    count = 0
    with get_connection() as conn:
        for item in urls:
            url = item.get("url", "")
            if not url:
                continue

            tags = item.get("tags") or []
            tag_str = ", ".join(tags) if isinstance(tags, list) else str(tags)

            try:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO feed_cache
                        (ioc, ioc_type, source, confidence, threat_type, malware_family, first_seen)
                    VALUES (?, 'url', 'urlhaus', 75, ?, ?, ?)
                    """,
                    (
                        url,
                        item.get("threat", ""),
                        tag_str,
                        item.get("date_added", ""),
                    ),
                )
                count += 1
            except Exception:
                pass
    return count


async def _ingest_feodo(client: httpx.AsyncClient) -> int:
    """
    Feodo Tracker — abuse.ch botnet C2 IP blocklist.
    Tracks command-and-control servers for Dridex, QakBot, Emotet, etc.
    """
    resp = await client.get(FEODO_BLOCKLIST, timeout=TIMEOUT)
    resp.raise_for_status()
    entries = resp.json()

    if not isinstance(entries, list):
        return 0

    count = 0
    with get_connection() as conn:
        for item in entries:
            ip = item.get("ip_address", "")
            if not ip:
                continue
            try:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO feed_cache
                        (ioc, ioc_type, source, confidence, threat_type, malware_family, first_seen)
                    VALUES (?, 'ip', 'feodo', 90, 'botnet_cc', ?, ?)
                    """,
                    (
                        ip,
                        item.get("malware", ""),
                        item.get("first_seen", ""),
                    ),
                )
                count += 1
            except Exception:
                pass
    return count


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def refresh_all() -> dict:
    """Fetch from all three sources concurrently and persist results."""
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            _ingest_threatfox(client),
            _ingest_urlhaus(client),
            _ingest_feodo(client),
            return_exceptions=True,
        )

    tf = results[0] if isinstance(results[0], int) else 0
    uh = results[1] if isinstance(results[1], int) else 0
    fd = results[2] if isinstance(results[2], int) else 0
    errors = [str(r) for r in results if isinstance(r, Exception)]

    return {
        "threatfox": tf,
        "urlhaus": uh,
        "feodo": fd,
        "total": tf + uh + fd,
        "errors": errors,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
    }


def get_feed_stats() -> dict:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                SUM(CASE WHEN source = 'threatfox' THEN 1 ELSE 0 END) AS threatfox,
                SUM(CASE WHEN source = 'urlhaus'   THEN 1 ELSE 0 END) AS urlhaus,
                SUM(CASE WHEN source = 'feodo'     THEN 1 ELSE 0 END) AS feodo,
                MAX(ingested_at) AS last_refresh
            FROM feed_cache
            """
        ).fetchone()
    return {
        "threatfox": row["threatfox"] or 0,
        "urlhaus": row["urlhaus"] or 0,
        "feodo": row["feodo"] or 0,
        "last_refresh": row["last_refresh"],
    }


def query_feeds(
    type: str = None,
    source: str = None,
    since: str = None,
    confidence: int = None,
    limit: int = 100,
    offset: int = 0,
) -> dict:
    conditions: list[str] = []
    params: list = []

    if type:
        conditions.append("ioc_type = ?")
        params.append(type)
    if source:
        conditions.append("source = ?")
        params.append(source)
    if confidence is not None:
        conditions.append("confidence >= ?")
        params.append(confidence)
    if since:
        conditions.append("ingested_at >= ?")
        params.append(since)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM feed_cache {where}", params
        ).fetchone()[0]

        rows = conn.execute(
            f"""
            SELECT ioc, ioc_type, source, confidence, threat_type, malware_family,
                   first_seen, ingested_at
            FROM feed_cache {where}
            ORDER BY ingested_at DESC
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        ).fetchall()

    return {
        "feed": [dict(r) for r in rows],
        "total": total,
    }
