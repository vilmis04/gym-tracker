# E02 · Design System & Theming

**Goal:** A calm, earth-tone, minimal UI kit with light and dark modes, used consistently across the app.
**Milestone:** M1 · Walking skeleton
**Depends on:** E01

See [design-system.md](../design-system.md) for the palette and component list.

---

### E02-T01 · Design tokens & Tailwind theme — `M`
Implement base palette and semantic tokens as CSS variables for light and dark, map them in Tailwind config, set up Inter via `next/font`, radius/spacing scale.

**Acceptance criteria**
- [ ] All semantic tokens defined for both themes
- [ ] Contrast of text/background and primary/primary-foreground pairs passes WCAG AA (automated check script or test)
- [ ] No raw hex colors outside the token file (lint rule or grep check in CI)

**Depends on:** E01-T01

### E02-T02 · Light / dark mode — `S`
Integrate `next-themes` with `light`, `dark`, `system`. Theme toggle component. No flash of wrong theme on load. Persist the choice in the profile once logged in (E04-T04).

**Acceptance criteria**
- [ ] Toggle switches theme instantly; choice survives reload
- [ ] `system` follows OS preference and reacts to OS changes
- [ ] No FOUC on first paint

**Depends on:** E02-T01

### E02-T03 · Base UI components — `M`
Add and theme shadcn/ui primitives: Button, Input, Textarea, Label, Card, Dialog, Sheet, Popover, Tabs, Toast, Avatar, Badge/Chip, Skeleton, DropdownMenu.

**Acceptance criteria**
- [ ] Components use semantic tokens only and look correct in both themes
- [ ] Keyboard and screen-reader accessible (Radix defaults kept)
- [ ] A `/dev/ui` page (dev-only) shows all components in both themes

**Depends on:** E02-T01

### E02-T04 · Searchable Combobox component — `M`
Generic autocomplete combobox (Popover + Command): async `onSearch`, 200 ms debounce, loading/empty states, keyboard navigation, match highlighting, optional sticky footer item "Create '{query}'". Used for exercises, machines, tags and buddy invites.

**Acceptance criteria**
- [ ] Works with mouse, touch and keyboard (↑ ↓ Enter Esc)
- [ ] Shows "Create '{query}'" when `allowCreate` and no exact (normalized) match
- [ ] Accent-insensitive highlight (e.g. "spaudimas" matches "spaudimas", "Špaudimas")
- [ ] Unit tests for search, select and create flows

**Depends on:** E02-T03

### E02-T05 · NumberStepper component — `S`
Large-touch numeric input with − / + buttons, configurable step (weight 2.5, reps 1), decimal support with locale-aware separator (`,` for LT, `.` for EN).

**Acceptance criteria**
- [ ] Accepts both `,` and `.` as input; displays per locale
- [ ] Min/max enforced; long-press repeats
- [ ] Opens numeric keyboard on mobile (`inputmode="decimal"`)

**Depends on:** E02-T03

### E02-T06 · App layout & navigation — `M`
Responsive shell: bottom nav on mobile (Home, Sessions, Progress, Buddies), sidebar on desktop, header with page title and avatar menu (language, theme, settings, sign out). Empty-state and page-skeleton patterns.

**Acceptance criteria**
- [ ] Nav highlights the active section; works at 360 px width up to desktop
- [ ] Touch targets ≥ 44 px
- [ ] Layout uses translated labels (E03)

**Depends on:** E02-T03, E03-T01
