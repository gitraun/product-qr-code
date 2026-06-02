@AGENTS.md

# Product QR Code — Project Context

## What this project does
Generates dynamic QR codes for physical product labels. The QR code image printed on a label encodes a fixed short URL (e.g. `go.yourbrand.com/p/[slug]`). That URL redirects to a configurable destination — so the destination can be updated anytime without reprinting labels.

## Current QR destination
The QR codes currently point to the **Manufacturer Details** page (this is the destination URL seeded in the `redirects` table):
https://wonderful-scabiosa-e45.notion.site/Manufacturer-Details-373c8079916d800c8f0deb0049c34ad3

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

## What's NOT built yet
- [x] DB schema (redirects table) — pushed to Neon
- [x] drizzle.config.ts
- [ ] `/p/[slug]` redirect route
- [ ] Admin UI
- [ ] Auth setup
- [ ] QR code download feature
