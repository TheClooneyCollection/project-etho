#!/usr/bin/env python3
"""
Enrich out.json with video titles + thumbnails, using a local cache.

Inputs (defaults assume your existing pipeline output):
  - /out/out.json
  - /out/video_info.json  (cache; created if missing)

Outputs:
  - /out/out.enriched.json
  - /out/video_info.json  (updated)

Fetch strategy:
  - YouTube: oEmbed for title; deterministic i.ytimg.com thumbnails (maxres -> hq -> mq -> sd)
  - Twitch VOD: scrape og:title + og:image from HTML

Config via env:
  OUT_DIR=/out
  IN_JSON=out.json
  OUT_JSON=out.enriched.json
  CACHE_JSON=video_info.json
  VIDEO_LINK_FIELDS="timestamp 1 link,ts 2 link"   # fields in out.json to treat as URLs
  SLEEP_SECS=0.2
  TIMEOUT_SECS=20
  USER_AGENT="Mozilla/5.0 ..."
"""

import os
import re
import json
import time
import html
import hashlib
import calendar
from datetime import datetime, date
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

import requests


OUT_DIR = os.environ.get("OUT_DIR", "/out")
IN_JSON = os.environ.get("IN_JSON", "out.json")
OUT_JSON = os.environ.get("OUT_JSON", "out.enriched.json")
CACHE_JSON = os.environ.get("CACHE_JSON", "video_info.json")

VIDEO_LINK_FIELDS = [s.strip() for s in os.environ.get(
    "VIDEO_LINK_FIELDS", "timestamp 1 link,ts 2 link"
).split(",") if s.strip()]

SLEEP_SECS = float(os.environ.get("SLEEP_SECS", "0.2"))
TIMEOUT_SECS = int(os.environ.get("TIMEOUT_SECS", "20"))
USER_AGENT = os.environ.get(
    "USER_AGENT",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
)

IN_PATH = os.path.join(OUT_DIR, IN_JSON)
OUT_PATH = os.path.join(OUT_DIR, OUT_JSON)
CACHE_PATH = os.path.join(OUT_DIR, CACHE_JSON)

session = requests.Session()
session.headers.update({
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, path)


def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def normalize_url(url: str) -> str:
    """
    Canonicalize URLs so your cache key is stable.
    - strip whitespace
    - normalize youtu.be -> youtube watch URL
    - remove common tracking params
    """
    url = (url or "").strip()
    if not url:
        return ""

    try:
        u = urlparse(url)
    except Exception:
        return url

    # drop fragments
    u = u._replace(fragment="")

    # Normalize youtu.be/<id> -> youtube.com/watch?v=<id>
    if u.netloc.lower() in {"youtu.be"}:
        vid = u.path.strip("/").split("/")[0]
        if vid:
            return f"https://www.youtube.com/watch?v={vid}"

    # Remove tracking params
    q = parse_qs(u.query, keep_blank_values=False)
    drop_keys = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "si", "feature", "t"
    }
    q2 = {k: v for k, v in q.items() if k not in drop_keys}

    query = urlencode([(k, v) for k, vs in q2.items() for v in vs])
    u = u._replace(query=query)

    # default to https where possible
    scheme = u.scheme or "https"
    u = u._replace(scheme=scheme)

    # Remove trailing slash for non-root paths (helps twitch/youtube consistency)
    path = u.path
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    u = u._replace(path=path)

    return urlunparse(u)


_YT_ID_RE = re.compile(r"(?:v=|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{6,})")


def youtube_video_id(url: str) -> str | None:
    u = urlparse(url)
    if "youtube.com" in u.netloc.lower():
        q = parse_qs(u.query)
        if "v" in q and q["v"]:
            return q["v"][0]
        m = _YT_ID_RE.search(url)
        return m.group(1) if m else None
    if "youtu.be" in u.netloc.lower():
        return u.path.strip("/").split("/")[0] or None
    return None


def is_youtube(url: str) -> bool:
    n = urlparse(url).netloc.lower()
    return "youtube.com" in n or "youtu.be" in n


def is_twitch(url: str) -> bool:
    return "twitch.tv" in urlparse(url).netloc.lower()


def http_get_text(url: str) -> str:
    r = session.get(url, timeout=TIMEOUT_SECS)
    r.raise_for_status()
    return r.text


def http_head_ok(url: str) -> bool:
    try:
        r = session.head(url, timeout=TIMEOUT_SECS, allow_redirects=True)
        return 200 <= r.status_code < 300
    except Exception:
        return False


def youtube_oembed_title(url: str) -> str | None:
    # public endpoint, no key
    oembed = "https://www.youtube.com/oembed?url=" + requests.utils.quote(url, safe="")
    oembed += "&format=json"
    try:
        r = session.get(oembed, timeout=TIMEOUT_SECS)
        if r.status_code != 200:
            return None
        data = r.json()
        title = data.get("title")
        return title.strip() if isinstance(title, str) and title.strip() else None
    except Exception:
        return None


def youtube_thumbnail_from_id(vid: str) -> str | None:
    # Prefer maxres if it exists
    candidates = [
        f"https://i.ytimg.com/vi/{vid}/maxresdefault.jpg",
        f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
        f"https://i.ytimg.com/vi/{vid}/sddefault.jpg",
    ]
    for c in candidates:
        if http_head_ok(c):
            return c
    # If HEAD is blocked sometimes, at least return hqdefault as a best guess
    return candidates[1]


# EXACTLY matches:
# curl ... | rg -o 'property="og:image" content="[^"]+"' -m 1 | rg -o 'https?://[^"]+'
_TWITCH_OG_IMAGE_BLOCK = re.compile(r'property="og:image" content="[^"]+"')
_HTTP_URL = re.compile(r'https?://[^"]+')
_TWITCH_BAD_THUMBNAILS = {
    "https://vod-secure.twitch.tv/_404/404_processing_640x360.png",
}

_TWITCH_OG_TITLE_BLOCK = re.compile(r'property="og:title" content="[^"]+"')
# (optional, but keeps title consistent with the same style)


def sanitize_twitch_thumbnail(thumb: str | None) -> str | None:
    if not isinstance(thumb, str):
        return None
    value = thumb.strip()
    if not value or value in _TWITCH_BAD_THUMBNAILS:
        return None
    return value


def twitch_vod_meta(url: str) -> tuple[str | None, str | None]:
    # Important: keep the URL exactly as-is (incl ?t=) to mirror your curl behavior.
    try:
        t = http_get_text(url)
    except Exception:
        return None, None

    title = None
    thumb = None

    # Title: follow the same "first match" approach (optional but recommended)
    m_title = _TWITCH_OG_TITLE_BLOCK.search(t)
    if m_title:
        m_url = re.search(r'content="([^"]+)"', m_title.group(0))
        if m_url:
            title = html.unescape(m_url.group(1)).strip() or None

    # Thumbnail: EXACT curl/rg pattern
    m_img = _TWITCH_OG_IMAGE_BLOCK.search(t)
    if m_img:
        m_url = _HTTP_URL.search(m_img.group(0))
        if m_url:
            thumb = sanitize_twitch_thumbnail(m_url.group(0))

    return title, thumb


def fetch_video_info(url: str) -> dict:
    """
    Returns dict with keys:
      - title (optional)
      - thumbnail (optional)
      - source (youtube_oembed / youtube_thumb / twitch_og / unknown)
    """
    info = {"title": None, "thumbnail": None, "source": None}

    if is_youtube(url):
        vid = youtube_video_id(url)
        if vid:
            info["thumbnail"] = youtube_thumbnail_from_id(vid)
            info["source"] = "youtube_thumb"
        title = youtube_oembed_title(url)
        if title:
            info["title"] = title
            info["source"] = "youtube_oembed"
        return info

    if is_twitch(url):
        title, image = twitch_vod_meta(url)
        info["title"] = title
        info["thumbnail"] = sanitize_twitch_thumbnail(image)
        info["source"] = "twitch_og"
        return info

    info["source"] = "unknown"
    return info


def base_name_from_link_field(field: str) -> str:
    # "timestamp 1 link" -> "timestamp 1"
    s = field.strip()
    if s.lower().endswith(" link"):
        return s[:-5].rstrip()
    return s


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
    if media_type != "VOD⏳":
        return False
    d = (
        parse_iso_date(row.get("Date"))
        or parse_iso_date(row.get("Added date"))
        or parse_iso_date(row.get("date"))
    )
    if not d:
        return False
    cutoff = subtract_months(date.today(), 3)
    return d < cutoff


def main():
    rows = load_json(IN_PATH, default=[])
    cache = load_json(CACHE_PATH, default={})
    existing_output = load_json(OUT_PATH, default={})

    if not isinstance(cache, dict):
        raise SystemExit("video_info.json must be a JSON object (map of url -> info)")

    for cached_url, cached_info in cache.items():
        if not (isinstance(cached_info, dict) and is_twitch(cached_url)):
            continue
        cached_info["thumbnail"] = sanitize_twitch_thumbnail(cached_info.get("thumbnail"))

    # Collect unique URLs to fetch
    wanted = []
    seen = set()
    url_skip = {}

    for row in rows:
        if not isinstance(row, dict):
            continue
        for field in VIDEO_LINK_FIELDS:
            url = normalize_url(str(row.get(field, "") or ""))
            if not url:
                continue
            if url in seen:
                skip = should_skip_old_twitch_vod(row, url)
                url_skip[url] = url_skip.get(url, True) and skip
                continue
            seen.add(url)
            skip = should_skip_old_twitch_vod(row, url)
            url_skip[url] = url_skip.get(url, True) and skip
            if url not in cache and not url_skip[url]:
                wanted.append(url)

    skipped = [u for u, skip in url_skip.items() if skip and u not in cache]
    print(f"Found {len(seen)} unique URLs, {len(wanted)} new to fetch.")
    if skipped:
        print(f"Skipping {len(skipped)} Twitch VOD⏳ URLs older than 3 months:")
        for u in skipped:
            print(f"  - {u}")

    # Fetch new ones with light throttling
    for i, url in enumerate(wanted, 1):
        print(f"[{i}/{len(wanted)}] Fetching: {url}")
        try:
            info = fetch_video_info(url)
            info["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            cache[url] = info
        except Exception as e:
            cache[url] = {
                "title": None,
                "thumbnail": None,
                "source": "error",
                "error": str(e),
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        time.sleep(SLEEP_SECS)

    # Enrich rows
    enriched = []
    for row in rows:
        if not isinstance(row, dict):
            enriched.append(row)
            continue

        out = dict(row)
        for field in VIDEO_LINK_FIELDS:
            url_raw = row.get(field, "")
            url = normalize_url(str(url_raw or ""))
            base = base_name_from_link_field(field)

            title_field = f"{base} title"
            thumb_field = f"{base} thumbnail"

            if not url:
                out[title_field] = ""
                out[thumb_field] = ""
                continue
            if should_skip_old_twitch_vod(row, url):
                out[title_field] = ""
                out[thumb_field] = ""
                continue

            info = cache.get(url, {})
            out[title_field] = info.get("title") or ""
            out[thumb_field] = info.get("thumbnail") or ""

        enriched.append(out)

    existing_videos = []
    existing_last_updated = None
    if isinstance(existing_output, dict):
        videos = existing_output.get("videos")
        metadata = existing_output.get("metadata")
        if isinstance(videos, list):
            existing_videos = videos
        if isinstance(metadata, dict):
            ts = metadata.get("last_updated")
            if isinstance(ts, str) and ts.strip():
                existing_last_updated = ts.strip()

    videos_changed = enriched != existing_videos
    if videos_changed or not existing_last_updated:
        last_updated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    else:
        last_updated = existing_last_updated

    enriched_output = {
        "videos": enriched,
        "metadata": {
            "last_updated": last_updated,
        },
    }

    save_json(CACHE_PATH, cache)
    save_json(OUT_PATH, enriched_output)

    print("Wrote:", CACHE_PATH)
    print("Wrote:", OUT_PATH)
    if videos_changed:
        print("Videos changed; updated metadata.last_updated.")
    else:
        print("Videos unchanged; kept existing metadata.last_updated.")


if __name__ == "__main__":
    main()
