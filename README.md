# Buddin

[getbuddin.org](https://getbuddin.org) — a free, private mental wellness app for teens. Built solo by a high-school student founder.

Teens are more connected than ever and lonelier than ever, and most of that screen time goes into feeds that don't actually help. Buddin is a small set of tools aimed at the other direction:

- **Chat** — a companion built to be a bridge back to real life, not a replacement for it. Nudges you toward your actual friends instead of keeping you talking to it forever. Free guest mode included, no signup required to try it.
- **Do** — an activity generator for when you know you should do something other than scroll but can't think of what.
- **Breathe** — a paced, animated breathing exercise with calming background music, for when you need to physically calm down, not just distract yourself.
- **Growth** — a tracker for activities completed and badges earned, so the effort is visible instead of disappearing the moment you close the tab.
- **Know Me** — seven ways of building a picture of someone without ever asking them to describe themselves: forced A/B choices rated on an unfamiliar prime-number scale, word association with adaptive difficulty, open writing prompts, direct preferences, name recognition, number reactions, and a synthesis that suggests directions their working life might take. Everything feeds one inference engine that only asks for the parts it actually has data for.
- **Learn It** — five scenario-based skill modules for the practical things school skips and families teach unevenly: etiquette, grammar and writing, financial self-control, reading people, and staying composed under pressure.

Buddin isn't therapy and isn't a social feed. It's a judgment-free place to think out loud and a nudge toward doing one small real thing.

## Stack

- **Frontend** — React 18 + Vite, no React Router. `main.jsx` is the top-level router; `components/SiteShell.jsx` holds the history helpers, nav, footer and per-route title/canonical hook.
- **Auth & DB** — Supabase
- **Hosting** — Vercel, serverless functions in `/api`
- **AI** — Anthropic API, called server-side only (the key never reaches the browser). Three routes call it: `api/chat.js` for conversation, `api/infer-profile.js` for the Know Me personality synthesis, and `api/knowme.js` for Career Discovery and the Learn It coach.
- **Payments** — none. See *Tiers* below.

## Project structure

```
main.jsx             entry point + the top-level router (marketing vs. app vs. 404)
index.html           single static shell served for every route
api/                 9 Vercel serverless functions (chat, profile inference, module saves)
components/          marketing site, auth, guest chat, legal pages, 404
components/screens/  the Know Me and Learn It module screens
components/learnit/  Learn It scenario diagrams and the companion coach panel
src/App.jsx          the authenticated app — chat, missions, progress, screen router
src/boom/            memory schema, mood inference and the question bank
src/data/            question banks and scenario content for every module
lib/                 shared client-side helpers (Supabase client, guest chat)
public/              static assets (audio, icons, sitemap, robots.txt)
scripts/             one-off maintenance scripts
```

## Local development

```bash
npm install
npm run dev       # vite dev server
npm run build     # production build
npm run preview   # preview the production build
```

`npm run dev` serves the frontend only. **Every** `/api/*` route is a Vercel
function and returns 404 under plain Vite — so chat, the Know Me modules, the
Learn It coach and profile inference are all non-functional locally unless you
run `vercel dev` instead. Marketing pages, routing and layout work fine either
way.

Copy `.env.example` to `.env.local` and fill it in — it documents all five
variables and where each one comes from.

### Database setup

> **Heads up — the base schema is not in this repo yet.** The code reads 11
> tables; only 4 of them (`feedback`, `pop_culture_responses`,
> `number_responses`, `training_progress`) have a `CREATE TABLE` here. The other
> seven — `profiles`, `user_profile`, `usage`, `user_memory`,
> `comparison_responses`, `word_responses`, `writing_samples` — were created by
> hand in the Supabase dashboard and have no DDL checked in. On a **fresh**
> Supabase project the scripts below abort on their first statement.
>
> To fix this properly, export the live schema and commit it as
> `supabase-schema-base.sql`, to run before the two below:
>
> ```bash
> supabase db dump --schema public --data-only=false -f supabase-schema-base.sql
> ```
>
> (or Supabase dashboard → Database → Schema Visualizer → export). Until that
> lands, this repo is not reproducible from a clean checkout.

Against the **existing** project, run these in the Supabase SQL editor, **in
this order**, because the second depends on the `UNIQUE(user_id)` constraint
the first adds:

1. `supabase-fixes.sql` — adds the missing `writing_samples` column, de-duplicates
   `user_profile` and adds its unique constraint, creates the `feedback` table.
2. `supabase-schema-v2.sql` — everything the Know Me and Learn It modules need.

`supabase-schema-v2.sql` is written to be idempotent and ends with a check query
that should return `true` on every row. `supabase-fixes.sql` says to run it once:
its `DELETE ... USING` de-duplication step is destructive by design, so re-running
it is harmless on clean data but is not something to do casually.

### Tiers

There is no way to buy a tier — the purchase flow was removed in October 2026
because it could not verify payments server-side. Tiers are granted by hand:

```sql
update profiles set tier = 'supporter' where id = '<user-uuid>';
```

See `TIER_SYSTEM_SETUP.md` for what each tier changes and what would have to be
built before purchasing could return.

## Tools

Tried a few AI coding tools along the way — Claude Code, Google Labs' Jules — and ultimately ended up doing much of it myself except for the web hosting and Supabase Dashboard managements which I had no prior experience doing so I needed some assistance from Claude.

## License

MIT — see [LICENSE](LICENSE).

## Contact

Questions or feedback: **getbuddin@gmail.com**
