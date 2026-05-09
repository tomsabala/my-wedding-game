# Tech Stack

## Architecture

Monorepo with two deployable apps sharing a common packages layer.

```
apps/
  dashboard/   ← couple-facing admin UI
  game/        ← player-facing game UI
packages/
  shared/      ← types, utilities, validation schemas
```

---

## Frontend

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | **Next.js 14 (App Router)** | SSR for game landing pages (SEO/QR link previews), file-based routing, easy API routes |
| Language | **TypeScript** | End-to-end type safety across monorepo |
| Styling | **Tailwind CSS** | Rapid mobile-first UI, no runtime CSS cost |
| UI Components | **shadcn/ui** | Accessible, unstyled-by-default components built on Radix UI |
| Animations | **Framer Motion** | Answer feedback animations, card transitions |
| Forms | **React Hook Form + Zod** | Validated forms with minimal re-renders |
| State (client) | **Zustand** | Lightweight game session state (current question, score, timer) |
| Drag and drop | **dnd-kit** | Reorder questions and passing cards in dashboard |
| QR generation | **qrcode** (npm) | Client-side QR PNG generation and download |

---

## Backend

| Concern | Choice | Reason |
|---------|--------|--------|
| API | **Next.js Route Handlers** | Co-located with frontend, reduces infra overhead for MVP |
| ORM | **Prisma** | Type-safe DB access, easy migrations, works well with Next.js |
| Database | **PostgreSQL** (via Supabase) | Relational data fits the game model; Supabase adds realtime + auth |
| Auth | **Supabase Auth** | Email/password + OAuth out of the box, integrates with Postgres RLS |
| File Storage | **Supabase Storage** | Photo and video uploads, signed URLs, CDN delivery |
| Realtime | **Supabase Realtime** | Leaderboard live updates via Postgres changes broadcast |

---

## Database Schema (key tables)

```
users           — managed by Supabase Auth
games           — id, user_id, slug, couple_names, wedding_date, status (draft|live)
questions       — id, game_id, text, options (jsonb), correct_index, position
passing_cards   — id, game_id, type (did_you_know|photo|video), content, after_question_position
players         — id, game_id, display_name, score, finished_at
player_answers  — id, player_id, question_id, selected_index, is_correct, time_taken_ms
```

---

## Infrastructure & DevOps

| Concern | Choice |
|---------|--------|
| Hosting | **Vercel** (both apps) |
| Database / Auth / Storage | **Supabase** (managed) |
| Monorepo tooling | **Turborepo** |
| Package manager | **pnpm** |
| CI/CD | **GitHub Actions** — lint, type-check, test on PR; deploy on merge to main |
| Error tracking | **Sentry** |
| Environment secrets | Vercel environment variables + `.env.local` locally |

---

## Key Libraries Summary

```
next, react, react-dom
typescript
tailwindcss
@radix-ui/react-* (via shadcn/ui)
framer-motion
react-hook-form, zod
zustand
@supabase/supabase-js
@supabase/auth-helpers-nextjs
prisma, @prisma/client
dnd-kit
qrcode
sentry/nextjs
```

---

## Local Development

```bash
pnpm install
pnpm dev          # starts both apps in parallel via Turborepo
```

Requires a local `.env.local` with Supabase project URL, anon key, and service role key.
Supabase can be run locally via the Supabase CLI (`supabase start`).
