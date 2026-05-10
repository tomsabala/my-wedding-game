# MVP Development Plan

## Overview

The MVP delivers two core surfaces served by a **single Next.js app** at `myweddinggame.com`:

1. **Couple Dashboard** — create an account, build a game, deploy it, get a QR code.
2. **Player Game** — scan QR, enter name, play trivia with passing cards, see leaderboard.

When a couple deploys their game it is assigned a unique **3-letter code** (e.g. `abc`).  
The QR code points to `myweddinggame.com/abc`. Guests land there directly — no account needed.

### App structure

```
myweddinggame.com/           ← marketing landing page
myweddinggame.com/login      ← couple sign-in
myweddinggame.com/signup     ← couple sign-up
myweddinggame.com/dashboard  ← couple game management (protected)
myweddinggame.com/abc        ← player game entry via QR (public)
```

---

## Phase 1 — Project Setup

- [x] Initialize monorepo: `apps/web`, `packages/shared`, `packages/db`, `packages/eslint-config`
- [x] Configure TypeScript, ESLint, Prettier across all packages
- [x] Define database schema — `games`, `questions`, `passing_cards`, `players`, `player_answers`
- [x] Set up Supabase client helpers (server + browser) and auth middleware
- [x] Set up environment variable management (`env.local.example`, gitignore)
- [x] GitHub Actions CI — lint + type-check on every PR
- [ ] Create Supabase project and run first migration (`prisma migrate dev`)
- [ ] Enable Email/Password and Google OAuth in Supabase Auth
- [ ] Create `photos` and `videos` storage buckets with RLS policies
- [ ] Link Vercel project to GitHub repo and set environment variables
- [ ] Verify end-to-end: sign up, sign in, session persists, skeleton deploys

---

## Phase 2 — Couple Dashboard (Core)

### Auth
- [x] Sign up page (email + password)
- [x] Log in page
- [x] Password reset flow
- [x] Protected route guard

### Game Management
- [ ] "My Game" page — shows game status (draft / live)
- [ ] Create game — sets couple names, wedding date, optional tagline
- [ ] Edit game metadata (names, date, tagline)

### Question Builder
- [ ] Add trivia question: question text, 4 answer options, correct answer marker
- [ ] Edit / delete question
- [ ] Drag-and-drop reorder questions
- [ ] Question list preview

### Passing Cards Builder
- [ ] Add passing card: choose type (Did You Know / Photo with Caption / Video Clip)
- [ ] "Did You Know" card: text input
- [ ] Photo card: image upload + caption text
- [ ] Video card: video file upload (short clip)
- [ ] Edit / delete passing card
- [ ] Assign passing card to appear after a specific question (or leave unassigned for auto-distribute)
- [ ] Passing card preview

### Deploy & QR
- [ ] Deploy game button (validates at least 3 questions exist)
- [ ] On deploy: generate unique 3-letter slug, check for collisions, mark game as live
- [ ] QR code generation displayed on screen (downloadable PNG)
- [ ] Un-deploy / take game offline button
- [ ] Share link copy button alongside QR

---

## Phase 3 — Player Game (Core)

### Entry
- [ ] Landing page at `myweddinggame.com/abc` (loaded from QR)
- [ ] Player name entry form (first name required, last name optional)
- [ ] "Join Game" validation (game must be live, reject empty names)
- [ ] Session stored in localStorage (no account required)

### Gameplay Loop
- [ ] Display question with 4 answer buttons
- [ ] Record selected answer + timestamp on selection
- [ ] Animate correct / wrong feedback (green / red flash)
- [ ] After answer: show passing card if one is assigned to this position
  - Did You Know: text card with continue button
  - Photo: image + caption with continue button
  - Video: autoplay muted clip, continue button appears after playback (or skip after 3s)
- [ ] Progress indicator (e.g., "Question 3 of 10")
- [ ] Move to next question automatically after passing card is dismissed

### Scoring
- [ ] Score = (correct answers × base points) − time penalty per question
- [ ] Time per question tracked from moment question renders
- [ ] Score computed client-side, submitted to server on game completion

### Leaderboard
- [ ] Final screen shows player's score and rank
- [ ] Top 3 displayed with 1st / 2nd / 3rd place styling
- [ ] Full ranked list below top 3
- [ ] Live updates (poll every 5s or use Supabase Realtime) so late finishers appear
- [ ] "Play again" resets session and returns to name entry

---

## Phase 4 — Polish & Hardening

- [ ] Mobile-first responsive design across all screens
- [ ] Loading states and skeleton screens
- [ ] Error boundaries and fallback UI
- [ ] Image/video optimization (compression on upload, lazy loading)
- [ ] Rate limiting on game join and answer submission endpoints
- [ ] Input sanitization on all user-supplied text
- [ ] Slug collision handling (retry loop on deploy)
- [ ] Handle game going offline mid-session gracefully
- [ ] Couple dashboard: basic analytics (total players, average score)

---

## Phase 5 — Production Readiness

- [ ] Custom domain support
- [ ] Email confirmation on sign-up
- [ ] Delete account + game data (GDPR)
- [ ] Terms of service + privacy policy pages
- [ ] Monitoring and error tracking (Sentry)
- [ ] Performance testing with simulated concurrent players
- [ ] Final QA pass on real mobile devices

---

## Milestones Summary

| Milestone | Deliverable |
|-----------|-------------|
| M1 | Repo scaffolded, DB running, auth working end-to-end |
| M2 | Couple can create a game with questions and passing cards |
| M3 | Couple can deploy, get QR; player can join and play full game |
| M4 | Leaderboard live; scoring accurate |
| M5 | Production-ready, mobile-polished, monitored |
