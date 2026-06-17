# Buddin

[getbuddin.org](https://getbuddin.org) — a free, private mental wellness app for teens. Built solo by a 9th-grade student founder.

Teens are more connected than ever and lonelier than ever, and most of that screen time goes into feeds that don't actually help. Buddin is a small set of tools aimed at the other direction:

- **Chat** — a companion built to be a bridge back to real life, not a replacement for it. Nudges you toward your actual friends instead of keeping you talking to it forever. Free guest mode included, no signup required to try it.
- **Do** — an activity generator for when you know you should do something other than scroll but can't think of what.
- **Comparisons** — quick, low-stakes "pick A or B" rounds that double as a way to learn what you actually value.
- **Breathe** — a paced, animated breathing exercise with calming background music, for when you need to physically calm down, not just distract yourself.
- **Growth** — a tracker for activities completed and badges earned, so the effort is visible instead of disappearing the moment you close the tab.

Buddin isn't therapy and isn't a social feed. It's a judgment-free place to think out loud and a nudge toward doing one small real thing.

## Stack

- **Frontend** — React 18 + Vite, no React Router (hand-rolled routing via `components/SiteShell.jsx`)
- **Auth & DB** — Supabase
- **Hosting** — Vercel, serverless functions in `/api`
- **AI** — Anthropic API, called server-side only via `/api/chat.js` (never exposed to the browser)

## Project structure

```
api/            serverless functions (chat, mood/profile inference, sessions)
components/     marketing site, auth, guest chat, legal pages
src/            the authenticated app (chat, missions, progress, etc.)
lib/            shared client-side helpers
public/         static assets (audio, images, sitemap)
scripts/        one-off maintenance scripts
```

## Local development

```bash
npm install
npm run dev       # vite dev server
npm run build     # production build
npm run preview   # preview the production build
```

Guest mode (`/try` and the homepage demo) calls `/api/chat`, which only runs on Vercel — use `vercel dev` instead of `npm run dev` to test it locally.

Copy `.env.example` to `.env.local` and fill in your own Supabase and Anthropic keys.

## Contact

Questions or feedback: **getbuddin@gmail.com**
