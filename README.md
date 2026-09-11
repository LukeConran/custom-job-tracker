# Application Scout

Personal internship tracker for **Luke Conran**. Phase 1 is a local-first Next.js app that:

1. Ingests public Summer 2027 internship feeds
2. Keeps **ML / DS / AI / computer-vision** roles only (no Spring 2027 co-ops)
3. Tracks applications: `applied` | `interviewing` | `oa` | `offer` | `rejected` | `skipped`
4. Shows a ranked **Next to apply** queue with one-click status updates

There is **no auto-apply**. Day-to-day use is the web UI, not a CLI.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, `@supabase/supabase-js`.

## Pages and APIs

| Route | What it does |
| --- | --- |
| `/` | Ranked Next to apply list with company/title search + fit chips, keyword hints, **Refresh jobs**, Applied / Interviewing / OA / Skip |
| `/applications` | Compact tracker table with search, **All = active pipeline** (hides rejected/skipped), status chips, JD links, delete-with-confirm, CSV import |
| `POST /api/ingest` | Fetch, filter, rank, upsert roles |
| `GET/POST/PATCH/DELETE /api/applications` | Create, update, or delete an application. `POST` also accepts CSV (`text/csv` or `{ "csv": "..." }`) |

## Ranking

`rank_score = freshness + fit + brand`

- **Fit:** computer vision > ML/DS > AI-SWE
- **Freshness:** newer `posted_at` ranks higher
- **Brand:** light boost for a short list of well-known labs/companies

Any role that already has an application in **any** status, including `skipped`, is hidden from Next to apply and shown on Applications instead.

## Sources (GET only)

1. [SimplifyJobs Summer 2027 listings](https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json) — `active` and visible; category `AI/ML/Data` **or** CV/ML/DS/AI title keywords; **Summer 2027** terms only; **not PhD-only**
2. [zshah101 Summer 2027 / Fall 2026 jobs](https://zshah101.github.io/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships/api/jobs.json) — ML/AI/CV; **Summer 2027** only; same PhD-only drop via title when degrees are absent

URLs are normalized (tracking/utm params stripped, host lowercased, trailing slash removed) and deduped by that cleaned URL. Sponsorship is **not** used as a filter.

### Degree filter

Keep BS, MS, BS/MS, BS/MS/PhD, and MS/PhD. Drop **PhD-only** (and postdoc).

- Simplify `degrees: ["PhD"]` (and other PhD/postdoc-only arrays) → exclude
- `["Master's","PhD"]`, `["Bachelor's","Master's","PhD"]`, Bachelor’s/Master’s only, or empty `degrees` → keep (empty falls through to the title)
- Title-only: drop “PhD Intern” / postdoc; **do not** drop “MS/PhD” or “BS/MS/PhD”

### Hard company exclusions

Company-name matches only (word-boundary safe so “NVIDIA” / “Financial” are not dropped):

Lockheed Martin, Sandia, Los Alamos, Idaho National, CIA, DIA.

## Setup

```bash
npm install
cp .env.example .env.local
```

### 1. Supabase schema

In the [Supabase SQL editor](https://supabase.com/dashboard) for project `lzgbtyztepeunvvvvbmu`, run `supabase/schema.sql` (same SQL as `supabase/migrations/20260911000000_init.sql`).

Or, if you use the Supabase CLI:

```bash
supabase db push
```

### 2. Environment

`.env.example` documents:

```
NEXT_PUBLIC_SUPABASE_URL=https://lzgbtyztepeunvvvvbmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INGEST_SECRET=
```

Never commit real keys. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is what ingest / application upserts should use.

`INGEST_SECRET` is optional. If set, `POST`/`GET /api/ingest` requires `Authorization: Bearer <secret>` or `x-ingest-secret: <secret>`. Leave it **blank** in `.env.local` so the **Refresh jobs** button (unauthenticated `POST /api/ingest`) keeps working. Set it in production before pointing a cron at the route.

### 3. RLS (personal prototype)

RLS is **enabled** on `roles` and `applications` with **no public policies**. The Next.js server uses the service role key, which bypasses RLS. The anon key cannot read or write these tables unless you add policies.

This is the simplest approach that still keeps the database closed to anyone who only has the published anon key. Do not add “allow all” policies unless you accept that the anon key becomes full access.

### 4. Local-first fallback

If Supabase keys are missing, the app writes `.data/store.json` (gitignored) so you can run the UI on a laptop without a project. That fallback is **not** for Vercel — set the Supabase keys before deploying.

```bash
npm run dev
```

Open `/` and click **Refresh jobs**. First ingest downloads the Simplify listings JSON (large) and can take 15–30 seconds.

```bash
npm test
npm run build
```

## CSV import

On `/applications`, import a sheet with columns:

`Company, Role, Type, Location, Date Applied, Status, Contact, Pay/Hr, Link`

Status aliases (`OA`, `Online Assessment`, `Skip`, …) map onto the six tracker statuses. Extra columns are stored in `notes`. Rows without a `Link` are skipped. Duplicate cleaned URLs are ignored.

## Scheduled ingest (Vercel Cron)

Local **Refresh jobs** is an unauthenticated `POST /api/ingest`. That still works whenever `INGEST_SECRET` is unset or empty.

For a hosted refresh, set `INGEST_SECRET` on Vercel, then either curl or use the daily cron in `vercel.json` (`GET /api/ingest` at 13:00 UTC). GET and POST share the same auth + ingest handler — existing POST behavior is unchanged.

### curl

```bash
curl -X POST "https://YOUR_DOMAIN/api/ingest" \
  -H "Authorization: Bearer $INGEST_SECRET"
```

Same secret via header:

```bash
curl -X POST "https://YOUR_DOMAIN/api/ingest" \
  -H "x-ingest-secret: $INGEST_SECRET"
```

### Vercel Cron

`vercel.json` already declares:

```json
{
  "crons": [{ "path": "/api/ingest", "schedule": "0 13 * * *" }]
}
```

Vercel Cron sends **GET** and, if you set `CRON_SECRET`, adds `Authorization: Bearer $CRON_SECRET`. Set `INGEST_SECRET` to that same value so the request is accepted. Or skip platform cron and POST from an external scheduler with `Authorization: Bearer $INGEST_SECRET`.

Do not add “allow all” RLS policies; ingest still uses the service role on the server.

## Deploy (later)

Vercel-ready: set the env vars (including `INGEST_SECRET` for cron), apply the schema, deploy.

## Schema

See `supabase/schema.sql`.

- `roles.id` — SHA-256 hex of the cleaned URL
- `applications.url` — unique normalized URL
- `applications.status` — check constraint for the six statuses
