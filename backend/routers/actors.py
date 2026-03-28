"""
Threat Actor Explorer router — Phase 3.
GET  /api/actors
GET  /api/actors/{id}
GET  /api/actors/{id}/navigator
POST /api/actors/{id}/notes
"""

from fastapi import APIRouter

router = APIRouter(tags=["actors"])


@router.get("/actors")
async def list_actors():
    return {"actors": [], "total": 0}


@router.get("/actors/{actor_id}")
async def get_actor(actor_id: str):
    return {"actor_id": actor_id, "message": "Phase 3 not yet implemented"}


@router.get("/actors/{actor_id}/navigator")
async def export_navigator(actor_id: str):
    return {"actor_id": actor_id, "layer": {}}


@router.post("/actors/{actor_id}/notes")
async def save_notes(actor_id: str, body: dict):
    return {"actor_id": actor_id, "notes": body.get("notes")}
