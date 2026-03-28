"""
News Aggregation Service — Phase 2 (supplementary).
Pulls security news from open sources — no API keys required.

Sources:
  Hacker News  — Algolia HN Search API (free, no key)
  CyberScoop   — RSS feed
  Krebs on Security — RSS feed
  BleepingComputer  — RSS feed
  CISA Advisories   — RSS feed (official US govt)
  The Hacker News   — RSS feed
"""

import asyncio
import hashlib
from datetime import datetime, timezone

import feedparser
import httpx

from backend.database import get_connection

TIMEOUT = httpx.Timeout(20.0)

CATEGORY_PATTERNS = {
    "ransomware":   r"ransomware|extortion|lockbit|blackcat|cl0p|dark web leak",
    "nation-state": r"\bapt\b|nation.state|espionage|state.sponsored|lazarus|apt28|apt41|sandworm",
    "vulnerabilities": r"cve-\d|zero.day|vulnerability|patch tuesday|exploit|rce\b|lpe\b",
    "data-breach":  r"breach|data leak|credential|stolen|exposed database",
    "government":   r"\bcisa\b|\bnist\b|executive order|legislation|sanctions|advisory",
    "incident":     r"incident|post.mortem|forensic|attributed|investigation",
}


def _tag_categories(title: str, summary: str) -> str:
    import re
    text = (title + " " + summary).lower()
    matched = [cat for cat, pattern in CATEGORY_PATTERNS.items() if re.search(pattern, text)]
    return ",".join(matched) if matched else "uncategorized"

# Algolia HN search — queries recent security stories
HN_ALGOLIA = (
    "https://hn.algolia.com/api/v1/search"
    "?query=cybersecurity+malware+breach+ransomware+vulnerability"
    "&tags=story"
    "&hitsPerPage=40"
)

RSS_SOURCES = {
    "cyberscoop":       "https://cyberscoop.com/feed/",
    "krebs":            "https://krebsonsecurity.com/feed/",
    "bleepingcomputer": "https://www.bleepingcomputer.com/feed/",
    "cisa":             "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    "thehackernews":    "https://feeds.feedburner.com/TheHackersNews",
}

SOURCE_LABELS = {
    "hackernews":       "Hacker News",
    "cyberscoop":       "CyberScoop",
    "krebs":            "Krebs on Security",
    "bleepingcomputer": "BleepingComputer",
    "cisa":             "CISA",
    "thehackernews":    "The Hacker News",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _article_id(source: str, url: str) -> str:
    h = hashlib.sha1(url.encode()).hexdigest()[:12]
    return f"{source}:{h}"


def _store_articles(articles: list[dict]) -> int:
    count = 0
    with get_connection() as conn:
        for a in articles:
            try:
                categories = _tag_categories(a.get("title", ""), a.get("summary", ""))
                conn.execute(
                    """
                    INSERT OR IGNORE INTO news_cache
                        (article_id, title, url, source, published_at, summary, score, author, categories)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        a["article_id"],
                        a["title"],
                        a.get("url", ""),
                        a["source"],
                        a.get("published_at", ""),
                        a.get("summary", ""),
                        a.get("score", 0),
                        a.get("author", ""),
                        categories,
                    ),
                )
                count += 1
            except Exception:
                pass
    return count


# ---------------------------------------------------------------------------
# Per-source fetchers
# ---------------------------------------------------------------------------

async def _fetch_hackernews(client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(HN_ALGOLIA, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    articles = []
    for hit in data.get("hits", []):
        url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
        articles.append({
            "article_id": _article_id("hackernews", url),
            "title": hit.get("title", ""),
            "url": url,
            "source": "hackernews",
            "published_at": hit.get("created_at", ""),
            "summary": "",
            "score": hit.get("points") or 0,
            "author": hit.get("author", ""),
        })
    return articles


async def _fetch_rss(client: httpx.AsyncClient, source: str, feed_url: str) -> list[dict]:
    resp = await client.get(feed_url, timeout=TIMEOUT)
    resp.raise_for_status()
    # feedparser is synchronous — run in thread to avoid blocking the event loop
    parsed = await asyncio.to_thread(feedparser.parse, resp.text)
    articles = []
    for entry in parsed.entries[:30]:
        url = entry.get("link", "")
        if not url:
            continue
        summary = entry.get("summary", "") or entry.get("description", "")
        # Strip HTML tags crudely — just take first 300 chars of text
        if summary:
            import re
            summary = re.sub(r"<[^>]+>", " ", summary)
            summary = " ".join(summary.split())[:300]
        published = ""
        if hasattr(entry, "published"):
            published = entry.published
        elif hasattr(entry, "updated"):
            published = entry.updated
        articles.append({
            "article_id": _article_id(source, url),
            "title": entry.get("title", ""),
            "url": url,
            "source": source,
            "published_at": published,
            "summary": summary,
            "score": 0,
            "author": entry.get("author", ""),
        })
    return articles


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def refresh_all() -> dict:
    """Fetch from all sources concurrently and persist new articles."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [_fetch_hackernews(client)] + [
            _fetch_rss(client, source, url)
            for source, url in RSS_SOURCES.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    counts: dict[str, int] = {}
    errors = []
    source_names = ["hackernews"] + list(RSS_SOURCES.keys())

    for source, result in zip(source_names, results):
        if isinstance(result, Exception):
            errors.append(f"{source}: {result}")
            counts[source] = 0
        else:
            stored = _store_articles(result)
            counts[source] = stored

    return {
        "counts": counts,
        "total": sum(counts.values()),
        "errors": errors,
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
    }


def query_news(source: str = None, category: str = None, limit: int = 60, offset: int = 0) -> dict:
    conditions: list[str] = []
    params: list = []

    if source:
        conditions.append("source = ?")
        params.append(source)

    if category and category != "all":
        conditions.append("categories LIKE ?")
        params.append(f"%{category}%")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM news_cache {where}", params
        ).fetchone()[0]

        rows = conn.execute(
            f"""
            SELECT article_id, title, url, source, published_at, summary, score, author, fetched_at, categories
            FROM news_cache {where}
            ORDER BY fetched_at DESC, score DESC
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        ).fetchall()

    return {
        "articles": [dict(r) for r in rows],
        "total": total,
        "source_labels": SOURCE_LABELS,
    }


def get_news_stats() -> dict:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT source, COUNT(*) AS cnt, MAX(fetched_at) AS last_fetch
            FROM news_cache
            GROUP BY source
            """
        ).fetchall()
    return {
        "by_source": {r["source"]: {"count": r["cnt"], "last_fetch": r["last_fetch"]} for r in rows},
        "source_labels": SOURCE_LABELS,
    }
