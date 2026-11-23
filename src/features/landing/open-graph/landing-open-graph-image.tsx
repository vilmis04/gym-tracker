import "server-only";

import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/lib/i18n/i18n.types";
import { readTokenColors } from "@/lib/seo/token-colors";

import { LANDING_OPEN_GRAPH_IMAGE_SIZE } from "./landing-open-graph-image-route";

/**
 * The landing page's Open Graph image (E04-T05), shown in link previews
 * (messengers, social networks): the landing page's dumbbell mark, the app name, the tagline and
 * the three benefits on the light theme's earth tones, in `locale`. The
 * colors come from the design tokens (`readTokenColors`), because
 * `ImageResponse` can't read CSS variables. Served by
 * `app/[locale]/(public)/og-image.png/route.ts`, prerendered per locale.
 *
 * The text uses `ImageResponse`'s built-in font (Geist, which has the
 * Lithuanian letters), not Inter: shipping Inter as a TTF only for this
 * image isn't worth it.
 */
export async function renderLandingOpenGraphImage(
  locale: Locale,
): Promise<ImageResponse> {
  const [translateCommon, translateLanding, getColor] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "landing" }),
    readTokenColors("light"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: getColor("background"),
        color: getColor("foreground"),
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: getColor("primary-soft"),
          }}
        >
          {DUMBBELL_PARTS.map(({ width, height }, index) => (
            <div
              key={index}
              style={{
                width,
                height,
                borderRadius: 3,
                background: getColor("primary"),
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 88, letterSpacing: -2 }}>
          {translateCommon("appName")}
        </div>
        <div style={{ fontSize: 40, color: getColor("muted-foreground") }}>
          {translateLanding("ogTagline")}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {BENEFIT_TITLE_KEYS.map((titleKey) => (
          <div
            key={titleKey}
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 26,
              background: getColor("surface"),
            }}
          >
            {translateLanding(titleKey)}
          </div>
        ))}
      </div>
    </div>,
    LANDING_OPEN_GRAPH_IMAGE_SIZE,
  );
}

// A dumbbell from plates and a bar, like the landing page's lucide
// `Dumbbell` (lucide's icons are client components, which can't be called
// while rendering the image on the server).
const DUMBBELL_PARTS = [
  { width: 6, height: 20 },
  { width: 8, height: 32 },
  { width: 16, height: 6 },
  { width: 8, height: 32 },
  { width: 6, height: 20 },
];

const BENEFIT_TITLE_KEYS = [
  "benefitBuddiesTitle",
  "benefitLastAttemptTitle",
  "benefitProgressTitle",
] as const;
