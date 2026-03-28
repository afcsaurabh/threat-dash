"""
IOC Enrichment router — Phase 1.
POST /api/enrich
GET  /api/enrich/history
GET  /api/enrich/history/{ioc}
POST /api/enrich/{ioc}/tag
"""

import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.enrichment import enrich_iocs
from backend.database import get_connection

router = APIRouter(tags=["enrichment"])


class EnrichRequest(BaseModel):
    iocs: list[str]


class TagRequest(BaseModel):
    tag: str


@router.post("/enrich")
async def enrich(body: EnrichRequest):
    cleaned = [ioc.strip() for ioc in body.iocs if ioc.strip()]
    if not cleaned:
        raise HTTPException(status_code=400, detail="No IOCs provided")
    results = await enrich_iocs(cleaned)
    return {"results": results}


@router.get("/enrich/history")
async def get_history():
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT ioc, ioc_type, risk_rating, queried_at
               FROM ioc_history
               ORDER BY queried_at DESC
               LIMIT 100"""
        ).fetchall()
    return {"history": [dict(r) for r in rows]}


@router.get("/enrich/history/{ioc}")
async def get_ioc_history(ioc: str):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM ioc_history WHERE ioc = ? ORDER BY queried_at DESC",
            (ioc,),
        ).fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No history for this IOC")

    history = []
    for r in rows:
        entry = dict(r)
        for key in ("vt_result", "abuseipdb_result", "greynoise_result"):
            raw = entry.get(key)
            entry[key] = json.loads(raw) if raw else None
        history.append(entry)

    return {"ioc": ioc, "history": history}


@router.post("/enrich/{ioc}/tag")
async def tag_ioc(ioc: str, body: TagRequest):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO ioc_tags (ioc, tag) VALUES (?, ?)",
            (ioc, body.tag),
        )
    return {"ioc": ioc, "tag": body.tag}
