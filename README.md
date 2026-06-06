<img src="/public/cover.png" alt="ifeadese.com homepage" width="100%" />

# ifeadese.com

My personal website — a hub for documenting life across faith, career, business, and hobbies. Built with Next.js 15, React 19, Tailwind CSS v4, and Motion.

Live: [https://ifeadese.com](https://ifeadese.com)

## What's on it

- One-page portfolio with animated sections
- Blog posts (MDX)
- Project case studies
- Web design & development services with Calendly scheduling
- Health/running data visualizations (behind feature flag)

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS v4, Motion
- **Content:** MDX for blog and project pages
- **Components:** Motion-Primitives, Lucide icons, Recharts
- **Deployment:** Vercel

## Getting started

```bash
git clone git@github.com-personal:ifeadese/ifeadese.com.git
cd ifeadese.com
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site locally.

## Project structure

```
app/
  page.tsx              # Homepage
  blog/                 # Blog posts (MDX)
  projects/             # Project case studies (MDX)
  services/             # Service pages
components/
  health/               # Running data visualizations
  ui/                   # Reusable UI primitives
lib/                    # Utilities, constants, data helpers
public/data/            # Static data (runs, etc.)
```
