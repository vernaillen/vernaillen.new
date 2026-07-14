# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:24-slim AS build
WORKDIR /app

# Pin pnpm to match the packageManager field (nixpacks/corepack lag behind pnpm 11)
RUN npm i -g pnpm@11.5.3

COPY . .

# Needed at build time so the prerender of /open-source bakes in real GitHub data.
# Plain ARG/ENV (not a BuildKit secret mount) because this image is also built by
# Coolify's deploy pipeline, which only supports build-time env vars, not --secret.
# The token doesn't leak into the runtime image since only .output is copied out below.
ARG NUXT_GITHUB_TOKEN
ENV NUXT_GITHUB_TOKEN=$NUXT_GITHUB_TOKEN

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile
# Skip sourcemaps (the main heap driver) and cap the heap well below the
# Coolify VPS's 8GB total — Node needs ~1-2GB on top of the V8 heap, and a
# runaway build should abort instead of waking the kernel OOM killer.
# Jenkins CI builds get their own container-level --memory cap in the
# Jenkinsfile on top of this — don't shrink this heap to fit that; size the
# Jenkins container cap around this value instead.
ENV NUXT_SOURCEMAPS=false
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

# --- Runtime stage ---
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000
# node -e fetch instead of curl/wget — node:24-slim ships neither, and Coolify
# needs an in-image HEALTHCHECK to report container health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
# Drop root privileges — node:24-slim ships a built-in non-root `node` user (UID 1000)
USER node
CMD ["node", ".output/server/index.mjs"]
