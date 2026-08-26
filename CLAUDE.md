# Project: vernaillen.dev

Personal developer website for Wouter Vernaillen, built with Nuxt 4 + @nuxt/ui v4 + Nuxt Content v3.

## After Making Changes

Always run lint and typecheck after changes and make sure there are no errors:

```bash
pnpm lint:fix
pnpm typecheck
```

## Key Directories

- `app/` — Nuxt app (pages, components, composables, assets)
- `content/` — Markdown content (blog posts, page data)
- `server/` — Server routes (sitemap API)
- `public/` — Static assets (images, fonts)

## Deployment

- Runs as a **Nitro node server in Docker on Coolify** (Hetzner VPS): push to `main` → GitHub Actions `ci` workflow builds and pushes the image to `registry.apps.vernaillen.dev`, then triggers the Coolify deploy (~10 min end to end; AVIF encoding during prerender is the slow part)
- **Cloudflare** proxies the apex + www (DNS for the whole zone lives there since 2026-08-25); long-lived cache headers on `/_nuxt`, `/images/**` and `/_ipx/**` make the edge cache do the heavy lifting
- Plausible analytics proxied via the `/plio/**` routeRules in `nuxt.config.ts`

## Known Quirks

- Prerender is CPU-heavy because every `/_ipx` AVIF variant is encoded at build time — `ogImage.security.renderTimeout` is raised to 60s so OG-image renders don't 408 while starved; don't lower it
- `@shikijs/engine-javascript` and `@shikijs/engine-oniguruma` are explicit deps to work around pnpm strict hoisting
- `@nuxtjs/mdc` is an explicit dep (pinned to match `@nuxt/content`) so Vite can resolve it at the root node_modules — otherwise its `optimizeDeps.include` entries (`@nuxtjs/mdc > remark-gfm`, etc.) are unresolvable under pnpm strict hoisting and `pnpm dev` logs a warning. Same shiki/h3 pattern.
- `sharp` is force-overridden to `>=0.35.0` in `pnpm-workspace.yaml` (libvips CVEs in 0.34.x via nuxt-studio's ipx@3 and nuxt-og-image)
- `image.format` in `nuxt.config.ts` only affects `<NuxtPicture>`; `<NuxtImg>` needs an explicit `format="avif"` prop — that's why the prop appears on each usage
- Server-side `queryCollection` must be imported from `@nuxt/content/server` (not auto-imports) to satisfy typecheck
- `defineOgImage` v6 API: first arg is component name string, second arg is props object directly (e.g. `defineOgImage('Vernaillen', { title, description })`)

## Do NOT (Project-Specific)
- Do NOT use `queryCollection` from auto-imports in server routes — import from `@nuxt/content/server`
- Do NOT use old `defineOgImage({ component, props })` syntax — use v6 API: `defineOgImage('Name', { ...props })`
- Do NOT add `@shikijs/*` packages — already explicit deps
- Do NOT remove the explicit `@nuxtjs/mdc` dep — it looks redundant (it's transitive via `@nuxt/content`) but is needed at root so Vite can pre-bundle MDC's remark/rehype deps
- Do NOT run `pnpm dev` — ask the user to start it

## Blog Post Conventions
- Numbered files: lower number = newer (993 is newer than 999)
- Frontmatter: title, description, minRead, date, image (src + optional height), author
- Author: Wouter Vernaillen / Full Stack Developer / /images/woutervernaillen.jpg
- Images: `public/images/blog/{number}.{slug}/`
- Drafts: prefix filename with dot (`.draft-title.md`)
