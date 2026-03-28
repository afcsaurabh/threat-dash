"""
IOC Enrichment Service — Phase 1.
Queries VirusTotal, AbuseIPDB, and GreyNoise concurrently for each IOC.
"""

import re
import json
import asyncio
import httpx

from backend.config import settings
from backend.database import get_connection


# ---------------------------------------------------------------------------
# IOC type detection
# ---------------------------------------------------------------------------

def detect_ioc_type(ioc: str) -> str:
    """Classify an IOC string as 'ip', 'hash', or 'domain'."""
    ioc = ioc.strip()
    if re.match(r"^[a-fA-F0-9]{32}$", ioc):   # MD5
        return "hash"
    if re.match(r"^[a-fA-F0-9]{40}$", ioc):   # SHA1
        return "hash"
    if re.match(r"^[a-fA-F0-9]{64}$", ioc):   # SHA256
        return "hash"
    if re.match(r"^\d{1,3}(?:\.\d{1,3}){3}$", ioc):  # IPv4
        return "ip"
    return "domain"


# ---------------------------------------------------------------------------
# Risk scoring
# ---------------------------------------------------------------------------

def compute_risk(
    ioc_type: str,
    vt: dict | None,
    abuseipdb: dict | None,
    greynoise: dict | None,
) -> str:
    """
    Aggregate signals from all three sources into a single risk tier.
    Score is additive; thresholds map to CRITICAL / HIGH / MEDIUM / LOW / UNKNOWN.
    """
    score = 0

    if vt and not vt.get("error") and not vt.get("not_found"):
        total = vt.get("total", 0)
        detections = vt.get("detections", 0)
        if total > 0:
            ratio = detections / total
            if ratio >= 0.5:
                score += 4
            elif ratio >= 0.2:
                score += 3
            elif ratio >= 0.05:
                score += 2
            elif ratio > 0:
                score += 1

    if abuseipdb and not abuseipdb.get("error"):
        conf = abuseipdb.get("confidence", 0)
        if conf >= 90:
            score += 4
        elif conf >= 60:
            score += 3
        elif conf >= 30:
            score += 2
        elif conf > 0:
            score += 1

    if greynoise and not greynoise.get("error"):
        classification = greynoise.get("classification", "")
        if classification == "malicious":
            score += 3
        elif classification == "suspicious":
            score += 1

    if score >= 6:
        return "CRITICAL"
    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    if score >= 1:
        return "LOW"
    return "UNKNOWN"


# ---------------------------------------------------------------------------
# VirusTotal
# ---------------------------------------------------------------------------

async def _query_virustotal(client: httpx.AsyncClient, ioc: str, ioc_type: str) -> dict | None:
    if not settings.virustotal_api_key:
        return None

    headers = {"x-apikey": settings.virustotal_api_key}

    try:
        if ioc_type == "ip":
            url = f"https://www.virustotal.com/api/v3/ip_addresses/{ioc}"
        elif ioc_type == "domain":
            url = f"https://www.virustotal.com/api/v3/domains/{ioc}"
        else:
            url = f"https://www.virustotal.com/api/v3/files/{ioc}"

        resp = await client.get(url, headers=headers, timeout=15)

        if resp.status_code == 200:
            data = resp.json()
            attrs = data.get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            cats_raw = attrs.get("categories", {})
            categories = list(set(cats_raw.values())) if isinstance(cats_raw, dict) else []

            vt_type_path = (
                "ip-address" if ioc_type == "ip"
                else "domain" if ioc_type == "domain"
                else "file"
            )
            return {
                "detections": stats.get("malicious", 0),
                "total": sum(stats.values()),
                "categories": categories,
                "permalink": f"https://www.virustotal.com/gui/{vt_type_path}/{ioc}",
            }
        if resp.status_code == 404:
            return {"detections": 0, "total": 0, "categories": [], "not_found": True}
        return {"error": f"HTTP {resp.status_code}"}

    except httpx.TimeoutException:
        return {"error": "Request timed out"}
    except Exception as exc:
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# AbuseIPDB (IP only)
# ---------------------------------------------------------------------------

async def _query_abuseipdb(client: httpx.AsyncClient, ioc: str, ioc_type: str) -> dict | None:
    if ioc_type != "ip" or not settings.abuseipdb_api_key:
        return None

    try:
        resp = await client.get(
            "https://api.abuseipdb.com/api/v2/check",
            params={"ipAddress": ioc, "maxAgeInDays": 90},
            headers={"Key": settings.abuseipdb_api_key, "Accept": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            d = resp.json().get("data", {})
            return {
                "confidence": d.get("abuseConfidenceScore", 0),
                "country": d.get("countryCode", ""),
                "isp": d.get("isp", ""),
                "total_reports": d.get("totalReports", 0),
                "last_reported": d.get("lastReportedAt"),
            }
        return {"error": f"HTTP {resp.status_code}"}

    except httpx.TimeoutException:
        return {"error": "Request timed out"}
    except Exception as exc:
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# GreyNoise (IP only — community endpoint)
# ---------------------------------------------------------------------------

async def _query_greynoise(client: httpx.AsyncClient, ioc: str, ioc_type: str) -> dict | None:
    if ioc_type != "ip" or not settings.greynoise_api_key:
        return None

    try:
        resp = await client.get(
            f"https://api.greynoise.io/v3/community/{ioc}",
            headers={"key": settings.greynoise_api_key},
            timeout=15,
        )
        if resp.status_code == 200:
            d = resp.json()
            return {
                "classification": d.get("classification", "unknown"),
                "name": d.get("name", ""),
                "last_seen": d.get("last_seen", ""),
                "riot": d.get("riot", False),
                "noise": d.get("noise", False),
            }
        if resp.status_code == 404:
            return {"classification": "not_seen", "message": "Not observed by GreyNoise"}
        return {"error": f"HTTP {resp.status_code}"}

    except httpx.TimeoutException:
        return {"error": "Request timed out"}
    except Exception as exc:
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def _save_to_history(
    ioc: str,
    ioc_type: str,
    risk: str,
    vt: dict | None,
    abuseipdb: dict | None,
    greynoise: dict | None,
) -> None:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO ioc_history
               (ioc, ioc_type, risk_rating, vt_result, abuseipdb_result, greynoise_result)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                ioc,
                ioc_type,
                risk,
                json.dumps(vt),
                json.dumps(abuseipdb),
                json.dumps(greynoise),
            ),
        )


# ---------------------------------------------------------------------------
# Demo-mode fixtures
# ---------------------------------------------------------------------------

_DEMO_RESULTS: list[dict] = [
    {
        "ioc": "185.220.101.47",
        "type": "ip",
        "risk": "CRITICAL",
        "sources": {
            "virustotal": {"detections": 45, "total": 72, "categories": ["malware", "c2"],
                           "permalink": "https://www.virustotal.com/gui/ip-address/185.220.101.47"},
            "abuseipdb": {"confidence": 99, "country": "RU", "isp": "Frantech Solutions",
                          "total_reports": 412, "last_reported": "2026-03-27T00:00:00Z"},
            "greynoise": {"classification": "malicious", "name": "TOR Exit Node",
                          "last_seen": "2026-03-27", "riot": False, "noise": True},
        },
    },
    {
        "ioc": "malware-delivery.xyz",
        "type": "domain",
        "risk": "HIGH",
        "sources": {
            "virustotal": {"detections": 12, "total": 72, "categories": ["phishing"],
                           "permalink": "https://www.virustotal.com/gui/domain/malware-delivery.xyz"},
            "abuseipdb": None,
            "greynoise": None,
        },
    },
    {
        "ioc": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "type": "hash",
        "risk": "LOW",
        "sources": {
            "virustotal": {"detections": 1, "total": 72, "categories": [],
                           "permalink": "https://www.virustotal.com/gui/file/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"},
            "abuseipdb": None,
            "greynoise": None,
        },
    },
]

_DEMO_LOOKUP: dict[str, dict] = {r["ioc"]: r for r in _DEMO_RESULTS}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def enrich_iocs(iocs: list[str]) -> list[dict]:
    """Enrich a list of IOCs. Returns demo fixtures when DEMO_MODE is active."""
    if settings.demo_mode:
        results = []
        for ioc in iocs:
            if ioc in _DEMO_LOOKUP:
                results.append(_DEMO_LOOKUP[ioc])
            else:
                ioc_type = detect_ioc_type(ioc)
                results.append({
                    "ioc": ioc,
                    "type": ioc_type,
                    "risk": "UNKNOWN",
                    "sources": {"virustotal": None, "abuseipdb": None, "greynoise": None},
                })
        return results

    async with httpx.AsyncClient() as client:
        tasks = [_enrich_single(client, ioc) for ioc in iocs]
        return await asyncio.gather(*tasks)


async def _enrich_single(client: httpx.AsyncClient, ioc: str) -> dict:
    ioc_type = detect_ioc_type(ioc)

    vt, abuseipdb, greynoise = await asyncio.gather(
        _query_virustotal(client, ioc, ioc_type),
        _query_abuseipdb(client, ioc, ioc_type),
        _query_greynoise(client, ioc, ioc_type),
    )

    risk = compute_risk(ioc_type, vt, abuseipdb, greynoise)
    _save_to_history(ioc, ioc_type, risk, vt, abuseipdb, greynoise)

    return {
        "ioc": ioc,
        "type": ioc_type,
        "risk": risk,
        "sources": {
            "virustotal": vt,
            "abuseipdb": abuseipdb,
            "greynoise": greynoise,
        },
    }
