# Video Card Behavior

## Component
Template file:
- `web/src/_includes/video-card.njk`

The card renders:
- thumbnail + primary link (`timestamp1.link`)
- title (`timestamp1.title`)
- creator, media type, content type, date
- notes (if present)
- second timestamp link (if present)
- expiry note for `VOD⏳` (conditioned by client-side date logic)

## Field Usage
Expected input shape comes from normalized `enrichedVideos` data:
- `video.date`
- `video.mediaType`
- `video.contentType`
- `video.creator`
- `video.notes`
- `video.timestamp1.link`
- `video.timestamp1.thumbnail`
- `video.timestamp1.title`
- `video.timestamp2.link`

Detailed data contract doc:
- `doc/0000-data-contract-web.md`

## Date Display
- Raw date value is included in `datetime`.
- Display text is date-only fallback from template.
- Client-side script localizes dates via `Intl.DateTimeFormat`.

## Secondary Timestamp
- Shown only when `video.timestamp2.link` is non-empty.
- Label text: `Second timestamp`.
- Styled as a clear link (black + underlined).
- Positioned above the expiry note.

## `VOD⏳` Expiry Note
- Template adds hidden note only for `mediaType == "VOD⏳"`.
- Runtime script (`markLikelyExpiredVods` in `web/src/assets/scripts/site.js`) unhides note when:
  - `now >= (video.date + 2 months)`
- Note text: `Likely expired`.

## Thumbnail Fallback
Cards use `.js-video-thumb` and runtime fallback logic.

- If `timestamp1.thumbnail` is missing/invalid: random fallback image is used.
- If thumbnail URL fails to load (e.g., expired Twitch thumbnail): random fallback is used.

Detailed fallback doc:
- `doc/0005-image-fallback-behavior.md`

Fallback assets:
- `/assets/images/sorry-etho-1.png`
- `/assets/images/sorry-etho-2.png`
