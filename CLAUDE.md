@AGENTS.md

# Product QR Code — Project Context

## What this project does
Generates dynamic QR codes for physical product labels. The QR code image printed on a label encodes a fixed short URL (e.g. `go.yourbrand.com/p/[slug]`). That URL redirects to a configurable destination — so the destination can be updated anytime without reprinting labels.

## Current QR destination
The QR codes currently point to the **Manufacturer Details** page. Seeded in the
`redirects` table under slug `manufacturer`, so the live short URL is
`${NEXT_PUBLIC_BASE_URL}/p/manufacturer`. Destination:
https://wonderful-scabiosa-e45.notion.site/Manufacturer-Details-373c8079916d800c8f0deb0049c34ad3

## Next.js 16 gotchas (this version)
- Dynamic `params` is a **Promise** — must be `await`ed in route handlers/pages.
- `middleware.ts` is deprecated → renamed to `proxy.ts`. (We gate `/admin` via a
  server-side `auth()` check in the layout instead, so no proxy file is needed.)

## Core decisions made
- **Dynamic QR codes** (not static) — destination URL is stored in DB and can be changed from admin panel
- **No scan analytics** — just redirects, keep it simple
- **Small team access** — admin panel protected with auth (NextAuth)
- **User handles Vercel + DB setup manually** — we write the code only

## Tech stack
- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Neon (serverless Postgres)
- **ORM**: Drizzle ORM + drizzle-kit
- **Auth**: NextAuth v5 (beta)
- **QR generation**: `qrcode` npm package (print-ready SVG/PNG output)
- **Hosting**: Vercel

## Key dependencies
```
next-auth@beta
@auth/drizzle-adapter
drizzle-orm
@neondatabase/serverless
drizzle-orm/neon-http
qrcode
@types/qrcode (dev)
drizzle-kit (dev)
```

## Environment variables needed
```
DATABASE_URL=           # Neon pooled connection string (has -pooler in hostname)
AUTH_SECRET=            # generate with: npx auth secret
AUTH_GOOGLE_ID=         # or another OAuth provider
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_BASE_URL=   # base URL QR codes encode, no trailing slash (set before printing)
ADMIN_EMAILS=           # comma-separated emails allowed into /admin
```

## App structure (planned)
- `GET /p/[slug]` — looks up slug in DB, redirects to destination URL (307)
- `/admin` — protected dashboard: create/edit slugs and their destination URLs, download QR code image
- `src/lib/db.ts` — Drizzle + Neon connection
- `src/lib/schema.ts` — DB schema (redirects table)

## DB connection pattern
```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)
```

## Build status
- [x] DB schema (redirects table) — pushed to Neon
- [x] drizzle.config.ts
- [x] `/p/[slug]` redirect route — `src/app/p/[slug]/route.ts` (307)
- [x] Auth setup — NextAuth v5 + Google, `src/auth.ts`, email allow-list via `ADMIN_EMAILS`
- [x] Admin UI — `src/app/admin/` (gated layout, create/edit/delete, server actions)
- [x] QR code download — `src/app/api/qr/[slug]/route.ts` (SVG/PNG, admin-only)

## Remaining (deployment / config)
- [ ] Decide & set custom QR domain in `NEXT_PUBLIC_BASE_URL` before printing labels
- [ ] Add Google OAuth redirect URI for prod domain
- [ ] Deploy to Vercel + set env vars there
