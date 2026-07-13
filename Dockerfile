# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:24-slim AS build
WORKDIR /app

# Pin pnpm to match the packageManager field (nixpacks/corepack lag behind pnpm 11)
RUN npm i -g pnpm@11.5.3

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile
# Skip sourcemaps (the main heap driver) and cap the heap to fit inside the
# --memory=4g container limit the Jenkinsfile applies to this build (Coolify
# deploys share the same 8GB VPS and need headroom of their own) — Node needs
# ~1GB on top of the V8 heap, and a runaway build should abort instead of
# waking the kernel OOM killer
ENV NUXT_SOURCEMAPS=false
ENV NODE_OPTIONS=--max-old-space-size=3072
# Needed at build time so the prerender of /open-source bakes in real GitHub data.
# BuildKit secret mount keeps the token out of the image layer history (unlike ARG/ENV).
RUN --mount=type=secret,id=nuxt_github_token \
    NUXT_GITHUB_TOKEN="$(cat /run/secrets/nuxt_github_token)" pnpm build

# --- Runtime stage ---
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000
# Drop root privileges — node:24-slim ships a built-in non-root `node` user (UID 1000)
USER node
CMD ["node", ".output/server/index.mjs"]
