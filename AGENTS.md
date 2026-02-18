# Repository Guidelines

## Project Structure & Module Organization
- `sheet-pipeline/`: data pipeline workspace.
- `sheet-pipeline/pipeline.py`: exports a public Google Sheet to `data/out.csv` and `data/out.json`.
- `sheet-pipeline/video_enrich.py`: enriches links with titles/thumbnails and writes `data/out.enriched.json`.
- `sheet-pipeline/scripts/`: runnable helpers (`extract`, `enrich`, `all`).
- `data/`: generated artifacts.

## Build, Test, and Development Commands
Run commands from `sheet-pipeline/` unless noted.
- `docker compose build`: build the Python pipeline image.
- `./scripts/extract`: run sheet export only.
- `./scripts/enrich`: enrich existing JSON with video metadata.
- `./scripts/all`: run extract + enrich in one pass (typical refresh command).
- `docker compose run --rm sheet-pipeline sh -lc "python /app/pipeline.py && python /app/video_enrich.py"`: explicit one-liner equivalent.

## Coding Style & Naming Conventions
- Python: follow PEP 8, 4-space indentation, `snake_case` for functions/variables, `UPPER_SNAKE_CASE` for env-config constants.
- Keep scripts deterministic and side-effect aware: write outputs only under `/out` (mapped to repo `data/`).
- Prefer small, focused scripts in `sheet-pipeline/scripts/` for operational tasks.
- Preserve existing JSON field naming in outputs (for frontend compatibility).

## Testing Guidelines
- No formal test suite exists yet; validate with pipeline runs.
- Minimum validation before PR:
  - Run `./scripts/all`.
  - Confirm `data/out.json` and `data/out.enriched.json` are regenerated without errors.
  - Open `index.html` and verify data renders as expected.

## Commit & Pull Request Guidelines
- Commit style in history is short, imperative, and scoped (example: `Fix twitch parsing issue`).
- Prefer one logical change per commit.
- PRs should include:
  - What changed and why.
  - Any `.env` or output schema impact.
  - Screenshots when `index.html` presentation changes.
  - Linked issue/task when available.

## Security & Configuration Tips
- Keep `SHEET_ID` and column mappings in `sheet-pipeline/.env`.
- Only use public-sheet data; do not commit secrets or private tokens.
- Treat `data/` as generated data and review diffs before merging.

## Documentation Workflow
- After completing a feature, first check whether a relevant feature doc already exists and update it when behavior changes. If no relevant doc exists, ask the user whether they want one created.
- When adding or updating files in `doc/`, also update `doc/README.md` so the current-doc list stays accurate.
