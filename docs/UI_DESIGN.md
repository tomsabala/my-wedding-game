# Auth Pages — UI Design Guidelines

## Color Palette

Six colors form the base palette. Every auth page render picks two at random: one for the full-bleed background, one for the card (never the same index).

| Name | Hex |
|------|-----|
| Coral | `#FF6B6B` |
| Amber | `#FFA552` |
| Citron | `#E8C840` |
| Sage | `#6DB87A` |
| Cornflower | `#6B9FFF` |
| Violet | `#A78BFA` |

The two-color pick lives in `apps/web/app/(auth)/_components/auth-card.tsx`. Because it runs in a **Server Component**, the colors re-randomize on every navigation — no client-side state needed.

## Typography

| Role | Token | Value |
|------|-------|-------|
| Font family | `--auth-font-family` | Nunito (loaded via `next/font/google`, `--font-nunito` CSS var) |
| Heading | `--auth-heading-size / --auth-heading-weight` | 23px / 600 |
| Body / subtitle | `--auth-body-size` | 14px |
| Label | `--auth-label-size` | 13px |
| Input text | `--auth-input-font-size` | 15px |
| Button text | `--auth-btn-font-size / --auth-btn-weight` | 14px / 600 |

All text is **white** (`#ffffff`) on the colored card; links use **black** (`#000000`) for contrast.

## Inputs

| Token | Value |
|-------|-------|
| `--auth-input-height` | 42px |
| `--auth-input-radius` | 8px |
| `--auth-input-padding` | 12px |
| `--auth-input-border-color` | `#ffffff` |
| Background | `rgba(255, 255, 255, 0.20)` — frosted glass |
| Focus ring | `0 0 0 3px rgba(255, 255, 255, 0.25)` with white border |
| Placeholder | white at 75% opacity |

## Buttons

| Variant | Style |
|---------|-------|
| Primary (submit) | `rgba(0, 0, 0, 0.82)` background, white text, 8px radius, 42px height |
| Outline (Google) | `rgba(255, 255, 255, 0.20)` background, `rgba(255, 255, 255, 0.55)` border, black text |

## Card

| Token | Value |
|-------|-------|
| `--auth-card-radius` | 16px |
| `--auth-card-padding` | 32px |
| `--auth-card-shadow` | `0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)` |

## CSS Architecture

All tokens live in `apps/web/app/globals.css` under two `:root` blocks and a `.auth-form` scope. The scope uses **unlayered CSS** (no `@layer`) so it wins over Tailwind's `@layer utilities` without needing `!important`.

The `.auth-form` class is applied by `AuthCard` which wraps the inner card `<div>`. Form pages just render `<AuthCard><XxxForm /></AuthCard>` — no per-page style wiring needed.

Error messages use `var(--auth-error-color)` (`#ff0000`) via `.auth-form .text-destructive`.

## Localization (Hebrew RTL)

- `lang="he"` and `dir="rtl"` are set on `<html>` in `apps/web/app/layout.tsx`
- All strings live in `apps/web/messages/he.json` under the `auth.*` namespace
- Shared strings (email label, placeholder, "Continue with Google", divider "or", "Back to sign-in") are in `auth.common` to avoid duplication
- Zod validation error messages use i18n keys (`auth.errors.*`) — schemas return the key string, form components call `tErr(error.message)` to translate at render time

## Interactive Design Explorer

`design-explorer.html` at the repo root is a self-contained HTML playground. Open it in any browser to tweak all design tokens visually and copy the resulting CSS variables directly into `globals.css`.
