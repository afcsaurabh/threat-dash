"""
SQLite connection and schema initialization.
Tables: ioc_history, ioc_tags, feed_cache, actor_notes, reports, news_cache
"""

import sqlite3
from contextlib import contextmanager
from backend.config import settings


def init_db() -> None:
    """Create all tables if they don't exist. Called on app startup."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS ioc_history (
                id INTEGER PRIMARY KEY,
                ioc TEXT NOT NULL,
                ioc_type TEXT,
                risk_rating TEXT,
                vt_result TEXT,
                abuseipdb_result TEXT,
                greynoise_result TEXT,
                queried_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ioc_tags (
                id INTEGER PRIMARY KEY,
                ioc TEXT NOT NULL,
                tag TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS feed_cache (
                id INTEGER PRIMARY KEY,
                ioc TEXT NOT NULL,
                ioc_type TEXT,
                source TEXT,
                confidence INTEGER,
                threat_type TEXT,
                malware_family TEXT,
                first_seen TIMESTAMP,
                ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ioc, source)
            );

            CREATE TABLE IF NOT EXISTS actor_notes (
                id INTEGER PRIMARY KEY,
                actor_id TEXT NOT NULL UNIQUE,
                notes TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY,
                title TEXT,
                actor_id TEXT,
                exec_summary TEXT,
                actor_profile TEXT,
                ttps_json TEXT,
                iocs_json TEXT,
                mitigations TEXT,
                analyst_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_cache (
                id INTEGER PRIMARY KEY,
                article_id TEXT UNIQUE,
                title TEXT NOT NULL,
                url TEXT,
                source TEXT NOT NULL,
                published_at TEXT,
                summary TEXT,
                score INTEGER DEFAULT 0,
                author TEXT,
                fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS actor_groups (
                stix_id TEXT PRIMARY KEY,
                external_id TEXT UNIQUE,
                name TEXT NOT NULL,
                aliases TEXT,
                description TEXT,
                country TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS attack_techniques (
                stix_id TEXT PRIMARY KEY,
                technique_id TEXT UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                tactics TEXT,
                platforms TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS actor_techniques (
                actor_stix_id TEXT NOT NULL,
                technique_stix_id TEXT NOT NULL,
                PRIMARY KEY (actor_stix_id, technique_stix_id)
            );

            CREATE TABLE IF NOT EXISTS actor_targets (
                id INTEGER PRIMARY KEY,
                actor_stix_id TEXT NOT NULL,
                target_name TEXT,
                target_type TEXT,
                target_sector TEXT,
                UNIQUE(actor_stix_id, target_name)
            );
        """)
        # Migrate existing feed_cache tables that predate Phase 2 columns.
        for col, typedef in [("threat_type", "TEXT"), ("malware_family", "TEXT")]:
            try:
                conn.execute(f"ALTER TABLE feed_cache ADD COLUMN {col} {typedef}")
            except Exception:
                pass
        # Migrate news_cache — add categories column (Phase 4b).
        try:
            conn.execute("ALTER TABLE news_cache ADD COLUMN categories TEXT DEFAULT ''")
        except Exception:
            pass
        # Migrate reports — add 8 new fields (Phase 4b).
        for col, typedef in [
            ("tlp", "TEXT DEFAULT 'WHITE'"),
            ("confidence", "TEXT DEFAULT 'UNASSESSED'"),
            ("date_from", "TEXT"),
            ("date_to", "TEXT"),
            ("affected_sectors", "TEXT"),
            ("named_victims", "TEXT"),
            ("detection_notes", "TEXT"),
            ("references_json", "TEXT"),
        ]:
            try:
                conn.execute(f"ALTER TABLE reports ADD COLUMN {col} {typedef}")
            except Exception:
                pass


@contextmanager
def get_connection():
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
