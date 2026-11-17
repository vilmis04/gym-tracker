# Design System

Visual reference: [UI mock-ups](ui-mockups.md) ([design canvas](https://claude.ai/artifact/FsPAXBmTkAVZ3SPNsBWqNS#page-dcb81aee8d83)), every screen in light and dark.

## Principles

- **Clean and minimal**: one primary action per screen, generous whitespace, no decorative noise. Secondary details and actions go behind a "⋯" menu or a collapsed row.
- **Earth tones and soft pastels**: muted, warm, natural. Nothing neon, saturated or flashy.
- **Calm feedback**: success and errors use muted sage and terracotta, never bright green or red.
- **Mobile-first**: thumb-reachable primary actions, 44 × 44 px min touch targets.
- **Accessible**: WCAG AA contrast (4.5:1 body text, 3:1 large text and UI) in both themes.

## Color tokens

Defined as CSS variables (HSL) in `globals.css` and mapped into Tailwind. Components use **semantic tokens only**.

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

Exact values are validated for contrast in E02-T01; any value that fails AA is adjusted in shade, not hue.

## Typography

- Font: **Inter** (variable) via `next/font`; supports Lithuanian diacritics (ą, č, ę, ė, į, š, ų, ū, ž).
- Scale: 12 / 14 / 16 (body) / 18 / 20 / 24 / 30 px.
- Weights: 400 body, 500 labels, 600 headings. No bold-heavy UI.
- Numbers in logging and charts use `font-variant-numeric: tabular-nums`.

## Spacing, shape, elevation

- 4 px spacing grid; page gutter 16 px mobile, 24 px desktop.
- Radius: 10–14 px controls, 18–20 px cards and sheets, full for avatars/chips.
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
