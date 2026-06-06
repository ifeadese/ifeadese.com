import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities'
const RUNS_PATH = resolve(__dirname, '../public/data/runs.json')

type StravaActivity = {
  type: string
  start_date: string
  distance: number
  moving_time: number
}

type RunEntry = {
  date: string
  distanceKm: number
  durationMinutes?: number
  type: string
  source: string
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN'
    )
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  return data.access_token
}

async function fetchAllActivities(accessToken: string): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${STRAVA_ACTIVITIES_URL}?page=${page}&per_page=${perPage}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${await response.text()}`)
    }

    const batch: StravaActivity[] = await response.json()
    if (batch.length === 0) break

    activities.push(...batch)
    page++
  }

  return activities
}

function normalizeStravaActivity(activity: StravaActivity): RunEntry | null {
  if (activity.type !== 'Run') return null

  const date = activity.start_date.split('T')[0]
  const distanceKm = Number((activity.distance / 1000).toFixed(2))
  const durationMinutes = Number((activity.moving_time / 60).toFixed(1))

  if (distanceKm <= 0) return null

  return { date, distanceKm, durationMinutes, type: 'run', source: 'strava' }
}

function readExistingRuns(): RunEntry[] {
  try {
    const raw = readFileSync(RUNS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function mergeRuns(existing: RunEntry[], incoming: RunEntry[]): RunEntry[] {
  const manualEntries = existing.filter((e) => e.source !== 'strava')
  const stravaByDate = new Map<string, RunEntry>()

  for (const entry of incoming) {
    const key = entry.date
    const current = stravaByDate.get(key)
    if (current) {
      current.distanceKm = Number((current.distanceKm + entry.distanceKm).toFixed(2))
      current.durationMinutes = Number(
        ((current.durationMinutes ?? 0) + (entry.durationMinutes ?? 0)).toFixed(1)
      )
    } else {
      stravaByDate.set(key, { ...entry })
    }
  }

  const merged = [...manualEntries, ...stravaByDate.values()]
  merged.sort((a, b) => a.date.localeCompare(b.date))
  return merged
}

async function main() {
  console.log('Refreshing Strava access token...')
  const accessToken = await getAccessToken()

  console.log('Fetching activities from Strava...')
  const activities = await fetchAllActivities(accessToken)
  console.log(`Fetched ${activities.length} total activities`)

  const runs = activities
    .map(normalizeStravaActivity)
    .filter((r): r is RunEntry => r !== null)
  console.log(`Found ${runs.length} runs`)

  const existing = readExistingRuns()
  console.log(`Existing entries: ${existing.length}`)

  const merged = mergeRuns(existing, runs)
  console.log(`Merged total: ${merged.length} entries`)

  writeFileSync(RUNS_PATH, JSON.stringify(merged, null, 2) + '\n')
  console.log(`Written to ${RUNS_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
