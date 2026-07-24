set -a; source .env; set +a   # loads NUXT_GITHUB_TOKEN into the env
docker buildx build --platform linux/amd64 \
  --secret id=nuxt_github_token,env=NUXT_GITHUB_TOKEN \
  -t registry.apps.vernaillen.dev/vernaillen-dev:latest --push .
