# Image Fallback Behavior

What’s now in place:

- If `timestamp1.thumbnail` is missing/invalid, card image uses a random fallback:
  - `/assets/images/sorry-etho-1.png`
  - `/assets/images/sorry-etho-2.png`

- If a thumbnail URL exists but fails to load (e.g. expired Twitch image), it also swaps to a random fallback at runtime.

Changes made:

- `web/src/_includes/video-card.njk`
  - Added JS hook class to thumbnail image:
  - `class="video-card__thumb js-video-thumb"`

- `web/src/assets/scripts/site.js`
  - Added `initVideoThumbnailFallbacks()`:
    - validates source URL
    - replaces invalid sources immediately
    - listens for image `error` and replaces failed loads
    - ensures replacement happens once per image

Verified:
- Build passes with `npx eleventy`
- Fallback assets are present in output:
  - `_site/assets/images/sorry-etho-1.png`
  - `_site/assets/images/sorry-etho-2.png`
