'use client'

import { useEffect, useState } from 'react'

type CalendlyInlineWidgetProps = {
  url: string
  styles?: React.CSSProperties
  pageSettings?: {
    hideEventTypeDetails?: boolean
    hideLandingPageDetails?: boolean
    primaryColor?: string
    textColor?: string
  }
}

export function ScheduleChatEmbed() {
  const [InlineWidget, setInlineWidget] = useState<React.ComponentType<CalendlyInlineWidgetProps> | null>(
    null,
  )

  useEffect(() => {
    import('react-calendly').then((mod) => {
      setInlineWidget(() => mod.InlineWidget)
    })
  }, [])

  return (
    <div className="not-prose mt-6 overflow-hidden rounded-xl">
      {InlineWidget ? (
        <InlineWidget
          url="https://calendly.com/ifeadese/initial-chat"
          styles={{
            height: '700px',
            width: '100%',
          }}
          pageSettings={{
            hideEventTypeDetails: true,
            hideLandingPageDetails: true,
          }}
        />
      ) : (
        <div className="flex h-[700px] items-center justify-center text-zinc-500">
          Loading calendar...
        </div>
      )}
    </div>
  )
}

