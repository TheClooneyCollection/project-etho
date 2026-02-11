# Video Card Behavior

## Component
Template file:
- `web/src/_includes/video-card.njk`

The card renders:
- embedded player when supported (YouTube/Twitch)
- thumbnail + primary link fallback (`timestamp1.link`)
- title (`timestamp1.title`)
- creator, media type, content type, date
- notes (if present)
- second timestamp link (if present)
- expiry note for `VOD⏳` (conditioned by client-side date logic)

Layout:
- Cards use a vertical stack (media on top, text below) so embeds can use full card width.

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

## Embedded Video Behavior
Runtime embed initialization is handled in `web/src/assets/scripts/site.js` via `initVideoEmbeds()`.

- YouTube links are converted to `youtube.com/embed/<id>` if a valid video ID is found.
- Twitch video links (`/videos/<id>`) are converted to `player.twitch.tv` embeds.
- For Twitch embeds, `parent` is set dynamically from `window.location.hostname`, so the same code works across local/dev/prod/official hostnames.

### Twitch Edge Case Handling
- If a Twitch entry is `VOD⏳` and older than 2 months, embed is skipped and card stays on thumbnail fallback mode.
- If iframe creation fails, card falls back to thumbnail mode.

### Media Visibility Toggle
- Media container uses `is-embedded` class at runtime.
- CSS ensures only one media view is visible at a time:
  - embed visible when `is-embedded`
  - thumbnail visible when not embedded

### Time Parameters
- Time offsets are parsed from link query parameters (`t` / `start`) and passed into embed URLs where supported.
