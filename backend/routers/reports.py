"""
Intelligence Report Generator router — Phase 4.
POST /api/reports
GET  /api/reports
GET  /api/reports/{id}
PUT  /api/reports/{id}
GET  /api/reports/{id}/export
POST /api/reports/{id}/generate
"""

from fastapi import APIRouter

router = APIRouter(tags=["reports"])


@router.post("/reports")
async def create_report(body: dict):
    return {"message": "Phase 4 not yet implemented"}


@router.get("/reports")
async def list_reports():
    return {"reports": []}


@router.get("/reports/{report_id}")
async def get_report(report_id: int):
    return {"id": report_id, "message": "Phase 4 not yet implemented"}


@router.put("/reports/{report_id}")
async def update_report(report_id: int, body: dict):
    return {"id": report_id}


@router.get("/reports/{report_id}/export")
async def export_report(report_id: int):
    return {"markdown": ""}


@router.post("/reports/{report_id}/generate")
async def generate_exec_summary(report_id: int):
    return {"exec_summary": "Phase 4 not yet implemented"}
