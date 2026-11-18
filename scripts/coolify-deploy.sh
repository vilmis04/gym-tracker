#!/usr/bin/env bash
# Deploys one commit of the Coolify production app and waits until Coolify
# reports the deployment as finished (E01-T08, used by .github/workflows/deploy.yml;
# docs/deployment.md → How a deploy works).
#
#   COOLIFY_URL=https://coolify.example.com COOLIFY_API_TOKEN=... \
#   COOLIFY_APP_UUID=... DEPLOY_SHA=<40-char commit sha> scripts/coolify-deploy.sh
#
# Steps (Coolify v4 API, https://coolify.io/docs/api-reference):
#   1. PATCH /api/v1/applications/{uuid} {"git_commit_sha": DEPLOY_SHA}
#      Pins the app to exactly the commit whose migrations just ran, so a newer
#      commit on `main` (whose migrations haven't run yet) is never deployed by
#      accident. Needs the token's `write` permission.
#   2. POST /api/v1/deploy?uuid={uuid}&force=false  (`deploy` permission)
#   3. GET /api/v1/deployments/{deployment_uuid} every POLL_INTERVAL seconds
#      until status is `finished` (exit 0) or `failed` / `cancelled*` (exit 1),
#      or DEPLOY_TIMEOUT seconds pass (exit 1). (`read` permission)
#
# Coolify marks a deployment `failed` when the new container doesn't become
# healthy; the previous container keeps serving traffic (rolling update).
#
# Optional: DEPLOY_TIMEOUT (default 1200 s), POLL_INTERVAL (default 10 s).
# Requires bash, curl and jq. Writes `deployment_uuid` to $GITHUB_OUTPUT when set.
set -euo pipefail

: "${COOLIFY_URL:?COOLIFY_URL is required (e.g. https://coolify.example.com)}"
: "${COOLIFY_API_TOKEN:?COOLIFY_API_TOKEN is required}"
: "${COOLIFY_APP_UUID:?COOLIFY_APP_UUID is required}"
: "${DEPLOY_SHA:?DEPLOY_SHA is required (the commit to deploy)}"
DEPLOY_TIMEOUT="${DEPLOY_TIMEOUT:-1200}"
POLL_INTERVAL="${POLL_INTERVAL:-10}"

api="${COOLIFY_URL%/}/api/v1"

# GitHub annotations when running in Actions, plain text otherwise.
error() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::error::$*"; else echo "ERROR: $*"; fi >&2
}

# request METHOD PATH [JSON_BODY] → prints the body; fails on non-2xx.
request() {
  local method="$1" path="$2" body="${3:-}" response status
  local args=(--silent --show-error --max-time 30 --request "$method"
    --header "Authorization: Bearer ${COOLIFY_API_TOKEN}"
    --header "Accept: application/json"
    --write-out $'\n%{http_code}')
  if [ -n "$body" ]; then
    args+=(--header "Content-Type: application/json" --data "$body")
  fi
  if ! response="$(curl "${args[@]}" "${api}${path}")"; then
    error "Coolify API request failed: ${method} ${path} (network error)"
    return 1
  fi
  status="${response##*$'\n'}"
  response="${response%$'\n'*}"
  if [ "${status:0:1}" != "2" ]; then
    error "Coolify API ${method} ${path} returned HTTP ${status}: ${response}"
    return 1
  fi
  printf '%s' "$response"
}

echo "Pinning Coolify app ${COOLIFY_APP_UUID} to commit ${DEPLOY_SHA}"
request PATCH "/applications/${COOLIFY_APP_UUID}" \
  "$(jq -nc --arg sha "$DEPLOY_SHA" '{git_commit_sha: $sha}')" >/dev/null

echo "Queueing the deployment"
deploy_response="$(request POST "/deploy?uuid=${COOLIFY_APP_UUID}&force=false")"
deployment_uuid="$(jq -r '.deployments[0].deployment_uuid // empty' <<<"$deploy_response")"
message="$(jq -r '.deployments[0].message // .message // empty' <<<"$deploy_response")"
if [ -z "$deployment_uuid" ]; then
  error "Coolify did not queue a deployment: ${message:-$deploy_response}"
  exit 1
fi
echo "${message:-Deployment queued.} Deployment: ${deployment_uuid}"
echo "Logs: ${COOLIFY_URL%/} → the application → Deployments → ${deployment_uuid}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "deployment_uuid=${deployment_uuid}" >>"$GITHUB_OUTPUT"
fi

deadline=$((SECONDS + DEPLOY_TIMEOUT))
last_status=""
while :; do
  # A transient API error while polling isn't fatal; the deadline still applies.
  if deployment="$(request GET "/deployments/${deployment_uuid}")"; then
    status="$(jq -r '.status // "unknown"' <<<"$deployment")"
    if [ "$status" != "$last_status" ]; then
      echo "Deployment status: ${status}"
      last_status="$status"
    fi
    case "$status" in
      finished)
        commit="$(jq -r '.commit // empty' <<<"$deployment")"
        if [ -n "$commit" ] && [ "$commit" != "HEAD" ] && [ "$commit" != "$DEPLOY_SHA" ]; then
          error "Coolify deployed commit ${commit}, expected ${DEPLOY_SHA}."
          exit 1
        fi
        echo "Deployment ${deployment_uuid} finished."
        exit 0
        ;;
      failed | cancelled*)
        error "Coolify deployment ${deployment_uuid} ended with status '${status}'. The previous version keeps running. See the deployment logs in Coolify."
        exit 1
        ;;
    esac
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    error "Coolify deployment ${deployment_uuid} did not finish within ${DEPLOY_TIMEOUT}s (last status: ${last_status:-unknown})."
    exit 1
  fi
  sleep "$POLL_INTERVAL"
done
