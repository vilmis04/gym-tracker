import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone for the Docker image (Dockerfile).
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// E03-T01: next-intl. Points `next-intl/config` at the per-request config
// (locale from the `[locale]` root param, messages from messages/*.json).
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

// Source maps are uploaded to Sentry only when SENTRY_AUTH_TOKEN is set at
// build time (with SENTRY_ORG / SENTRY_PROJECT); without it nothing is
// generated or uploaded and the build doesn't need Sentry at all (CI, local).
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

// E01-T07: error tracking. Wraps the config to inject the release and the
// Sentry SDK into every bundle; see README → Error tracking.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Release = APP_VERSION (the commit SHA; also reported by /api/health).
  // Unset → the SDK falls back to `git rev-parse HEAD`.
  release: {
    name: process.env.APP_VERSION || undefined,
    create: uploadSourceMaps,
  },
  sourcemaps: {
    disable: !uploadSourceMaps,
    // Uploaded maps are removed from the build, so they're never served.
    deleteSourcemapsAfterUpload: true,
  },
  // Upload maps for all client chunks (incl. framework), for readable stacks.
  widenClientFileUpload: true,
  // Build logs only when uploading.
  silent: !uploadSourceMaps,
  telemetry: false,
});
