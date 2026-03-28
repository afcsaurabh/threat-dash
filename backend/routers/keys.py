"""
API key management — local dev only.
POST /api/keys  — set keys in memory (no restart needed, lost on server stop)
GET  /api/keys  — returns which keys are configured (masked, never returns values)
"""

from fastapi import APIRouter
from pydantic import BaseModel

from backend.config import settings

router = APIRouter(tags=["settings"])


class KeysPayload(BaseModel):
    virustotal_api_key: str = ""
    abuseipdb_api_key: str = ""
    greynoise_api_key: str = ""
    anthropic_api_key: str = ""


@router.post("/keys")
async def set_keys(body: KeysPayload):
    """Inject API keys into the running process without restarting the server."""
    if body.virustotal_api_key:
        settings.virustotal_api_key = body.virustotal_api_key
    if body.abuseipdb_api_key:
        settings.abuseipdb_api_key = body.abuseipdb_api_key
    if body.greynoise_api_key:
        settings.greynoise_api_key = body.greynoise_api_key
    if body.anthropic_api_key:
        settings.anthropic_api_key = body.anthropic_api_key
    return _key_status()


@router.get("/keys")
async def get_keys():
    """Returns which keys are currently active. Never returns key values."""
    return _key_status()


def _key_status() -> dict:
    return {
        "virustotal": bool(settings.virustotal_api_key),
        "abuseipdb": bool(settings.abuseipdb_api_key),
        "greynoise": bool(settings.greynoise_api_key),
        "anthropic": bool(settings.anthropic_api_key),
    }
