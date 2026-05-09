# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                              # start the app (http://localhost:3000)
pnpm build                            # build all packages
pnpm lint                             # lint all packages
pnpm type-check                       # type-check all packages
pnpm format                           # format with Prettier
pnpm --filter @repo/db db:migrate     # run Prisma migrations
pnpm --filter @repo/db db:studio      # open Prisma Studio
pnpm --filter @repo/db db:generate    # regenerate Prisma client
```

All commands use [Turborepo](https://turbo.build/) and respect inter-package dependency order.

## Architecture

Monorepo (pnpm workspaces + Turborepo) with one deployable app and three shared packages:

```
apps/web/          — single Next.js 16 app (App Router) at myweddinggame.com
packages/db/       — Prisma schema + generated client
packages/shared/   — types, Zod schemas, scoring logic, slug generator
packages/eslint-config/ — shared ESLint rules
```

### apps/web route groups

| Route group | URL | Notes |
|---|---|---|
| `(marketing)/` | `/` | Public landing page |
| `(auth)/login` | `/login` | Couple sign-in |
| `(auth)/signup` | `/signup` | Couple sign-up |
| `(dashboard)/dashboard` | `/dashboard` | Protected; requires auth |
| `[slug]/` | `/abc` | Public player game entry via QR |

**Auth middleware** (`apps/web/middleware.ts`) uses `@supabase/ssr` to refresh the session on every request. It guards all routes except `/`, `/login`, `/signup`, and 3-letter slug routes (`/[a-z]{3}`). Authenticated users visiting auth routes are redirected to `/dashboard`.

**Supabase clients** live in `apps/web/lib/supabase/`:
- `server.ts` — async `createClient()` for Server Components and Route Handlers (uses `next/headers`)
- `client.ts` — browser client for Client Components

### packages/db

Prisma schema defines five models: `Game`, `Question`, `PassingCard`, `Player`, `PlayerAnswer`. The `Game.slug` is a unique 3-letter code. All child models cascade-delete from `Game`.

Requires two env vars: `DATABASE_URL` (pooled connection) and `DIRECT_URL` (direct connection for migrations).

### packages/shared

- `types.ts` — TypeScript interfaces mirroring the Prisma models (no Prisma dependency)
- `scoring.ts` — `calculateQuestionScore` / `calculateTotalScore`: 1000 base points minus 50 per second taken, minimum 100 for a correct answer, 0 for wrong
- `utils.ts` — `generateSlug()`: random 3-letter lowercase string
- `schemas.ts` — Zod validation schemas

## Game concept

Couples create a trivia game, deploy it, and share a QR code. Guests play without accounts — player session stored in `localStorage`. Score = sum of per-question scores (speed-penalised). Leaderboard updates live on the end screen.

## Local setup

Copy `apps/web/.env.local.example` → `apps/web/.env.local` and fill in Supabase credentials (project URL, anon key, service role key, `DATABASE_URL`, `DIRECT_URL`). Run `pnpm --filter @repo/db db:migrate` after adding credentials.
