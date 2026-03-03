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

Shared month parsing/grouping helpers live in `web/src/_data/videoGrouping.js`.

Creator index data is built in `web/src/_data/creatorIndex.js`.

- Input: normalized `enrichedVideos`.
- Creator key: lower-cased `video.creatorKey`.
- Output shape per creator:
  - `key`
  - `name`
  - `videoCount`
  - `months` (sorted desc `YYYY-MM` keys)

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
  - expandable creator list (`<details>`) with `Creator (count)` rows

## Creator Filter Behavior
Implemented in `web/src/assets/scripts/site.js` (`initCreatorFilter()`).

- Active creator is driven by URL query parameter: `?creator=<creatorKey>`.
- Cards are filtered client-side using `data-video-creator-key`.
- If a creator has no videos in the current month route, the page redirects to the nearest available month for that creator.
- Prev/next month links and month picker are rewritten to creator-scoped months while a creator filter is active.
- `Clear filter` removes the `creator` query parameter and returns to all creators for the current month route.

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
