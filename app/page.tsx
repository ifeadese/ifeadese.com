'use client'
import { motion } from 'motion/react'
import { XIcon } from 'lucide-react'
import { Spotlight } from '@/components/ui/spotlight'
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/ui/morphing-dialog'
import Link from 'next/link'
import Image from 'next/image'
import { WORK_EXPERIENCE, PROJECTS, EMAIL, SOCIAL_LINKS } from './data'
import { FEATURES } from '@/lib/constants'
import dynamic from 'next/dynamic'

const RunningDistanceChart = dynamic(
  () =>
    import('@/components/health/running-distance-chart').then(
      (module) => module.RunningDistanceChart,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading running chart...
      </p>
    ),
  },
)

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = {
  duration: 0.3,
}

type ProjectMediaProps = {
  video?: string
  image?: string
}

function ProjectMedia({ video, image }: ProjectMediaProps) {
  const mediaSrc = video || image
  if (!mediaSrc) return null

  const isVideo = !!video
  if (!isVideo && !image) return null

  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0,
        duration: 0.3,
      }}
    >
      <MorphingDialogTrigger>
        {isVideo ? (
          <video
            src={video}
            autoPlay
            loop
            muted
            className="aspect-video w-full cursor-zoom-in rounded-xl"
          />
        ) : (
          <Image
            src={image!}
            alt="Project cover"
            width={800}
            height={450}
            className="aspect-video w-full cursor-zoom-in rounded-xl object-cover"
          />
        )}
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative aspect-video rounded-2xl bg-zinc-50 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950 dark:ring-zinc-800/50">
          {isVideo ? (
            <video
              src={video}
              autoPlay
              loop
              muted
              className="aspect-video h-[50vh] w-full rounded-xl md:h-[70vh]"
            />
          ) : (
            <Image
              src={image!}
              alt="Project cover"
              width={1200}
              height={675}
              className="aspect-video h-[50vh] w-full rounded-xl object-cover md:h-[70vh]"
            />
          )}
        </MorphingDialogContent>
        <MorphingDialogClose
          className="fixed top-6 right-6 h-fit w-fit rounded-full bg-white p-1"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon className="h-5 w-5 text-zinc-500" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

/**
 * Contact icons: 18px, drawn in currentColor, matching the outlined 1.6-stroke
 * set used in the Credom footer so both sites share one icon language.
 */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-[18px] w-[18px] shrink-0',
} as const

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="4.75" width="19" height="14.5" rx="2.5" />
      <path d="m3.5 7 7.6 5.3a1.6 1.6 0 0 0 1.8 0L20.5 7" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M7.5 10.5v6.5" />
      <circle cx="7.5" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.5 17v-6.5" />
      <path d="M11.5 13.2c0-1.6 1.1-2.8 2.6-2.8s2.4 1.1 2.4 2.8V17" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

const CONTACT_LINK_CLASSNAME =
  'inline-flex shrink-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400'

const SOCIAL_ICONS: Record<string, () => React.ReactElement> = {
  github: GithubIcon,
  linkedin: LinkedInIcon,
}

function SocialLink({ label, link }: { label: string; link: string }) {
  const Icon = SOCIAL_ICONS[label.toLowerCase()] ?? MailIcon

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={CONTACT_LINK_CLASSNAME}
    >
      <Icon />
      <span className="sr-only">{label}: </span>
      {link}
    </a>
  )
}

function CareerLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}

export default function Personal() {
  return (
    <motion.main
      className="space-y-12"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <div className="flex-1">
          <p className="text-zinc-600 dark:text-zinc-400">
            I'm a software engineer with a wide range of creative interests and
            hobbies. This site is my hub for documenting life in key areas and
            the things I'm learning along the way. One life, one story.
          </p>
          <div className="mt-6">
            <Image
              src="/author.jpeg"
              alt="Ife Adese"
              width={1200}
              height={800}
              objectFit="fill"
              className="w-full rounded-2xl object-cover grayscale"
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Career</h3>
        <div className="flex flex-col space-y-2">
          {WORK_EXPERIENCE.map((job) => (
            <CareerLink
              key={job.id}
              href={job.link}
              className="relative overflow-hidden rounded-2xl bg-zinc-300/30 p-[1px] dark:bg-zinc-600/30"
            >
              <Spotlight
                className="from-zinc-900 via-zinc-800 to-zinc-700 blur-2xl dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-50"
                size={64}
              />
              <div className="relative h-full w-full rounded-[15px] bg-white p-4 dark:bg-zinc-950">
                <div className="relative flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <h4 className="text-sm font-normal dark:text-zinc-100">
                      {job.title}
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {job.company}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-600 sm:text-right dark:text-zinc-400">
                    {job.start} - {job.end}
                  </p>
                </div>
              </div>
            </CareerLink>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-3 text-lg font-medium">Work</h3>
        <div className="flex flex-col space-y-2">
          {PROJECTS.map((project) => (
            <Link
              key={project.uid}
              className="relative overflow-hidden rounded-2xl bg-zinc-300/30 p-[1px] dark:bg-zinc-600/30"
              href={project.link}
            >
              <Spotlight
                className="from-zinc-900 via-zinc-800 to-zinc-700 blur-2xl dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-50"
                size={64}
              />
              <div className="relative h-full w-full rounded-[15px] bg-white p-4 dark:bg-zinc-950">
                <div className="relative flex w-full flex-col space-y-1">
                  <h4 className="text-sm font-normal dark:text-zinc-100">
                    {project.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {project.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {FEATURES.healthRunningChart && (
        <motion.section
          variants={VARIANTS_SECTION}
          transition={TRANSITION_SECTION}
        >
          <h3 className="mb-3 text-lg font-medium">Runs</h3>
          <RunningDistanceChart />
        </motion.section>
      )}

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Contact</h3>
        <div className="flex flex-col items-start gap-3">
          <a className={CONTACT_LINK_CLASSNAME} href={`mailto:${EMAIL}`}>
            <MailIcon />
            {EMAIL}
          </a>
          {SOCIAL_LINKS.map((link) => (
            <SocialLink key={link.label} label={link.label} link={link.link} />
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
