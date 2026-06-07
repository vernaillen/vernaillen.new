# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-slim AS build
WORKDIR /app

# Pin pnpm to match the packageManager field (nixpacks/corepack lag behind pnpm 11)
RUN npm i -g pnpm@11.0.9

COPY . .

# Needed at build time so the prerender of /open-source bakes in real GitHub data
ARG NUXT_GITHUB_TOKEN
ENV NUXT_GITHUB_TOKEN=$NUXT_GITHUB_TOKEN

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm i --frozen-lockfile
RUN pnpm build

# --- Runtime stage ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
