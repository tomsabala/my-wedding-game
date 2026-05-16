# Performance Investigation — Deep Audit

**Branch:** `performance-v2`  
**Date:** 2026-05-16  
**Scope:** Code, database, components, i18n, deployment architecture

---

## Executive Summary

The app has **six distinct layers of performance problems**. The two biggest smoking guns are:

1. **Zero server-side data on the most-hit player pages** — the welcome, play, and leaderboard pages all load game data client-side via `useEffect`, guaranteeing a visible spinner on every page load even when the data could be pre-rendered.
2. **`getPublicGame` has no caching** — the welcome page (first stop for every wedding guest) hits the database on every load with no protection. A wedding with 200 guests all opening the QR link in the same minute fires 200 DB queries for the same row.

The rest of the findings stack on top of those two.

---

## Layer 1 — Server Actions & Data Fetching

### BUG-1 (CRITICAL): `getPublicGame` has no caching
**File:** `apps/web/app/actions/players.ts:20`

```ts
export async function getPublicGame(slug: string): Promise<PublicGame | null> {
  const game = await prisma.game.findUnique({          // ← plain Prisma, no cache
    where: { slug },
    ...
  })
```

Every call to `/[slug]` (the welcome page) executes a live DB query. This is the most-visited page in the system — all guests start here. No `unstable_cache` wraps it.

**Impact:** 200 guests opening the link simultaneously = 200 concurrent DB reads for the same record.

**Fix:** Wrap with `unstable_cache([slug], { tags: ['game-for-play-${slug}'], revalidate: 60 })`. The tag already exists (`game-for-play-${slug}`) and is invalidated by `updateGame`.

---

### BUG-2 (CRITICAL): Play page fetches game data client-side after mount
**Files:** `apps/web/app/[slug]/play/page.tsx` and `apps/web/app/[slug]/play/_components/GamePlayer.tsx:63-95`

`play/page.tsx` passes zero data to `GamePlayer`:
```tsx
export default async function PlayPage({ params }) {
  const { slug } = await params
  return <GamePlayer slug={slug} />     // ← no initialGame passed
}
```

`GamePlayer` then fetches in a `useEffect`:
```ts
useEffect(() => {
  void (async () => {
    const player = readPlayer()              // localStorage read
    const game = await getGameForPlay(slug)  // ← server action round-trip AFTER mount
    setBootstrap({ game, ... })
  })()
}, [slug, router])
```

Timeline for a player:
1. Browser receives HTML → full page shell renders
2. JS hydrates → `useEffect` fires → spinner shown
3. Server action call goes to Vercel → cached response returned (~100–300ms RTT)
4. `ActiveGame` finally mounts

Players see a spinner on every game start, even though `getGameForPlay` is cached.

**Fix:** Call `getGameForPlay` in `play/page.tsx` (RSC) and pass as `initialGame` prop to `GamePlayer`. The localStorage `readPlayer()` call must stay client-side, but `game` data can be pre-fetched server-side.

---

### BUG-3 (CRITICAL): Leaderboard page fetches data client-side after mount
**Files:** `apps/web/app/[slug]/leaderboard/page.tsx` and `LeaderboardClient.tsx:36-47`

```tsx
// page.tsx:
export default async function LeaderboardPage({ params }) {
  const { slug } = await params
  return <LeaderboardClient slug={slug} />   // ← zero data passed
}

// LeaderboardClient.tsx:
useEffect(() => {
  void (async () => {
    const data = await getLeaderboard(slug)  // ← server action call on mount
    setPlayers(data.players)
    setLoading(false)
  })()
}, [slug, router])
```

Players see a loading spinner on the leaderboard every time it loads.

**Fix:** Call `getLeaderboard` in `leaderboard/page.tsx` and pass `initialData` to `LeaderboardClient`. Client effect only needs to run the Realtime subscription, not re-fetch initial data.

---

### BUG-4 (HIGH): `getGame` loads ALL players without a limit
**File:** `apps/web/app/actions/games.ts:61-95`

```ts
prisma.game.findUnique({
  where: { id },
  include: {
    players: {                                 // ← no `take` limit
      select: { id, displayName, score, finishedAt, createdAt },
      orderBy: { createdAt: 'desc' },
    },
    _count: { select: { questions: true, players: true } },
  },
})
```

The dashboard overview page only uses `.slice(0, 3)` for avatars and recent activity. A 150-guest wedding loads 150 player rows, serializes them into the RSC payload, and sends them to the browser — just to display 3.

**Fix:** Add `take: 10` (enough for activity + avatars). The `_count.players` already gives the total count. If a "view all players" page is needed, that's a separate query.

---

### BUG-5 (HIGH): `finishGame` re-reads all answers from DB
**File:** `apps/web/app/actions/players.ts:211-222`

```ts
export async function finishGame(playerId: string): Promise<ActionResult> {
  const answers = await prisma.playerAnswer.findMany({   // ← full table scan for player
    where: { playerId },
    select: { isCorrect: true, timeTakenMs: true },
  })
  const score = calculateTotalScore(answers)
  await prisma.player.updateMany({ where: { id: playerId, finishedAt: null }, data: { score, finishedAt: new Date() } })
}
```

The client already has the exact final score in `totalScore` state (accumulated correctly via `calculateQuestionScore` throughout the game). `finishGame` then re-reads every answer from the DB to recalculate the same number.

**Impact:** At the most latency-sensitive moment (last question answered → end screen), an extra DB read is performed that is 100% redundant.

**Fix:** Accept `score` as a parameter: `finishGame(playerId: string, score: number)`. Trust the client score — it uses the same `calculateQuestionScore` formula, and `submitAnswer` already stores the correct `isCorrect`/`timeTakenMs` for leaderboard purposes. The `score` field in `Player` is purely for display.

---

### BUG-6 (MEDIUM): `submitAnswer` result is discarded — server lookup is unnecessary overhead
**File:** `apps/web/app/[slug]/play/_components/GamePlayer.tsx:426-432`

```ts
void submitAnswer({       // ← fire and forget
  playerId,
  questionId: question.id,
  selectedIndex: serverIdx,
  timeTakenMs,
})
```

The server action `submitAnswer` does a `question.findUnique` to get `correctIndex` and returns `{ isCorrect, questionScore, correctIndex }` — but the result is `void`-ed. The client already computed these values locally:

```ts
const isCorrect = serverIdx === question.correctIndex
const scoreGained = calculateQuestionScore(isCorrect, timeTakenMs)
```

The `question.findUnique` in the server action is executed and paid for, but its result never reaches the client.

**Note:** The DB write (`playerAnswer.create`) IS necessary for leaderboard data. The `question.findUnique` is only needed to verify `isCorrect` server-side for that write — which IS correct for data integrity. However, since the client already has `question.correctIndex` in `PlayGame.questions`, the server action could accept `isCorrect` directly from the client (trusting the client's own data payload). Or alternatively, cache the correctIndex lookup.

---

### BUG-7 (MEDIUM): `getLeaderboard` makes 2 serial DB queries when 1 would do
**File:** `apps/web/app/actions/players.ts:232-266`

```ts
// Query 1: get game by slug
const game = await prisma.game.findUnique({ where: { slug }, select: { id, coupleNames, status } })
// Query 2: aggregate player answers
const rows = await prisma.$queryRaw`SELECT ... FROM players ... WHERE p.game_id = ${game.id} ...`
```

The second query could be rewritten to JOIN on `games` directly using `slug`, eliminating the first query:

```sql
SELECT p.id, p.display_name, COUNT(...) AS correct_count, COALESCE(SUM(...), 0) AS total_time_ms
FROM players p
JOIN games g ON g.id = p.game_id
WHERE g.slug = $1 AND g.status = 'LIVE'
GROUP BY p.id, p.display_name
ORDER BY correct_count DESC, total_time_ms ASC
```

---

### BUG-8 (MEDIUM): `joinGame` checks name uniqueness with no index
**File:** `apps/web/app/actions/players.ts:71-78`

```ts
const existingPlayer = await prisma.player.findFirst({
  where: { gameId: game.id, displayName: name },   // ← composite scan
  select: { id: true },
})
```

There's an index on `[gameId]` and `[gameId, score(sort: Desc)]` in the schema, but no index on `[gameId, displayName]`. This uniqueness check does a sequential scan over all players for that game.

**Fix:** Add `@@index([gameId, displayName])` to the `Player` model.

---

## Layer 2 — Next.js Caching Architecture

### ARCH-1 (HIGH): `unstable_cache` key is created fresh every call in `getGames` / `getGame`
**Files:** `apps/web/app/actions/games.ts:10-21`, `61-96`, etc.

```ts
export async function getGames() {
  const user = await getAuthUser()
  return unstable_cache(
    async () => prisma.game.findMany(...),
    [`games-${user.id}`],          // ← key computed from live user.id
    { tags: [`games-${user.id}`] },
  )()
}
```

`getAuthUser()` is called first (cookie read), then `unstable_cache(fn, key)()` is called. The `fn` closure is re-created on every call. `unstable_cache` uses the `key` array for cache lookup, not function identity, so the cache HIT path is correct. But on a **cache MISS**, the inner `prisma.game.findMany` runs — this is expected.

The subtle problem: on Vercel Serverless, the **in-memory** Next.js data cache is NOT shared across function instances. Cold starts on different instances each have an empty cache. This means the first request on each new function instance always hits the DB, regardless of whether another instance recently fetched the same data.

**Implication:** The `unstable_cache` provides deduplication within a single SSR render tree, and durability within the same function instance's lifetime. But across Vercel serverless invocations (common at scale), it provides no protection.

**Fix:** This is partly mitigated by connection pooling (PgBouncer via Supabase). The deeper fix is either (a) use Vercel's shared cache layer (Redis / Vercel KV) or (b) use Prisma Accelerate which provides a globally-shared query cache.

---

### ARCH-2 (MEDIUM): `revalidateTag` + `revalidatePath` called together is redundant
**Example from `updateQuestion`:**

```ts
revalidateTag(`game-${gameId}`, 'default')            // invalidates data cache entries
revalidatePath(`/dashboard/games/${gameId}`)           // invalidates full-page cache
revalidatePath(`/dashboard/games/${gameId}/questions`) // invalidates full-page cache
```

`revalidatePath` already triggers re-rendering of the route which re-runs the data fetchers tagged by `revalidateTag`. Having both is redundant — `revalidateTag` alone is sufficient when all pages re-render by fetching fresh data.

---

## Layer 3 — Font & Asset Loading

### FONT-1 (HIGH): Five Google Font families loaded — duplicate Hebrew fonts
**File:** `apps/web/app/layout.tsx` + `apps/web/app/(dashboard)/layout.tsx`

Root layout loads:
- `Playfair_Display` → `--font-playfair` (headings)
- `Plus_Jakarta_Sans` → `--font-jakarta` (body)
- `Heebo` → `--font-heebo` (Hebrew)

Dashboard layout additionally loads:
- `Dancing_Script` → `--font-dancing`
- `Rubik` → `--font-rubik` (another Hebrew font)

**Issues:**
1. `Heebo` AND `Rubik` are both Hebrew fonts. One is redundant.
2. `Dancing_Script` appears to be unused in the visible player UI — it may only appear in a design mockup artifact.
3. `next/font/google` self-hosts the fonts (served from your domain), but 5 font families still means 5+ separate HTTP font file requests on first page load.

**Fix:** Audit actual CSS usage of `--font-dancing` and `--font-rubik`. If unused, remove them. Choose one Hebrew font (Heebo or Rubik) for the whole app.

---

### FONT-2 (LOW): Material Symbols loaded as external Google Fonts stylesheet
**File:** `apps/web/app/layout.tsx:37-42`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded..." />
```

Material Symbols is loaded from `fonts.googleapis.com` as a render-blocking stylesheet. From Israel, this CDN can add 200–600ms. Unlike `next/font/google` (which self-hosts), this raw `<link>` tag hits Google's CDN on every page load.

**Fix:** Move to `next/font/google` with `family: 'Material+Symbols+Rounded'` OR self-host the font file using `next/font/local`. This is the same fix from the existing performance-fixes.md Phase 3 — but it was not applied because the root layout already has this link. Confirm it's using `<link rel="stylesheet">` not `next/font`.

---

## Layer 4 — Internationalization (next-intl)

### I18N-1 (MEDIUM): `getMessages()` called in both player and dashboard layouts
**Files:** `apps/web/app/[slug]/layout.tsx:5` and `apps/web/app/(dashboard)/layout.tsx:18`

Both layouts call:
```ts
const messages = await getMessages()
```

This imports `messages/he.json` (12KB) on every server render of these layouts, serializes it into the RSC payload, and sends it to the client as part of `NextIntlClientProvider`. The 12KB isn't huge, but it inflates every RSC payload for every player-facing page.

More significantly: **all message keys from the entire app are sent to the player** (including dashboard messages, auth messages, etc.) even though the game play UI only uses the `game.*` and `player.*` namespaces.

**Fix:** Split `he.json` into `he-player.json` (game + player keys) and `he-dashboard.json` (dashboard + auth keys). Use `pick` in each layout's `getMessages` call.

---

### I18N-2 (LOW): `getRequestConfig` uses a hardcoded `'he'` locale
**File:** `apps/web/i18n/request.ts`

```ts
export default getRequestConfig(async () => {
  const locale = 'he'                                        // always 'he'
  return { locale, messages: (await import(`../messages/${locale}.json`)).default }
})
```

The routing config also only defines `locales: ['he']`. This is a single-locale setup. While correct, the `getRequestConfig` dynamic import runs on every request. Since `he.json` doesn't change, this could be a top-level `import` instead of `await import()`, allowing the module bundler to include it statically.

---

## Layer 5 — Deployment Architecture

### DEPLOY-1 (HIGH): Player-facing pages run in Serverless (Node.js) runtime, not Edge
All `[slug]/*` pages run in Vercel's Node.js serverless runtime. Cold starts from a European/US data center to Israeli guests add 200–500ms on each cold invocation.

The play page RSC (`[slug]/play/page.tsx`) currently does zero async work server-side. With the BUG-2 fix applied (pre-fetching `getGameForPlay` server-side), it would do one DB call. But the welcome page RSC (`[slug]/page.tsx`) calls `getPublicGame` which hits the DB — that requires Node.js, not Edge.

However, the play, interstitial, and leaderboard pages could be evaluated for `export const runtime = 'edge'` after their data fetching is addressed, or at minimum given `export const dynamic = 'force-static'` for the shell HTML.

---

### DEPLOY-2 (MEDIUM): No CDN headers / stale-while-revalidate on player pages
The `[slug]/play/page.tsx` shell HTML (`<GamePlayer slug={slug} />`) is always the same — it contains no dynamic content. Without explicit cache headers, Vercel serves it from the serverless function on every request instead of the CDN.

If `getGameForPlay` is moved to the RSC and the page produces deterministic HTML based only on `slug`, the page can be cached at the CDN with `revalidate: 300`.

---

### DEPLOY-3 (LOW): No `generateStaticParams` for known active game slugs
For games that are `LIVE`, their slugs are known. Adding `generateStaticParams` to pre-render the welcome and play pages at deploy time would eliminate cold starts entirely for the first visitor.

---

## Layer 6 — Database Schema

### DB-1 (MEDIUM): Missing index for `joinGame` name-uniqueness check
Already covered in BUG-8. The `players` table has no index on `(game_id, display_name)`.

**Schema fix:**
```prisma
model Player {
  // ...
  @@index([gameId, displayName])
}
```

---

### DB-2 (LOW): No index on `player_answers(player_id, question_id)` composite
**File:** `packages/db/prisma/schema.prisma`

```prisma
@@index([playerId])
@@index([questionId])
```

These are separate single-column indexes. The `getLeaderboard` GROUP BY joins `player_answers` on `player_id`. A composite `(player_id, is_correct, time_taken_ms)` covering index would let Postgres satisfy the GROUP BY aggregate without touching the heap:

```prisma
@@index([playerId, isCorrect, timeTakenMs])
```

---

## Full Priority Ranking

| # | Issue | File | Severity | Effort |
|---|-------|------|----------|--------|
| 1 | `getPublicGame` not cached | `actions/players.ts:20` | CRITICAL | 5 min |
| 2 | Play page: game fetched client-side | `[slug]/play/page.tsx` + `GamePlayer.tsx:63` | CRITICAL | 30 min |
| 3 | Leaderboard: data fetched client-side | `[slug]/leaderboard/page.tsx` + `LeaderboardClient.tsx:36` | CRITICAL | 20 min |
| 4 | `getGame` loads all players, no limit | `actions/games.ts:61` | HIGH | 10 min |
| 5 | `finishGame` re-reads all answers | `actions/players.ts:211` | HIGH | 15 min |
| 6 | Five font families, duplicate Hebrew | `layout.tsx` + `(dashboard)/layout.tsx` | HIGH | 20 min |
| 7 | Material Symbols external CDN link | `app/layout.tsx:37` | HIGH | 10 min |
| 8 | `submitAnswer` result discarded | `GamePlayer.tsx:426` + `actions/players.ts:183` | MEDIUM | 20 min |
| 9 | `getLeaderboard` 2 serial queries | `actions/players.ts:232` | MEDIUM | 20 min |
| 10 | `joinGame` name check missing index | `schema.prisma` + `actions/players.ts:71` | MEDIUM | 5 min |
| 11 | All intl messages sent to player | `[slug]/layout.tsx:5` | MEDIUM | 30 min |
| 12 | Unstable cache defeated by cold starts | all dashboard actions | MEDIUM | hours (Prisma Accelerate or KV) |
| 13 | Player pages not on Edge runtime | `[slug]/play/page.tsx` | MEDIUM | 30 min |
| 14 | `getLeaderboard` has no caching | `actions/players.ts:232` | LOW | 10 min |
| 15 | `savePassingCardsSequence` N transactions | `actions/passingCards.ts:130` | LOW | 20 min |
| 16 | `player_answers` covering index missing | `schema.prisma` | LOW | 5 min |

---

## Recommended Execution Order

### Sprint 1 — Zero logic change, maximum impact (< 2 hours)
1. Cache `getPublicGame` — `actions/players.ts` (fixes BUG-1)
2. Add `take: 10` to `getGame` player query — `actions/games.ts` (fixes BUG-4)
3. Pass `initialGame` from `play/page.tsx` to `GamePlayer` — (fixes BUG-2)
4. Pass `initialData` from `leaderboard/page.tsx` to `LeaderboardClient` — (fixes BUG-3)
5. Add `@@index([gameId, displayName])` to Player schema — (fixes DB-1)
6. Add covering index to `player_answers` — (fixes DB-2)

### Sprint 2 — Eliminate wasted server work (2–3 hours)
7. `finishGame` accepts score param — removes `findMany` (fixes BUG-5)
8. `submitAnswer` accepts `isCorrect` from client, skips question lookup (fixes BUG-6)
9. `getLeaderboard` single-query with slug JOIN (fixes BUG-7)

### Sprint 3 — Frontend & infrastructure (half day)
10. Audit and remove unused fonts (fixes FONT-1)
11. Replace Material Symbols `<link>` with `next/font` (fixes FONT-2)
12. Split i18n messages by surface area (fixes I18N-1)
13. Evaluate Edge runtime for `[slug]/play` and `[slug]/leaderboard` (DEPLOY-1)
14. Cache `getLeaderboard` with short TTL + Realtime invalidation (fixes item 14)

### Sprint 4 — Infrastructure (requires evaluation)
15. Prisma Accelerate for globally-shared query cache (fixes ARCH-1)
16. Or: Vercel KV as shared cache layer

---

## Local Logs to Collect (if needed)

Run `pnpm dev` and open the browser console. The app already has perf instrumentation:
- `[perf-game] Q{n} mounted — {ms}ms after next-question click` — measures Q-to-Q advance time
- `[perf-client] {label} mounted — {ms}ms after click` — measures tab navigation latency

To expose server-side DB query times, temporarily add to `apps/web/lib/actions.ts`:
```ts
const start = Date.now()
const result = await prisma.game.findUnique(...)
console.log(`[db] getGame ${Date.now() - start}ms`)
```

Or enable Prisma query logging in `packages/db/src/client.ts`:
```ts
export const prisma = new PrismaClient({ log: ['query'] })
```

These logs will immediately show which queries are slow vs. fast when cached.
