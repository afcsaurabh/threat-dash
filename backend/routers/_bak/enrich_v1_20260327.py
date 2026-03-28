"""
IOC Enrichment router — Phase 1.
POST /api/enrich
GET  /api/enrich/history
GET  /api/enrich/history/{ioc}
POST /api/enrich/{ioc}/tag
"""

from fastapi import APIRouter

router = APIRouter(tags=["enrichment"])


@router.post("/enrich")
async def enrich_iocs(body: dict):
    # Phase 1 implementation goes here
    return {"message": "Phase 1 not yet implemented", "iocs": body.get("iocs", [])}


@router.get("/enrich/history")
async def get_history():
    return {"history": []}


@router.get("/enrich/history/{ioc}")
async def get_ioc_history(ioc: str):
    return {"ioc": ioc, "history": []}


@router.post("/enrich/{ioc}/tag")
async def tag_ioc(ioc: str, body: dict):
    return {"ioc": ioc, "tag": body.get("tag")}
