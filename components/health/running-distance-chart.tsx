'use client'

import { useEffect, useMemo, useState } from 'react'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { useTheme } from 'next-themes'
import { normalizeRunningData } from '@/lib/running-data'

type RunningDataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: unknown }

const CHART_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 }

function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatDuration(minutes: number): string {
  const totalMinutes = Math.round(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

export function RunningDistanceChart() {
  const { resolvedTheme } = useTheme()
  const [state, setState] = useState<RunningDataState>({ status: 'loading' })

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const response = await fetch('/data/runs.json')
        if (!response.ok) {
          throw new Error(`Failed to load run data (${response.status})`)
        }

        const data = (await response.json()) as unknown
        if (isMounted) {
          setState({ status: 'ready', data })
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Unable to load running data.',
          })
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const normalized = useMemo(() => {
    if (state.status !== 'ready') return null
    return normalizeRunningData(state.data)
  }, [state])

  const chartData = useMemo(() => {
    if (!normalized || normalized.points.length === 0) return null

    const runsByDate = new Map(
      normalized.points.map((p) => [p.date, p])
    )

    const first = normalized.points[0].date
    const last = normalized.points[normalized.points.length - 1].date
    const [fy, fm, fd] = first.split('-').map(Number)
    const [ly, lm, ld] = last.split('-').map(Number)
    const startDate = new Date(Date.UTC(fy, fm - 1, fd))
    const endDate = new Date(Date.UTC(ly, lm - 1, ld))

    const distances: number[] = []
    const dates: string[] = []
    const durations: number[] = []

    const current = new Date(startDate)
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0]
      const run = runsByDate.get(key)
      distances.push(run ? run.distanceKm : 0)
      dates.push(key)
      durations.push(run ? run.durationMinutes : 0)
      current.setUTCDate(current.getUTCDate() + 1)
    }

    return { distances, dates, durations }
  }, [normalized])

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const barColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#27272a'

  if (state.status === 'loading') {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading running chart...
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
    )
  }

  if (!normalized || !chartData || normalized.points.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No running data available for this year.
      </p>
    )
  }

  const activeIndex =
    hoveredIndex === null
      ? chartData.distances.length - 1
      : Math.min(Math.max(hoveredIndex, 0), chartData.distances.length - 1)

  const activeDistance = chartData.distances[activeIndex]
  const activeDate = chartData.dates[activeIndex]
  const activeDuration = chartData.durations[activeIndex]

  return (
    <div className="space-y-3">
      <div
        className="relative w-full"
        onMouseMove={(event) => {
          const target = event.currentTarget.getBoundingClientRect()
          if (!target.width || chartData.distances.length === 0) return

          const x = event.clientX - target.left
          const ratio = Math.min(Math.max(x / target.width, 0), 1)
          const nextIndex = Math.round(ratio * (chartData.distances.length - 1))
          setHoveredIndex(nextIndex)
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="font-medium">{formatFullDate(activeDate)}</span>
          {activeDistance > 0 ? (
            <>
              <span className="mx-2 text-zinc-400 dark:text-zinc-600">|</span>
              <span>Distance: {activeDistance.toFixed(2)} km</span>
              <span className="mx-2 text-zinc-400 dark:text-zinc-600">|</span>
              <span>Time: {formatDuration(activeDuration)}</span>
            </>
          ) : (
            <>
              <span className="mx-2 text-zinc-400 dark:text-zinc-600">|</span>
              <span>Rest day</span>
            </>
          )}
        </div>
        <SparkLineChart
          height={220}
          data={chartData.distances}
          plotType="bar"
          color={barColor}
          showHighlight
          margin={CHART_MARGIN}
          valueFormatter={(value) => `${Number(value ?? 0).toFixed(1)} km`}
        />
      </div>

      {(normalized.invalidRowCount > 0 || normalized.futureRowCount > 0) && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Ignored {normalized.invalidRowCount} invalid row(s) and{' '}
          {normalized.futureRowCount} future row(s).
        </p>
      )}
    </div>
  )
}
