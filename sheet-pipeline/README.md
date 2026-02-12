# Google Sheets → Static Data Pipeline

A small, self-contained Docker pipeline that:

* downloads a **public Google Sheet** as XLSX
* **preserves embedded hyperlinks** (rich text links)
* normalizes the data
* exports **CSV + JSON** for use in static or semi-static web apps

Designed for **cron / CI / static-site pipelines**, not manual use.

---

## Why this exists

Google Sheets stores links as *rich text*.
When you export to CSV, **the URLs are lost**.

This pipeline solves that by:

1. exporting the sheet as **XLSX**
2. extracting both **visible text** and **hyperlink targets**
3. emitting clean, deterministic data files you can safely consume elsewhere

---

## What it outputs

* `out/sheet.xlsx` – raw exported spreadsheet
* `out/out.csv` – flattened CSV (links preserved)
* `out/out.json` – normalized JSON (dates → ISO-8601 strings)
* `out/out.enriched.json` – link-enriched JSON with per-link title/thumbnail fields
* `out/video_info.json` – URL metadata cache used by enrichment

Hyperlink columns are split into:

* text column (e.g. `timestamp 1`)
* url column (e.g. `timestamp 1 link`)

---

## Video enrichment

Run enrichment after extraction to add title/thumbnail fields for video links:

```bash
./scripts/enrich
```

or run both extract + enrich:

```bash
./scripts/all
```

Quickly report missing video metadata (title/thumbnail) from cache:

```bash
./scripts/check-video-info
```

Notes:
* YouTube titles use oEmbed first, then page `og:title` fallback; unavailable videos are classified as `youtube_unavailable`; thumbnails use deterministic `i.ytimg.com`.
* Twitch uses page `og:title` and `og:image` metadata.
* Twitch placeholder image `https://vod-secure.twitch.tv/_404/404_processing_640x360.png` is treated as missing and saved as `null`.

---

## Requirements

* Docker (or Docker Desktop)
* The Google Sheet must be **publicly accessible**

No Google Cloud account or OAuth needed.

---

## Project structure

```
.
├── Dockerfile
├── pipeline.py
├── compose.yml
├── .env
└── out/
```

---

## Configuration

All configuration lives in a non-sensitive `.env` file.

### `.env`

```env
SHEET_ID=1mv_mKgCggvrCrspBPRGCwwNY8oT6943uaX0d0mkCMxk
START_ROW=5

LINK_COL_1=F
LINK_COL_2=G

LINK1_TEXT_HEADER=timestamp 1
LINK1_URL_HEADER=timestamp 1 link
LINK2_TEXT_HEADER=ts 2
LINK2_URL_HEADER=ts 2 link
```

### Config notes

* `START_ROW` – first row containing data
* `LINK_COL_*` – columns that contain linked text
* header names are **fully customizable**
* all other columns are included automatically

---

## Running the pipeline

### Build

```bash
docker compose build
```

### Run (recommended)

```bash
docker compose run --rm sheet-pipeline
```

`--rm` ensures containers are discarded after each run (no clutter).

Outputs appear in `./out`.

---

## Scheduling

This pipeline is designed to be run repeatedly:

* cron job
* GitHub Actions (scheduled)
* CI pipeline
* server cron + Docker

Example cron (hourly):

```cron
0 * * * * cd /path/to/project && docker compose run --rm sheet-pipeline
```

---

## Data guarantees

* Dates/times → ISO-8601 strings
* Empty cells → empty strings
* CSV and JSON column order is stable
* Containers are fully disposable; data lives outside via volume mount

---

## Limitations

* Assumes **one hyperlink per cell**
* Does **not** extract multiple links within a single rich-text cell

  * If needed, the Google Sheets API (`textFormatRuns`) would be required

---

## When this is a good fit

* Static or semi-static websites
* Data refreshed hourly / daily
* Pipelines where simplicity > real-time sync
* You want **no Google auth complexity**

---

## License

MIT
