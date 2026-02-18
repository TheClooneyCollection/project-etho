#!/usr/bin/env python3
"""
Check data/video_info.json for entries with missing title and/or thumbnail.

Skip rule:
  - Ignore Twitch URLs when all matching rows in data/out.json are:
    - Media type == "VOD⏳"
    - row date older than CUTOFF_MONTHS (default: 2)
"""

import os
import json
import calendar
from datetime import datetime, date
from collections import defaultdict
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


OUT_DIR = os.environ.get("OUT_DIR", "../data")
IN_JSON = os.environ.get("IN_JSON", "out.json")
CACHE_JSON = os.environ.get("CACHE_JSON", "video_info.json")
VIDEO_LINK_FIELDS = [
    s.strip()
    for s in os.environ.get("VIDEO_LINK_FIELDS", "timestamp 1 link,ts 2 link").split(",")
    if s.strip()
]
SKIP_MEDIA_TYPE = os.environ.get("SKIP_MEDIA_TYPE", "VOD⏳")
CUTOFF_MONTHS = int(os.environ.get("CUTOFF_MONTHS", "2"))

IN_PATH = os.path.join(OUT_DIR, IN_JSON)
CACHE_PATH = os.path.join(OUT_DIR, CACHE_JSON)


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""

    try:
        u = urlparse(url)
    except Exception:
        return url

    u = u._replace(fragment="")

    if u.netloc.lower() in {"youtu.be"}:
        vid = u.path.strip("/").split("/")[0]
        if vid:
            return f"https://www.youtube.com/watch?v={vid}"

    q = parse_qs(u.query, keep_blank_values=False)
    drop_keys = {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "si",
        "feature",
        "t",
    }
    q2 = {k: v for k, v in q.items() if k not in drop_keys}

    query = urlencode([(k, v) for k, vs in q2.items() for v in vs])
    u = u._replace(query=query)

    scheme = u.scheme or "https"
    u = u._replace(scheme=scheme)

    path = u.path
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    u = u._replace(path=path)

    return urlunparse(u)


def is_twitch(url: str) -> bool:
    return "twitch.tv" in urlparse(url).netloc.lower()


def parse_iso_date(value: str) -> date | None:
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        return dt.date()
    except Exception:
        return None


def subtract_months(d: date, months: int) -> date:
    year = d.year
    month = d.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def should_skip_old_twitch_vod(row: dict, url: str) -> bool:
    if not is_twitch(url):
        return False
    media_type = str(row.get("Media type", "") or "").strip()
    if media_type != SKIP_MEDIA_TYPE:
        return False
    d = (
        parse_iso_date(row.get("Date"))
        or parse_iso_date(row.get("Added date"))
        or parse_iso_date(row.get("date"))
    )
    if not d:
        return False
    cutoff = subtract_months(date.today(), CUTOFF_MONTHS)
    return d < cutoff


def is_blank(value) -> bool:
    return not (isinstance(value, str) and value.strip())


def main():
    rows = load_json(IN_PATH, default=[])
    cache = load_json(CACHE_PATH, default={})

    if not isinstance(rows, list):
        raise SystemExit(f"{IN_PATH} must be a JSON array")
    if not isinstance(cache, dict):
        raise SystemExit(f"{CACHE_PATH} must be a JSON object")

    url_rows = defaultdict(list)
    for row in rows:
        if not isinstance(row, dict):
            continue
        for field in VIDEO_LINK_FIELDS:
            url = normalize_url(str(row.get(field, "") or ""))
            if url:
                url_rows[url].append(row)

    total = len(cache)
    skipped = 0
    flagged = []

    for url, info in cache.items():
        if not isinstance(info, dict):
            continue

        if info.get("source") == "youtube_unavailable":
            skipped += 1
            continue

        linked_rows = url_rows.get(url, [])
        if linked_rows and all(should_skip_old_twitch_vod(r, url) for r in linked_rows):
            skipped += 1
            continue

        missing = []
        if is_blank(info.get("title")):
            missing.append("title")
        if is_blank(info.get("thumbnail")):
            missing.append("thumbnail")
        if missing:
            media_types = sorted({
                str(r.get("Media type", "") or "").strip()
                for r in linked_rows
                if isinstance(r, dict)
            })
            flagged.append({
                "url": url,
                "missing": ", ".join(missing),
                "source": info.get("source") or "",
                "rows": len(linked_rows),
                "media_types": ", ".join([m for m in media_types if m]) or "NO_ROW",
            })

    print(f"Checked {total} cached URLs in {CACHE_PATH}")
    print(f"Skipped {skipped} URLs by old {SKIP_MEDIA_TYPE} Twitch rule ({CUTOFF_MONTHS} months)")
    print(f"Found {len(flagged)} URLs missing title and/or thumbnail")

    if not flagged:
        return

    for item in flagged:
        print(
            f"- [{item['media_types']}] {item['url']} | missing: {item['missing']} "
            f"| source: {item['source']} | rows: {item['rows']}"
        )


if __name__ == "__main__":
    main()
