export type RawRunEntry = {
  date: string
  distanceKm: number
  durationMinutes?: number
}

export type NormalizedRunEntry = {
  date: string
  distanceKm: number
  durationMinutes: number
}

export type RunningDataSummary = {
  totalKm: number
  runCount: number
  avgKmPerRun: number
  totalDurationMinutes: number
  avgPaceMinPerKm: number
}

export type RunningDataResult = {
  points: NormalizedRunEntry[]
  summary: RunningDataSummary
  invalidRowCount: number
  futureRowCount: number
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(dateString: string): Date | null {
  if (!ISO_DATE_REGEX.test(dateString)) return null

  const [year, month, day] = dateString.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return parsed
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYtdBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  return { start, end }
}

function coerceDistance(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }

  return null
}

function coerceDurationMinutes(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

export function normalizeRunningData(
  rawData: unknown,
  now = new Date()
): RunningDataResult {
  const { start, end } = getYtdBounds(now)
  const runsByDate = new Map<string, { distanceKm: number; durationMinutes: number }>()

  let invalidRowCount = 0
  let futureRowCount = 0

  if (!Array.isArray(rawData)) {
    return {
      points: [],
      summary: {
        totalKm: 0,
        runCount: 0,
        avgKmPerRun: 0,
        totalDurationMinutes: 0,
        avgPaceMinPerKm: 0,
      },
      invalidRowCount: 1,
      futureRowCount: 0,
    }
  }

  for (const row of rawData) {
    if (!row || typeof row !== 'object') {
      invalidRowCount += 1
      continue
    }

    const maybeDate = 'date' in row ? (row.date as unknown) : null
    const maybeDistance = 'distanceKm' in row ? (row.distanceKm as unknown) : null

    if (typeof maybeDate !== 'string') {
      invalidRowCount += 1
      continue
    }

    const parsedDate = parseIsoDate(maybeDate)
    const parsedDistance = coerceDistance(maybeDistance)
    const parsedDuration = coerceDurationMinutes(
      'durationMinutes' in row ? (row.durationMinutes as unknown) : null
    )

    if (!parsedDate || parsedDistance === null) {
      invalidRowCount += 1
      continue
    }

    if (parsedDate > end) {
      futureRowCount += 1
      continue
    }

    if (parsedDate < start) {
      continue
    }

    const key = formatIsoDate(parsedDate)
    const durationMinutes =
      parsedDuration ?? Number((parsedDistance * 6.2).toFixed(1))
    const existing = runsByDate.get(key) ?? { distanceKm: 0, durationMinutes: 0 }

    runsByDate.set(key, {
      distanceKm: Number((existing.distanceKm + parsedDistance).toFixed(2)),
      durationMinutes: Number(
        (existing.durationMinutes + durationMinutes).toFixed(1)
      ),
    })
  }

  const points: NormalizedRunEntry[] = [...runsByDate.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, values]) => ({
      date,
      distanceKm: values.distanceKm,
      durationMinutes: values.durationMinutes,
    }))

  const runDistances = points.map((point) => point.distanceKm)
  const runDurations = points.map((point) => point.durationMinutes)
  const totalKm = Number(runDistances.reduce((sum, value) => sum + value, 0).toFixed(1))
  const totalDurationMinutes = Number(
    runDurations.reduce((sum, value) => sum + value, 0).toFixed(1)
  )
  const runCount = points.length
  const avgKmPerRun = runCount > 0 ? Number((totalKm / runCount).toFixed(1)) : 0
  const avgPaceMinPerKm =
    totalKm > 0 ? Number((totalDurationMinutes / totalKm).toFixed(2)) : 0

  return {
    points,
    summary: {
      totalKm,
      runCount,
      avgKmPerRun,
      totalDurationMinutes,
      avgPaceMinPerKm,
    },
    invalidRowCount,
    futureRowCount,
  }
}
