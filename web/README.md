# Project Etho Web (Eleventy)

Statically generated frontend for browsing Etho appearances by month.

![Project Etho web screenshot](https://github.com/user-attachments/assets/c7eea507-b31b-4612-849e-624edba4c79c)

---

## What this app is

This `web/` app is the presentation layer for pipeline output from `sheet-pipeline/`.

It reads enriched JSON and renders a month-paginated timeline using Eleventy.

---

## Features

* Month-based pagination (`/` for latest, `/<YYYY-MM>/` for older months)
* Previous/next month navigation (top + bottom)
* Month controls (latest, oldest, month picker)
* Reusable video card UI with creator, media/content type, notes, and timestamps
* Theme support (system, light, dark)
* Locale-aware date formatting in browser
* `VOD⏳` helper note for older Twitch VOD links

---

## Requirements

* Node.js 20+ (or Docker)
* Generated data from `data/out.enriched.json`

---

## Run locally (Node)

From `web/`:

```bash
npm install
npm run dev
```

App URL:

* `http://127.0.0.1:8080`

Production-mode local preview:

```bash
npm run prod
```

Build static output:

```bash
npm run build
```

---

## Run with Docker Compose

From `web/`:

```bash
docker compose -f compose.yml up -d dev
```

Dev URL:

* `http://127.0.0.1:8180`

Production preview container:

```bash
docker compose -f compose.yml up -d prod
```

Prod URL:

* `http://127.0.0.1:8190`

Optional edge-network override:

```bash
docker compose -f compose.yml -f compose.edge.yml up -d dev
```

---

## Data input contract

The app reads `out.enriched.json` through `web/src/_data/enrichedVideos.js`.

Path resolution order:

1. `ENRICHED_JSON_PATH` (if set)
2. `../data/out.enriched.json` from repo layout
3. fallback candidates based on current working directory

If the file is missing or invalid JSON, the site renders with an empty video list.

---

## Project layout

```text
web/
├── src/
│   ├── _data/          # Data loaders/normalizers used by templates
│   ├── _includes/      # Nunjucks layouts/components
│   └── assets/         # CSS, JS, and image assets
├── eleventy.config.js  # Eleventy config + passthrough assets
├── compose.yml         # Dev/prod local containers
└── compose.edge.yml    # Optional edge-network override
```

---

## Commands

* `npm run dev` - Eleventy dev server (`ELEVENTY_ENV=development`)
* `npm run prod` - Eleventy serve in production mode
* `npm run build` - Generate static output to `_site/`

---

## Notes

* Generate fresh data first with `sheet-pipeline/scripts/all`.
* `web/` is a static frontend only; data extraction/enrichment stays in `sheet-pipeline/`.
