# Twitch Mobile Embed `time` Known Issue

## Status
- Known issue
- Affects: Twitch VOD embeds in mobile browsers (most notably iOS Safari)
- Symptom: Embed starts at `0:00` on mobile even when `time` is set; desktop often honors the same parameter

## Context
Project Etho uses non-interactive Twitch VOD embeds generated in:
- `web/src/assets/scripts/site.js`

Twitch VOD iframe URLs are generated as:
- `https://player.twitch.tv/?video=v<id>&parent=<host>&autoplay=false&time=<offset>`

## Problem
Twitch VOD `time` offsets can work on desktop but be ignored on mobile.

This creates inconsistent behavior for links like:
- `https://www.twitch.tv/videos/<id>?t=1h2m3s`

## Attempted Fix
We temporarily updated generated embed URLs to pass Twitch's documented time format (`1h2m3s`) instead of normalized seconds (`3723s`).

Change made in:
- `web/src/assets/scripts/site.js`

Result:
- Desktop: still works
- Mobile: still unreliable / can still start at `0:00`

Outcome:
- The `1h2m3s` change was reverted because it did not improve mobile behavior.

## Investigation
Twitch docs confirm `time` is valid for VOD embeds and should use `1h2m3s`:
- https://dev.twitch.tv/docs/embed/video-and-clips/

Community reports of the same mobile issue:
- https://discuss.dev.twitch.com/t/example-of-embedded-twitch-video-for-ios-w-start-time/11193
- https://discuss.dev.twitch.com/t/embed-with-time-does-not-work-on-mobile-ios-safari/22446

Related Twitch embed requirements and caveats:
- https://dev.twitch.tv/docs/embed/

## Conclusion
- Testing the documented `1h2m3s` format did not resolve mobile behavior.
- The attempted format change was reverted; current implementation uses the prior behavior.
- The issue appears to be Twitch/mobile player behavior, not URL formatting in our app.
- Treat mobile start-time accuracy for non-interactive Twitch embeds as best-effort.

## Practical Guidance
- Keep `parent` accurate for every serving hostname.
- Treat Twitch VOD start time on mobile as best-effort for non-interactive embeds.
- If strict mobile timestamp behavior becomes required, migrate Twitch embeds to the interactive player and apply a post-ready seek strategy.
