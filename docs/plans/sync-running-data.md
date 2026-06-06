# Plan: Auto-sync running stats via Apple Health Shortcut

## Context

Running stats on ifeadese.com need to auto-update after each run. Originally planned for Strava, but that requires a paid subscription (~$100/yr). Pivoting to an Apple Health Shortcut approach that's free, automatic, and equally reliable.

**How it works:** Finish a run on Apple Watch → iOS Shortcut triggers on workout end → sends run data to GitHub API → GitHub Action updates `runs.json` and commits → Vercel auto-deploys.

## Architecture

```
Apple Watch (workout ends)
  → iOS Shortcut (triggers automatically)
    → GitHub API (repository_dispatch)
      → GitHub Action (appends to runs.json, commits)
        → Vercel (auto-deploys)
```

## What's already done

- Schema evolution: `runs-ytd.json` → `runs.json` with `type`/`source` fields
- `lib/running-data.ts` extended with `type?` and `source?`
- Chart fetch path updated to `/data/runs.json`
- 76 entries backfilled with `type: "run"`, `source: "manual"`
- Feature flag enabled

## Implementation

### GitHub Action (`.github/workflows/sync-run.yml`)

Receives a `repository_dispatch` event with workout payload, appends to `runs.json`, commits.

Triggers:
- `repository_dispatch` type `new_run` — fired by iOS Shortcut
- `workflow_dispatch` with manual inputs — for backfill/testing

Payload shape:
```json
{
  "event_type": "new_run",
  "client_payload": {
    "date": "2026-06-05",
    "distanceKm": 5.2,
    "durationMinutes": 32.1
  }
}
```

### iOS Shortcut (user sets up on phone)

Automation trigger: **Apple Watch Workout → End → Type: Running**

Steps:
1. Get last workout details (distance in km, duration in minutes)
2. Format date as YYYY-MM-DD
3. POST to `https://api.github.com/repos/ifeadese/ifeadese.com/dispatches`
   - Header: `Authorization: Bearer <GITHUB_PAT>`
   - Body: `{ "event_type": "new_run", "client_payload": { "date": "...", "distanceKm": ..., "durationMinutes": ... } }`

## Setup (one-time, manual)

1. Create a GitHub Personal Access Token (fine-grained, repo-scoped, contents:write)
2. Create iOS Shortcut automation (trigger: workout end, type: running)
3. Configure the Shortcut with the PAT and repo dispatch URL

## Design decisions

- **No Strava** — requires paid subscription, Apple Health Shortcut is free and instant
- **No sync script** — GitHub Action handles the append inline (simpler)
- **source: "apple_health"** — distinguishes automated entries from manual backfill
- **repository_dispatch** — standard GitHub pattern for external triggers
- **Manual backfill** — add entries directly to `runs.json` with `source: "manual"`

## Verification

1. Trigger `workflow_dispatch` manually with test data → confirm `runs.json` updates
2. Run `npm run dev` → confirm chart renders with new entry
3. Set up iOS Shortcut → do a test walk/run → confirm end-to-end flow
