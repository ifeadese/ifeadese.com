'use client'
import { useEffect, useState } from 'react'

export default function ScheduleChatPage() {
  const [InlineWidget, setInlineWidget] = useState<React.ComponentType<{
    url: string
    styles?: React.CSSProperties
    pageSettings?: {
      hideEventTypeDetails?: boolean
      hideLandingPageDetails?: boolean
      primaryColor?: string
      textColor?: string
    }
  }> | null>(null)

  useEffect(() => {
    import('react-calendly').then((mod) => {
      setInlineWidget(() => mod.InlineWidget)
    })
  }, [])

  return (
    <article className="prose prose-sm prose-gray dark:prose-invert prose-h1:text-xl prose-h1:font-medium">
      <h1>Schedule a Chat</h1>
      <p>
        Get started with a free consultation call. This is your opportunity to
        discuss your project, ask questions, and explore how we can work
        together.
      </p>

      <div className="not-prose mt-8 overflow-hidden rounded-xl">
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
              primaryColor: '00a2ff',
              textColor: '4d5055',
            }}
          />
        ) : (
          <div className="flex h-[700px] items-center justify-center text-zinc-500">
            Loading calendar...
          </div>
        )}
      </div>
    </article>
  )
}

