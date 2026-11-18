import { ThemeToggle } from "@/components/common/theme/theme-toggle";

// Placeholder page (E01-T01). Hard-coded strings are temporary: E03 moves
// this under app/[locale]/ and replaces them with next-intl messages.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">Gym Tracker</h1>
      <p>Coming soon.</p>
      {/* E04-T05 builds the real landing page; it keeps the theme toggle. */}
      <div className="mt-6">
        <ThemeToggle />
      </div>
    </main>
  );
}
