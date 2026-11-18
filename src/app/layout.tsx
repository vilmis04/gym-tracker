import type { Metadata } from "next";

import "./globals.css";

// TODO(E03): move under app/[locale]/ and translate via next-intl.
export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Track gym sessions together with your gym buddies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
