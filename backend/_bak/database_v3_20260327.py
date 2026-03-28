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
        """)


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
