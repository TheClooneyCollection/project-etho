#!/usr/bin/env python3
import json
import sys
from pathlib import Path

BAD_THUMB = "https://static-cdn.jtvnw.net/ttv-static-metadata/twitch_logo3.jpg"

path = Path(sys.argv[1] if len(sys.argv) > 1 else "../data/video_info.json")

data = json.loads(path.read_text(encoding="utf-8"))
if not isinstance(data, dict):
    raise SystemExit("video_info.json must be a JSON object")

before = len(data)
cleaned = {
    url: info
    for url, info in data.items()
    if info.get("thumbnail") != BAD_THUMB
}
after = len(cleaned)

path.write_text(
    json.dumps(cleaned, ensure_ascii=False, indent=2, sort_keys=True),
    encoding="utf-8",
)

print(f"Removed {before - after} entries; kept {after}")
