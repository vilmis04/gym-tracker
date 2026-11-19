import type { FormatSample } from "./format-samples.types";

/** One rendering of the samples; the same markup on the server and client. */
export function FormatSampleList({
  label,
  samples,
}: {
  label: string;
  samples: readonly FormatSample[];
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
    >
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {samples.map(({ call, text }) => (
          <div key={call} className="contents">
            <dt className="font-mono text-muted-foreground">{call}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
