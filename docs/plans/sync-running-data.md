# Plan: Auto-sync running stats

## Context

Running stats on ifeadese.com need to update after each run without requiring code changes. Evaluated three approaches — Strava API, Apple Health iOS Shortcut, and GitHub Actions manual dispatch — chose manual dispatch for its reliability and zero maintenance cost.

## Decision summary

| Approach | Verdict | Reason |
|----------|---------|--------|
| Strava API | Rejected | Requires paid subscription (~$100/yr) |
| Apple Health Shortcut | Rejected | Fragile (token expiry, manual wiring, iOS update risk, silent failures) |
| GitHub Actions workflow_dispatch | Chosen | Zero setup, zero cost, zero failure modes, 30 seconds per run |

## Architecture

```
User (after a run)
  → GitHub Actions UI (workflow_dispatch)
    → Validates input, upserts public/data/runs.json, commits
      → Vercel auto-deploys
```

## Implementation

### Data schema (`public/data/runs.json`)

Flat array, sorted by date:
```json
[
  { "date": "2026-06-05", "distanceKm": 5.2, "durationMinutes": 32.1, "type": "run", "source": "manual" }
]
```

### GitHub Action (`.github/workflows/sync-run.yml`)

Triggers:
- `workflow_dispatch` — manual input

Inputs: date (required, YYYY-MM-DD), distanceKm (required, positive number), durationMinutes (optional, positive number)

Behavior: validates inputs, upserts entry in `runs.json` (replaces existing entry for same date), sorts by date, commits if changed.

### Existing code (already built)

- `lib/running-data.ts` — types and normalization
- `components/health/running-distance-chart.tsx` — renders chart from `/data/runs.json`
- `lib/constants.ts` — feature flag (`FEATURES.healthRunningChart`)

## Usage

After a run:
1. Go to repo → **Actions** tab → "Sync Run Data"
2. Click **Run workflow**
3. Enter: date (`2026-06-05`), distanceKm (`5.2`), optionally durationMinutes (`32`)
4. Site auto-updates via Vercel deploy

## Future path

If manual entry becomes tedious, automation can be layered on via a new `repository_dispatch` trigger or a scheduled workflow without changing the data format. Options: iOS Shortcut, Strava (if subscribed), or any service that can POST to the GitHub API.
