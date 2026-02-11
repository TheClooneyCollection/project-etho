# Month Pagination and Navigation

## Overview
The frontend groups videos by month and renders one static page per month.

- Latest month is served at `/`.
- Older months are served at `/<YYYY-MM>/`.

## Data Source
Month grouping is built in `web/src/_data/videosByMonth.js`.

- Input: normalized `enrichedVideos`.
- Group key: `YYYY-MM` from `video.date`.
- Sorting: descending by month key (newest first).
- Output shape per group:
  - `key` (`YYYY-MM`)
  - `year`
  - `month`
  - `videos` (array for that month)

## Page Generation
Pagination is configured in `web/src/index.njk`.

- `pagination.data: videosByMonth`
- `pagination.size: 1`
- `pagination.alias: monthPage`
- `permalink`:
  - page `0` -> `index.html`
  - page `n > 0` -> `{{ monthPage.key }}/index.html`

## Navigation Components
Month navigation is DRY via includes.

- `web/src/_includes/month-pagination.njk`
  - Shared prev/next month links
  - Used at both top and bottom of page
- `web/src/_includes/month-controls.njk`
  - `Latest month` button
  - `Oldest month` button
  - month picker (`input type="month"`) + `Go`

## Month Picker Behavior
Implemented in `web/src/assets/scripts/site.js` (`initMonthPicker()`).

- Builds a `month -> href` map from hidden route anchors.
- If selected month exists, navigates there directly.
- If selected month does not exist, falls back to nearest available month.
- Supports both `Go` button click and `Enter` key.

## Localized Labels
Month labels are rendered with `.js-locale-month` markers and localized client-side.

- Formatting script: `web/src/assets/scripts/site.js` (`formatDatesForLocale()`)
- Uses `Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" })`.
