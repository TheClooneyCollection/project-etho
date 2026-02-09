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

TODO

## Repository Layout
- `sheet-pipeline/`: Dockerized extraction + enrichment pipeline
- `sheet-pipeline/scripts/`: helper scripts (`extract`, `enrich`, `all`)
- `sheet-pipeline/out/`: generated outputs used by the frontend

## Notes
- `out.enriched.json` is the frontend’s source of truth.
- Pipeline config lives in `sheet-pipeline/.env`.
- This project expects a public Google Sheet (no OAuth flow required).
