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
- **Themes switch on a `.dark` class** (`@custom-variant dark`), set on `<html>` by next-themes (see [Themes](#themes-light--dark--system-e02-t02)).

**Adding or changing a token:** declare it under both `:root` and `.dark` in `src/app/globals.css` (aliases that point at other tokens go in the shared `:root, .dark` block), map it in `@theme inline` as `--color-<name>: var(--<name>)`, add a swatch to `src/app/(developer-tools)/dev/tokens/token-catalog.ts`, add any text/UI pair it forms to `scripts/contrast/contrast-pairs.mts`, run `npm run check:contrast`, and update the table above.

Preview every token in both themes at `/dev/tokens` (dev only, see README → Dev pages).

## Themes: light / dark / system (E02-T02)

Code: [`src/components/common/theme/`](../src/components/common/theme/).

- **Provider.** `ThemeProvider` wraps the app in the root layout: [next-themes](https://github.com/pacocoursey/next-themes) with `attribute="class"`, themes `light` / `dark` / `system`, default `system`, stored in local storage under `theme` (survives reloads and browser restarts, synced across tabs). `system` follows the OS setting live. Transitions are disabled for the moment of the switch, so the whole UI changes in one frame.
- **No flash.** next-themes renders an inline script that sets the `light`/`dark` class and `color-scheme` on `<html>` while the HTML is parsed, before the first paint and long before React hydrates. `<html>` has `suppressHydrationWarning` because of it (only that element's attributes are exempt). If a Content Security Policy is added later, the inline scripts need a nonce (next-themes takes a `nonce` prop).
- **Browser UI color.** `ThemeColorSync` keeps `<meta name="theme-color">` equal to the rendered page background. It reads the color from the page (`getComputedStyle(body).backgroundColor`, i.e. `--background`) instead of repeating the hex values, so `globals.css` stays the only place colors are defined and no `raw-color-allowed` exemption is needed. An inline script sets it before the first paint; afterwards a `MutationObserver` on the `<html>` class follows every change. Next's static `viewport.themeColor` was not used: it can only follow the OS (`media="(prefers-color-scheme: …)"`), not an explicit choice, and would duplicate the colors.
- **Toggle.** `ThemeToggle` is a segmented radio group (Light / Dark / System with lucide `Sun` / `Moon` / `Monitor`, 20 px, 1.5 stroke) inside a `fieldset` with the legend "Theme": Tab enters the group, the arrow keys change the theme, and screen readers announce the legend and the checked option. Pill shaped like the mock-ups' segmented person chips (options `rounded-full`, the frame 24 px so it stays a pill on one row and a rounded box when the options wrap, E04-T04; 44 px targets, `border-input` because the border shows the control's boundary); the checked option is `bg-primary-soft` + semibold, like the active desktop nav item. The mock-ups have no theme switch design, so this follows those patterns. Labels are the `common.theme` / `themeLight` / `themeDark` / `themeSystem` messages (next-intl, E03-T01); `THEME_PREFERENCE_OPTIONS` in `theme-preferences.ts` maps each choice to its message key and icon for the toggle and the avatar menu. The server can't know the stored theme, so no option is checked until hydration; the page itself is already in the right theme.
- **Where.** Landing page (`src/app/[locale]/(public)/page.tsx`, E04-T05) and sign-in page, `/dev/tokens`, the avatar menu (E02-T06) and the settings page (E04-T04).
- **Saving to `profiles.theme` (E04-T04).** `ThemeToggle` and `useThemePreference()` take an optional `onThemePreferenceChange(preference)` callback, called after the theme is applied locally. Signed-in pages (avatar menu, settings) pass `saveThemeToProfile`, which calls the `savePreferences` Server Action and shows "Saved" (see [Settings page](#settings-page-e04-t04)); after a sign-in `ApplySavedPreferences` applies `profiles.theme` with next-themes' `setTheme()` once per session. Values are the same strings as the `profiles.theme` column (`light` | `dark` | `system`, see [data model](data-model.md)).
- **Styling.** Components never check the theme in JS for colors: tokens switch with the class, and `dark:` utilities exist for the rare exception.

## Language: Lietuvių / English (E03-T02)

Code: [`src/components/common/language/`](../src/components/common/language/).

- **Switcher.** `LanguageSwitcher` is a `SegmentedControl` like `ThemeToggle` (legend `common.language`, "Language" / "Kalba"; no icons): Tab enters the group, the arrow keys switch, and the checked option is the current language. The options are the native names from `LOCALE_NATIVE_NAMES` ("Lietuvių", "English", never translated), each with its own `lang` attribute so screen readers pronounce it in that language. Unlike the theme, the language is known on the server (it is the URL), so the current one is checked in the prerendered HTML. The mock-ups have no design for it; it sits above the theme toggle on the landing page.
- **Avatar menu.** `AccountMenu` offers the same choices as `menuitemradio` items (a form control inside `role="menu"` would be unreachable by keyboard, see Layout → `AccountMenu`), with the same `lang` attributes.
- **Behaviour.** Both use `useLocaleSwitch()`: the same path **and query** open in the other locale (`/lt/sessions/123?tab=x` → `/en/sessions/123?tab=x`; next-intl's router from `src/lib/i18n/navigation.ts`), and the choice is saved in the `NEXT_LOCALE` cookie (one year), so `/` and paths without a locale open in it next time. The query is read from `window.location` when switching, not with `useSearchParams()`, so pages stay fully prerendered without a Suspense boundary. Picking the current language does nothing.
- **Saving to `profiles.locale` (E04-T04).** `LanguageSwitcher` and `useLocaleSwitch()` take an optional `onLocaleChange(locale)` callback, called after the switch starts (cookie written). Signed-in pages (avatar menu, settings) pass `saveLocaleToProfile` (the `savePreferences` Server Action + "Saved"); after a sign-in `ApplySavedPreferences` opens the same path in `profiles.locale` once per session (see [Settings page](#settings-page-e04-t04)).
- **Where.** Landing page (`src/app/[locale]/(public)/page.tsx`, E04-T05) and sign-in page, the avatar menu and the settings page (E04-T04).

## Typography

- Font: **Inter** (variable) via `next/font/google` with the `latin` and `latin-ext` subsets, self-hosted at build time (`src/app/root-document.tsx`, shared by both root layouts; CSS variable `--font-inter` → `font-sans`, the default). `latin-ext` carries the Lithuanian letters (ą, č, ę, ė, į, š, ų, ū, ž); `tests/e2e/design-tokens.spec.ts` checks they render in Inter, not a fallback.
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

### Implementation (E02-T03)

Code: [`src/components/ui/`](../src/components/ui/), previewed with every variant in both themes at `/dev/ui` (dev only). Built like [shadcn/ui](https://ui.shadcn.com/) (Radix primitives from the `radix-ui` package, Tailwind classes, `cn()` from `src/lib/utils/cn.ts`), but written by hand and restyled with the tokens; `components.json` makes later `npx shadcn add` output land in the same place. Components take their text through props or children; built-in default labels ("Close", "Loading", "Remove …") are translated in the `ui` message namespace (E03-T03; counts as ICU plurals), so the components need a `NextIntlClientProvider` above them (both root layouts have one; tests use `renderWithIntl()`).

| Component | File · exports | Notes |
|---|---|---|
| Button | `button.tsx` · `Button` | `variant` primary (fill) / secondary (outlined, `border-input`) / ghost / destructive; `size` sm 44 px (radius 12, 14 px) / md 48 px / lg 56 px (the mock-ups' main buttons) / `icon` 44 × 44 round. `isLoading` shows a spinner, sets `aria-busy` + `aria-disabled` and swallows clicks and submits, but keeps focus (not `disabled`); `loadingLabel` names it. `asChild` styles a `<Link>`. |
| Input, Textarea | `input.tsx` · `Input`; `textarea.tsx` · `Textarea` | Filled like the mock-ups: `bg-surface`, no border, 56 px, radius 14, 16 px text (no iOS zoom). `aria-invalid` adds a destructive ring. |
| Label, FormField | `label.tsx` · `Label`; `form-field.tsx` · `FormField` | `<FormField label help error><Input /></FormField>` sets `id`, `aria-describedby` (help, error) and `aria-invalid` on its single child; `isLabelHidden` for icon search fields. |
| Card | `card.tsx` · `Card`, `CardHeader`, `CardTitle` (`as` h2–h4), `CardDescription`, `CardContent`, `CardFooter` | Fill only, no border or shadow, radius 20, padding 20; `variant="soft"` = `bg-primary-soft` (active session card). |
| Dialog | `dialog.tsx` · `Dialog`, `DialogTrigger`, `DialogContent` (`closeLabel`), `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | Radix Dialog: focus trap, `Esc` / scrim close, focus back to the trigger. Centered, max 448 px, radius 20, `bg-popover`, border + the one shadow, × button 44 px. Footer stacks full-width buttons on mobile. |
| Sheet | `sheet.tsx` · `Sheet`, `SheetTrigger`, `SheetContent` (`size` default / `full`), `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose` | Same Radix Dialog behavior. **< 1024 px: bottom sheet** (radius 24 top, drag-handle bar, max 90 dvh, safe-area padding); **≥ 1024 px: full-height panel on the right** (448 px). The handle is a visual only (no drag to dismiss). `size="full"` (E02-T04): on mobile it fills the *visual* viewport (`--visual-viewport-height/-top`, set from `window.visualViewport` while open, fallback `100dvh`), so it shrinks above the iOS on-screen keyboard; square corners, no handle, top padding clears the notch. |
| Popover | `popover.tsx` · `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent` | Radix Popover; radius 18, border + shadow. Base for the Combobox (E02-T04); `PopoverAnchor` positions it against another element than the trigger. |
| Combobox | `combobox/combobox.tsx` · `Combobox<T>` | See **Combobox (E02-T04)** below. |
| NumberStepper | `number-stepper/number-stepper.tsx` · `NumberStepper`; `number-stepper-presets.ts` · `NUMBER_STEPPER_PRESETS` | See **NumberStepper (E02-T05)** below. |
| DropdownMenu | `dropdown-menu.tsx` · `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (`variant="destructive"`), `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` (E02-T06, ✓ on the checked one) | Radix menu: arrows, typeahead, `Esc`; 44 px items with a ring on keyboard focus. Only menu items are reachable inside (Tab is kept in the menu), so pick-one choices are radio items, never a form control. Sub-menus, checkbox items and shortcuts are not wrapped yet (add when needed). |
| Tabs | `tabs.tsx` · `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Underline tabs from the Sessions mock-up: 44 px, active = foreground underline + semibold; counts go in the label. |
| SegmentedControl | `segmented-control.tsx` · `SegmentedControl` | Native radios in a `fieldset` (arrow keys, announced as a radio group); pill with `border-input` (frame radius 24 px, so options that wrap onto a second row at 360 px stay inside a rounded box, E04-T04), checked = `bg-primary-soft`; options take an `icon` (lucide icon or small Avatar) and a `lang` (label in another language, E03-T02). `ThemeToggle` and `LanguageSwitcher` are built on it. |
| Toast | `toast.tsx` · `Toaster` (root layout), `showToast(message, { description, action, id })` (`id` replaces the toast with that id instead of stacking, E04-T04), `TOAST_DURATION_MS` | [sonner](https://sonner.emilkowal.ski/), unstyled + token classes: inverted (foreground fill, background text) like the mock-ups, radius 14, bottom center (96 px up on mobile, clear of the bottom nav), **4 s**, polite live region, Alt+T focuses it. |
| Avatar, AvatarStack | `avatar.tsx` · `Avatar`, `getInitials`, `getAvatarFillClassName`; `avatar-stack.tsx` · `AvatarStack` | Photo or up to two initials on one of the new `--avatar-1..5` fills (the 300 pastels, Bark 900 text, same in both themes; picked from the name). Sizes 26 / 40 / 44 px. `isDecorative` when the name is written next to it. AvatarStack: labelled list, overlap with a ring in `--avatar-ring` (set it to the surface color on cards), "+N" with screen-reader text. |
| Chip, Badge | `chip.tsx` · `Chip`; `badge.tsx` · `Badge` | Chip: 40 px `bg-primary-soft` pill, optional `icon`, `onRemove` adds a × (32 px visual, 44 px hit area via a transparent `::after`; Enter / Space / Delete / Backspace). Badge: 20 px status label in neutral / primary / success / warning / destructive (the PR badge is `warning`). |
| Skeleton | `skeleton.tsx` · `Skeleton` | `bg-muted` pulsing block, `aria-hidden`; mark the region `aria-busy` and say "Loading" once. |
| EmptyState | `empty-state.tsx` · `EmptyState` | `icon` + one-sentence `message` + optional `action`, centered, no illustration. |

### Combobox (E02-T04)

Searchable picker for exercises, machines, tags and buddies (`src/components/ui/combobox/`), built from Popover / Sheet + [cmdk](https://cmdk.paco.me/) 1.1.1 with cmdk's filtering off (`shouldFilter={false}`): results come from `onSearch`.

```tsx
<FormField label="Machine">
  <Combobox
    label="Machine"                     // names trigger, input, list; sheet title on phones
    placeholder="No machine"
    onSearch={(query, { signal }) => searchMachines(query, { signal })}
    getKey={(machine) => machine.id}
    getLabel={(machine) => machine.name}
    renderItem={(machine, { highlightedLabel, isSelected }) => highlightedLabel} // optional
    initialItems={recentMachines}        // shown before typing
    value={machine} onChange={setMachine} // or `multiple` with arrays
    allowCreate onCreate={(name) => createMachine(name)}
  />
</FormField>
```

- **Search.** `onSearch(trimmedQuery, { signal })` runs 200 ms after the last keystroke; the previous request's `AbortSignal` is aborted and a late answer to an older query is ignored. While waiting a spinner shows in the input and the list is empty (no stale results, no create option for an older query). An empty query shows `initialItems` without searching. Rejections show `errorText`.
- **Create.** With `allowCreate`, a sticky last option **Create “{query}”** (dashed, 52 px, as in the "Add exercise" mock-up) appears once results for the current query have arrived and none has `normalizeSearchText(getLabel(item)) === normalizeSearchText(query)` (trimmed, lowercase, accents removed). `onCreate` gets the trimmed query; adding the new item to `value` is the owner's job. Single mode closes; multiple mode clears the query and stays open.
- **Highlight.** Matches are wrapped in `<mark>` (semibold, no fill, like the mock-up's bold match), accent- and case-insensitively: "spaudimas" marks "Špaudimas" and "spaudimas".
- **Keyboard and screen readers.** The input is `role="combobox"` with `aria-controls` → `listbox` and `aria-activedescendant` → the highlighted `option` (`bg-primary-soft`); ↑ / ↓ / Home / End move, Enter picks, Esc closes and returns focus to the trigger. Chosen options have `aria-checked="true"` and a check icon. A polite `role="status"` says "Loading", "N results", the empty text or the error. The trigger is named "{label} {value or placeholder}" (`aria-labelledby`) so the current value is read out; FormField's `aria-describedby` is passed on; its `aria-invalid` becomes a destructive ring (`data-invalid`), since buttons can't be `aria-invalid`.
- **Multiple.** Selected items are removable Chips in the field (a labelled list); the popover anchors to the whole field. Removing a chip moves focus to the next chip, else the previous, else the trigger.
- **Layout.** ≥ 1024 px: popover as wide as the field, max 26 rem tall, list scrolls under the sticky create option. < 1024 px: `Sheet size="full"` titled with `label`, input focused at the top, list fills the rest above the keyboard.
- Default strings are in the `ui` message namespace (`comboboxCreate`, `comboboxResultCount` — an ICU plural: "1 rezultatas", "2 rezultatai", "10 rezultatų" —, `comboboxNoResults`, `comboboxSearchFailed`, `comboboxSearch`); each has a prop.

### NumberStepper (E02-T05)

Weight and reps field with big − / + buttons (`src/components/ui/number-stepper/`), as in the Live session mock-up: 56 px, radius 14, `bg-surface` without a border, 48 × 56 px buttons, value 20 px semibold `tabular-nums`, "—" while empty.

```tsx
<FormField label="Weight">
  <NumberStepper
    {...NUMBER_STEPPER_PRESETS.weight}  // step 2.5, min 0, max 999.75, 2 decimals, unit "kg"
    label="Weight"                      // names the spinbutton and the −/+ group
    value={weight}                      // number | null (null shows "—")
    onChange={setWeight}                // gets the parsed number, never the text
    locale="lt"                         // optional; defaults to next-intl's active locale
  />
</FormField>
```

`NUMBER_STEPPER_PRESETS.reps` is step 1, min 1, max 999, 0 decimals (matching `sets.weight_kg numeric(6,2) ≥ 0` and `sets.reps 1..999`).

- **Typing.** `inputmode="decimal"` when `decimals > 0`, else `numeric` (the phone keypad). `,` and `.` are both accepted and spaces ignored (`57,5`, `57.5`, ` 57,50 ` → 57.5); extra decimals are rounded half away from zero on the digits (`57,555` → 57.56, `10,5` reps → 11). A valid in-range number goes to `onChange` while typing; on blur or Enter the number is clamped to min/max and shown again with the locale's separator (`57,5` in `lt`, `57.5` in `en`, `Intl.NumberFormat`, no grouping, no trailing zeros); anything that isn't a number (or an empty field) reverts to the last valid value. Focusing selects the text so typing replaces it.
- **Buttons.** A press steps at once; holding repeats after 400 ms at intervals shrinking by 15 % per step from 200 ms to 50 ms (about 20 steps in 2 s), and stops on release, pointer leave/cancel, blur, unmount or at a bound. The button at a bound is `aria-disabled` (stays focusable). No context menu, text selection or iOS callout on a long press. Steps are integer math scaled by 10^decimals (no drift) and are **not snapped** to multiples of the step (58.75 + 2.5 = 61.25). From empty either button sets `min`.
- **Keyboard and screen readers.** The input is a `spinbutton` (`aria-valuenow/min/max`, `aria-valuetext` "57,5 kg"); ↑ / ↓ step, Page Up / Page Down step 10× (Home / End keep moving the caret). Buttons are named "Sumažinti 2,5 kg" / "Increase by 1" (`ui.numberStepperDecrease` / `ui.numberStepperIncrease` in the active language, `decreaseLabel` / `increaseLabel` props) inside a `group` named by `label`. After a button tap, and once on release of a hold (not on every repeat), the new value is announced in a polite `role="status"`; arrow-key changes rely on the spinbutton's own value text. FormField's `id`, `aria-describedby` and `aria-invalid` go on the input (destructive ring).
- Helpers (pure, unit-tested): `number-stepper-values.ts` (`parseDecimalInput`, `clampValue`, `isWithinRange`, `stepValue`, `createValueFormat`), `use-auto-repeat.ts` (`useAutoRepeat`, `getAutoRepeatDelay`).

Rules the components follow (and new ones should):

- **Focus.** Every interactive element shows a 2 px `--ring` outline 2 px outside it on keyboard focus (`FOCUS_RING_CLASS_NAME` in `focus-ring.ts`); where an outline doesn't fit (segmented options, menu items) a 2 px `ring-ring` box-shadow.
- **Touch targets.** At least 44 × 44 px at every size, desktop included (no smaller "desktop" variants); small visuals get a padded hit area. `tests/e2e/ui-components.spec.ts` measures every control on `/dev/ui` at 390 px.
- **Elevation.** Cards, inputs and chips use fills; popovers, menus, dialogs and sheets add a border and the single shadow level `shadow-overlay` (`--overlay-shadow`, darker in the dark theme). Tailwind's other shadow sizes are removed.
- **Motion.** Overlays fade / pop (`animate-pop-in`, scale 0.96 → 1) or slide (`animate-sheet-in-bottom` / `-right`) in 200 ms and out in 150 ms, ease-out; colors transition in 150 ms. With `prefers-reduced-motion` one rule in the base layer of `globals.css` sets every animation and transition to 0 s (the spinner and skeleton pulse stop too).
- **Icons.** lucide at 20 px, `strokeWidth={1.5}`, `aria-hidden` when decorative; the chip × is 16 px to fit the 32 px button.

## Layout

- Mobile: bottom navigation with 4 items — **Home**, **Sessions**, **Progress**, **Buddies**; settings via avatar menu. No count badges on nav items; pending invitations and requests are surfaced on Home and in tab labels.
- Desktop (≥ 1024 px): left sidebar with the same items; content max width 1180 px.
- Header: page title, language switch and theme toggle in avatar menu.
- Scroll bars are hidden in the app shell (`scrollbar-width: none`); content still scrolls by touch, wheel and keyboard.

### App shell (E02-T06)

`src/app/[locale]/(app)/layout.tsx` validates the locale and renders `AppShell` (`src/components/common/app-shell/`). Which navigation shows is pure CSS (`lg:hidden` / `hidden lg:flex`), so server and client render the same markup.

- **Bottom navigation** (`BottomNav`, < 1024 px): fixed, `bg-background`, top border, 4 equal columns; 76 px (`--bottom-nav-height`) plus `env(safe-area-inset-bottom)` (`--bottom-nav-inset`), padding 6 / 8 / 14 px + the inset. Item: 24 px lucide icon (stroke 1.5) over a `text-xs` label; active `text-primary font-semibold` with `aria-current="page"`, others `text-muted-foreground font-medium`.
- **Sidebar** (`SidebarNav`, ≥ 1024 px): 216 px, sticky, right border, app name on top, text-only items `min-h-11 rounded-sm px-3 text-sm`, active `bg-primary-soft font-semibold` with `aria-current="page"`.
- A section stays active on its detail pages (`/lt/sessions/123` → Sessions; `isNavItemActive` in `nav-items.ts`). Settings is not a section: nothing is active there. Items and routes: `NAV_ITEMS` (Home = `dashboard`).
- **Page area**: `max-w-content` (1180 px, `--container-content`), left-aligned next to the sidebar as in the mock-up; padding 28 px top / 16 px sides on phones (plus the notch / landscape safe-area insets) and room for the bottom navigation below; 24 px sides at `lg`, 36 × 48 px from `xl`. A "Skip to content" link is the first focusable element.
- **Viewport**: the root layout exports `viewport` with `viewport-fit=cover`, which makes `env(safe-area-inset-*)` work (bottom navigation, page padding, full-height Sheet).
- **Scroll bars**: hidden for `<html>` while a shell is on the page (`html:has([data-app-shell])`) and inside the shell (`globals.css`).
- **Toasts** sit 20 px above the bottom navigation (96 px + the inset) below 1024 px, 24 px up on desktop (`--toast-offset-bottom`; sonner's own mobile breakpoint is 600 px, so the offset is set in CSS).

### Page patterns (E02-T06)

`src/components/common/page/`:

- `PageHeader({ title, backHref? })` — the `<h1>` (24 / 30 px; 18 / 24 px on detail pages), a back link (44 px ghost icon button, "Back") when `backHref` is given, and the avatar menu on the right. The back button is a link to the parent page, not `history.back()`, so it works when the page was opened directly.
- `AccountMenu` (in `app-shell/`) — the avatar menu: **Language** (Lietuvių / English, `menuitemradio`, opens the same path and query in the other locale and saves the `NEXT_LOCALE` cookie, see [Language](#language-lietuvių--english-e03-t02)), **Theme** (Light / Dark / System, `menuitemradio`, applies at once and keeps the menu open), both saved to the profile with a "Saved" toast once the user is loaded (E04-T04), **Settings** (link), **Sign out** (E04-T01, lucide `LogOut`, the last item; ends the Clerk session and opens the landing page; disabled until Clerk has loaded the user). Since E04-T01 the button shows the signed-in user's `Avatar size="lg"` (44 px, the Google photo or the initials on a pastel fill, as on the mock-up's Home header; the user icon until Clerk has loaded) and keeps its accessible name ("Account, language and theme"); the menu opens with the user's name (semibold) and email (muted) as a label. It is a Radix menu: Enter / Space / ↓ open it, arrows / Home / End move, Esc closes and returns focus. The theme is offered as menu radio items rather than the `ThemeToggle` radio group because a Radix menu keeps Tab inside and moves only between menu items, so a form control inside a `role="menu"` would be unreachable by keyboard (and invalid ARIA). The user comes from `useAccount()` (`components/common/auth/`), not from Clerk's hooks.
- `PageSkeleton` — `loading.tsx` of every section: header row, a card and three rows; `aria-busy` with one "Loading" status for screen readers.
- `SectionError({ error, retry, titleKey })` — `error.tsx` of every section: keeps the page header (so navigation, language and theme still work), a `role="alert"` block with a translated title, description and **Try again** (`retry()`), and reports the error to Sentry. The error message is never shown.
- Placeholder pages use `EmptyState` with a section icon and one sentence.
- Titles: each page's `generateMetadata` uses `getSectionMetadata(params, "<nav key>")` → "Treniruotės · Gym Tracker" (template in the `(app)` layout).

### Sign-in (E04-T01)

Not in the mock-ups (the canvas has no sign-in, landing or settings screens), so it follows the landing page: one centered column on `bg-background` with Clerk's `<SignIn />` card and, below it, the `LanguageSwitcher` above the `ThemeToggle`; safe-area padding top and bottom. Clerk is themed through `appearance.variables` set to the CSS custom properties (`src/lib/auth/clerk-appearance.ts`): `colorPrimary` → `var(--primary)`, `colorBackground` → `var(--card)` (a fill, like other cards), `colorForeground` / `colorMutedForeground` / `colorBorder` / `colorInput` / `colorRing` / `colorDanger` → their tokens, `colorShadow: transparent` (cards have no shadow), `borderRadius` 12 px (`--radius-md`), font inherited (Inter). Because the values are `var(--…)`, Clerk's `color-mix()` shades switch with the `.dark` class without re-rendering. Clerk's own layout, spacing and "Secured by Clerk" footer are kept. Texts: `CLERK_LOCALIZATIONS` (`lt-LT` translated by us, `en-US` Clerk's own).

### Landing page (E04-T05)

`/[locale]` for signed-out visitors (signed-in users are redirected to Home). Not in the mock-ups (the canvas has no landing screen), so it is built from the existing patterns and the earth-tone tokens, with one primary action:

- One centered column on `bg-background`, at most 448 px wide on phones and tablets (896 px from 1024 px), 16 px gutters, safe-area padding top and bottom.
- **Header:** a 56 px `bg-primary-soft` circle with lucide `Dumbbell` (28 px, `text-primary`) as the app mark, the app name as the `h1` (30 px, semibold), the value proposition (18 px, `text-muted-foreground`), then **Continue with Google**: the primary `Button` `size="lg"` (56 px, radius 14, the mock-ups' main button), full width below 640 px (thumb reach), at least 288 px wide above. It sits right under the value proposition so it is in view without scrolling at 360 × 740. While Clerk opens Google it shows the button's spinner ("Opening Google sign-in" for screen readers); if that fails, a `role="alert"` line in `text-destructive` below it says so and the button works again. Without Clerk keys it is the same button as a link to the sign-in page. No Google logo: the button is the app's primary color like every main action, and Google's logo may only be used in its own colors, so the text says it.
- **Benefits:** three `Card`s (radius 20, `bg-card`, no shadow), each a 40 px `bg-primary-soft` circle with a lucide icon (`Users`, `History`, `ChartLine`; 20 px, 1.5 stroke, `text-primary`), an `h3` (16 px, semibold) and one muted 14 px sentence. One column on phones, three columns from 1024 px. The section has a visually hidden `h2` ("Why Gym Tracker").
- **Switches:** the `LanguageSwitcher` above the `ThemeToggle`, centered at the bottom (`mt-auto`), under a visually hidden `h2` ("Language and theme"). They change only this device; after the first sign-in a new profile takes these values (E04-T04).
- **Open Graph image** (`/{locale}/og-image.png`, 1200 × 630): the light theme's `--background`, the mark in `--primary` on `--primary-soft`, the app name in `--foreground`, the tagline ("Train together, track together.") in `--muted-foreground` and the three benefit titles as `--surface` pills. The colors are read from `globals.css` at build time (`readTokenColors()`, `src/lib/seo/`), so they follow the tokens without a `raw-color-allowed` exemption. Font: `ImageResponse`'s built-in Geist (it has the Lithuanian letters), not Inter.
- Checked at 360 px in both languages and themes (no horizontal scroll; the three Lithuanian theme options wrap onto two rows), and with Lighthouse (mobile).

### Settings page (E04-T04)

`/[locale]/settings`, opened from the avatar menu. Not in the mock-ups (no settings screen on the canvas), so it is built from the existing patterns:

- `PageHeader` with the back link to Home (settings isn't a navigation section, so nothing in the nav is active), then one column of `Card`s, `gap-5`, at most 672 px wide on desktop. Each card has an `h2` title (`CardTitle as="h2"`) and a muted one-line description.
- **Account:** `Avatar size="lg"` (photo or initials; decorative because the name is written next to it), then a definition list — "Name" / "Email" as muted 14 px labels, the name semibold, the email breaking anywhere (long addresses at 360 px). Plain text, no inputs: the description says "Managed by Google: …". **Manage account** (secondary button, lucide `UserCog`) opens Clerk's account dialog (`openUserProfile()`, themed by `CLERK_APPEARANCE`).
- **Preferences:** the `LanguageSwitcher` above the `ThemeToggle` (the same order as on the landing page), with the description "Saved to your account, so they follow you to every device you sign in on." Every change applies at once and a toast says **Saved** / **Išsaugota** (one toast, replaced on every change; after a language switch it appears on the new page in the new language). If saving fails: "Couldn't sync to your account. The change applies on this device only."
- **Your data:** "Coming soon: …" and the **Export data** (secondary, `Download`) and **Delete account** (destructive, `Trash2`) buttons, disabled until E10-T05.
- **Sign out:** a large secondary button with `LogOut` at the end, full width below 640 px.
- Checked at 360 px in both languages and themes (no horizontal scroll; the three Lithuanian theme options wrap onto two rows inside the control's rounded frame).

## Iconography

`lucide-react`, 1.5 px stroke, 20 px default size, colored with `currentColor`.
