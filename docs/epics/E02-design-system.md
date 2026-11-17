# E02 · Design System & Theming

**Goal:** A calm, earth-tone, minimal UI kit with light and dark modes, used consistently across the app.
**Milestone:** M1 · Walking skeleton
**Depends on:** E01

See [design-system.md](../design-system.md) for the palette and component list.

---

### E02-T01 · Design tokens & Tailwind theme — `M`
**Why:** Colors, spacing and type must be defined once so the whole app stays calm and consistent and both themes work automatically.

**Scope**
- CSS variables in `app/globals.css` for every semantic token in the design doc, under `:root` (light) and `.dark` (dark).
- Tailwind config maps tokens to utilities (`bg-background`, `text-muted-foreground`, `bg-primary`, `chart-1…5`, …).
- Radius (`8px` controls, `12px` cards), spacing (4 px grid), font sizes from the type scale.
- Inter loaded via `next/font` with the `latin-ext` subset (Lithuanian letters).
- `tabular-nums` utility for numbers.
- Script `npm run check:contrast` that computes WCAG contrast for the key token pairs in both themes.
- Lint rule or CI grep that fails on raw hex/rgb colors outside the token file.

**Out of scope:** Theme switching UI (E02-T02); individual components (E02-T03).

**Acceptance criteria**
- [ ] Every semantic token from the design doc has a light and a dark value.
- [ ] `check:contrast` passes: body text ≥ 4.5:1, large text and UI borders/icons ≥ 3:1, in both themes.
- [ ] Lithuanian text "ąčęėįšųūž ĄČĘĖĮŠŲŪŽ" renders in Inter with no fallback font.
- [ ] Adding `color: #ff0000` in a component makes CI fail.
- [ ] Palette visually reviewed and signed off by the product owner (screenshot of tokens page in both themes).

**Depends on:** E01-T01

### E02-T02 · Light / dark mode — `S`
**Why:** Users train in bright gyms and dark rooms; they need to choose a theme or follow the OS setting.

**Scope**
- `next-themes` provider with `attribute="class"`, options `light`, `dark`, `system` (default `system`).
- `ThemeToggle` component (3 options with icons and labels) used in the avatar menu and on the landing page.
- No flash of the wrong theme on first load (script injected before paint).
- `<meta name="theme-color">` updated per theme (browser UI color on mobile).
- Hook to save the choice to `profiles.theme` once logged in (wired in E04-T04).

**Out of scope:** Per-user server-side persistence (E04-T04).

**Acceptance criteria**
- [ ] Switching theme updates the whole UI immediately without reload.
- [ ] The choice survives a page reload and a browser restart (local storage).
- [ ] With `system`, changing the OS theme updates the app live.
- [ ] Hard reload in dark mode shows no white flash (verified on throttled connection).
- [ ] Toggle is keyboard accessible and announces the current theme to screen readers.

**Depends on:** E02-T01

### E02-T03 · Base UI components — `M`
**Why:** A shared, accessible component set keeps the UI minimal and avoids each feature styling its own buttons and dialogs.

**Scope**
- Add via shadcn/ui and restyle with tokens: Button (`primary`, `secondary`, `ghost`, `destructive`; `sm`/`md`/`lg`; loading state), Input, Textarea, Label, FormField (label + help + error), Card, Dialog, Sheet (bottom sheet on mobile), Popover, Tabs, SegmentedControl, Toast, Avatar + AvatarStack, Chip/Badge (optionally removable), Skeleton, DropdownMenu, EmptyState.
- Icons from `lucide-react` at 20 px, 1.5 px stroke.
- Dev-only page `/dev/ui` showing every component and variant, with a theme toggle.
- Component tests for interactive pieces (Dialog focus trap, removable Chip).

**Out of scope:** Combobox and NumberStepper (own tasks).

**Acceptance criteria**
- [ ] All listed components exist, use only semantic tokens, and look correct in both themes on `/dev/ui`.
- [ ] Every interactive component is usable with keyboard only and has a visible focus ring (`--ring`).
- [ ] Dialog/Sheet trap focus, close on `Esc`, and return focus to the trigger.
- [ ] Touch targets are at least 44 × 44 px on mobile sizes.
- [ ] `/dev/ui` is not reachable in production builds.

**Depends on:** E02-T01

### E02-T04 · Searchable Combobox component — `M`
**Why:** The core interaction for choosing exercises, machines, tags and buddies is a searchable dropdown with a "create new" option. Building it once makes all those pickers behave the same.

**Scope**
- Generic `Combobox<T>` built from Popover + `cmdk` Command.
- Props: `onSearch(query) => Promise<T[]>`, `renderItem`, `getKey`, `getLabel`, `value`/`onChange`, `multiple`, `allowCreate`, `onCreate(query)`, `placeholder`, `emptyText`, `initialItems` (shown before typing).
- 200 ms debounce, request cancellation (only the latest result is shown), loading spinner, empty state.
- Sticky footer item **"Create '{query}'"** shown when `allowCreate` and no result's normalized label equals the normalized query (lowercase, trimmed, accents removed).
- Match highlighting that is accent-insensitive.
- Multi-select shows selected items as removable chips in the trigger.
- On mobile, opens as a full-height sheet with the input focused.

**Out of scope:** The data sources (exercise search etc. are separate tasks).

**Acceptance criteria**
- [ ] Typing filters results after 200 ms; fast typing does not show stale results (unit test with delayed mock).
- [ ] `↑`/`↓` move the highlight, `Enter` selects, `Esc` closes; the create item is reachable by keyboard.
- [ ] Query "spaudimas" highlights "Špaudimas" and "spaudimas"; "Create" is hidden when an exact normalized match exists, shown otherwise.
- [ ] Choosing "Create '{query}'" calls `onCreate` with the trimmed query.
- [ ] Screen readers announce the number of results and the active option (ARIA combobox pattern).
- [ ] Works on iOS Safari without the keyboard covering the results list.

**Depends on:** E02-T03

### E02-T05 · NumberStepper component — `S`
**Why:** Weight and reps are entered with sweaty hands between sets; big − / + buttons and a numeric keyboard make this fast and error-free.

**Scope**
- `NumberStepper` with props `value`, `onChange`, `step`, `min`, `max`, `decimals`, `unit` (e.g. "kg"), `label`.
- Big − / + buttons (≥ 44 px) with long-press auto-repeat (accelerating).
- Text input with `inputmode="decimal"` (weight) or `numeric` (reps); accepts both `,` and `.`; shows the locale separator (`,` in LT, `.` in EN).
- Value clamped to min/max on blur; invalid input reverts to the last valid value.
- Presets: weight (step 2.5, min 0, max 999.75, 2 decimals), reps (step 1, min 1, max 999).

**Out of scope:** lb conversion (post-MVP).

**Acceptance criteria**
- [ ] Typing `57,5` or `57.5` both store `57.5`; displays `57,5` in LT and `57.5` in EN.
- [ ] Holding + for 2 s increases the value repeatedly and faster over time; releasing stops it.
- [ ] Values below min or above max are clamped on blur.
- [ ] Mobile shows a numeric keypad.
- [ ] Has an accessible label and announces the new value on change.

**Depends on:** E02-T03

### E02-T06 · App layout & navigation — `M`
**Why:** Users need a simple, predictable way to move between the four main areas on both phone and desktop.

**Scope**
- Authenticated layout for `(app)` routes.
- Mobile (< 1024 px): fixed bottom navigation with **Home**, **Sessions**, **Progress**, **Buddies** (icon + label, safe-area padding for iPhones).
- Desktop (≥ 1024 px): left sidebar with the same items; content max width 1120 px.
- Header: page title, back button on detail pages, avatar menu (language, theme, settings, sign out).
- Badge slot on nav items (used by E05-T03 and E07-T03).
- Shared page patterns: `PageHeader`, `PageSkeleton`, `EmptyState` usage, `loading.tsx`/`error.tsx` per section.
- Placeholder pages for the four sections.

**Out of scope:** The content of each section.

**Acceptance criteria**
- [ ] The active section is highlighted in both bottom nav and sidebar.
- [ ] Layout works from 360 px to 1440 px wide with no horizontal scroll.
- [ ] Bottom nav is not hidden behind the iPhone home indicator.
- [ ] All nav labels are translated (EN/LT) and the menu works with keyboard.
- [ ] Each section shows a skeleton while loading and a friendly translated error page on failure.

**Depends on:** E02-T03, E03-T01
