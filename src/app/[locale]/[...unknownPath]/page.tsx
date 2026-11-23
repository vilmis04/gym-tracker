import { notFound } from "next/navigation";

// Any path under /lt or /en without a page: renders the localized 404
// (`../not-found.tsx`) inside the locale's root layout, instead of Next.js's
// unstyled default.
export default function UnknownPathPage() {
  notFound();
}
