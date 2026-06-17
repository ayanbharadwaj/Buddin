# Buddin

[getbuddin.org](https://getbuddin.org) — a quiet, private conversational companion built for teen emotional wellness. Built by a 9th-grade student founder.

Buddin isn't therapy, a chatbot assistant, or a social feed. It's a judgment-free place to think out loud, with a free guest preview and a full app for signed-in users that remembers you over time.

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
