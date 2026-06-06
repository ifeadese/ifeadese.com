'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { useTheme } from 'next-themes'
import { normalizeRunningData } from '@/lib/running-data'

type RunningDataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: unknown }

const BAR_MIN_WIDTH_MOBILE = 16
const BAR_MIN_WIDTH_DESKTOP = 10
const MOBILE_BREAKPOINT = 640

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

function formatTime(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}m ${secs}s`
}

function formatPace(minutes: number, distanceKm: number): string {
  const paceMin = minutes / distanceKm
  const paceMins = Math.floor(paceMin)
  const paceSecs = Math.round((paceMin - paceMins) * 60)
  return `${paceMins}:${String(paceSecs).padStart(2, '0')}/km`
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
    if (!containerWidth) return 21
    const barWidth = containerWidth < MOBILE_BREAKPOINT ? BAR_MIN_WIDTH_MOBILE : BAR_MIN_WIDTH_DESKTOP
    return Math.max(14, Math.floor(containerWidth / barWidth))
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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const isTouching = useRef(false)

  const getIndexFromX = useCallback(
    (clientX: number, rect: DOMRect) => {
      if (!chartData || !rect.width || chartData.distances.length === 0) return null
      const x = clientX - rect.left
      const ratio = Math.min(Math.max(x / rect.width, 0), 1)
      return Math.round(ratio * (chartData.distances.length - 1))
    },
    [chartData]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isTouching.current) return
      const idx = getIndexFromX(event.clientX, event.currentTarget.getBoundingClientRect())
      if (idx !== null) setSelectedIndex(idx)
    },
    [getIndexFromX]
  )

  const handleMouseLeave = useCallback(() => {
    if (!isTouching.current) setSelectedIndex(null)
  }, [])

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      isTouching.current = true
      const touch = event.touches[0]
      const idx = getIndexFromX(touch.clientX, event.currentTarget.getBoundingClientRect())
      if (idx !== null) setSelectedIndex(idx)
    },
    [getIndexFromX]
  )

  const isDark = resolvedTheme === 'dark'
  const restDayColor = isDark ? 'rgba(82, 82, 91, 0.3)' : 'rgba(212, 212, 216, 0.3)'
  const highlightColor = isDark ? '#60a5fa' : '#2563eb'

  const interpolateColor = useCallback(
    (t: number): string => {
      if (t < 0.01) return restDayColor
      const light = isDark ? Math.round(63 + t * 187) : Math.round(228 - t * 204)
      return `rgb(${light}, ${light}, ${light})`
    },
    [isDark, restDayColor]
  )

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
    selectedIndex === null
      ? chartData.distances.length - 1
      : Math.min(Math.max(selectedIndex, 0), chartData.distances.length - 1)

  const activeDistance = chartData.distances[activeIndex]
  const activeDate = chartData.dates[activeIndex]
  const activeDuration = chartData.durations[activeIndex]

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        <div className="mb-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300 sm:leading-normal">
          <span className="font-medium">{formatFullDate(activeDate)}</span>
          {activeDistance > 0 ? (
            <>
              <span className="mx-2 hidden text-zinc-400 dark:text-zinc-600 sm:inline">|</span>
              <br className="sm:hidden" />
              <span>Distance: {activeDistance.toFixed(2)}km</span>
              <span className="mx-2 hidden text-zinc-400 dark:text-zinc-600 sm:inline">|</span>
              <br className="sm:hidden" />
              <span>Time: {formatTime(activeDuration)}</span>
              <span className="mx-2 hidden text-zinc-400 dark:text-zinc-600 sm:inline">|</span>
              <br className="sm:hidden" />
              <span>Pace: {formatPace(activeDuration, activeDistance)}</span>
            </>
          ) : (
            <>
              <span className="mx-2 hidden text-zinc-400 dark:text-zinc-600 sm:inline">|</span>
              <br className="sm:hidden" />
              <span>None</span>
            </>
          )}
        </div>
        <div className="border-b border-zinc-100 dark:border-zinc-800">
          <BarChart
            height={220}
            renderer="svg-single"
            series={[
              {
                data: chartData.displayDistances,
                valueFormatter: (value) => `${Number(value ?? 0).toFixed(2)}km`,
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
              '& .MuiBarChart-element': {
                rx: 2,
                transition: 'opacity 0.15s',
              },
              ...(selectedIndex !== null && {
                '& .MuiBarChart-series .MuiBarChart-element': {
                  opacity: 0.4,
                },
                [`& .MuiBarChart-series .MuiBarChart-element:nth-of-type(${activeIndex + 1})`]: {
                  opacity: 1,
                  fill: `${highlightColor} !important`,
                },
              }),
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
