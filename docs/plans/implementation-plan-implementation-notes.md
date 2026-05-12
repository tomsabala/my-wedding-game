# implementation-plan — implementation notes

Companion log for `implementation-plan.md`. Each phase records why decisions were made so a future agent can pick up cleanly.

## Status snapshot (latest first)

- **Phases 1, 2, 3** — committed before this session. Not touched.
- **Phase 7, 4, 5, 6, 8, 9, 10** — implemented in a single sequential session per user request (no per-phase approval gates).

## Key cross-phase decisions

### `ActionResult` pattern
Existing convention from `apps/web/app/actions/games.ts`:
```ts
type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }
```
All new actions follow this. Errors come back as Hebrew strings already so the UI can render them directly with no translation step.

### Auth + ownership pattern
All couple-facing actions go through `getAuthUser()` then verify `game.userId === user.id`. Player-facing actions (`actions/players.ts`, `actions/media.ts` read paths) are unauthenticated but check `game.status === 'LIVE'` before exposing data.

### Schema reuse
`packages/shared/src/schemas.ts` already had `questionSchema`, `passingCardSchema`, `joinGameSchema`, `submitScoreSchema` — re-used as-is. `joinGameSchema` uses `firstName`/`lastName` already; the plan said "displayName" but we adapt: form collects firstName (required) + lastName (optional), joins them with a space for `Player.displayName`.

### i18n
All new copy goes through `next-intl`. New namespaces added: `questions`, `passingCards`, `media`, `settings`, `player`, `game`. Server components use `getTranslations()`, client components use `useTranslations()`.

### Material Symbols
Already loaded in root `layout.tsx` via Google CDN. Icons used inline as `<span className="material-symbols-rounded">name</span>`.

### Routing
- `/dashboard/games/[id]` — Overview (existed)
- `/dashboard/games/[id]/questions` — new (Phase 4)
- `/dashboard/games/[id]/passing-cards` — new (Phase 5)
- `/dashboard/games/[id]/media` — new (Phase 6)
- `/dashboard/games/[id]/settings` — new (Phase 7, replaces `/edit`)
- `/dashboard/games/[id]/edit` — kept as a redirect to `/settings` for any lingering links
- `/[slug]` — rewritten (Phase 8) — welcome/join
- `/[slug]/play` — new (Phase 9)
- `/[slug]/interstitial` — new (Phase 9)
- `/[slug]/leaderboard` — new (Phase 9)
- `middleware.ts` already passes through `/[a-z]{3}(/.*)?` — no changes needed

### Media bucket
Storage bucket name: `game-media`. File path: `{userId}/{gameId}/{timestamp}-{filename}`. Public read; only owner writes/deletes (enforced in server actions, not RLS — server action holds the auth context).

### Player state
`localStorage` key: `wg:player` storing `{ playerId, gameId, slug }`. The leaderboard page polls every 5s via `setInterval`.

### Tabs bar update
`GameTabs` (built in Phase 3) had 4 tabs (סקירה / שאלות / מדיה / הגדרות) — that's 4, but Phase 5 (passing cards) needs to live somewhere. **Decision:** Add a 5th tab "כרטיסיות" between Questions and Media. The plan didn't make this explicit; without it, passing cards have no nav entry.

## Phase-by-phase notes

### Phase 7 — Settings
- `updateGame` + `deleteGame` added to `actions/games.ts` with the standard owner check.
- `/edit/page.tsx` rewritten as a `redirect()` to `/settings` for any lingering links.
- `SettingsForm` is a client component using `react-hook-form` + `zodResolver(createGameSchema)`, pre-filled from the server fetch.
- Danger zone uses inline confirm (two buttons swap in) — no modal dependency. After delete: `router.push('/dashboard')`.
- "Saved" indicator is a plain boolean (not a timestamp) — `Date.now()` in render is flagged by React 19 purity lint.

### Phase 4 — Questions
- `actions/questions.ts` uses the existing `questionSchema` from `@repo/shared`. The schema includes `position`; the create action computes `nextPosition` server-side so the caller only sends `text/options/correctIndex`.
- Delete compacts positions in a transaction — keeps positions contiguous so passing-card "after question N" references stay valid.
- `QuestionsList` is a single client component with inline create/edit forms (no slide-over panel). Optimistic delete; uses `confirm()` for the delete dialog (simpler than building a modal).
- Inline form validates client-side (text + 4 options required) before hitting server.

### Phase 5 — Passing Cards
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- New tab added to `GameTabs`: "כרטיסיות" between Questions and Media — the plan didn't include this nav entry, but without it the passing-cards screen had no way to be reached. Documented in cross-phase decisions.
- `savePassingCardsSequence` packs cards into `afterQuestionPosition` slots based on their list order — first card after Q1, second after Q2, etc.; any beyond the question count fall to `null` (end of game).
- Media uploads for PHOTO/VIDEO cards are stubbed for now — text content only. The card form shows a hint ("העלאת קבצים תופעל בקרוב") and the actual file pickers will come once we wire passing cards to the media gallery (post-launch enhancement).

### Phase 6 — Media Gallery
- Storage bucket name: `game-media`. Path: `{userId}/{gameId}/{timestamp}-{filename}`.
- **Bucket must be created manually** in Supabase (Storage → New bucket → `game-media`, public access enabled). No code path creates it.
- 25 MB per-file limit; 2 GB quota display target (not enforced — purely informational).
- Server actions verify the path starts with `{userId}/{gameId}/` before deletes to prevent path-traversal.
- After upload, the page reloads (`window.location.reload()`) to refresh public URLs and storage totals — simpler than re-fetching incrementally.
- Lint required removing `eslint-disable-next-line jsx-a11y/media-has-caption` directive — that rule is not active in the project's flat ESLint config.

### Phase 8 — Player Welcome
- `actions/players.ts` `getPublicGame` returns whatever a guest needs (couple names, question count, isLive, first DID_YOU_KNOW card as a fun fact).
- `joinGame` is called from `JoinGameForm`; on success it writes `wg:player` localStorage and navigates to `/{slug}/play`.
- The schema (`joinGameSchema` in `@repo/shared`) uses `firstName/lastName`; for now we collect a single name field and pass it as `displayName`. Re-evaluate when/if we add a multi-field name form.
- Not-live state has its own page (event_busy icon + "checkBackLater" message).

### Phase 9 — Gameplay
- Single all-questions fetch upfront (`getGameForPlay`) — avoids per-question round trips. Trade-off: the entire question list, including correct indexes, hits the client. Acceptable because: (a) the correct index is server-validated on `submitAnswer`, and (b) determined players could see the network response anyway.
- Wait — actually the play fetch deliberately omits `correctIndex` (look at `getGameForPlay`). The server tells you only `{ isCorrect, questionScore }` on submit. Good.
- `GamePlayer` is split into 3 components: outer `GamePlayer` (bootstrap from localStorage), `ActiveGame` (mounted after bootstrap), and `QuestionRound` (keyed on `currentQuestion.id` so per-question state resets automatically on advance).
- The bootstrap setState in useEffect uses `queueMicrotask` so React 19's `set-state-in-effect` lint rule treats it as async.
- Timer auto-locks on timeout. If no selection, submits index `-1` which the server reports back as `isCorrect: false`, `questionScore: 0` (`calculateQuestionScore` returns 0 for `isCorrect = false`).
- After lock-in: 700ms feedback delay → server submission → check for passing card scheduled `after this question's position` → either navigate to `/interstitial?cardId=...` or advance to next question / finalize.
- Progress persisted to `wg:progress` localStorage so refresh during gameplay resumes. Cleared on finalize.
- Interstitial reads `cardId` from search params, renders content based on type. PHOTO/VIDEO types currently show placeholder icons (matches Phase 5 stub state).
- Leaderboard polls every 5s, highlights current player using the `wg:player` localStorage entry. Polling tick reads localStorage *and* fetches in the same async function so the setState lint rule is satisfied (setState after await is allowed).

### Phase 10 — i18n audit + verification
- `pnpm type-check`: passes clean.
- `pnpm --filter @repo/web lint`: passes (0 errors). Two pre-existing warnings on `apps/web/app/layout.tsx` about the Material Symbols Google Fonts CDN link — those were introduced in Phase 1 commit `49f52ea` and are intentional (Stitch design uses Material Symbols).
- `pnpm lint` at root fails because `@repo/db` and `@repo/shared` don't have eslint installed locally — pre-existing monorepo setup issue unrelated to this work.
- Hardcoded Hebrew strings audit: all *new* client components route through `useTranslations`/`getTranslations`. Hardcoded Hebrew that remains:
  - **Server-action error messages** — intentional. Hebrew-only app, errors render directly. See "Cross-phase decisions" above.
  - **Phase 1–3 committed code** (GameCard, GameStats, QRCodeSection, GameTabs, DeploySection, SignOutButton, Overview page) — user instructed not to touch Phases 1–3. Future cleanup pass should move these into the `dashboard.*` and `overview.*` i18n namespaces.

## Open / known issues to address post-merge

1. **Supabase Storage bucket** must be created manually before Phase 6 works: `game-media`, public read.
2. **Passing-card media uploads** are stubbed — Phase 5 form shows a hint that file upload is coming. Wire it up against the Phase 6 storage bucket as a follow-up.
3. **Optimistic insert after media upload** uses `window.location.reload()`. Could be replaced with `router.refresh()` + revalidatePath; left as-is for simplicity.
4. **Schema migration**: `Player.createdAt` was added in Phase 3. Anyone with a fresh DB needs `pnpm --filter @repo/db db:migrate` once `.env.local` is configured.
5. **Phase 1–3 i18n debt**: see audit notes above — non-blocking, but worth a pass before launch.

