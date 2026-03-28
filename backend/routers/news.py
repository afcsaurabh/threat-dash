"""
News Intelligence router — Phase 2 (supplementary).
GET  /api/news
POST /api/news/refresh
GET  /api/news/stats
"""

from fastapi import APIRouter
from backend.services import news as news_svc

router = APIRouter(tags=["news"])


@router.get("/news")
async def get_news(source: str = None, limit: int = 60, offset: int = 0):
    return news_svc.query_news(source=source, limit=limit, offset=offset)


@router.post("/news/refresh")
async def refresh_news():
    return await news_svc.refresh_all()


@router.get("/news/stats")
async def get_news_stats():
    return news_svc.get_news_stats()
