import { Inter } from "next/font/google";

import type { Metadata } from "next";

import "./globals.css";

// `latin-ext` carries the Lithuanian letters (ą č ę ė į š ų ū ž); without it
// they would render in the fallback font. Inter is variable, so no weights.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

// TODO(E03): move under app/[locale]/ and translate via next-intl.
export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Track gym sessions together with your gym buddies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
