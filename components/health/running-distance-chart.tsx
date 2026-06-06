'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { useTheme } from 'next-themes'
import { normalizeRunningData } from '@/lib/running-data'

type RunningDataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: unknown }

const BAR_MIN_WIDTH = 10

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

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(el)
    setWidth(el.clientWidth)

    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

export function RunningDistanceChart() {
  const { resolvedTheme } = useTheme()
  const [state, setState] = useState<RunningDataState>({ status: 'loading' })
  const { ref: containerRef, width: containerWidth } = useContainerWidth()

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

  const dayCount = useMemo(() => {
    if (!containerWidth) return 30
    return Math.max(14, Math.floor(containerWidth / BAR_MIN_WIDTH))
  }, [containerWidth])

  const chartData = useMemo(() => {
    if (!normalized || normalized.points.length === 0) return null

    const runsByDate = new Map(
      normalized.points.map((p) => [p.date, p])
    )

    const now = new Date()
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const startDate = new Date(endDate)
    startDate.setUTCDate(startDate.getUTCDate() - dayCount + 1)

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

    const nonZero = distances.filter((d) => d > 0)
    const minDistance = nonZero.length > 0 ? Math.min(...nonZero) : 0
    const maxDistance = nonZero.length > 0 ? Math.max(...nonZero) : 1

    const REST_DAY_HEIGHT = maxDistance * 0.04
    const displayDistances = distances.map((d) => (d === 0 ? REST_DAY_HEIGHT : d))

    return { distances, displayDistances, dates, durations, minDistance, maxDistance, restDayHeight: REST_DAY_HEIGHT }
  }, [normalized, dayCount])

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!chartData) return
      const target = event.currentTarget.getBoundingClientRect()
      if (!target.width || chartData.distances.length === 0) return

      const x = event.clientX - target.left
      const ratio = Math.min(Math.max(x / target.width, 0), 1)
      const nextIndex = Math.round(ratio * (chartData.distances.length - 1))
      setHoveredIndex(nextIndex)
    },
    [chartData]
  )

  const isDark = resolvedTheme === 'dark'
  const restDayColor = isDark ? 'rgba(82, 82, 91, 0.3)' : 'rgba(212, 212, 216, 0.3)'

  const interpolateColor = (t: number): string => {
    if (t < 0.01) return restDayColor
    const light = isDark ? Math.round(63 + t * 187) : Math.round(228 - t * 204)
    return `rgb(${light}, ${light}, ${light})`
  }

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
        ref={containerRef}
        className="relative w-full"
        onMouseMove={handleMouseMove}
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
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <BarChart
            height={220}
            series={[
              {
                data: chartData.displayDistances,
                valueFormatter: (value) => `${Number(value ?? 0).toFixed(2)} km`,
              },
            ]}
            yAxis={[
              {
                position: 'none',
                colorMap: {
                  type: 'continuous',
                  min: 0,
                  max: chartData.maxDistance,
                  color: interpolateColor,
                },
              },
            ]}
            xAxis={[
              {
                scaleType: 'band',
                data: chartData.dates,
                position: 'none',
              },
            ]}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            slotProps={{ tooltip: { trigger: 'none' } }}
            sx={{
              '& .MuiBarElement-root': {
                rx: 2,
              },
            }}
          />
        </div>
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
