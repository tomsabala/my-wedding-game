# UI Design System

## Typography

### Fonts loaded

| Font | Variable | Tailwind | Use |
|------|----------|----------|-----|
| **Nunito** | `--font-nunito` | `font-sans` (default) | All UI text — headings, body, labels, buttons |
| **Geist Mono** | `--font-geist-mono` | `font-mono` | Code snippets only |

Nunito is loaded in `apps/web/app/layout.tsx` via `next/font/google` and injected as `--font-nunito`. It is also registered as `--font-sans` in the `@theme inline` block in `globals.css`, making it the global default for `body` and any element using Tailwind's `font-sans`.

**Geist Sans is not used** — it is loaded but unused. Nunito is the single brand font.

---

### Dashboard typography scale

Tokens live in `apps/web/app/globals.css` under the `/* Dashboard design tokens */` block.

| Role | Token | Value | When to use |
|------|-------|-------|-------------|
| Page heading | `--dashboard-heading-size` / `--dashboard-heading-weight` | 20px / 800 | `<h1>` on each dashboard page (e.g. "המשחקים שלי") |
| Card / section heading | `--dashboard-subheading-size` / `--dashboard-subheading-weight` | 16px / 700 | Card titles, section titles |
| Body text | `--dashboard-body-size` | 14px | Paragraphs, descriptions |
| Labels & metadata | `--dashboard-label-size` | 13px | Dates, form labels, secondary info |
| Small / supporting | `--dashboard-small-size` | 12px | Player counts, status details, footnotes |

Usage in JSX — prefer CSS variables over Tailwind size classes so changes propagate everywhere:

```tsx
// ✓ correct — uses the token
<h1 style={{ fontSize: 'var(--dashboard-heading-size)', fontWeight: 'var(--dashboard-heading-weight)' }}>
  המשחקים שלי
</h1>

// ✗ avoid — hardcodes the size
<h1 className="text-2xl font-bold">המשחקים שלי</h1>
```

---

### Auth typography scale

Tokens live in `apps/web/app/globals.css` under the `/* Auth page design tokens */` block.

| Role | Token | Value |
|------|-------|-------|
| Font family | `--auth-font-family` | `var(--font-nunito)` |
| Heading | `--auth-heading-size` / `--auth-heading-weight` | 23px / 600 |
| Body | `--auth-body-size` | 14px |
| Label | `--auth-label-size` | 13px |
| Input text | `--auth-input-font-size` | 15px |
| Button text | `--auth-btn-font-size` / `--auth-btn-weight` | 14px / 600 |

Applied automatically by the `.auth-form` CSS scope — no per-component font wiring needed.

---

## Color Palette

Six colors form the brand palette. Both auth pages and the dashboard nav pick one at random per Server Component render.

| Name | Hex | Nav text |
|------|-----|----------|
| Coral | `#FF6B6B` | `#ffffff` |
| Amber | `#FFA552` | `#2d1500` |
| Citron | `#E8C840` | `#2a2000` |
| Sage | `#6DB87A` | `#ffffff` |
| Cornflower | `#6B9FFF` | `#ffffff` |
| Violet | `#A78BFA` | `#ffffff` |

### Where the random pick happens

| Surface | File | Behavior |
|---------|------|----------|
| Auth page background + card | `apps/web/app/(auth)/_components/auth-card.tsx` | Picks two different colors per request; one for the full-bleed background, one for the form card |
| Dashboard nav bar | `apps/web/app/(dashboard)/_components/DashboardNav.tsx` | Picks one color per layout mount (re-randomizes on fresh login; stays stable while navigating within `/dashboard`) |

---

## Dashboard Design

### Card

```
bg-white  rounded-xl  box-shadow: var(--dashboard-card-shadow)
```

| Token | Value |
|-------|-------|
| `--dashboard-card-radius` | 12px (`rounded-xl`) |
| `--dashboard-card-shadow` | `0 6px 30px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)` |
| `--dashboard-card-padding` | 20px |

Hover: `hover:-translate-y-0.5` (2px lift, 0.2s transition).

### Nav bar

| Token | Value |
|-------|-------|
| `--dashboard-nav-height` | 60px |
| Background | Random palette color (server-side, per mount) |
| Logo text | Contrast-safe per color (white or very dark) |
| Logout button | `rgba(255,255,255,0.18)` background, `rgba(255,255,255,0.4)` border |

### Layout

| Token | Value |
|-------|-------|
| `--dashboard-page-padding` | 24px |
| Card grid | `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` |

---

## Auth Design

### Card
| Token | Value |
|-------|-------|
| `--auth-card-radius` | 16px |
| `--auth-card-padding` | 32px |
| `--auth-card-shadow` | `0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)` |

### Inputs
| Token | Value |
|-------|-------|
| `--auth-input-height` | 42px |
| `--auth-input-radius` | 8px |
| Background | `rgba(255,255,255,0.20)` — frosted glass |
| Focus ring | `0 0 0 3px rgba(255,255,255,0.25)` |

### Buttons
| Variant | Style |
|---------|-------|
| Primary (submit) | `rgba(0,0,0,0.82)` bg, white text, 42px height |
| Outline (Google) | `rgba(255,255,255,0.20)` bg, `rgba(255,255,255,0.55)` border |

---

## CSS Architecture

All tokens are in `apps/web/app/globals.css` split into three blocks:
1. **Tailwind theme** (`@theme inline`) — registers CSS vars as Tailwind utilities
2. **Dashboard tokens** (`:root`) — `--dashboard-*` vars
3. **Auth tokens** (`:root` + `.auth-form` scope) — `--auth-*` vars

The `.auth-form` scope uses **unlayered CSS** (no `@layer`) so it overrides Tailwind utilities without `!important`.

The dashboard does not use a CSS scope — it relies on the global Nunito default and inline `style` props for dynamic token values.

---

## Localization (Hebrew RTL)

- `lang="he"` and `dir="rtl"` on `<html>` in `apps/web/app/layout.tsx`
- All strings in `apps/web/messages/he.json` — `auth.*` for auth pages, `dashboard.*` for dashboard
- Use `useTranslations` (client) / `getTranslations` (server) from `next-intl`
