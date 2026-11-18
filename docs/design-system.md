# Design System

Visual reference: [UI mock-ups](ui-mockups.md) ([design canvas](https://claude.ai/artifact/FsPAXBmTkAVZ3SPNsBWqNS#page-dcb81aee8d83)), every screen in light and dark.

## Principles

- **Clean and minimal**: one primary action per screen, generous whitespace, no decorative noise. Secondary details and actions go behind a "⋯" menu or a collapsed row.
- **Earth tones and soft pastels**: muted, warm, natural. Nothing neon, saturated or flashy.
- **Calm feedback**: success and errors use muted sage and terracotta, never bright green or red.
- **Mobile-first**: thumb-reachable primary actions, 44 × 44 px min touch targets.
- **Accessible**: WCAG AA contrast (4.5:1 body text, 3:1 large text and UI) in both themes.

## Color tokens

Defined as CSS variables (HSL) in `globals.css` and mapped into Tailwind. Components use **semantic tokens only**: `npm run check:colors` (CI) fails on any hex/`rgb()`/`hsl()`/… literal in `src/` outside `src/app/globals.css`.

### Base palette

| Name | Hex | Use |
|---|---|---|
| Sand 50 | `#FAF7F2` | Light background |
| Sand 100 | `#F2ECE2` | Light surface / cards |
| Sand 200 | `#E6DCCB` | Borders, dividers (light) |
| Clay 400 | `#C7A98B` | Secondary accents |
| Terracotta 400 | `#C8876B` | Destructive / error accent |
| Sage 300 | `#B7C4A8` | Success surface |
| Sage 500 | `#7E9171` | Primary (light theme) |
| Olive 700 | `#4F5B43` | Primary hover / pressed |
| Moss 600 | `#5F6F55` | Focus ring |
| Dusty Blue 300 | `#A9B8C2` | Info, chart series 2 |
| Mauve 300 | `#C4AFB4` | Chart series 3 |
| Ochre 300 | `#D9BE85` | Warning, chart series 4 |
| Bark 900 | `#2E2A25` | Light theme text |
| Bark 700 | `#5A524A` | Light theme muted text |
| Charcoal 950 | `#1C1A17` | Dark background |
| Charcoal 900 | `#26231F` | Dark surface / cards |
| Charcoal 800 | `#36322C` | Dark borders |
| Linen 100 | `#EDE6DA` | Dark theme text |
| Linen 300 | `#BDB4A6` | Dark theme muted text |

### Semantic tokens

The table below is the source the tokens were derived from; the **final values** (after the contrast check) are in the next section.

| Token | Light | Dark |
|---|---|---|
| `--background` | Sand 50 | Charcoal 950 |
| `--surface` | Sand 100 | Charcoal 900 |
| `--border` | Sand 200 | Charcoal 800 |
| `--foreground` | Bark 900 | Linen 100 |
| `--muted-foreground` | Bark 700 | Linen 300 |
| `--primary` | Sage 500, darkened to `#5E7152` for AA contrast with light text | Sage 300 |
| `--primary-foreground` | Sand 50 | Charcoal 950 |
| `--secondary` | Clay 400 (15% tint) | Clay 400 (20% tint) |
| `--accent` | Dusty Blue 300 (20% tint) | Dusty Blue 300 (15% tint) |
| `--success` | Sage 300 | Sage 500 |
| `--warning` | Ochre 300 | Ochre 300 (darkened) |
| `--destructive` | Terracotta 400 | Terracotta 400 (softened) |
| `--ring` | Moss 600 | Sage 300 |
| `--chart-1..5` | Sage 500, Dusty Blue 300, Mauve 300, Ochre 300, Clay 400 | lighter variants of the same |

### Final token values (E02-T01)

Defined once in [`src/app/globals.css`](../src/app/globals.css) as complete `hsl()` values under `:root` (light) and `.dark` (dark), and mapped to Tailwind utilities with `@theme inline` (`bg-<token>`, `text-<token>`, `border-<token>`, `ring-<token>`, `fill-<token>`, `stroke-<token>`, with opacity modifiers such as `bg-primary/80`). Tailwind's default palette (`red-500`, `gray-*`, `white`, `black`, …) is removed, so only tokens exist; `transparent` and `current` still work. Hex values are what the HSL values round to on screen.

`npm run check:contrast` reads these values from `globals.css` and checks the key pairs in both themes (text ≥ 4.5:1, which also covers large text; control borders, focus ring and chart series ≥ 3:1). Values that failed AA were changed in **lightness only** (same hue and saturation); they are marked *adjusted*.

| Token (utility) | Light | Dark | Notes |
|---|---|---|---|
| `--background` (`bg-background`) | `hsl(37.5 44.4% 96.5%)` `#FAF7F2` Sand 50 | `hsl(36 9.8% 10%)` `#1C1A17` Charcoal 950 | |
| `--foreground` (`text-foreground`) | `hsl(33.3 10.8% 16.3%)` `#2E2A25` Bark 900 | `hsl(37.9 34.5% 89.2%)` `#EDE6DA` Linen 100 | 13.3:1 / 14.0:1 |
| `--surface` (`bg-surface`) | `hsl(37.5 38.1% 91.8%)` `#F2ECE2` Sand 100 | `hsl(34.3 10.1% 13.5%)` `#26231F` Charcoal 900 | cards, inputs, steppers |
| `--card` / `--card-foreground` | = surface / foreground | = surface / foreground | aliases for shadcn/ui |
| `--popover` / `--popover-foreground` | = background / foreground | = surface / foreground | dark popovers sit on surface (shadows don't read on dark) |
| `--muted` / `--muted-foreground` | = surface / `hsl(30 9.8% 32.2%)` `#5A524A` Bark 700 | = surface / `hsl(36.5 14.8% 69.6%)` `#BDB4A6` Linen 300 | secondary text and icons, 7.2:1 / 8.5:1 |
| `--border` (`border-border`, the default border color) | `hsl(37.8 35.1% 84.9%)` `#E6DCCB` Sand 200 | `hsl(32.7 10.5% 20.6%)` `#3A352F` | decorative dividers only (see below); dark value from the mock-ups |
| `--input` (`border-input`) | `hsl(30 9.8% 50%)` `#8C8073` | `hsl(36 10.2% 43%)` `#797062` | **new**: borders that identify a control, ≥ 3:1 |
| `--ring` (`ring-ring`) | `hsl(96.9 13.3% 38.4%)` `#5F6F55` Moss 600 | `hsl(87.9 19.2% 71.4%)` `#B7C4A8` Sage 300 | focus ring |
| `--primary` / `--primary-foreground` | `hsl(96.8 15.9% 38.2%)` `#5E7152` / Sand 50 | `hsl(87.9 19.2% 71.4%)` `#B7C4A8` Sage 300 / Charcoal 950 | also used as text (active nav label): 5.0:1 / 9.5:1 |
| `--primary-soft` (`bg-primary-soft`) | `hsl(87.7 22.8% 91.8%)` `#EAEFE5` | `hsl(90 12.8% 18.4%)` `#2F3529` | **new**, from the mock-ups (active session card, selected chips); light *adjusted* from `#E3E9DC` so primary text on it is 4.5:1 |
| `--secondary` / `--secondary-foreground` | `hsl(32 36.6% 92%)` `#F2EBE3` (Clay 400 15% over Sand 50) / foreground | `hsl(33.8 14.8% 21.2%)` `#3E372E` (Clay 400 20% over Charcoal 950) / foreground | |
| `--accent` / `--accent-foreground` | `hsl(60 4.5% 91.4%)` `#EAEAE8` (Dusty Blue 300 20% over Sand 50) / foreground | `hsl(120 1% 19.4%)` `#313231` (15% over Charcoal 950) / foreground | the tint reads almost neutral grey |
| `--success` / `--success-foreground` | `hsl(87.9 19.2% 71.4%)` `#B7C4A8` Sage 300 / foreground | `hsl(95.6 12.7% 50.6%)` `#7E9171` Sage 500 / background | fills with their foreground text, not text colors |
| `--warning` / `--warning-foreground` | `hsl(40.7 52.5% 68.6%)` `#D9BE85` Ochre 300 / foreground | `hsl(40.7 52.5% 52%)` `#C59C44` Ochre darkened / background | fills, not text colors |
| `--destructive` / `--destructive-foreground` | `hsl(18.1 45.8% 42%)` `#9C583A` / Sand 50 | `hsl(18.1 45.8% 68%)` `#D39F88` / Charcoal 950 | light *adjusted*: Terracotta 400 (`#C8876B`) is 2.8:1 on Sand 50, too low for error text and button labels; dark is Terracotta lightened ("softened") |
| `--scrim` (`bg-scrim`) | `hsl(33.3 10.8% 16.3% / 0.36)` | `hsl(0 0% 0% / 0.6)` | **new**, overlay behind dialogs and sheets (mock-ups); use instead of `bg-black/50` |
| `--chart-1` | `hsl(95.6 12.7% 48%)` `#778A6B` Sage 500 *adjusted* | `hsl(87.9 19.2% 71.4%)` `#B7C4A8` Sage 300 | |
| `--chart-2` | `hsl(204 17% 52%)` `#708999` Dusty Blue *adjusted* | `hsl(204 17% 71.2%)` `#A9B8C2` Dusty Blue 300 | |
| `--chart-3` | `hsl(345.7 15.1% 55%)` `#9E7B83` Mauve *adjusted* | `hsl(345.7 15.1% 72.7%)` `#C4AFB4` Mauve 300 | |
| `--chart-4` | `hsl(40.7 52.5% 42%)` `#A37F33` Ochre *adjusted* | `hsl(40.7 52.5% 68.6%)` `#D9BE85` Ochre 300 | |
| `--chart-5` | `hsl(30 34.9% 48%)` `#A57A50` Clay *adjusted* | `hsl(30 34.9% 66.3%)` `#C7A98B` Clay 400 | |

Decisions behind the values:

- **Chart colors in the light theme are darkened** so every series is ≥ 3:1 against the background and cards (WCAG 1.4.11, graphical objects). The 300 pastels are 1.9–2.8:1 on Sand 50; the mock-ups already darkened series 2 the same way. The dark theme uses the original pastels (the "lighter variants").
- **`--border` vs `--input`.** Dividers stay the soft Sand 200 / `#3A352F` from the mock-ups (1.3:1 / 1.4:1): they separate content but aren't needed to identify a control, so WCAG 1.4.11 doesn't apply, and 3:1 dividers would make the UI heavy. Any border that is the only thing showing a control's boundary (outlined button, checkbox, unfilled input) uses `border-input` (≥ 3:1). Filled inputs/steppers on `bg-surface` (as in the mock-ups) are identified by their label and fill.
- **Colors as `hsl()` values** (not bare `H S% L%` channels): Tailwind v4 builds opacity modifiers with `color-mix()`, so full values work everywhere and the contrast script can parse them directly.
- **Themes switch on a `.dark` class** (`@custom-variant dark`), ready for next-themes (E02-T02). Until then the app is always light; `/dev/tokens?theme=dark` previews the dark theme.

**Adding or changing a token:** declare it under both `:root` and `.dark` in `src/app/globals.css` (aliases that point at other tokens go in the shared `:root, .dark` block), map it in `@theme inline` as `--color-<name>: var(--<name>)`, add a swatch to `src/app/dev/tokens/token-catalog.ts`, add any text/UI pair it forms to `scripts/contrast/contrast-pairs.mts`, run `npm run check:contrast`, and update the table above.

Preview every token in both themes at `/dev/tokens` (dev only, see README → Dev pages).

## Typography

- Font: **Inter** (variable) via `next/font/google` with the `latin` and `latin-ext` subsets, self-hosted at build time (`src/app/layout.tsx`, CSS variable `--font-inter` → `font-sans`, the default). `latin-ext` carries the Lithuanian letters (ą, č, ę, ė, į, š, ų, ū, ž); `tests/e2e/design-tokens.spec.ts` checks they render in Inter, not a fallback.
- Scale: 12 / 14 / 16 (body) / 18 / 20 / 24 / 30 px = `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` / `text-2xl` / `text-3xl`, plus `text-4xl` (36 px) for hero numbers (best lift on Progress). Other Tailwind sizes are removed. The mock-ups use in-between sizes (11, 13, 15, 17, 22, 26, 32, 40 px); implementations snap them to the nearest step.
- Weights: 400 body, 500 labels, 600 headings = `font-normal` / `font-medium` / `font-semibold`; the other weights (`font-bold`, …) are removed. No bold-heavy UI.
- Numbers in logging and charts use `font-variant-numeric: tabular-nums` (Tailwind's built-in `tabular-nums` utility).

## Spacing, shape, elevation

- 4 px spacing grid (`--spacing: 0.25rem`: `p-1` = 4 px, `p-4` = 16 px); page gutter 16 px mobile (`px-4`), 24 px desktop (`lg:px-6`).
- Radius (from the mock-ups): `rounded-sm` 10 px, `rounded-md` 12 px (compact buttons), `rounded-lg` 14 px (buttons, inputs, steppers — the default for controls), `rounded-xl` 18 px, `rounded-2xl` 20 px (cards), `rounded-3xl` 24 px (sheets), `rounded-full` for avatars/chips. Other Tailwind radii are removed. The E02-T01 epic text said 8 px controls / 12 px cards; the mock-ups (the reference for look and layout) consistently use 10–14 px controls and 18–24 px cards, so those were kept.
- Elevation: borders over shadows; one soft shadow level for popovers and dialogs.
- Motion: 150–200 ms ease-out; respect `prefers-reduced-motion`.

## Core components

| Component | Notes |
|---|---|
| Button | `primary`, `secondary`, `ghost`, `destructive`; sizes sm/md/lg |
| Input, Textarea, NumberStepper | NumberStepper for weight (±2.5 kg) and reps (±1) |
| Combobox (searchable autocomplete) | Debounced search, keyboard navigation, highlighted match, "Create '…'" item at the bottom when no exact match |
| Chip / Tag | Removable, used for tags and participants |
| Avatar + AvatarStack | Participants in session cards |
| Card, Sheet (bottom on mobile), Dialog | |
| Tabs, SegmentedControl | Dashboard slices, participant switcher |
| Toast | Muted colors, auto-dismiss 4 s |
| EmptyState | Illustration-free: icon + one sentence + action |
| Skeleton | Loading states |
| Charts | Line (progress), Bar (volume), all using `--chart-*` tokens |

## Layout

- Mobile: bottom navigation with 4 items — **Home**, **Sessions**, **Progress**, **Buddies**; settings via avatar menu. No count badges on nav items; pending invitations and requests are surfaced on Home and in tab labels.
- Desktop (≥ 1024 px): left sidebar with the same items; content max width 1180 px.
- Header: page title, language switch and theme toggle in avatar menu.
- Scroll bars are hidden in the app shell (`scrollbar-width: none`); content still scrolls by touch, wheel and keyboard.

## Iconography

`lucide-react`, 1.5 px stroke, 20 px default size, colored with `currentColor`.
