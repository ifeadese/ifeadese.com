# Apple Health Shortcut Setup

Automatically sync running data from Apple Watch to ifeadese.com after each run.

## Prerequisites

- iPhone with Apple Watch paired
- GitHub account with access to `ifeadese/ifeadese.com`

## Step 1: Create a GitHub Personal Access Token

1. Go to: **github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Configure:
   - **Name:** `apple-health-sync`
   - **Expiration:** 1 year (or no expiration)
   - **Repository access:** Only select repositories → `ifeadese/ifeadese.com`
   - **Permissions:** Contents → Read and write
3. Generate and copy the token immediately.

## Step 2: Create the iOS Shortcut Automation

1. Open **Shortcuts** app → **Automation** tab → **+** → **Personal Automation**
2. Select **Apple Watch Workout**:
   - Workout Type: **Running**
   - When: **Ends**
3. Build the actions:

### Action 1: Find Health Samples

- Type: Workouts
- Sort by: Start Date (most recent first)
- Limit: 1

### Action 2: Text (build the JSON payload)

```
{"event_type":"new_run","client_payload":{"date":"[Current Date: yyyy-MM-dd]","distanceKm":[Workout Distance in km, rounded 2 decimals],"durationMinutes":[Workout Duration in minutes, rounded 1 decimal]}}
```

Insert dynamic values:
- **Current Date** → custom format: `yyyy-MM-dd`
- **Workout distance** → may need a Calculate action to convert meters → km and round
- **Duration** → convert seconds → minutes if needed

### Action 3: Get Contents of URL

- **URL:** `https://api.github.com/repos/ifeadese/ifeadese.com/dispatches`
- **Method:** POST
- **Headers:**
  - `Authorization`: `Bearer <YOUR_PAT>`
  - `Accept`: `application/vnd.github+v3+json`
- **Request Body:** File → the Text from Action 2

### Action 4: Disable "Ask Before Running"

Toggle off so the automation fires silently after each run.

## Testing

### Option A: Manual workflow dispatch (no run needed)

1. Go to repo → **Actions** tab → "Sync Run Data"
2. Click **Run workflow**
3. Enter test values (e.g., date: `2026-06-05`, distanceKm: `5.0`)
4. Check that `public/data/runs.json` gets a new commit

### Option B: Real test

1. Start an "Outdoor Run" workout on Apple Watch
2. Run/walk for 1 minute, then end the workout
3. Check GitHub Actions for a new workflow run
4. Verify the entry appears in `runs.json`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Shortcut doesn't fire | Ensure "Ask Before Running" is off. Check that the workout type matches (Running). |
| 403 from GitHub API | Token expired or wrong permissions. Regenerate with Contents: Read and write. |
| Data doesn't appear on site | Check Vercel auto-deploy is enabled. The commit to `main` triggers a redeploy. |
| Distance is in meters | Add a Calculate action: divide by 1000 before inserting into the Text. |
| Duration is in seconds | Add a Calculate action: divide by 60 before inserting into the Text. |

## Manual Backfill

For runs without your watch, add entries directly to `public/data/runs.json`:

```json
{ "date": "2026-06-05", "distanceKm": 5.0, "durationMinutes": 31.0, "type": "run", "source": "manual" }
```

Commit and push — the site will update on next deploy.
