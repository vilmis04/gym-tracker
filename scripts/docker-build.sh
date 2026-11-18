#!/bin/sh
# Builds the production image locally (`npm run docker:build`), like Coolify
# does: NEXT_PUBLIC_* values (and the non-secret SENTRY_ORG / SENTRY_PROJECT)
# become build arguments (read from the environment, or from .env.local if
# present); server secrets stay out of the build and are passed at runtime
# (`npm run docker:run`). Extra arguments go to `docker build`.
#
# Sentry source maps are uploaded only if SENTRY_AUTH_TOKEN is set in the
# environment; it's passed as a BuildKit secret, never as a build argument.
set -eu

if [ -f .env.local ]; then
  # Only the public variables; secrets in .env.local are never read here.
  eval "$(grep -E '^(NEXT_PUBLIC_[A-Z0-9_]+|SENTRY_ORG|SENTRY_PROJECT)=' .env.local | sed 's/^/export /')"
fi

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  set -- --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN "$@"
fi

exec docker build \
  --tag gym-tracker \
  --build-arg NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --build-arg NEXT_PUBLIC_SENTRY_DSN \
  --build-arg NEXT_PUBLIC_SENTRY_ENVIRONMENT \
  --build-arg SENTRY_ORG \
  --build-arg SENTRY_PROJECT \
  --build-arg APP_VERSION="$(git rev-parse --short HEAD 2>/dev/null || true)" \
  "$@" \
  .
