import { notFound } from "next/navigation";
import { connection } from "next/server";

import { isDevPagesEnabled } from "@/lib/dev-pages";

/**
 * Gate for every developer-only page under `/dev`: 404 unless
 * {@link isDevPagesEnabled}. Developer-only, so nothing here is translated.
 */
export default async function DevLayout({ children }: LayoutProps<"/dev">) {
  // Read the flag per request (runtime env), not once at build time.
  await connection();
  if (!isDevPagesEnabled()) notFound();

  return children;
}
