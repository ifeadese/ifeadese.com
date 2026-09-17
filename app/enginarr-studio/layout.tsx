'use client'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { ArrowLeftIcon, CheckIcon, CopyIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Keep studio toolbar typography aligned with the main Header subtitle styling
const TOOLBAR_BUTTON_CLASSNAME =
  'inline-flex cursor-pointer items-center gap-1 text-base font-normal text-zinc-600 transition-colors hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'

function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        // Prefer real back-navigation (keeps user context), but fall back to home.
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
          return
        }

        router.push('/')
      }}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
      type="button"
      aria-label="Go back"
    >
      <ArrowLeftIcon className="h-4 w-4" />
    </button>
  )
}

function CopyButton() {
  const [copied, setCopied] = useState(false)
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    if (!copied) return
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }, [copied])

  return (
    <button
      onClick={() => {
        setCopied(true)
        navigator.clipboard.writeText(currentUrl)
      }}
      className={TOOLBAR_BUTTON_CLASSNAME}
      type="button"
      aria-label="Copy URL"
    >
      <span className="sr-only">{copied ? 'Copied' : 'Copy URL'}</span>
      {copied ? (
        <CheckIcon className="h-5 w-5" />
      ) : (
        <CopyIcon className="h-5 w-5" />
      )}
    </button>
  )
}

export default function LayoutEnginarrStudio({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="pointer-events-none fixed left-0 top-0 z-10 h-12 w-full bg-gray-100 to-transparent backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)] dark:bg-zinc-950" />
      <ScrollProgress
        className="fixed top-0 z-20 h-0.5 bg-gray-300 dark:bg-zinc-600"
        springOptions={{
          bounce: 0,
        }}
      />

      <div className="mt-12 mb-10 flex items-center justify-between">
        <BackButton />
        <CopyButton />
      </div>
      <main className="prose prose-sm prose-gray pb-20 prose-h4:prose-base dark:prose-invert prose-h1:text-xl prose-h1:font-medium prose-h2:mt-12 prose-h2:scroll-m-20 prose-h2:text-lg prose-h2:font-medium prose-h3:text-base prose-h3:font-medium prose-h4:font-medium prose-h5:text-base prose-h5:font-medium prose-h6:text-base prose-h6:font-medium prose-strong:font-medium">
        {children}
      </main>
    </>
  )
}
