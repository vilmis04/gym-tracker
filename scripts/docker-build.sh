#!/bin/sh
# Builds the production image locally (`npm run docker:build`), like Coolify
# does: NEXT_PUBLIC_* values become build arguments (read from the environment,
# or from .env.local if present); server secrets stay out of the build and are
# passed at runtime (`npm run docker:run`). Extra arguments go to `docker build`.
set -eu

if [ -f .env.local ]; then
  # Only the public variables; secrets in .env.local are never read here.
  eval "$(grep -E '^NEXT_PUBLIC_[A-Z0-9_]+=' .env.local | sed 's/^/export /')"
fi

exec docker build \
  --tag gym-tracker \
  --build-arg NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --build-arg APP_VERSION="$(git rev-parse --short HEAD 2>/dev/null || true)" \
  "$@" \
  .
