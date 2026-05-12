# Terapimap

Terapist (psikolog & psikoterapist) keşif ve karşılaştırma platformu.
A therapist discovery and comparison platform for the Turkish market.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth)
- next-intl (TR / EN)

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Set up the database
# In the Supabase SQL editor, run, in order:
#   supabase/schema.sql
#   supabase/seed.sql

# 4. Run
npm run dev
```

Open http://localhost:3000 — you will be redirected to `/tr` (default locale).

## Routes

- `/` → redirects to default locale (`/tr`)
- `/[locale]` — Homepage
- `/[locale]/therapists` — All therapists with filters
- `/[locale]/therapists/[city]` — Therapists in a city
- `/[locale]/therapists/[city]/[specialty]` — City + specialty filtered list
- `/[locale]/therapist/[slug]` — Therapist profile + lead form
- `/api/leads` — POST endpoint to submit a lead

Locales: `tr` (default), `en`.

## Project structure

```
src/
  app/
    [locale]/             # all user-facing pages, locale-aware
    api/leads/            # lead submission endpoint
  components/             # shared UI (cards, filters, forms, primitives)
  lib/
    supabase/             # SSR-safe browser + server clients
    queries.ts            # all DB reads
    cities.ts, specialties.ts  # constants for filter UIs and routing
  i18n.ts                 # next-intl config
  middleware.ts           # locale routing
messages/
  tr.json, en.json        # translations
supabase/
  schema.sql              # tables, indexes, RLS
  seed.sql                # 18 sample therapists
```

## Scaling notes (next phases)

The shape is set up so we can add later, without rewriting:

- **Therapist auth panel** — Supabase Auth is already linked. Add a `/[locale]/dashboard` route group, a `user_id` column on `psychologists`, and an RLS policy `psychologists.user_id = auth.uid()` for self-edits.
- **Subscriptions / SaaS** — add a `subscriptions` table keyed by `user_id`. Stripe webhooks live in `app/api/stripe/`.
- **AI assistants (WhatsApp, IG DM)** — keep these as separate workers that read from `leads` and `psychologists`. Don't put them in this app.
- **Messaging / CRM** — `conversations` + `messages` tables, realtime via Supabase channels.

## Conventions

- Server Components by default. Mark only interactive pieces with `"use client"`.
- All DB reads go through `lib/queries.ts` — easier to swap data sources later.
- Filter values in URLs are slugs (`anksiyete`, `istanbul`) so the pages are crawlable and shareable.
