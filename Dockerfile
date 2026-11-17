# syntax=docker/dockerfile:1
# Production image for self-hosting (E01-T06; deployed by Coolify, E01-T08).
# Multi-stage: deps (npm ci) → builder (next build, standalone output) → runner.
#
#   docker build -t gym-tracker \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... \
#     --build-arg NEXT_PUBLIC_SENTRY_DSN=... \
#     --build-arg APP_VERSION="$(git rev-parse --short HEAD)" .
#   docker run --env-file .env.local -p 3000:3000 gym-tracker
#
# Only public values are build arguments (Next.js inlines NEXT_PUBLIC_* into the
# browser bundle at build time). Server secrets (CLERK_SECRET_KEY,
# CLERK_WEBHOOK_SIGNING_SECRET, SUPABASE_SERVICE_ROLE_KEY) are read at runtime
# from the container environment and must never be added as ARG/ENV here:
# build arguments are visible in `docker history`. The one build-time secret,
# the Sentry auth token for source-map upload, is passed with `--secret`
# (see the builder stage). Optional runtime vars: SENTRY_DSN,
# ENABLE_TEST_ERROR_PAGE (README → Error tracking).

# Node 22 LTS (matches .nvmrc / engines) on Alpine, pinned by version and digest.
# Bump both together: docker pull node:<version>-alpine<x.y> and copy the digest.
ARG NODE_IMAGE=node:22.23.5-alpine3.24@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a

# --- deps: install exact dependencies from the lockfile -----------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: skips install scripts the build doesn't need (e.g. the
# `supabase` CLI downloading its binary). sharp ships prebuilt @img/* packages
# for linux-musl, so it needs no install script.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

# --- builder: production build -------------------------------------------------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Public, build-time values only (inlined into the client bundle).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Error tracking (E01-T07), all optional and non-secret: the DSN is public (it
# only allows sending events), SENTRY_ORG/SENTRY_PROJECT name where source maps
# go. APP_VERSION becomes the Sentry release (same value as /api/health).
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG APP_VERSION=""
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT} \
    SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT} \
    APP_VERSION=${APP_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ may not exist in the repo yet; the runner stage copies it either way.
# The Sentry auth token (uploads source maps) is a build *secret*, never an
# ARG/ENV: it's only present while this RUN executes and isn't stored in any
# layer or in `docker history`. Without it, nothing is uploaded:
#   docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN ...
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    mkdir -p public && npm run build
# npm installs every Linux sharp binary (glibc, musl, wasm); keep only the one
# this image runs (linux-musl, current CPU arch) to save ~25 MB. Fails the
# build if sharp is missing from the standalone output.
RUN cd .next/standalone/node_modules/@img \
    && arch="$(node -p process.arch)" \
    && for pkg in sharp-*; do \
         case "$pkg" in *-linuxmusl-"$arch") ;; *) rm -rf "$pkg" ;; esac; \
       done \
    && ls

# --- runner: minimal runtime ---------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

# Commit SHA (or any release id) reported by GET /api/health; not a secret.
# Empty → /api/health falls back to the package.json version.
ARG APP_VERSION=""
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}

# Unprivileged user; the app files are owned by root, so they're read-only to it.
RUN addgroup -S -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs -H -s /sbin/nologin nextjs \
    && mkdir -p .next/cache \
    && chown nextjs:nodejs .next/cache

# Standalone output: server.js plus only the node_modules it needs (incl. sharp).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

# Busybox wget is also available for platforms that probe from inside the
# container (Coolify); this check uses Node so it doesn't depend on it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=2s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

CMD ["node", "server.js"]
