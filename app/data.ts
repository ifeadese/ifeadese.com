type Service = {
  name: string
  description: string
  link?: string
  video?: string
  image?: string
  id: string
}

type WorkExperience = {
  company: string
  title: string
  start: string
  end: string
  link: string
  id: string
}

type Project = {
  title: string
  description: string
  link: string
  uid: string
}

type SocialLink = {
  label: string
  link: string
}

export const SERVICES: Service[] = [
  {
    name: 'Web Design & Development',
    description:
      'With hosting, branding & SEO as needed. Delivered within 1-2 weeks. Starting at $300.',
    link: '/services/web-design-development',
    id: 'service2',
  },
]

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    company: 'GoDaddy',
    title: 'Software Engineer',
    start: 'April 2022',
    end: 'Present',
    link: 'https://godaddy.com',
    id: 'work1',
  },
  {
    company: 'Rebel.com',
    title: 'Software Developer',
    start: 'May 2020',
    end: 'April 2022',
    link: 'https://rebel.com',
    id: 'work2',
  },
]

// NOTE: Keep title and description in sync with the metadata export in each project's MDX file
// When updating a project, update both:
// 1. The metadata export in app/projects/[slug]/page.mdx
// 2. The entry in PROJECTS below
export const PROJECTS: Project[] = [

  {
    title: 'Galentines 2026: The Love of God Conference',
    description:
      'A website for an annual Christian women\'s conference in Ottawa.',
    link: '/projects/galentines-2026',
    uid: 'project-1',
  },
  {
    title: 'Designing an App to Help Churches Engage with Newcomers',
    description:
      'A mobile app design to help churches engage with newcomers.',
    link: '/projects/church-guest-engagement',
    uid: 'project-2',
  },
  {
    title: 'Lighthouse Church Ottawa',
    description:
      'A website rebuild for a multi-campus church in Ottawa.',
    link: '/projects/lighthouse-church-ottawa',
    uid: 'project-3',
  }
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Github',
    link: 'https://github.com/ifeadese',
  },
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/ifeadese/',
  },
]

export const EMAIL = 'ifeoluwaadese@gmail.com'
