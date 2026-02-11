# Project Etho

Beautiful statically generated frontend for Etho’s appearances across the web

## What This Repo Is

This project turns a living spreadsheet of videos into a clean, visual timeline.

Right now it is a static web app backed by generated JSON from the data pipeline in `sheet-pipeline/`.
Over time, this can evolve into a fuller web application, but today the workflow is intentionally simple and dependable.

## How It Works
1. `sheet-pipeline/pipeline.py` exports a public Google Sheet and preserves rich-text links.
2. `sheet-pipeline/video_enrich.py` fetches metadata (titles/thumbnails) for YouTube and Twitch links.
3. The pipeline writes `sheet-pipeline/out/out.enriched.json`.
4. `web/` (Eleventy) reads enriched data and renders month-paginated static pages.

## Web Frontend Features
- Reusable video card component (title, creator, media/content type, notes, timestamps, thumbnail)
- Month-based pagination (`/` for latest, `/<YYYY-MM>/` for older months)
- Top and bottom previous/next month navigation
- Quick month controls (latest, oldest, month picker jump)
- Locale-aware month/date formatting in browser
- `VOD⏳` helper note (`Likely expired`) shown after 2 months
- Theme support: System default + Light/Dark switcher

## Quick Start
### 1) Build pipeline image
```bash
cd sheet-pipeline
docker compose build
```

### 2) Generate data
```bash
./scripts/all
```

### 3) Run the static site locally
```bash
cd ../web
npm install
npm run dev
```

Or with Docker Compose:
```bash
cd web
docker compose -f compose.yml up -d dev
```

The web container reads pipeline output from:
- host: `sheet-pipeline/out/out.enriched.json`
- container: `/data/out/out.enriched.json` (via `ENRICHED_JSON_PATH`)

## Repository Layout
- `sheet-pipeline/`: Dockerized extraction + enrichment pipeline
- `sheet-pipeline/scripts/`: helper scripts (`extract`, `enrich`, `all`)
- `sheet-pipeline/out/`: generated outputs used by the frontend
- `web/`: Eleventy frontend
- `web/src/_includes/`: reusable Nunjucks templates/components
- `web/src/_data/`: normalized data loaders used by templates
- `web/src/assets/`: frontend CSS and JavaScript, and image assets

## Notes
- `out.enriched.json` is the frontend’s source of truth.
- Pipeline config lives in `sheet-pipeline/.env`.
- This project expects a public Google Sheet (no OAuth flow required).
- `video_enrich.py` keeps `metadata.last_updated` unchanged when the `videos` array has no content changes.
