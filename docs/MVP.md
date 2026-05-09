# MVP Development Plan

## Overview

The MVP delivers two core surfaces:
1. **Couple Dashboard** — create an account, build a game, deploy it, get a QR code.
2. **Player Game** — scan QR, enter name, play trivia with passing cards, see leaderboard.

---

## Phase 1 — Project Setup

- [ ] Initialize monorepo structure: `apps/dashboard`, `apps/game`, `packages/shared`
- [ ] Configure TypeScript, ESLint, Prettier across packages
- [ ] Set up database schema (see TECH_STACK.md)
- [ ] Set up auth provider (email/password + Google OAuth)
- [ ] Configure file storage bucket for photo/video uploads
- [ ] Set up environment variable management (local + production)
- [ ] Deploy skeleton to hosting provider (verify CI/CD pipeline works)

---

## Phase 2 — Couple Dashboard (Core)

### Auth
- [ ] Sign up page (email + password)
- [ ] Log in page
- [ ] Password reset flow
- [ ] Protected route guard

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
- [ ] On deploy: generate unique game slug, mark game as live
- [ ] QR code generation displayed on screen (downloadable PNG)
- [ ] Un-deploy / take game offline button
- [ ] Share link copy button alongside QR

---

## Phase 3 — Player Game (Core)

### Entry
- [ ] Landing page loaded from QR link (`/game/:slug`)
- [ ] Player name entry form (first name required, last name optional)
- [ ] "Join Game" validation (game must be live, reject empty names)
- [ ] Session stored in memory / localStorage (no login required)

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
- [ ] Live updates (poll every 5s or use websocket) so late finishers appear
- [ ] "Play again" resets session and returns to name entry

---

## Phase 4 — Polish & Hardening

- [ ] Mobile-first responsive design across all game screens
- [ ] Loading states and skeleton screens
- [ ] Error boundaries and fallback UI
- [ ] Image/video optimization (compression on upload, lazy loading)
- [ ] Rate limiting on game join and answer submission endpoints
- [ ] Input sanitization on all user-supplied text
- [ ] Game slug collision handling
- [ ] Handle game going offline mid-session gracefully
- [ ] Couple dashboard: basic analytics (total players, average score)

---

## Phase 5 — Production Readiness

- [ ] Custom domain support
- [ ] Email confirmation on sign-up
- [ ] Delete account + game data (GDPR)
- [ ] Terms of service + privacy policy pages
- [ ] Monitoring and error tracking (e.g., Sentry)
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
