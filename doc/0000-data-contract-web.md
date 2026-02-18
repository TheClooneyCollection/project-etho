# Data Contract for Web Frontend

## Purpose
This document defines the normalized data shape consumed by Nunjucks templates in `web/`.

Source of truth:
- `data/out.enriched.json` (pipeline output)

Normalization layer:
- `web/src/_data/enrichedVideos.js`

## Input File Structure
`out.enriched.json` top-level object:

- `metadata`
  - `last_updated` (string timestamp)
- `videos` (array of raw row objects)

## Normalized Video Shape
Each item in `enrichedVideos` is:

```js
{
  date: string,
  mediaType: string,
  contentType: string,
  creator: string, // trimmed
  notes: string,
  timestamp1: {
    link: string,
    thumbnail: string,
    title: string
  },
  timestamp2: {
    link: string
  }
}
```

## Field Mapping
Raw -> normalized:

- `Date` -> `date`
- `Media type` -> `mediaType`
- `Content type` -> `contentType`
- `Creator` -> `creator` (trimmed)
- `Notes` -> `notes`
- `timestamp 1 link` -> `timestamp1.link`
- `timestamp 1 thumbnail` -> `timestamp1.thumbnail`
- `timestamp 1 title` -> `timestamp1.title`
- `timestamp 2 link` -> `timestamp2.link`

## Path Resolution for Source JSON
`enrichedVideos.js` resolves the input file in this order:

1. `ENRICHED_JSON_PATH` env var (if set)
2. repo-layout relative path from `_data` file
3. `process.cwd()` path when run from `web/`
4. `process.cwd()` path when run from repo root

If reading/parsing fails, it returns `{ videos: [] }`, resulting in an empty rendered list.

## Consumer Templates
- `web/src/index.njk`
- `web/src/_includes/video-card.njk`
- `web/src/_data/videosByMonth.js` (groups normalized videos by month)

## Compatibility Notes
- Preserve pipeline raw field names in `sheet-pipeline` output for compatibility.
- Frontend should rely on normalized keys only, not raw spreadsheet column names.
