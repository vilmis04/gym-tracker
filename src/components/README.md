# Components

- `ui/` — shadcn/ui primitives, themed with design tokens (E02)
- `common/` — app-level shared components

Feature-specific components live in `src/features/<feature>/components/`.

Style with the design-token utilities only (`bg-surface`, `text-muted-foreground`, `border-input`, `rounded-lg`, …; README → Design tokens and dev pages). Raw colors fail CI (`npm run check:colors`); when adding shadcn/ui components, replace palette classes such as `bg-black/50` with tokens (`bg-scrim`). Developer previews go under `src/app/dev/` (gated by `src/app/dev/layout.tsx`).
