# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:24-slim AS build
WORKDIR /app

# Pin pnpm to match the packageManager field (nixpacks/corepack lag behind pnpm 11)
RUN npm i -g pnpm@11.5.3

COPY . .

# Needed at build time so the prerender of /open-source bakes in real GitHub data
ARG NUXT_GITHUB_TOKEN
ENV NUXT_GITHUB_TOKEN=$NUXT_GITHUB_TOKEN

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile
# Skip sourcemaps (the main heap driver) and cap the heap well below the
# Coolify VPS's 8GB total — Node needs ~1-2GB on top of the V8 heap, and a
# runaway build should abort instead of waking the kernel OOM killer
ENV NUXT_SOURCEMAPS=false
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

# --- Runtime stage ---
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000
# Drop root privileges — node:24-slim ships a built-in non-root `node` user (UID 1000)
USER node
CMD ["node", ".output/server/index.mjs"]
