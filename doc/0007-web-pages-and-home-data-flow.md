# Web Pages and Home Data Flow

## Purpose
This doc gives a quick map of what pages exist in `web/`, what the home template does, and where month/creator page data comes from.

For deeper contract details, see:
- `doc/0000-data-contract-web.md`
- `doc/0003-month-pagination-and-navigation.md`

## Pages in `web/`
Current page templates:

- `web/src/index.njk`: main/home page (monthly listing with pagination)
- `web/src/creator.njk`: creator page (all videos for one creator)
- `web/src/about.njk`: about page

Supporting files (not standalone pages):

- `web/src/_includes/*.njk`: layout and reusable components
- `web/src/_data/*.js`: build-time data sources/transformations
- `web/src/assets/*`: frontend CSS/JS/images/social assets

## What `web/src/index.njk` Does
`index.njk` is the monthly paginated listing template.

- Uses `layout.njk`
- Paginates over `videosByMonth` with one month per generated page
- Permalinks:
  - first page (`pageNumber == 0`) -> `/index.html` (site root)
  - later pages -> `/<YYYY-MM>/index.html`
- Renders:
  - page title and subtitle
  - theme selector (`system`, `light`, `dark`)
  - About link (`/about/`)
  - month controls (`Latest`, `Earliest`, `Random Month`, month picker, creator filter)
  - localized month heading marker (`.js-locale-month`)
  - top and bottom month pagination include
  - video card grid for `monthPage.videos`

## Where `videosByMonth` and `videosByCreator` Come From
Data flow, end to end:

1. `sheet-pipeline/pipeline.py`
Converts public Google Sheet data into `data/out.json`.

2. `sheet-pipeline/video_enrich.py`
Enriches that JSON and writes `data/out.enriched.json`.

3. `web/src/_data/enrichedVideos.js`
Reads `out.enriched.json` and normalizes rows into frontend fields.

4. `web/src/_data/videosByMonth.js`
Groups normalized videos by `YYYY-MM` from `video.date` and sorts descending (newest first).

5. `web/src/_data/creatorIndex.js`
Builds creator metadata (`key`, `pathKey`, counts, active months).

6. `web/src/_data/videosByCreator.js`
Builds per-creator full video lists (sorted newest first).

7. `web/src/_data/creatorVideoPages.js`
Splits creator video lists into 10-item pages and precomputes creator-page routes/navigation.

8. `web/src/index.njk`
Uses Eleventy pagination (`pagination.data: videosByMonth`) to render the monthly pages.

9. `web/src/creator.njk`
Uses Eleventy pagination (`pagination.data: creatorVideoPages`) to render creator pages at:
- `/creator/<pathKey>/` (page 1)
- `/creator/<pathKey>/<pageNumber>/` (page 2+)

## When to Use the Other Docs
- Use `doc/0000-data-contract-web.md` when you need exact field mapping, normalization behavior, or JSON resolution fallback order.
- Use `doc/0003-month-pagination-and-navigation.md` when you need full routing, month navigation behavior, or picker fallback logic.
