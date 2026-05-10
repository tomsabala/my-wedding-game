# Plan: Implement Full Wedding Story Trivia Application

## Progress

| Phase | Status | Commits |
|-------|--------|---------|
| 1 — Design System Foundation | ✅ Done | `9f92aca` `a6ab116` `3876c11` |
| 2 — Dashboard Shell Redesign | ✅ Done | `aeaec96` `11d1bfa` `fd53465` |
| 3 — Game Detail 4-Tab Layout | ✅ Done | `49f52ea` `3ec8a9f` `615777d` `3432e72` |
| 7 — Game Settings Tab | ⬜ Next | — |
| 4 — Questions Manager | ⬜ Pending | — |
| 5 — Passing Cards Manager | ⬜ Pending | — |
| 6 — Media Gallery | ⬜ Pending | — |
| 8 — Player Welcome Screen | ⬜ Pending | — |
| 9 — Gameplay Loop | ⬜ Pending | — |
| 10 — i18n Audit | ⬜ Pending | — |

### Notes from implementation
- **Phase 3 gap filled:** `games/[id]/layout.tsx` was missing from the plan's critical files — added as the required Next.js layout to host `GameTabs` persistently across all sub-routes.
- **Schema change:** `createdAt` added to `Player` model (needed for activity feed). Requires migration: `pnpm --filter @repo/db db:migrate` once `.env.local` is configured.
- **DeploySection refactored:** now renders buttons only (deploy/undeploy). Copy-link moved to `QRCodeSection`.
- **GameStats rewritten:** now shows question-count progress bar (target: 40) instead of player accuracy stats (those belong in Phase 9).

---

## Context

The Stitch project "Wedding Story Trivia" (project ID `2153929781898588535`) is the source of truth for all UI/UX. The codebase already has auth, a game list dashboard, and a game detail page — but no question/passing-card management, no player-facing screens, and the visual design is completely different (random-color glassmorphism vs. Stitch's static cream/blush/gold palette). The entire app is Hebrew RTL and must remain so. The user also wants a full Media Gallery feature even though it has no Stitch screen — it will be built following the Stitch design system principles.

**Key design decisions:**
- All text: Hebrew, direction RTL throughout
- Stitch color palette replaces all current tokens (no more random colors)
- Fonts: Playfair Display (headlines) + Plus Jakarta Sans (body) — replaces Geist/Nunito
- The Stitch "Couple's Dashboard" = `/dashboard/games/[id]` in our routing — a 4-tab layout per game
- Multiple games per couple is preserved; the game list at `/dashboard` stays

---

## ✅ Phase 1 — Design System Foundation

**Goal:** Replace the current neutral/random design tokens with the Stitch palette and fonts. No layout changes — just the visual layer.

### 1.1 Add fonts to `apps/web/app/layout.tsx`
- Import `Playfair_Display` and `Plus_Jakarta_Sans` from `next/font/google`
- Expose as CSS vars: `--font-playfair` and `--font-jakarta`
- Remove `Geist`, `Geist_Mono`, `Nunito` (they're not used in Stitch)
- Keep `lang="he" dir="rtl"`

### 1.2 Rewrite `apps/web/app/globals.css` design tokens
Replace all `--background`, `--primary`, etc. with Stitch hex values:

| Token | Value |
|-------|-------|
| `--wedding-bg` | `#faf9f6` |
| `--wedding-surface` | `#ffffff` |
| `--wedding-surface-low` | `#f4f3f1` |
| `--wedding-surface-container` | `#efeeeb` |
| `--wedding-primary` | `#7b5455` |
| `--wedding-primary-container` | `#f4c2c2` |
| `--wedding-on-primary` | `#ffffff` |
| `--wedding-secondary` | `#5c5d6e` |
| `--wedding-secondary-container` | `#e1e1f5` |
| `--wedding-tertiary` | `#735c00` |
| `--wedding-tertiary-container` | `#f1ca50` |
| `--wedding-on-surface` | `#1a1c1a` |
| `--wedding-on-surface-variant` | `#504444` |
| `--wedding-outline` | `#827473` |
| `--wedding-outline-variant` | `#d4c2c2` |
| `--wedding-error` | `#ba1a1a` |

- Remove dark-mode `@media (prefers-color-scheme: dark)` block (Stitch is light-only)
- Update Tailwind `@theme inline` block to map these tokens to Tailwind utilities
- Update dashboard CSS vars to use Stitch spacing (`--dashboard-page-padding: 48px`)

### 1.3 Update `apps/web/components/ui/button.tsx`
- Primary variant: `background: var(--wedding-primary)`, white text, `border-radius: 1.5rem`
- Outline variant: border `var(--wedding-outline-variant)`, text `var(--wedding-primary)`
- Hover: subtle gold glow (box-shadow with `var(--wedding-tertiary-container)`)

**Critical files:**
- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/ui/button.tsx`

---

## ✅ Phase 2 — Dashboard Shell Redesign

**Goal:** Replace random-color glassmorphism with Stitch's static cream/blush design. Match the 4-tab game navigation layout.

### 2.1 Rewrite `apps/web/app/(dashboard)/_components/DashboardShell.tsx`
- Remove the random `PALETTE` and `pickColors` logic entirely
- Background: `var(--wedding-bg)` (#faf9f6, static)
- Keep RTL (`dir="rtl"`)
- No more inline style color overrides per page

### 2.2 Rewrite `apps/web/app/(dashboard)/_components/DashboardNav.tsx`
Top bar matching Stitch:
- Logo / app name: "Our Wedding Game" in `font-playfair`, `var(--wedding-primary)` color
- Right side: sign-out button (ghost/text style)
- Background: white (`var(--wedding-surface)`), bottom border `var(--wedding-outline-variant)`
- Remove color/text/accent props (no more dynamic colors)

### 2.3 Update `apps/web/app/(dashboard)/dashboard/_components/GameCard.tsx`
Match Stitch card style:
- Background: white, `border-radius: 1rem`, border `var(--wedding-outline-variant)`
- Couple names in Playfair Display
- Status badge: blush container for LIVE, surface-container for DRAFT
- Remove random glassmorphism background

**Critical files:**
- `apps/web/app/(dashboard)/_components/DashboardShell.tsx`
- `apps/web/app/(dashboard)/_components/DashboardNav.tsx`
- `apps/web/app/(dashboard)/dashboard/_components/GameCard.tsx`
- `apps/web/app/(dashboard)/dashboard/page.tsx` (remove frosted-glass inline styles)

---

## ✅ Phase 3 — Game Detail: 4-Tab Layout (Stitch "Couple's Dashboard")

**Goal:** Transform the game detail page into a tabbed interface matching the Stitch Couple's Dashboard — Overview, Questions, Media, Settings.

### 3.1 Create `apps/web/app/(dashboard)/dashboard/games/[id]/_components/GameTabs.tsx`
Client component — tab bar with 4 items:
- **סקירה** (Overview) — quiz icon
- **שאלות** (Questions) — edit_note icon  
- **מדיה** (Media) — photo_library icon
- **הגדרות** (Settings) — settings_heart icon

Tab bar style: underline-style tabs, active tab in `var(--wedding-primary)`, inactive `var(--wedding-on-surface-variant)`. Icons via Material Symbols (loaded via Google Fonts CDN as a variable font).

Active tab determined by pathname (`/dashboard/games/[id]` = overview, `/dashboard/games/[id]/questions` = questions, etc.)

### 3.2 Restructure the game detail routing
New route structure under `apps/web/app/(dashboard)/dashboard/games/[id]/`:
```
page.tsx              → Overview tab (currently game detail)
questions/page.tsx    → Questions tab (new)
media/page.tsx        → Media tab (new)
settings/page.tsx     → Settings tab (replaces /edit)
```

### 3.3 Redesign `apps/web/app/(dashboard)/dashboard/games/[id]/page.tsx` (Overview tab)
Match Stitch "Couple's Dashboard" layout:

**Header card** (white, rounded-lg, border):
- Couple name in Playfair Display h1
- "Wedding Celebration" + formatted wedding date
- Live Status indicator with descriptive text
- "פרסם משחק" (Deploy Game) button — primary pill button with rocket icon
- Guest avatar row (last 3 players' initials as circles) + "+N שחקנים" count

**Stats cards** (2-column grid, white cards with outline border):
- Card 1: question count icon, "X שאלות", progress bar toward 40-question target
- Card 2: QR code preview, "קוד QR של המשחק", "הורד JPG" + "העתק קישור" buttons

**Activity feed** — "עדכונים אחרונים":
- 3 most recent player joins or question adds with relative timestamps
- Each item: icon circle + text + timestamp

**Reuse:** existing `<DeploySection>`, `<QRCodeSection>`, `<GameStats>` — wrap/restyle them to match Stitch, don't rewrite from scratch.

**Critical files:**
- `apps/web/app/(dashboard)/dashboard/games/[id]/page.tsx`
- `apps/web/app/(dashboard)/dashboard/games/[id]/_components/GameTabs.tsx` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/_components/DeploySection.tsx` (reskin)
- `apps/web/app/(dashboard)/dashboard/games/[id]/_components/QRCodeSection.tsx` (reskin)
- `apps/web/app/(dashboard)/dashboard/games/[id]/_components/GameStats.tsx` (reskin)

---

## Phase 4 — Questions Manager

**Goal:** Build the full Question CRUD UI matching Stitch "Manage Questions" screen.

### 4.1 New server actions in `apps/web/app/actions/questions.ts`
```typescript
getQuestions(gameId: string)         // list ordered by position
createQuestion(gameId, data)         // validate with questionSchema
updateQuestion(id, data)             // validate, revalidate path
deleteQuestion(id)                   // cascade delete answers
reorderQuestions(gameId, orderedIds) // update position field
```
Each action: calls `getAuthUser()`, verifies game ownership, returns `ActionResult`.

### 4.2 New page `apps/web/app/(dashboard)/dashboard/games/[id]/questions/page.tsx`
Server component — fetches questions via `getQuestions(id)`, renders `<QuestionsList>`.

### 4.3 New `_components/QuestionsList.tsx` (client)
Matching Stitch "Manage Questions" layout:

**Question list** (each item is a card):
- Category label chip (position-based: "שאלה 1", "שאלה 2", etc.)
- Question text as heading (Playfair Display)
- 4 answer options shown as radio-style items, correct one checked
- Edit icon button + Delete icon button (with confirm dialog)
- On delete: optimistic removal + server action

**Add Question form** (revealed by "הוסף שאלה" button):
- Textarea: "טקסט השאלה" (question text)
- 4 text inputs labeled "אפשרות א׳/ב׳/ג׳/ד׳"
- Radio selector: "תשובה נכונה"
- "שמור שאלה" submit button
- Validated via `questionSchema` from `@repo/shared`

**Edit mode:** clicking Edit on an existing question expands an inline form (same fields pre-filled).

**Tips sidebar/callout** (Stitch shows this): "שמור על שאלות קצרות וקריאות" hint box.

### 4.4 Add i18n keys to `apps/web/messages/he.json`
```json
"questions": {
  "title": "שאלות הטריוויה",
  "subtitle": "ניהול השאלות למשחק החתונה שלכם",
  "add": "הוסף שאלה",
  "save": "שמור שאלה",
  "edit": "ערוך",
  "delete": "מחק",
  "questionText": "טקסט השאלה",
  "optionA": "אפשרות א׳",
  "optionB": "אפשרות ב׳",
  "optionC": "אפשרות ג׳",
  "optionD": "אפשרות ד׳",
  "correctAnswer": "תשובה נכונה",
  "position": "שאלה {n}",
  "empty": "אין עדיין שאלות. הוסיפו את השאלה הראשונה!",
  "deleteConfirm": "בטוח שרוצים למחוק שאלה זו?"
}
```

**Critical files:**
- `apps/web/app/actions/questions.ts` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/questions/page.tsx` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/questions/_components/QuestionsList.tsx` (new)
- `apps/web/messages/he.json` (extend)

---

## Phase 5 — Passing Cards Manager

**Goal:** Build the full Passing Cards CRUD matching Stitch "Passing Cards Manager" screen.

### 5.1 New server actions in `apps/web/app/actions/passingCards.ts`
```typescript
getPassingCards(gameId)            // list ordered by afterQuestionPosition
createPassingCard(gameId, data)    // validate with passingCardSchema
updatePassingCard(id, data)        // update content/type/position
deletePassingCard(id)              // delete
savePassingCardsSequence(gameId, sequence: { id, afterQuestionPosition }[])
```

### 5.2 New page `apps/web/app/(dashboard)/dashboard/games/[id]/passing-cards/page.tsx`
Server component — fetches passing cards and question count for the position selector.

### 5.3 New `_components/PassingCardsList.tsx` (client)
Matching Stitch layout:

**Card list** (ordered cards with drag-to-reorder):
- Each card shows: type badge (DID_YOU_KNOW | PHOTO | VIDEO), content preview, "מופיע אחרי שאלה X" label
- Icons: drag handle, edit, delete
- Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (install if not present)

**Card types:**
- `DID_YOU_KNOW`: text content, no media
- `PHOTO`: image preview + caption text
- `VIDEO`: video file name + description text

**Add Card form** (triggered by "הוסף כרטיסייה" button):
- Type selector: 3 pills (ידעת?, תמונה, וידאו)
- Content textarea: "טקסט הכרטיסייה"
- "מופיע אחרי שאלה:" dropdown (1 to N, or "בסוף המשחק")
- For PHOTO/VIDEO: file upload input (connects to Supabase Storage)
- "שמור כרטיסייה" submit

**"שמור סדר" (Save Sequence) button:** persists drag-and-drop order.

### 5.4 Add i18n keys `"passingCards"` namespace to `he.json`

**Critical files:**
- `apps/web/app/actions/passingCards.ts` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/passing-cards/page.tsx` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/passing-cards/_components/PassingCardsList.tsx` (new)
- `apps/web/messages/he.json` (extend)

---

## Phase 6 — Media Gallery

**Goal:** Build the Media tab for uploading/managing photos and videos linked to a game. No Stitch screen exists; design follows the Stitch design system.

### 6.1 Supabase Storage setup
- Storage bucket: `game-media` with RLS: only authenticated owner can upload, public read
- File path pattern: `{userId}/{gameId}/{filename}`

### 6.2 New server actions in `apps/web/app/actions/media.ts`
```typescript
getMediaItems(gameId)             // list signed/public URLs for game
uploadMediaItem(gameId, formData) // upload to Supabase Storage, store metadata
deleteMediaItem(gameId, path)     // delete from Storage
```

### 6.3 New page `apps/web/app/(dashboard)/dashboard/games/[id]/media/page.tsx`

**"העלה מדיה" (Upload New) button** — triggers file picker (accepts image/*, video/*)

**Media grid** (3-column, responsive):
- Photo cards: thumbnail image, filename, delete button
- Video cards: play-circle icon overlay on thumbnail, filename, delete button
- Empty state: "לא הועלתה מדיה עדיין" with upload icon

**Storage indicator**: "X MB / 2 GB" progress bar (matches Stitch stats card design)

**Critical files:**
- `apps/web/app/actions/media.ts` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/media/page.tsx` (new)
- `apps/web/app/(dashboard)/dashboard/games/[id]/media/_components/MediaGrid.tsx` (new)

---

## Phase 7 — Game Settings Tab

**Goal:** Replace the current placeholder `/edit` page with a Settings tab matching Stitch patterns.

### 7.1 New action in `apps/web/app/actions/games.ts`
- `updateGame(id, data)` — updates coupleNames, weddingDate, tagline; validates with `createGameSchema`; revalidates paths
- `deleteGame(id)` — deletes game and all cascade data

### 7.2 New `apps/web/app/(dashboard)/dashboard/games/[id]/settings/page.tsx`
Edit form (client, react-hook-form + Zod):
- Fields: "שמות הזוג", "תאריך החתונה", "תגית" (same as create form, pre-filled)
- "שמור שינויים" button — primary
- Danger zone: "מחק משחק" — red outline button with confirm dialog

### 7.3 Redirect `/edit` → `/settings`
Update any existing links to the old `/edit` route.

**Critical files:**
- `apps/web/app/actions/games.ts` (add `updateGame`, `deleteGame`)
- `apps/web/app/(dashboard)/dashboard/games/[id]/settings/page.tsx` (new, replaces edit)
- `apps/web/app/(dashboard)/dashboard/games/[id]/edit/page.tsx` (redirect or remove)

---

## Phase 8 — Player Screens: Welcome & Join Game

**Goal:** Implement the `/{slug}` landing page matching Stitch "Welcome & Join Game" screen. Full Hebrew/RTL.

### 8.1 New server actions `apps/web/app/actions/players.ts`
```typescript
getPublicGame(slug)          // returns { coupleNames, questionCount, isLive, funFact } — no auth
joinGame(slug, displayName)  // creates Player record, returns { playerId, gameId }
```

### 8.2 Rewrite `apps/web/app/[slug]/page.tsx`
Server component — calls `getPublicGame(slug)`:
- If game not found or not LIVE: show "המשחק לא פעיל" error page
- If found: renders welcome UI

**Layout matching Stitch "Welcome & Join Game":**

**Header:**
- "Our Wedding Game" top-left logo
- Couple names: "{coupleNames}" in Playfair Display h1
- Wedding hero visual (decorative blush/cream gradient block)

**Main content (centered white card):**
- "ברוכים הבאים למשחק הטריוויה של {coupleNames}!"
- Input: "השם שלך" (text, required)
- "התחל לשחק" button (primary pill, play icon) — calls `joinGame`, stores `{ playerId, gameId }` in `localStorage`, navigates to `/{slug}/play`
- Badges row: "{N} שאלות" chip + "פרסים" chip
- Fun fact callout box (first DID_YOU_KNOW passing card, or static fallback)

**Critical files:**
- `apps/web/app/actions/players.ts` (new)
- `apps/web/app/[slug]/page.tsx` (rewrite)
- `apps/web/app/[slug]/_components/JoinGameForm.tsx` (new client component)

---

## Phase 9 — Player Screens: Gameplay Loop

**Goal:** Build the trivia gameplay experience: Question → Did You Know? interstitial → next question → Leaderboard.

### 9.1 New routes under `apps/web/app/[slug]/`
```
play/page.tsx           → Trivia Question screen
play/_components/       → AnswerTile, TimerBar, HintSection
interstitial/page.tsx   → Did You Know? screen
leaderboard/page.tsx    → Game Leaderboard screen
```
Middleware already allows `/{slug}/*` as public — no changes needed.

### 9.2 Extend `apps/web/app/actions/players.ts`
```typescript
getGameForPlay(slug)    // returns { questions[], passingCards[], coupleNames }
submitAnswer(data: {
  playerId: string
  questionId: string
  selectedIndex: number
  timeTakenMs: number
})                      // creates PlayerAnswer, returns { isCorrect, questionScore }
finishGame(playerId, score)  // sets Player.score + Player.finishedAt
getLeaderboard(slug)         // returns ranked Player[] with scores + correctCount
```

### 9.3 Client-side game state
`localStorage`: `{ playerId, gameId, slug }` — persisted across navigation.  
In-memory React state: `currentQuestionIndex`, `totalScore`, `questionStartTime`.  
Use `calculateTotalScore` from `@repo/shared` for score display.

Game state machine: `joining → question → interstitial? → next_question → leaderboard`

### 9.4 `apps/web/app/[slug]/play/page.tsx` — Trivia Question Screen
Client component. Matches Stitch "Trivia Question" screen:

**Header bar:** app logo + couple names + bottom nav tabs (משחק / דירוג / הניקוד שלי)

**Progress:** "שאלה {n} / {total}" + "{score} נקודות"

**Question card** (white, rounded-lg): question text in Playfair Display (large, centered)

**Answer tiles** (2×2 grid):
- Unselected: border `var(--wedding-secondary-container)`, white bg
- Selected: border `var(--wedding-tertiary)` 2px gold, bg `#fffdf0`
- Post-lock correct: mint green bg; incorrect: muted rose bg

**Timer bar:** `var(--wedding-tertiary-container)` (#f1ca50) narrowing bar, 30s default; auto-submit on timeout

**"נעל תשובה" button:** pill, primary, disabled until tile selected

**Hint accordion:** "רמז:" label + text

**After lock-in flow:**
1. Show feedback (500ms) → submit `submitAnswer`
2. Check if passing card for this position → if yes, navigate to `/{slug}/interstitial?cardId=&next=`
3. If no card → next question or leaderboard if final

### 9.5 `apps/web/app/[slug]/interstitial/page.tsx` — Did You Know?
Matches Stitch "Did You Know?" screen:
- "פרק {n}" chapter label (label-uppercase style, `var(--wedding-on-surface-variant)`)
- "ידעת?" heading in Playfair Display
- Photo (if PHOTO card) or decorative illustration placeholder
- Fun fact text in large serif quote style
- Story/body paragraph
- "לשאלה הבאה ←" pill button
- Bottom nav: משחק / דירוג / הניקוד שלי

Passing card data fetched server-side via `cardId` search param.

### 9.6 `apps/web/app/[slug]/leaderboard/page.tsx` — Game Leaderboard
Matches Stitch "Game Leaderboard" screen:

**"מזל טוב!" banner** — couple names + celebratory text

**Top 3 podium** (horizontal): 1st (star cluster, largest), 2nd (premium badge), 3rd

**"דירוג מלא" section:**
- "{N} משתתפים" count
- Scrollable list: rank, avatar initials, name, correct answer count, score
- "הצג את כל המשתתפים" expand link

**Live updates:** poll `getLeaderboard(slug)` every 5s via `setInterval`

### 9.7 Add `"game"` namespace to `apps/web/messages/he.json`
```json
"game": {
  "question": "שאלה {current} מתוך {total}",
  "score": "{score} נקודות",
  "lockAnswer": "נעל תשובה",
  "hint": "רמז",
  "nextQuestion": "לשאלה הבאה",
  "didYouKnow": "ידעת?",
  "chapter": "פרק {n}",
  "congratulations": "מזל טוב!",
  "yourName": "השם שלך",
  "startPlaying": "התחל לשחק",
  "participants": "{n} משתתפים",
  "viewAll": "הצג את כל המשתתפים",
  "play": "משחק",
  "rankings": "דירוג",
  "myScore": "הניקוד שלי",
  "gameNotLive": "המשחק לא פעיל כרגע",
  "answerA": "א׳",
  "answerB": "ב׳",
  "answerC": "ג׳",
  "answerD": "ד׳"
}
```

**Critical files:**
- `apps/web/app/actions/players.ts` (new + extended)
- `apps/web/app/[slug]/page.tsx` (rewrite)
- `apps/web/app/[slug]/play/page.tsx` (new)
- `apps/web/app/[slug]/interstitial/page.tsx` (new)
- `apps/web/app/[slug]/leaderboard/page.tsx` (new)
- `apps/web/app/[slug]/_components/JoinGameForm.tsx` (new)
- `apps/web/app/[slug]/play/_components/AnswerTile.tsx` (new)
- `apps/web/app/[slug]/play/_components/TimerBar.tsx` (new)
- `apps/web/messages/he.json` (extend)

---

## Phase 10 — i18n Completeness & Translation Audit

**Goal:** Ensure every string in every screen is in `messages/he.json`. No hardcoded English strings anywhere.

- Audit all new components for hardcoded strings
- Add missing keys to `he.json`
- Ensure `next-intl` `useTranslations` / `getTranslations` used consistently in all new files

---

## Implementation Order

Execute phases in this sequence:

1. **Phase 1** — Design tokens + fonts (unblocks all visual work)
2. **Phase 2** — Shell/Nav reskin (makes the canvas right)
3. **Phase 3** — Game overview tab + 4-tab layout (restructures routing first)
4. **Phase 7** — Settings tab (finishes routing restructure, removes edit placeholder)
5. **Phase 4** — Questions manager (highest value dashboard feature)
6. **Phase 5** — Passing cards (depends on question positions being defined)
7. **Phase 6** — Media gallery (Supabase Storage setup needed first)
8. **Phase 8** — Player welcome screen (starts player flow)
9. **Phase 9** — Gameplay + leaderboard (completes the player experience)
10. **Phase 10** — i18n audit (final pass)

---

## Packages to Install

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop for questions and passing cards
- Material Symbols variable font via `<link>` in layout (for icons matching Stitch: `quiz`, `edit_note`, `photo_library`, `settings_heart`, `rocket_launch`, etc.)
- No additional packages needed for player screens (all state is client-side React + `@repo/shared` scoring)

---

## Verification

After each phase:
- `pnpm type-check` must pass
- `pnpm lint` must pass
- `pnpm dev` → visually compare each screen against Stitch reference (use `mcp__stitch__get_screen` to retrieve screenshots)

End-to-end checks:
- **Phase 4**: create / edit / delete a question in the dashboard
- **Phase 5**: add a DID_YOU_KNOW card assigned to question 1; verify it appears after Q1 in gameplay
- **Phase 6**: upload a photo, verify it appears in the media grid with storage indicator
- **Phase 8+9**: full player flow — join with a name, answer 3 questions, see leaderboard with live updates
