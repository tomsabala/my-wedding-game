# My Wedding Game

A mobile-first web platform where couples create a personalised wedding trivia game with questions, memory cards, QR sharing, guest participation, and a final leaderboard.

All surfaces — couple dashboard and player game — are served by a single Next.js app at `myweddinggame.com`.  
When a couple deploys their game, it gets a unique 3-letter code (e.g. `abc`).  
The QR code points to `myweddinggame.com/abc`.

## Structure

```
apps/
  web/                    ← single Next.js app (myweddinggame.com)
    app/
      (marketing)/        → /            public landing page
      (auth)/login        → /login       couple sign-in
      (auth)/signup       → /signup      couple sign-up
      (dashboard)/        → /dashboard   protected couple area
      [slug]/             → /abc         player game entry (public)
packages/
  shared/                 ← types, Zod schemas, scoring logic, slug generator
  db/                     ← Prisma client + schema
  eslint-config/          ← shared ESLint rules
```

## Local setup

**Prerequisites:** Node 20+, pnpm 10+

```bash
# 1. Install dependencies (also runs prisma generate)
pnpm install

# 2. Copy env template and fill in your Supabase credentials
cp apps/web/.env.local.example apps/web/.env.local

# 3. Run initial migration against your Supabase DB
pnpm --filter @repo/db db:migrate

# 4. Start the app
pnpm dev
```

App → http://localhost:3000

## Supabase setup

1. Create a project at supabase.com
2. Enable **Email** and **Google** auth providers under Authentication → Providers
3. Create two Storage buckets: `photos` and `videos` (private)
4. Copy the project URL, anon key, service role key, and DB connection strings into `apps/web/.env.local`

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the app |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | Type-check all packages |
| `pnpm --filter @repo/db db:migrate` | Run Prisma migrations |
| `pnpm --filter @repo/db db:studio` | Open Prisma Studio |
