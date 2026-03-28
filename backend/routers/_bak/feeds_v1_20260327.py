"""
Feed Monitor router — Phase 2.
GET  /api/feeds
POST /api/feeds/refresh
GET  /api/feeds/stats
"""

from fastapi import APIRouter

router = APIRouter(tags=["feeds"])


@router.get("/feeds")
async def get_feeds(
    type: str = None,
    source: str = None,
    since: str = None,
    confidence: int = None,
):
    return {"feed": [], "total": 0}


@router.post("/feeds/refresh")
async def refresh_feeds():
    return {"status": "Phase 2 not yet implemented"}


@router.get("/feeds/stats")
async def get_feed_stats():
    return {"threatfox": 0, "urlhaus": 0, "feodo": 0, "last_refresh": None}
