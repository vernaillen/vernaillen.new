#!/usr/bin/env bash
# Build the production image and smoke-test it locally.
# On success the container stays running on http://localhost:3300 for manual checks;
# push the exact tested image (no rebuild) with `pnpm docker:push`.
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE=registry.apps.vernaillen.dev/vernaillen-dev:latest
CONTAINER=vernaillen-smoke

set -a; source .env; set +a
: "${NUXT_GITHUB_TOKEN:?NUXT_GITHUB_TOKEN missing from .env}"

docker buildx build --platform linux/amd64 \
  --secret id=nuxt_github_token,env=NUXT_GITHUB_TOKEN \
  -t "$IMAGE" --load .

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
# 3300 on the host so a local `pnpm dev` on 3000 can keep running.
# NUXT_GITHUB_TOKEN is a RUNTIME need (the open-source page fetches client-side,
# so nothing is baked at build) — prod gets it from Coolify's env vars.
docker run -d --name "$CONTAINER" -p 3300:3000 -e NUXT_GITHUB_TOKEN "$IMAGE"

echo "Waiting for http://localhost:3300 (amd64 under emulation starts slowly) ..."
for _ in $(seq 1 24); do
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" != "true" ]; then
    echo "Container exited during startup." >&2
    break
  fi
  if curl -fsS http://localhost:3300/ >/dev/null 2>&1; then
    echo "Smoke test passed — app is up at http://localhost:3300"
    echo "Container '$CONTAINER' stays up for manual checks; stop it with: docker rm -f $CONTAINER"
    exit 0
  fi
  sleep 5
done

echo "Smoke test FAILED — container logs:" >&2
docker logs "$CONTAINER" >&2 || true
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
exit 1
