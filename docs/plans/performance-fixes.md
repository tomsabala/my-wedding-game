# Performance Fix Plan

Full investigation findings: see conversation / investigation report.
Branch: `performance-v2`

---

## Phase 1 — Database Indexes (highest leverage, zero logic change)

**Why first:** Every query in the system hits unindexed foreign-key columns. As guest count grows, query time grows linearly. This is the time-bomb. Fixing it now takes 10 minutes and prevents everything from getting worse before the wedding.

### 1.1 Add indexes to the Prisma schema

**File to edit:** `packages/db/prisma/schema.prisma`

Add `@@index` to every model that is queried by a non-PK column:

```prisma
model Game {
  // ... existing fields ...
  @@index([userId])           // getGames() WHERE user_id = ?
}

model Question {
  // ... existing fields ...
  @@index([gameId])           // getQuestions() WHERE game_id = ?
  @@index([gameId, position]) // ORDER BY position (covered index)
}

model PassingCard {
  // ... existing fields ...
  @@index([gameId])           // getPassingCards() WHERE game_id = ?
}

model Player {
  // ... existing fields ...
  @@index([gameId])                    // player queries WHERE game_id = ?
  @@index([gameId, score(sort: Desc)]) // leaderboard ORDER BY score DESC
}

model PlayerAnswer {
  // ... existing fields ...
  @@index([playerId])   // leaderboard fetches answers per player
  @@index([questionId]) // submitAnswer lookup
}
```

**Steps:**
1. Edit `schema.prisma` with the `@@index` entries above
2. Run `pnpm --filter @repo/db db:generate` to regenerate the client
3. Run `pnpm --filter @repo/db db:migrate` to create and apply the migration

---

## Phase 2 — Eliminate the Redundant `assertGameOwner` DB Round Trip

**Why:** Every dashboard tab switch fires 2 serial DB queries: one ownership check, one data fetch. This is documented as a known bottleneck in `lib/actions.ts:54-55`. Eliminating it halves the DB cost of every tab.

### 2.1 Remove `assertGameOwner` from data-fetching actions

**Files to edit:**
- `apps/web/app/actions/questions.ts` — `getQuestions()`
- `apps/web/app/actions/passingCards.ts` — `getPassingCards()`
- `apps/web/app/actions/media.ts` — `getMediaItems()`

**Pattern for each:** Instead of calling `assertGameOwner(gameId)` then fetching data, do a single query that fetches data AND includes `userId` in the result, then check ownership inline.

Example for `getQuestions`:

```ts
// BEFORE (2 serial queries):
export async function getQuestions(gameId: string) {
  await assertGameOwner(gameId)           // query 1: game.findUnique({id, userId})
  const rows = await prisma.question.findMany({ where: { gameId } }) // query 2
  ...
}

// AFTER (1 query):
export async function getQuestions(gameId: string) {
  const user = await getAuthUser()
  // Single query: fetch questions AND verify ownership via game relation
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      userId: true,
      questions: {
        where: {},  // all questions for this game
        orderBy: { position: 'asc' },
        select: { id: true, gameId: true, text: true, options: true, correctIndex: true, position: true },
      },
    },
  })
  if (!game || game.userId !== user.id) notFound()
  return game.questions.map(...)
}
```

Apply the same pattern to `getPassingCards` and `getMediaItems`.

**For `getMediaItems`:** The media action uses `assertGameOwner` then makes a Supabase Storage call (no Prisma data query). Here, inline the ownership check with a minimal `game.findUnique({ where: { id: gameId }, select: { userId: true } })` — only one query needed since there's no second Prisma call to fold into.

### 2.2 Keep `assertGameOwner` only for mutation actions

Mutation actions (`createQuestion`, `createPassingCard`, `uploadMediaItem`, etc.) each do a small ownership check before writing. These are fine — writes are infrequent and the pattern is correct for security. Only the read/fetch path needs the optimization.

### 2.3 Remove the note comment from `lib/actions.ts`

Once the data-fetch actions no longer call `assertGameOwner`, remove the "known bottleneck" comment from `lib/actions.ts:53-55`.

---

## Phase 3 — Fix the Render-Blocking Google Fonts Load

**Why:** A `<link rel="stylesheet">` to Google's CDN inside a React layout component is render-blocking and discovered late by the browser. From Israel, this adds 200–800ms to every dashboard and game page load.

### 3.1 Move Material Symbols to the root layout `<head>`

**Files to edit:**
- `apps/web/app/layout.tsx` — add the font link here once, in the `<head>`
- `apps/web/app/(dashboard)/layout.tsx` — remove the `<link>` tag
- `apps/web/app/[slug]/layout.tsx` — remove the `<link>` tag

In `layout.tsx` (root), add to the `metadata` export or directly in the `<head>`:

```tsx
// In RootLayout, add inside <head> before </head>:
<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossOrigin="anonymous"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
/>
```

This loads the font **once** at the root level, is parsed as part of the initial document `<head>`, and is shared across all routes — no redundant re-fetch when navigating between dashboard and game pages.

**Alternative (better):** Self-host the Material Symbols font using `next/font/local` or a package like `material-symbols`. Eliminates the external network dependency entirely. Worth doing if there's time before launch.

---

## Phase 4 — Fix `getLeaderboard` Aggregation (updated after live-leaderboard merge)

**Why:** The merged branch changed ranking from `score` to `correctCount DESC, totalTimeTakenMs ASC`. The current implementation still fetches ALL `PlayerAnswer` rows for every player and aggregates in JS. Prisma can't do nested `_sum` on relations, so the right fix is a single raw SQL GROUP BY query that returns one row per player instead of N_players × N_answers rows.

### 4.1 Replace per-player answers fetch with a single SQL aggregate

**File to edit:** `apps/web/app/actions/players.ts` — `getLeaderboard()`

```ts
export async function getLeaderboard(slug: string) {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: { id: true, coupleNames: true, status: true },
  })
  if (!game || game.status !== 'LIVE') return null

  const rows = await prisma.$queryRaw<
    { id: string; display_name: string; correct_count: bigint; total_time_ms: bigint }[]
  >`
    SELECT p.id, p.display_name,
           COUNT(CASE WHEN pa.is_correct THEN 1 END) AS correct_count,
           COALESCE(SUM(pa.time_taken_ms), 0)        AS total_time_ms
    FROM players p
    LEFT JOIN player_answers pa ON pa.player_id = p.id
    WHERE p.game_id = ${game.id}
    GROUP BY p.id, p.display_name
    ORDER BY correct_count DESC, total_time_ms ASC
  `

  return {
    gameId: game.id,
    coupleNames: game.coupleNames,
    players: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      correctCount: Number(r.correct_count),
      totalTimeTakenMs: Number(r.total_time_ms),
    })),
  }
}
```

Note: `bigint` cast required — Postgres returns `COUNT`/`SUM` as bigint; `Number()` converts safely for values in the expected range.

### 4.2 Remove redundant immediate refresh in LeaderboardClient

**File to edit:** `apps/web/app/[slug]/leaderboard/_components/LeaderboardClient.tsx`

The `useEffect` calls `void refresh()` immediately on mount even though SSR already provided `initialPlayers`. This fires an unnecessary server action call on every leaderboard load. Remove the `void refresh()` line — the Realtime subscription handles updates from that point on.

---

## Phase 5 — Optimistic UI for Answer Submission

**Why:** Players currently see nothing (or a spinner) for 300–800ms after tapping an answer, while waiting for `submitAnswer` Server Action to complete. On a wedding venue's crowded WiFi or a guest's 4G, this can stretch to 1–2 seconds. The game feels broken.

### 5.1 Decouple UI feedback from server response

**File to edit:** `apps/web/app/[slug]/play/_components/GamePlayer.tsx` — `handleLock()`

The server action is needed to record the answer and get the `isCorrect` / `questionScore` result. But we don't have to *block the UI* on it.

**Strategy — show instant tile lock, get result async:**

```ts
const handleLock = useCallback(async (idx: number) => {
  if (locked) return
  setLocked(true)
  setSelectedIndex(idx)
  // UI is immediately locked — player sees their selection highlighted

  const timeTakenMs = startedAtRef.current === 0 ? 0 : Date.now() - startedAtRef.current
  const result = await submitAnswer({ playerId, questionId: question.id, selectedIndex: idx, timeTakenMs })

  const scoreGained = result.success ? result.data.questionScore : 0
  const isCorrect = result.success ? result.data.isCorrect : false
  setLastResult({ isCorrect, correctIndex: isCorrect ? idx : -1 })
  // Advance after feedback delay — same as before
  setTimeout(() => onComplete(scoreGained), FEEDBACK_DELAY_MS)
}, [locked, playerId, question.id, onComplete])
```

The tile selection is already shown instantly (via `selectedIndex` state). The visual lock (graying out other options) now happens immediately on tap, before the server responds. The correct/wrong reveal comes as soon as the server responds — which is the expected UX.

The key additional improvement: reduce `FEEDBACK_DELAY_MS` from 700ms to ~400ms once the server latency is separate from the visual delay. The 700ms was probably compensating for the server wait time.

### 5.2 Add a "pending" visual state to `AnswerTile`

**File to edit:** `apps/web/components/game/AnswerTile.tsx`

Add a `pending` prop: shown when `locked && lastResult === null` (answer submitted, awaiting server). Show a subtle pulse/shimmer on the selected tile. Gives the player feedback that their tap registered, without freezing the whole UI.

---

## Phase 6 — Switch Leaderboard to Supabase Realtime ✅ DONE (live-leaderboard merge)

This phase was completed by the `live-leaderboard` branch merge. What was implemented:

- `LeaderboardClient` now subscribes to `postgres_changes` on the `players` table filtered by `game_id`, with a 300ms debounce on rapid events
- `getLeaderboard` now returns `gameId` alongside players
- `leaderboard/page.tsx` passes `gameId` as a prop to `LeaderboardClient`
- Migration `20260515114829_realtime_players` sets `REPLICA IDENTITY FULL` on the players table and adds it to the `supabase_realtime` publication

**Remaining ops step:** Confirm in the Supabase dashboard that Realtime is enabled on the `players` table (Database → Replication). The migration adds the table to the publication but the dashboard toggle should also be on.

---

## Phase 7 — Bulk Question Reorder

**Why:** Dragging to reorder 20 questions fires 20 individual `UPDATE` statements. Minor but easy to fix.

### 7.1 Replace N-query transaction with a CASE WHEN bulk update

**File to edit:** `apps/web/app/actions/questions.ts` — `reorderQuestions()`

```ts
// AFTER — single raw query using unnest:
export async function reorderQuestions(gameId: string, orderedIds: string[]): Promise<ActionResult> {
  await assertGameOwner(gameId)

  // Build a VALUES list and update in one statement
  await prisma.$executeRaw`
    UPDATE questions AS q
    SET position = v.position
    FROM (
      SELECT unnest(${orderedIds}::text[]) AS id,
             generate_series(0, ${orderedIds.length - 1}) AS position
    ) AS v
    WHERE q.id = v.id AND q.game_id = ${gameId}
  `

  revalidatePath(`/dashboard/games/${gameId}/questions`)
  return { success: true }
}
```

---

## Phase 8 — Verify Supabase Connection Pooling

**Why:** Vercel Serverless Functions can cold-start. Without connection pooling, each cold-start pays TCP handshake + Postgres connection setup (~200-500ms) before the first query.

### 8.1 Confirm `DATABASE_URL` uses the pooled endpoint

In the Supabase dashboard → Project Settings → Database:
- `DATABASE_URL` should use the **Session/Transaction pooler** URL (port 5432 or 6543 with `?pgbouncer=true`)
- `DIRECT_URL` should use the direct connection (for migrations)

The schema already has both `url` and `directUrl` configured — verify that the actual env vars in Vercel match the pooled connection string.

### 8.2 Optional: Evaluate Prisma Accelerate

Prisma Accelerate is a connection pooler + query cache that sits between your app and the DB. For Vercel Serverless it nearly eliminates cold-start DB latency. Worth evaluating if pooling alone isn't enough after other fixes.

---

## Execution Order & Dependencies

```
Phase 1 (indexes)          ← no dependencies, do first
Phase 2 (assertGameOwner)  ← needs Phase 1 done (indexes make the queries it replaces faster)
Phase 3 (fonts)            ← independent, do in parallel with Phase 2
Phase 4 (leaderboard count)← independent
Phase 5 (optimistic UI)    ← independent
Phase 6 (Realtime)         ← depends on Phase 4 being done first (shares getLeaderboard changes)
Phase 7 (bulk reorder)     ← independent, low priority
Phase 8 (pooling check)    ← independent, ops task, 5 minutes
```

**Recommended sprint order:**
1. Phase 1 (indexes) + Phase 3 (fonts) + Phase 8 (pooling check) — do all three today, < 1 hour total
2. Phase 2 (assertGameOwner) + Phase 4 (leaderboard aggregation) — next session
3. Phase 5 (optimistic UI) — after basic fixes are validated
4. ~~Phase 6 (Realtime)~~ — done via live-leaderboard merge

---

## Files Changed per Phase (summary)

| Phase | Files | Status |
|---|---|---|
| 1 | `packages/db/prisma/schema.prisma` + new migration | Pending |
| 2 | `apps/web/app/actions/questions.ts`, `passingCards.ts`, `media.ts`, `apps/web/lib/actions.ts` | Pending |
| 3 | `apps/web/app/layout.tsx`, `apps/web/app/(dashboard)/layout.tsx`, `apps/web/app/[slug]/layout.tsx` | Pending |
| 4 | `apps/web/app/actions/players.ts`, `LeaderboardClient.tsx` | Pending |
| 5 | `apps/web/app/[slug]/play/_components/GamePlayer.tsx`, `apps/web/components/game/AnswerTile.tsx` | Pending |
| 6 | `LeaderboardClient.tsx`, `players.ts`, `leaderboard/page.tsx`, migration | ✅ Done |
| 7 | `apps/web/app/actions/questions.ts` | Pending |
| 8 | Supabase dashboard (ops) + verify `.env.local` / Vercel env vars | Pending |
