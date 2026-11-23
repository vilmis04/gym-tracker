import { type ReactNode } from "react";

import { ThemeToggle } from "@/components/common/theme/theme-toggle";

import {
  COLOR_GROUPS,
  LITHUANIAN_SAMPLE,
  RADIUS_SCALE,
  SPACING_SCALE,
  TYPE_SCALE,
} from "./token-catalog";

import type { ColorSwatch, ScaleStep } from "./token-catalog.types";

/**
 * Design tokens preview (E02-T01) for the palette review: every color token,
 * the type, radius and spacing scales, and the Lithuanian sample in Inter.
 * The theme toggle switches the real app theme (E02-T02). Gated to
 * development by src/app/(developer-tools)/dev/layout.tsx.
 */
export default function TokensPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-12 px-4 py-8 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Design tokens</h1>
          <p className="text-muted-foreground">
            Values live in src/app/globals.css; see docs/design-system.md.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section aria-labelledby="colors-heading" className="flex flex-col gap-8">
        <h2 id="colors-heading" className="text-2xl font-semibold">
          Colors
        </h2>
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {group.title}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.swatches.map((swatch) => (
                <ColorSwatchCard key={swatch.token} swatch={swatch} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="type-heading" className="flex flex-col gap-6">
        <h2 id="type-heading" className="text-2xl font-semibold">
          Typography
        </h2>
        <p lang="lt" className="text-2xl" data-testid="lithuanian-sample">
          {LITHUANIAN_SAMPLE}
        </p>
        <ul className="flex flex-col gap-3">
          {TYPE_SCALE.map((step) => (
            <li
              key={step.className}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
            >
              <span className="w-32 text-xs text-muted-foreground tabular-nums">
                {step.className} · {step.pixels}px
              </span>
              <span className={step.className}>
                Treniruotė su draugais · {step.usage}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-6">
          <span className="font-normal">Regular 400 body</span>
          <span className="font-medium">Medium 500 labels</span>
          <span className="font-semibold">Semibold 600 headings</span>
        </div>
        <div className="flex gap-8 text-xl">
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">tabular-nums</span>
            <span className="tabular-nums">
              111.1 kg
              <br />
              82.5 kg
            </span>
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">proportional</span>
            <span>
              111.1 kg
              <br />
              82.5 kg
            </span>
          </span>
        </div>
      </section>

      <section aria-labelledby="shape-heading" className="flex flex-col gap-6">
        <h2 id="shape-heading" className="text-2xl font-semibold">
          Radius and spacing
        </h2>
        <ul className="flex flex-wrap gap-4">
          {RADIUS_SCALE.map((step) => (
            <ScaleCard key={step.className} step={step}>
              <span
                className={`block size-16 border border-input bg-surface ${step.className}`}
              />
            </ScaleCard>
          ))}
        </ul>
        <ul className="flex flex-col gap-2">
          {SPACING_SCALE.map((step) => (
            <li key={step.className} className="flex items-center gap-4">
              <span className="w-40 text-xs text-muted-foreground tabular-nums">
                {step.className} · {step.pixels}px · {step.usage}
              </span>
              <span className={`block h-4 bg-primary ${step.className}`} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function ColorSwatchCard({ swatch }: { swatch: ColorSwatch }) {
  return (
    <li className="flex flex-col gap-2">
      <span
        className={`flex h-20 items-end rounded-2xl border p-3 text-sm font-medium ${swatch.className}`}
      >
        Aa · {LITHUANIAN_SAMPLE.slice(0, 4)}
      </span>
      <span className="flex flex-col">
        <code className="text-sm font-medium">--{swatch.token}</code>
        <span className="text-xs text-muted-foreground">{swatch.usage}</span>
      </span>
    </li>
  );
}

function ScaleCard({
  step,
  children,
}: {
  step: ScaleStep;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col items-start gap-2">
      {children}
      <span className="flex flex-col">
        <code className="text-sm font-medium">{step.className}</code>
        <span className="text-xs text-muted-foreground tabular-nums">
          {step.pixels}px · {step.usage}
        </span>
      </span>
    </li>
  );
}
