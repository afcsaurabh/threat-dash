"""
MITRE ATT&CK Service — Phase 3.
Downloads the enterprise ATT&CK STIX bundle from MITRE's GitHub, parses
Groups (threat actors), Techniques, and their relationships, and caches
everything in SQLite for fast queries.

No extra libraries required — uses httpx (already a dependency) and plain JSON.
"""

import json
import httpx
from backend.database import get_connection

ATTCK_BUNDLE_URL = (
    "https://raw.githubusercontent.com/mitre/cti/master/"
    "enterprise-attack/enterprise-attack.json"
)

COUNTRY_LOOKUP = {
    "APT1": "CN", "APT10": "CN", "APT12": "CN", "APT16": "CN",
    "APT17": "CN", "APT18": "CN", "APT19": "CN", "APT28": "RU",
    "APT29": "RU", "APT30": "CN", "APT32": "VN", "APT33": "IR",
    "APT34": "IR", "APT37": "KP", "APT38": "KP", "APT39": "IR",
    "APT40": "CN", "APT41": "CN", "Axiom": "CN", "Charming Kitten": "IR",
    "Cozy Bear": "RU", "Fancy Bear": "RU", "Goblin Panda": "CN",
    "Kimsuky": "KP", "Lazarus Group": "KP", "Leviathan": "CN",
    "Machete": "VZ", "Magic Hound": "IR", "Mustang Panda": "CN",
    "OilRig": "IR", "Patchwork": "IN", "Sandworm Team": "RU",
    "Scarlet Mimic": "CN", "Silent Chollima": "KP", "TA505": "RU",
    "TA551": "UA", "Temp.Veles": "RU", "The Dukes": "RU",
    "Threat Group-3390": "CN", "Turla": "RU", "WIRTE": "PS",
    "Winnti Group": "CN", "Wizard Spider": "RU", "ZIRCONIUM": "CN",
    "Equation": "US", "Elderwood": "CN", "FIN7": "RU", "FIN8": "RU",
    "LAPSUS$": "BR", "Scattered Spider": "UK",
}


def _infer_country(g: dict) -> str | None:
    name = g.get("name", "")
    if name in COUNTRY_LOOKUP:
        return COUNTRY_LOOKUP[name]
    for alias in g.get("aliases", []):
        if alias in COUNTRY_LOOKUP:
            return COUNTRY_LOOKUP[alias]
    return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ext_id(obj: dict) -> str | None:
    """Return the MITRE ATT&CK external ID (e.g. G0007, T1566) for a STIX object."""
    for ref in obj.get("external_references", []):
        if ref.get("source_name") == "mitre-attack":
            return ref.get("external_id")
    return None


def _tactics(obj: dict) -> list[str]:
    """Return ATT&CK tactic phase names from kill_chain_phases."""
    return [
        kc["phase_name"]
        for kc in obj.get("kill_chain_phases", [])
        if kc.get("kill_chain_name") == "mitre-attack"
    ]


def _is_active(obj: dict) -> bool:
    return not obj.get("revoked") and not obj.get("x_mitre_deprecated")


# ---------------------------------------------------------------------------
# Refresh — download + parse + store
# ---------------------------------------------------------------------------

async def refresh_attck() -> dict:
    """Fetch the ATT&CK STIX bundle and repopulate the three cache tables."""
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(ATTCK_BUNDLE_URL)
        resp.raise_for_status()

    bundle = resp.json()
    objects = bundle.get("objects", [])

    groups = {
        o["id"]: o
        for o in objects
        if o["type"] == "intrusion-set" and _is_active(o)
    }
    techniques = {
        o["id"]: o
        for o in objects
        if o["type"] == "attack-pattern" and _is_active(o)
    }

    with get_connection() as conn:
        conn.execute("DELETE FROM actor_techniques")
        conn.execute("DELETE FROM actor_groups")
        conn.execute("DELETE FROM attack_techniques")

        for stix_id, g in groups.items():
            conn.execute(
                """
                INSERT OR REPLACE INTO actor_groups
                    (stix_id, external_id, name, aliases, description, country)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    stix_id,
                    _ext_id(g),
                    g["name"],
                    json.dumps(g.get("aliases", [])),
                    (g.get("description") or "")[:2000],
                    COUNTRY_LOOKUP.get(g["name"]) or _infer_country(g),
                ),
            )

        for stix_id, t in techniques.items():
            conn.execute(
                """
                INSERT OR REPLACE INTO attack_techniques
                    (stix_id, technique_id, name, description, tactics, platforms)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    stix_id,
                    _ext_id(t),
                    t["name"],
                    (t.get("description") or "")[:1000],
                    json.dumps(_tactics(t)),
                    json.dumps(t.get("x_mitre_platforms", [])),
                ),
            )

        for o in objects:
            if (
                o.get("type") == "relationship"
                and o.get("relationship_type") == "uses"
                and o.get("source_ref") in groups
                and o.get("target_ref") in techniques
            ):
                conn.execute(
                    """
                    INSERT OR IGNORE INTO actor_techniques
                        (actor_stix_id, technique_stix_id)
                    VALUES (?, ?)
                    """,
                    (o["source_ref"], o["target_ref"]),
                )

        # Parse identity objects and targets relationships
        identities = {o["id"]: o for o in objects if o["type"] == "identity"}
        conn.execute("DELETE FROM actor_targets")
        for o in objects:
            if (
                o.get("type") == "relationship"
                and o.get("relationship_type") == "targets"
                and o.get("source_ref") in groups
                and o.get("target_ref") in identities
            ):
                identity = identities[o["target_ref"]]
                conn.execute(
                    """
                    INSERT OR IGNORE INTO actor_targets
                        (actor_stix_id, target_name, target_type, target_sector)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        o["source_ref"],
                        identity.get("name", ""),
                        identity.get("identity_class", ""),
                        ",".join(identity.get("sectors", [])),
                    ),
                )

    return {
        "groups": len(groups),
        "techniques": len(techniques),
        "message": "ATT&CK data refreshed successfully",
    }


# ---------------------------------------------------------------------------
# Read — queries
# ---------------------------------------------------------------------------

def get_actor_stats() -> dict:
    with get_connection() as conn:
        g_count = conn.execute("SELECT COUNT(*) FROM actor_groups").fetchone()[0]
        t_count = conn.execute("SELECT COUNT(*) FROM attack_techniques").fetchone()[0]
        last_updated = conn.execute(
            "SELECT MAX(last_updated) FROM actor_groups"
        ).fetchone()[0]
    return {"groups": g_count, "techniques": t_count, "last_updated": last_updated}


def list_actors(search: str = "", limit: int = 300) -> dict:
    with get_connection() as conn:
        q = search.lower()
        if q:
            rows = conn.execute(
                """
                SELECT ag.stix_id, ag.external_id, ag.name, ag.aliases,
                       ag.description, ag.country,
                       COUNT(at2.technique_stix_id) AS technique_count
                FROM actor_groups ag
                LEFT JOIN actor_techniques at2 ON at2.actor_stix_id = ag.stix_id
                WHERE lower(ag.name) LIKE ? OR lower(ag.aliases) LIKE ?
                GROUP BY ag.stix_id
                ORDER BY ag.name
                LIMIT ?
                """,
                (f"%{q}%", f"%{q}%", limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT ag.stix_id, ag.external_id, ag.name, ag.aliases,
                       ag.description, ag.country,
                       COUNT(at2.technique_stix_id) AS technique_count
                FROM actor_groups ag
                LEFT JOIN actor_techniques at2 ON at2.actor_stix_id = ag.stix_id
                GROUP BY ag.stix_id
                ORDER BY ag.name
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

    actors = [
        {
            "id": r["external_id"] or r["stix_id"],
            "stix_id": r["stix_id"],
            "external_id": r["external_id"],
            "name": r["name"],
            "aliases": json.loads(r["aliases"] or "[]"),
            "description": r["description"] or "",
            "country": r["country"],
            "technique_count": r["technique_count"],
        }
        for r in rows
    ]
    return {"actors": actors, "total": len(actors)}


def get_actor(external_id: str) -> dict | None:
    with get_connection() as conn:
        g = conn.execute(
            """
            SELECT stix_id, external_id, name, aliases, description, country
            FROM actor_groups WHERE external_id = ?
            """,
            (external_id,),
        ).fetchone()

        if not g:
            return None

        stix_id = g["stix_id"]

        notes_row = conn.execute(
            "SELECT notes FROM actor_notes WHERE actor_id = ?", (external_id,)
        ).fetchone()

        rows = conn.execute(
            """
            SELECT t.stix_id, t.technique_id, t.name, t.description,
                   t.tactics, t.platforms
            FROM attack_techniques t
            JOIN actor_techniques at2 ON at2.technique_stix_id = t.stix_id
            WHERE at2.actor_stix_id = ?
            ORDER BY t.technique_id
            """,
            (stix_id,),
        ).fetchall()

    techniques = [
        {
            "id": r["technique_id"],
            "name": r["name"],
            "description": r["description"] or "",
            "tactics": json.loads(r["tactics"] or "[]"),
            "platforms": json.loads(r["platforms"] or "[]"),
        }
        for r in rows
    ]

    return {
        "id": g["external_id"] or g["stix_id"],
        "external_id": g["external_id"],
        "name": g["name"],
        "aliases": json.loads(g["aliases"] or "[]"),
        "description": g["description"] or "",
        "country": g["country"],
        "notes": notes_row["notes"] if notes_row else "",
        "techniques": techniques,
    }


def save_notes(actor_id: str, notes: str) -> dict:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO actor_notes (actor_id, notes, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(actor_id) DO UPDATE
                SET notes = excluded.notes,
                    updated_at = excluded.updated_at
            """,
            (actor_id, notes),
        )
    return {"actor_id": actor_id, "saved": True}


def get_top_actors(country: str = None, sector: str = None, limit: int = 10) -> list[dict]:
    """Return top actors by technique count, optionally filtered by country or targeted sector."""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT ag.stix_id, ag.external_id, ag.name, ag.aliases,
                   ag.country, COUNT(at2.technique_stix_id) AS technique_count
            FROM actor_groups ag
            LEFT JOIN actor_techniques at2 ON at2.actor_stix_id = ag.stix_id
            GROUP BY ag.stix_id
            ORDER BY technique_count DESC
            LIMIT 100
            """
        ).fetchall()

        sector_stix_ids: set[str] | None = None
        if sector:
            sector_rows = conn.execute(
                "SELECT DISTINCT actor_stix_id FROM actor_targets WHERE target_sector LIKE ?",
                (f"%{sector}%",),
            ).fetchall()
            sector_stix_ids = {r[0] for r in sector_rows}

    actors = []
    for r in rows:
        if country and r["country"] != country:
            continue
        if sector_stix_ids is not None and r["stix_id"] not in sector_stix_ids:
            continue
        actors.append({
            "id": r["external_id"] or r["stix_id"],
            "name": r["name"],
            "country": r["country"],
            "technique_count": r["technique_count"],
            "aliases": json.loads(r["aliases"] or "[]"),
        })
        if len(actors) >= limit:
            break

    return actors


def get_target_summary() -> dict:
    """Return top targeted sectors and named orgs across all actors."""
    with get_connection() as conn:
        sector_rows = conn.execute(
            """
            SELECT target_sector, COUNT(*) as cnt
            FROM actor_targets
            WHERE target_sector != '' AND target_sector IS NOT NULL
            GROUP BY target_sector
            ORDER BY cnt DESC
            LIMIT 30
            """
        ).fetchall()

        org_rows = conn.execute(
            """
            SELECT at.target_name, at.target_sector, ag.name as actor_name
            FROM actor_targets at
            JOIN actor_groups ag ON ag.stix_id = at.actor_stix_id
            WHERE at.target_type = 'organization' AND at.target_name != ''
            ORDER BY ag.name
            LIMIT 20
            """
        ).fetchall()

    # Expand comma-separated sectors and aggregate counts
    sector_counts: dict[str, int] = {}
    for r in sector_rows:
        for s in (r["target_sector"] or "").split(","):
            s = s.strip()
            if s:
                sector_counts[s] = sector_counts.get(s, 0) + r["cnt"]

    sectors = sorted(
        [{"sector": k, "count": v} for k, v in sector_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    return {
        "sectors": sectors,
        "named_orgs": [
            {
                "name": r["target_name"],
                "sector": r["target_sector"],
                "actor": r["actor_name"],
            }
            for r in org_rows
        ],
    }


def get_country_actor_map() -> dict[str, list[str]]:
    """Return mapping of country code → list of actor names (for map panel)."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT name, country FROM actor_groups WHERE country IS NOT NULL"
        ).fetchall()
    result: dict[str, list[str]] = {}
    for r in rows:
        result.setdefault(r["country"], []).append(r["name"])
    return result


def get_navigator_layer(external_id: str) -> dict | None:
    actor = get_actor(external_id)
    if not actor:
        return None

    layer = {
        "name": f"{actor['name']} — threat-dash",
        "versions": {"attack": "14", "navigator": "4.9.1", "layer": "4.5"},
        "domain": "enterprise-attack",
        "description": f"TTPs attributed to {actor['name']} (exported from threat-dash)",
        "techniques": [
            {
                "techniqueID": t["id"],
                "tactic": t["tactics"][0] if t["tactics"] else None,
                "color": "#e05622",
                "comment": f"Used by {actor['name']}",
                "enabled": True,
                "score": 1,
            }
            for t in actor["techniques"]
            if t.get("id")
        ],
        "gradient": {"colors": ["#ffffff", "#e05622"], "minValue": 0, "maxValue": 1},
        "legendItems": [{"label": actor["name"], "color": "#e05622"}],
        "hideDisabled": False,
        "metadata": [],
    }
    return layer
