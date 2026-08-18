#!/usr/bin/env bash
# Tell Coolify to pull :latest from the registry and redeploy.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; source .env; set +a
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN missing from .env}"

curl --fail-with-body -sS -X POST \
  "https://coolify.apps.vernaillen.dev/api/v1/deploy?uuid=vzeilwjlwikulinu1x7s2vjd&force=false" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
echo
