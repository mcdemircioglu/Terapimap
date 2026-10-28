# Terapimap

Terapist (psikolog, psikiyatrist, psikolojik danışman) keşif ve karşılaştırma platformu.
A therapist discovery and comparison platform for the Turkish market.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- next-intl (aktif locale: yalnızca `tr`)
- nodemailer (Gmail SMTP)

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# fill in the values (see docs/DEVELOPMENT.md)

# 3. Run
npm run dev
```

Open http://localhost:3000. You will be redirected to `/tr`.

Veritabanı mevcut Supabase projesidir. SQL dosyaları ve tablolar için [docs/DATABASE.md](docs/DATABASE.md) dosyasına bakın.

## Main routes

- `/tr`: Ana sayfa
- `/tr/terapistler`, `/tr/terapistler/[city]`, `/tr/terapistler/[city]/[specialty]`: Terapist dizini
- `/tr/psikolog/[slug]` (ayrıca `psikiyatrist`, `psikolojik-danisman`, `aile-terapisti`, `cocuk-psikiyatristi`): Profil
- `/tr/[seoSlug]`: SEO landing sayfaları
- `/tr/psikoloji-rehberi`, `/tr/testler`, `/tr/duyurular`: Rehber, testler, duyurular
- `/panel`: Terapist paneli (Supabase Auth)
- `/admin`: Admin paneli

Tam liste için: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

- [CLAUDE.md](CLAUDE.md): Claude Code çalışma kuralları
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Mimari, route'lar, önbellek, auth
- [docs/DATABASE.md](docs/DATABASE.md): Tablolar, RLS, SQL dosya envanteri
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): Kurulum, ortam değişkenleri, geliştirme akışı

## Conventions

- Server Components by default. Mark only interactive pieces with `"use client"`.
- Public DB reads go through `src/lib/queries.ts` (and `articles.ts`, `announcements.ts`, `seo-landing.ts`).
- Filter values in URLs are slugs (`anksiyete`, `istanbul`) so the pages are crawlable and shareable.
- Internal links are built with `getProfessionalUrl()` / `getTherapistsListPath()` from `src/lib/utils.ts`.
