'use client'

import { useEffect, useMemo, useState } from 'react'
import { normalizeRunningData } from '@/lib/running-data'

export function JourneyStats() {
  const [data, setData] = useState<unknown>(null)

  useEffect(() => {
    fetch('/data/runs.json')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const summary = useMemo(() => {
    if (!data) return null
    return normalizeRunningData(data).summary
  }, [data])

  if (!summary) return null

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className="text-center">
        <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {summary.runCount}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">days</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {summary.totalKm.toFixed(1)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">km</p>
      </div>
    </div>
  )
}
