#!/usr/bin/env bash
set -euo pipefail

# Run serially: parallel audits compete for CPU and invalidate comparisons.
# Reports include HTML, JSON, a Chrome trace, and a DevTools network log.
audit_origin="${1:-https://vernaillen.dev}"
audit_output="${2:-.unlighthouse/performance/baseline-2026-09-05}"
mkdir -p "$audit_output"

run_audit() {
  local label="$1" route="$2"
  shift 2
  printf 'Auditing %s%s (%s)\n' "$audit_origin" "$route" "$label"
  pnpm dlx lighthouse@13.4.1 \
    "${audit_origin%/}${route}" \
    --chrome-flags="--headless" \
    --output=html --output=json --save-assets \
    --output-path="$audit_output/$label" \
    --quiet "$@"
}

for audit_iteration in 1 2 3; do
  run_audit "home-mobile-$audit_iteration" /
done
run_audit home-desktop / --preset=desktop
run_audit projects-mobile /projects
run_audit blog-mobile /blog
run_audit open-source-mobile /open-source
