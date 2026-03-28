"""
Threat Actor Explorer router — Phase 3.
GET  /api/actors/stats
GET  /api/actors?search=&limit=
GET  /api/actors/{id}
GET  /api/actors/{id}/navigator
POST /api/actors/{id}/notes
POST /api/actors/refresh
"""

from fastapi import APIRouter, HTTPException, Query
from backend.services import attck

router = APIRouter(tags=["actors"])


@router.get("/actors/stats")
async def actor_stats():
    return attck.get_actor_stats()


@router.get("/actors/targets")
async def get_targets():
    return attck.get_target_summary()


@router.post("/actors/refresh")
async def refresh_actors():
    result = await attck.refresh_attck()
    return result


@router.get("/actors")
async def list_actors(
    search: str = Query(default=""),
    limit: int = Query(default=300),
):
    return attck.list_actors(search=search, limit=limit)


@router.get("/actors/{actor_id}/navigator")
async def export_navigator(actor_id: str):
    layer = attck.get_navigator_layer(actor_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Actor not found")
    return layer


@router.get("/actors/{actor_id}")
async def get_actor(actor_id: str):
    actor = attck.get_actor(actor_id)
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    return actor


@router.post("/actors/{actor_id}/notes")
async def save_notes(actor_id: str, body: dict):
    return attck.save_notes(actor_id, body.get("notes", ""))
