#!/usr/bin/env bash
# One-shot manual deploy: build + local smoke test, then push the tested image
# and trigger Coolify. Normal deploys go through CI on main; this is the bypass.
set -euo pipefail
cd "$(dirname "$0")/.."

./scripts/dockerBuildRun.sh
docker push registry.apps.vernaillen.dev/vernaillen-dev:latest
./scripts/triggerDeploy.sh
