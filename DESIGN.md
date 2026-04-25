---
version: "alpha"
name: AAFairShare
description: A private, two-person expense tracking and settlement web app for couples.
colors:
  primary: "#2563eb"
  primary-foreground: "#ffffff"
  secondary: "#f1f5f9"
  secondary-foreground: "#0f172a"
  muted: "#f1f5f9"
  muted-foreground: "#64748b"
  accent: "#f1f5f9"
  accent-foreground: "#0f172a"
  destructive: "#ef4444"
  destructive-foreground: "#f8fafc"
  background: "#ffffff"
  foreground: "#020617"
  card: "#ffffff"
  card-foreground: "#020617"
  popover: "#ffffff"
  popover-foreground: "#020617"
  border: "#e2e8f0"
  input: "#e2e8f0"
  ring: "#020617"
  brand-blue: "#2563eb"
  brand-teal: "#0d9488"
  brand-blue-light: "#eff6ff"
  brand-blue-tint: "#dbeafe"
  success: "#22c55e"
  warning: "#f59e0b"
  info: "#3b82f6"
typography:
  h1:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.1
  h2:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  data:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "#1d4ed8"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
  button-ghost:
    backgroundColor: "#00000000"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.caption}"
---

## Overview

AAFairShare is a private, two-person expense tracking and settlement web app built for couples. It replaces spreadsheet-based expense tracking with a clean, always-in-sync web app that handles daily expenses, recurring bills, settlements, savings goals, and receipt storage.

The design direction is **clean utilitarian with a warm brand accent**. The UI should feel trustworthy, calm, and organized — this is money software, so predictability matters more than delight. The landing page uses blue/teal gradients to signal warmth and partnership, while the app UI stays restrained with a slate-based neutral palette and sparing use of brand color.

The product is dashboard-heavy: data tables, forms, charts, and modal workflows dominate the UX. Responsive design is essential — the app must work equally well on desktop (sidebar navigation) and mobile (bottom tab bar).

---

## Colors

The palette is rooted in high-contrast neutrals with a single brand accent (blue) that unifies the landing page and app UI.

### Core Theme (shadcn/ui Slate)

These tokens map directly to the CSS variables in `src/index.css` and power the app UI:

- **Primary (#2563eb):** Brand blue for primary buttons, active nav states, focus rings, and key text. This is the landing page brand color, now unified across the app. Provides strong contrast against white surfaces.
- **Secondary (#f1f5f9):** Cool gray for secondary buttons, muted backgrounds, and subtle borders.
- **Muted (#f1f5f9):** Same as secondary — used for hover backgrounds and disabled states.
- **Muted Foreground (#64748b):** Mid-gray for placeholder text, captions, timestamps, and metadata.
- **Accent (#f1f5f9):** Hover and selection backgrounds. Currently identical to secondary.
- **Destructive (#ef4444):** Errors, delete confirmations, negative balances.
- **Background (#ffffff):** Page canvas.
- **Foreground (#020617):** Primary body text.
- **Card (#ffffff):** Content containers — cards, modals, popovers.
- **Border (#e2e8f0):** Dividers, input borders, table row separators.
- **Ring (#020617):** Focus indicators for accessibility.

### Brand Colors

The landing page uses the same brand blue in its gradient system. The core app theme now aligns with the landing page identity:

- **Brand Blue (#2563eb):** Primary action color, gradient start, icon accents, CTAs.
- **Brand Teal (#0d9488):** Gradient end — paired with Brand Blue for the hero wordmark and CTA section.
- **Brand Blue Light (#eff6ff):** Subtle background tint for hero sections.
- **Brand Blue Tint (#dbeafe):** Icon circle backgrounds on feature cards.

### Semantic Colors

- **Success (#22c55e):** Positive balances, savings progress completion, confirmation states.
- **Warning (#f59e0b):** Pending transactions, approaching deadlines, cautions.
- **Info (#3b82f6):** Tips, help text, informational banners.

### Theme Variants

The app supports three modes via CSS class toggling on `<html>`:

1. **Light** — default. White backgrounds, slate text, cool gray borders.
2. **Dark** — inverted. Slate-950 backgrounds, light text, muted borders. All HSL values invert; brand colors remain fixed.
3. **High-Contrast** — pure black/white. No color, maximum contrast for accessibility. Custom `.high-contrast` class overrides all tokens.

---

## Typography

The app uses system fonts exclusively for performance and zero layout shift. No external font files are loaded.

| Token | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| H1 | System sans | 3.75rem | 700 | 1.1 | Landing page hero (desktop) |
| H2 | System sans | 1.875rem | 700 | 1.2 | Page titles, landing sections |
| H3 | System sans | 1.5rem | 600 | 1.3 | Card titles, subsections |
| Body | System sans | 1rem | 400 | 1.5 | Default body text |
| Body Small | System sans | 0.875rem | 400 | 1.5 | Secondary text, table cells, labels |
| Caption | System sans | 0.75rem | 400 | 1.4 | Badges, meta, timestamps |
| Data | System sans | 0.875rem | 400 | 1.5 | Monetary values with `tabular-nums` |

### Type Scale Conventions

- Monetary values always use `tabular-nums` to prevent jitter during updates.
- Headings use `font-bold` (700). Subheadings use `font-semibold` (600).
- The landing page hero uses `bg-clip-text text-transparent` with a `bg-gradient-to-r` for the brand gradient effect.

---

## Layout

### App Structure

- **Desktop (≥768px):** Fixed left sidebar (256px width), scrollable main content. Sidebar contains navigation, user context, theme toggle, and a primary "New Expense" CTA.
- **Mobile (<768px):** Bottom navigation bar (fixed, ~64px height), full-width content with `pb-20` padding for nav clearance. Header bar at top with logo and actions.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight internal padding, icon gaps |
| sm | 8px | Inline gaps, small button padding |
| md | 16px | Card internal padding (mobile), form field gaps |
| lg | 24px | Card internal padding (desktop), section gaps |
| xl | 32px | Page section separation |
| 2xl | 48px | Major page sections, landing page blocks |

### Container Behavior

- App pages: Full-width with `p-4 md:p-6`. No max-width constraint — data tables and dashboards benefit from full space.
- Landing page: Centered container with `max-w-5xl` or `max-w-6xl` for readability.
- Modals and dialogs: Centered, `max-w-md` to `max-w-lg` depending on content complexity.

### Grid Patterns

- Dashboard: Single-column cards stacked vertically. Summary cards use a responsive grid (`grid-cols-1 md:grid-cols-3`).
- Landing page: `md:grid-cols-2` and `lg:grid-cols-3` for feature grids.
- Forms: Single-column stacked inputs with `space-y-4`.

---

## Elevation & Depth

The design is predominantly flat. Depth is conveyed through borders and subtle shadows, never through gradients or drop shadows on app surfaces.

- **Cards:** 1px border (`border-border`). No shadow by default. The `card-highlight` utility uses a subtle gradient from `hsl(var(--card))` to `hsl(var(--muted))`.
- **Card hover:** `shadow-sm` to `shadow` on interactive cards only (feature highlights, landing page cards).
- **Modals/Dialogs:** Native browser overlay with semi-transparent backdrop. No custom shadow — the border and contrast provide separation.
- **Sticky headers:** `border-b` plus `bg-background/80 backdrop-blur-md` for the landing page header. App header uses solid `bg-background` with `border-b`.

---

## Shapes

- **Border radius base:** `0.5rem` (8px) — the shadcn/ui default.
- **Cards, modals, inputs:** `rounded-lg` (8px).
- **Buttons:** `rounded-md` (6px).
- **Badges, pills, avatar circles:** `rounded-full`.
- **Icon containers:** `rounded-lg` (8px) squares with centered icon.

No strongly rounded "pill" shapes for primary containers. The aesthetic is crisp and rectangular, not bubbly.

---

## Components

### Buttons

Three variants cover all actions:

1. **Primary** — Solid `primary` background, white text. Used for the single most important action on a page ("Add Expense", "Save").
2. **Secondary** — `secondary` background, dark text. Used for supplementary actions ("Export", "Cancel").
3. **Ghost** — Transparent background, dark text. Used for icon-only actions, toolbar buttons, and navigation items. Hover state adds `bg-accent`.

Icon buttons always use `size="icon"` and `variant="ghost"`.

### Cards

The primary content container. All cards use:
- `bg-card` background
- `text-card-foreground` text
- `rounded-lg` corners
- `border` (1px `border-border`)
- `p-4` on mobile, `p-6` on desktop

Interactive cards (landing page features) add `hover:shadow-lg transition-shadow`.

### Forms

- Labels: `text-sm font-medium` with `space-y-2` between label and input.
- Inputs: Full-width, `rounded-md`, `border-border`, focus state uses `ring-ring`.
- Form spacing: `space-y-4` between field groups.
- Validation errors: Inline below input in `text-destructive` with `text-sm`.

### Data Tables

- Wrapper: `overflow-x-auto` for mobile scrolling.
- Header row: `border-b` with bold text.
- Rows: No zebra striping. Hover state adds `bg-muted/50`.
- Currency columns: Right-aligned with `tabular-nums`.

### Navigation

- **Sidebar nav items:** Icon (`h-5 w-5`) + label. Active state uses `bg-primary text-primary-foreground` with a subtle shadow — brand blue in both light and dark mode.
- **Bottom nav:** 5-icon tab bar with active state highlighted via color.
- **Keyboard shortcuts:** Nav items display shortcut badges (e.g., `⌘H`) on desktop sidebar.

### Badges

- Default: `secondary` background, small rounded pill.
- Outline: Transparent with border — used for status labels and metadata.
- No strong colors on badges. Semantic meaning is conveyed through text, not background color.

### Icons

- **Library:** Lucide React exclusively.
- **Sizes:** Navigation `h-5 w-5`, inline actions `h-4 w-4`, feature/hero `h-6 w-6` to `h-8 w-8`.
- **Product mark:** `PiggyBank` icon — used as favicon source, logo, and app icon.

---

## Do's and Don'ts

### Do

- Use `bg-card` and `text-card-foreground` for all content surfaces — never hardcode white or black.
- Use `tabular-nums` for all monetary values to prevent column jitter.
- Use `variant="ghost"` for icon-only buttons.
- Respect the 3-theme system: test changes in light, dark, and high-contrast modes.
- Keep the sidebar CTA prominent — "New Expense" is the primary action.
- Use `space-y-4` for form vertical rhythm and `gap-4` for horizontal groupings.

### Don't

- Don't use hardcoded Tailwind colors (`text-blue-600`, `bg-gray-50`, etc.) in app components — always use theme tokens so all three modes work correctly.
- Don't add decorative gradients, blobs, or background patterns to app pages. Gradients are landing-page only.
- Don't use drop shadows on static app surfaces. Shadows are reserved for hover states and overlays.
- Don't load external fonts. System fonts keep the app fast and avoid layout shift.
- Don't create new button styles. The three variants (primary, secondary, ghost) cover all needs.
- Don't use color alone to convey meaning — pair with icons or text labels for accessibility.
