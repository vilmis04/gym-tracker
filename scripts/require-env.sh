#!/usr/bin/env bash
# Fails with a clear message listing every named environment variable that is
# empty or unset (E01-T08; deploy.yml checks its secrets with it).
#
#   scripts/require-env.sh SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF
set -euo pipefail

missing=()
for name in "$@"; do
  if [ -z "${!name:-}" ]; then missing+=("$name"); fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  message="Missing secrets/variables: ${missing[*]}. Add them to this job's GitHub environment (docs/deployment.md → GitHub environments and secrets)."
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::error::$message"; else echo "ERROR: $message"; fi >&2
  exit 1
fi
echo "All set: $*"
