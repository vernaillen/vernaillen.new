set -a; source .env; set +a   # loads NUXT_GITHUB_TOKEN into the env
docker buildx build --platform linux/amd64 \
  --secret id=nuxt_github_token,env=NUXT_GITHUB_TOKEN \
  -t registry.apps.vernaillen.dev/vernaillen-dev:latest --push .
read -rs COOLIFY_TOKEN   # paste token, press enter
curl --fail-with-body -sS \
  "https://coolify.apps.vernaillen.dev/api/v1/deploy?uuid=vzeilwjlwikulinu1x7s2vjd&force=false" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
