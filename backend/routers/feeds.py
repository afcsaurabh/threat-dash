"""
Feed Monitor router — Phase 2.
GET  /api/feeds
POST /api/feeds/refresh
GET  /api/feeds/stats
"""

from fastapi import APIRouter
from backend.services import feeds as feed_svc

router = APIRouter(tags=["feeds"])


@router.get("/feeds")
async def get_feeds(
    type: str = None,
    source: str = None,
    since: str = None,
    confidence: int = None,
    limit: int = 100,
    offset: int = 0,
):
    return feed_svc.query_feeds(
        type=type, source=source, since=since,
        confidence=confidence, limit=limit, offset=offset,
    )


@router.post("/feeds/refresh")
async def refresh_feeds():
    return await feed_svc.refresh_all()


@router.get("/feeds/stats")
async def get_feed_stats():
    return feed_svc.get_feed_stats()
