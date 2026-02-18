# Docker Dev Workflow (`web/`)

## Overview
The Eleventy frontend runs in Docker with bind mounts and reads pipeline output from outside the `web/` folder.

Primary config:
- `web/compose.yml`

## Services
- `dev` (served on host `127.0.0.1:8180`)
- `prod` (served on host `127.0.0.1:8190`)

Both run:
- image: `node:25-bookworm-slim`
- working dir: `/app`
- command: `npm install && npm run dev|prod`

## Data Mounts and Env
Frontend needs `data/out.enriched.json`.

Current wiring in `compose.yml`:

- `ENRICHED_JSON_PATH=/app/src/_data/out.enriched.json`
- bind mount:
  - `../data/out.enriched.json:/app/src/_data/out.enriched.json:ro`
- additional output directory mount:
  - `../data:/data:ro`

This makes enriched JSON available inside container even though source lives outside `web/`.

## File Watch and Stale State Notes
Watch issues on bind mounts can cause stale template state (historically seen with `index.md` -> `index.njk` transition).

When templates seem stale:
1. Restart services:
   - `docker compose -f compose.yml down`
   - `docker compose -f compose.yml up -d dev`
2. Verify logs:
   - `docker compose -f compose.yml logs --tail=100 dev`
3. Confirm the expected source template is used.

## Inspecting Built Output in Container
If `_site` is on a named volume, inspect inside container:

```bash
docker compose -f compose.yml exec dev ls -la /app/_site
```

## Recommended Validation
After config changes:
1. `docker compose -f compose.yml config` (check resolved mounts/env)
2. `docker compose -f compose.yml up -d dev`
3. Confirm page render at local port
4. Confirm enriched data is loaded
