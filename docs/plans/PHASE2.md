# Phase 2 — Couple Dashboard: Macro Plan

## Overview

Phase 2 delivers the full authenticated experience for couples: sign up, build their game, and deploy it with a QR code. Each couple owns exactly **one game**. The dashboard is their command center for everything from writing trivia questions to going live on the wedding day.

---

## Design Direction

**Vibe:** Playful, high-energy, celebratory — like a wedding invitation met a party app. Not a boring SaaS form.

**Energetic color set:**  
A palette of ~5–6 vibrant colors, each equally valid as the "active" theme. No single primary — every color is a main character.

| Name | Hex range |
|------|-----------|
| Coral | `#FF6B6B` range |
| Purple | `#A855F7` range |
| Golden | `#FBBF24` range |
| Teal | `#14B8A6` range |
| Sky | `#38BDF8` range |
| Rose | `#FB7185` range |

**Random color per page navigation:**  
Every redirect to a new page picks a random accent color from the set (never the same as the previous page). It drives the background wash, button gradient, and highlight elements for that page. Implemented as a CSS custom property or lightweight React context, seeded on each route change. Deferred to Chunk B (Shell).

**Typography:**
- Display / headings: use `Assistant` (Google Fonts — designed to support both Hebrew and Latin script beautifully) as the primary font; fallback to system sans-serif
- Body: same font family; verify Hebrew readability at each scale — Hebrew glyphs render slightly larger than Latin equivalents

**Component feel:**
- Large rounded corners (`rounded-2xl` / `rounded-3xl`)
- Soft card shadows with subtle color tints matching the active page color
- Gradient buttons using the active page color
- Micro-animations: bounce on CTA hover, confetti burst on deploy, smooth tab transitions
- Emoji + illustration accents in empty states and success moments

**Responsive strategy:**
- Mobile: single-column stacked layout, bottom tab bar for section navigation
- Desktop: fixed right sidebar (240px — RTL, sidebar is on the right), main content area, optional left panel for previews
- Breakpoint: `md` (768px) is the mobile/desktop split

**RTL layout:**
- The app renders in RTL (`dir="rtl"` on `<html>`). Sidebar is on the right, directional icons are mirrored, text aligns right by default
- Use Tailwind **logical properties** throughout (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`) — never `ml-*`/`mr-*`/`pl-*`/`pr-*` in layout code

---

## Localisation & String Management

**Target audience:** Hebrew-speaking couples and wedding guests. Hebrew is the default and primary language.

**Library:** `next-intl` — best-in-class for Next.js App Router; supports Server Components, async translation loading, and typed message keys.

**Locale strategy:** Hebrew only for MVP (`he`). English (`en`) added later if needed. No language switcher UI in Phase 2. No URL prefix — Hebrew is the only locale, no routing complexity needed.

**File structure:**
```
apps/web/
  messages/
    he.json          — all Hebrew strings (source of truth)
  i18n.ts            — next-intl config (locales, defaultLocale)
  middleware.ts      — already exists; extend to handle locale detection
```

**String organisation inside `he.json`:**
```json
{
  "auth": { "login": "...", "signup": "...", "forgotPassword": "...", ... },
  "dashboard": { "myGame": "...", "status": { "live": "...", "draft": "..." }, ... },
  "questions": { "add": "...", "edit": "...", "delete": "...", ... },
  "cards": { "didYouKnow": "...", "photo": "...", "video": "...", ... },
  "deploy": { "goLive": "...", "takeOffline": "...", ... },
  "errors": { "required": "...", "minQuestions": "...", ... },
  "common": { "save": "...", "cancel": "...", "confirm": "...", ... }
}
```

**Rules:**
- Zero hardcoded UI strings in component files — all text comes from `useTranslations()` (Client Components) or `getTranslations()` (Server Components)
- Keys are namespaced by feature area, matching the chunk structure
- Date formatting via `next-intl`'s `useFormatter()` with `he-IL` locale — correct day/month order
- Number formatting via `useFormatter()` — correct separators

**RTL implementation (owned by Chunk B):**
- `<html lang="he" dir="rtl">` set in `apps/web/app/layout.tsx`
- Tailwind: use logical-property classes everywhere; add `rtl:` variant for any directional overrides
- Directional icons (arrows, chevrons, back buttons): flip via `rtl:rotate-180` or use direction-neutral icons

---

## User Journeys

### Journey 1 — First-time couple
```
/signup → email confirmation → /dashboard (empty state)
→ "Create Your Game" CTA → Game Setup Wizard
→ Dashboard Hub (game in DRAFT)
→ Questions tab → add questions
→ Passing Cards tab → add cards
→ Deploy tab → deploy → get QR
```

### Journey 2 — Returning couple
```
/login → /dashboard → see live game status
→ edit questions / cards
→ share QR link
```

### Journey 3 — Wedding day
```
/login → /dashboard → confirm game is LIVE → share QR / display URL
```

---

## Screen Inventory

| Screen | Route | Description |
|--------|-------|-------------|
| Sign Up | `/signup` | Email + password, with link to login |
| Log In | `/login` | Email + password, with link to signup |
| Forgot Password | `/forgot-password` | Email input to trigger reset |
| Reset Password | `/reset-password` | New password form (from email link) |
| Dashboard Hub | `/dashboard` | Command center — game card, status, quick nav |
| Game Setup Wizard | `/dashboard` (modal/inline) | 3-step onboarding: couple names → date → tagline |
| Questions Editor | `/dashboard` (tab or sub-page) | Full question list, add/edit/delete/reorder |
| Passing Cards Editor | `/dashboard` (tab or sub-page) | Card list, add/edit/delete/assign |
| Deploy & QR | `/dashboard` (tab or sub-page) | Deploy controls, QR display, share link |

---

## Implementation Chunks

Each chunk below is a self-contained unit to be planned and built independently.

### Chunk A — Auth Pages
**Scope:** `/signup`, `/login`, `/forgot-password`, `/reset-password`  
**Key decisions:** Supabase Auth email+password flow, form validation with Zod, error states, redirect-after-auth logic  
**Design moments:** Full-page split layout (desktop), logo + illustration panel on one side, form on the other (RTL-aware); mobile = stacked; each auth page gets its own randomly picked color

### Chunk B — Dashboard Shell & Navigation
**Scope:** Layout wrapper (`(dashboard)/layout.tsx`), sidebar (desktop, on the right in RTL), bottom tab bar (mobile), auth guard, user menu, **random-color-per-page system**, **RTL + i18n foundation**  
**Key decisions:** Tab structure (Game Details / Questions / Cards / Deploy), active state, mobile bottom nav items; `<html lang="he" dir="rtl">` in root layout; `next-intl` provider wiring; `messages/he.json` scaffold  
**Design moments:** Right-side sidebar with gradient header (active color) showing couple names, animated tab transitions; color shifts smoothly on every navigation

### Chunk C — Dashboard Hub (Empty & Populated States)
**Scope:** `/dashboard` main view — empty state before game creation, game status card after  
**Key decisions:** Empty state CTA triggers Game Setup Wizard; populated state shows game health (question count, card count, status badge)  
**Design moments:** Empty state with a big illustrated "Start Here" prompt; populated state as a colorful summary card with LIVE/DRAFT badge

### Chunk D — Game Setup Wizard
**Scope:** Wizard for creating game — couple names, wedding date, tagline (3 short steps)  
**Key decisions:** In-page step flow vs. modal, validation per step, skip tagline option  
**Design moments:** Animated step progress (RTL direction), celebratory confetti on completion, playful step illustrations

### Chunk E — Question Builder
**Scope:** Question list, add/edit form, delete confirmation, drag-and-drop reorder  
**Key decisions:** Inline edit vs. slide-over panel, optimistic UI for reorder, minimum 3 questions gate for deploy  
**Design moments:** Question cards with numbered badges, drag handle visible on hover/touch, answer options as color-coded pills

### Chunk F — Passing Cards Builder
**Scope:** Card list, add/edit form for all 3 types (Did You Know / Photo / Video), file upload, question assignment  
**Key decisions:** File upload to Supabase Storage, preview rendering per card type, assignment UI (dropdown or drag-to-question)  
**Design moments:** Card type picker with large illustrated icons, photo cards show thumbnail preview, video shows first-frame

### Chunk G — Deploy & QR
**Scope:** Deploy validation (≥3 questions check), deploy/undeploy toggle, QR code display, download PNG, copy share link  
**Key decisions:** QR library (`react-qr-code`), downloadable canvas export, slug display, undeploy warning modal  
**Design moments:** QR inside a decorative frame, big "GO LIVE" gradient button with confetti burst, animated LIVE status badge

---

## API / Server Actions Layer

All mutations go through Next.js Server Actions or Route Handlers. No client-side DB access.

| Action | Trigger |
|--------|---------|
| `createGame` | Wizard completion |
| `updateGame` | Edit details form |
| `createQuestion` | Add question form submit |
| `updateQuestion` | Edit question form submit |
| `deleteQuestion` | Delete confirmation |
| `reorderQuestions` | Drag-and-drop release |
| `createPassingCard` | Add card form submit |
| `updatePassingCard` | Edit card form submit |
| `deletePassingCard` | Delete confirmation |
| `deployGame` | Deploy button (validates ≥3 questions, generates slug) |
| `undeployGame` | Un-deploy button |
| `uploadMedia` | Photo/video file select (streams to Supabase Storage) |

All actions return typed results. Errors surface as toast notifications.

---

## State Management Approach

- **Server state:** Fetched via Server Components at page level, passed as props; mutations invalidate via `revalidatePath`
- **Optimistic UI:** Question reorder and card assignment use `useOptimistic`
- **Form state:** `react-hook-form` + Zod resolvers
- **Toast / feedback:** Lightweight toast library (e.g. `sonner`)
- **Active color:** React context or CSS custom property, set on route change
- **No global client store** needed for Phase 2

---

## Component Architecture (shared)

```
apps/web/
  messages/
    he.json                  — all Hebrew UI strings (source of truth)
  i18n.ts                    — next-intl config
  components/
    ui/                      — primitives: Button, Input, Card, Badge, Modal, Toast
    forms/                   — QuestionForm, PassingCardForm, GameDetailsForm
    dashboard/
      Sidebar.tsx
      BottomTabBar.tsx
      GameStatusCard.tsx
      QuestionList.tsx
      PassingCardList.tsx
      QRDisplay.tsx
    auth/
      AuthForm.tsx            — shared form shell for login/signup
    providers/
      ColorThemeProvider.tsx  — random-color-per-page context
```

---

## Open Questions (to resolve per chunk)

| Question | Options |
|----------|---------|
| Question editor: inline or slide-over? | Inline expand vs. right-side panel |
| Passing card assignment: dropdown or drag? | Dropdown simpler; drag more tactile |
| Wizard: modal or full page? | Full page feels more intentional |
| File upload: direct to Supabase or via API route? | API route for auth header control |
| QR generation: server-side or client-side? | Client-side with `react-qr-code` is simplest |
| Color switching: hard cut or animated transition? | CSS transition on custom property for smooth fade |
| Directional icons: flip via CSS or use RTL-specific assets? | `rtl:rotate-180` Tailwind class is sufficient for arrows/chevrons |

---

## Implementation Order

1. **Chunk B** — Shell first: RTL layout, `next-intl` wiring, color system, navigation skeleton
2. **Chunk A** — Auth pages (login/signup/reset) — now with Hebrew strings + RTL forms
3. **Chunk C + D** — Hub + Wizard (gets us to a DRAFT game fast)
4. **Chunk E** — Questions (core content)
5. **Chunk F** — Passing Cards (media upload adds complexity, do after questions are solid)
6. **Chunk G** — Deploy & QR (the milestone moment — everything leads here)
