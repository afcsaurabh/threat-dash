"""
Intelligence Report Generator router — Phase 4.
POST   /api/reports
GET    /api/reports
GET    /api/reports/{id}
PUT    /api/reports/{id}
POST   /api/reports/{id}/generate
GET    /api/reports/{id}/export
"""

from fastapi import APIRouter, HTTPException
from backend.services import reports as svc

router = APIRouter(tags=["reports"])


@router.post("/reports")
async def create_report(body: dict):
    report = svc.create_report(
        title=body.get("title", "Untitled Report"),
        actor_id=body.get("actor_id") or None,
        ioc_text=body.get("ioc_text", ""),
        analyst_notes=body.get("analyst_notes", ""),
    )
    return report


@router.get("/reports")
async def list_reports():
    return {"reports": svc.list_reports()}


@router.get("/reports/{report_id}")
async def get_report(report_id: int):
    report = svc.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/reports/{report_id}")
async def update_report(report_id: int, body: dict):
    report = svc.update_report(report_id, body)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/reports/{report_id}/generate")
async def generate_exec_summary(report_id: int):
    result = await svc.generate_exec_summary(report_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/reports/{report_id}/export")
async def export_report(report_id: int):
    markdown = svc.export_markdown(report_id)
    if markdown is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"markdown": markdown}
