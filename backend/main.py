"""
threat-dash — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.config import settings
from backend.database import init_db
from backend.routers import enrich, feeds, actors, reports, keys, news

app = FastAPI(
    title="threat-dash API",
    description="CTI analyst dashboard — IOC enrichment, feed monitoring, threat actor research",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrich.router, prefix="/api")
app.include_router(feeds.router, prefix="/api")
app.include_router(actors.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(keys.router, prefix="/api")
app.include_router(news.router, prefix="/api")


@app.on_event("startup")
async def startup():
    init_db()
    if settings.demo_mode:
        print("⚠  DEMO MODE active — all API calls return cached fixtures")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
    }


# Serve React build in production (when frontend/dist exists)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
