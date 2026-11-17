#!/usr/bin/env bash
# Polls a deployment's /api/health until it answers 200 with
# {"status":"ok","version":<EXPECTED_VERSION>} (E01-T08, used by
# .github/workflows/deploy.yml after the Coolify deploy).
#
#   scripts/wait-for-health.sh https://gym.example.com <commit sha>
#
# The version matches when it equals EXPECTED_VERSION or is a prefix of it of
# at least 7 characters (a short SHA, as `npm run docker:build` sets it).
# Exits 0 once it matches, 1 when HEALTH_TIMEOUT seconds (default 300) pass
# without a match. Optional: HEALTH_INTERVAL (default 5 s). Needs curl and jq.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <base url> <expected version>" >&2
  exit 2
fi
base_url="${1%/}"
expected="$2"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-300}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
url="${base_url}/api/health"

error() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::error::$*"; else echo "ERROR: $*"; fi >&2
}

matches() {
  local version="$1"
  [ "$version" = "$expected" ] && return 0
  [ "${#version}" -ge 7 ] && [ "${expected#"$version"}" != "$expected" ]
}

echo "Waiting for ${url} to report version ${expected} (timeout ${HEALTH_TIMEOUT}s)"
deadline=$((SECONDS + HEALTH_TIMEOUT))
last=""
while :; do
  body="$(curl --silent --show-error --fail --max-time 10 "$url" 2>&1)" || body="unreachable: ${body}"
  status="$(jq -r '.status // empty' <<<"$body" 2>/dev/null || true)"
  version="$(jq -r '.version // empty' <<<"$body" 2>/dev/null || true)"
  if [ "$status" = "ok" ] && matches "$version"; then
    echo "Healthy: ${body}"
    exit 0
  fi
  if [ "$body" != "$last" ]; then
    echo "Not yet: ${body}"
    last="$body"
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    error "${url} did not report version ${expected} within ${HEALTH_TIMEOUT}s (last response: ${last})."
    exit 1
  fi
  sleep "$HEALTH_INTERVAL"
done
