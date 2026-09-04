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

- **Static site on Combell, fronted by Bunny.net.** One workflow, `ci.yml`, runs on every branch as two chained jobs: `check` (lint, typecheck) → `build-deploy` (`needs: check`, runs `pnpm generate`). On `main` only, and only if all of that passed, `build-deploy`'s last two steps rsync `.output/public/` to the Combell shared-hosting pack over SSH and purge the Bunny pull zone. The split is on the CHECKS, not the build: a second job gets a fresh runner, so building there too would repeat the expensive AVIF encoding, and passing `.output/public` as an artifact instead would need `include-hidden-files: true` or `upload-artifact` silently drops `public/.htaccess`.
- **DNS lives at LuaDNS** (`~/git/luadns/vernaillen.dev.lua`, zone-as-Lua-code). Apex is an `alias()` to the Bunny pull zone, `www` a CNAME to it; Bunny origin-pulls from `https://vernaillencom.webhosting.be` (a valid SAN on the Combell pack cert, so origin SSL verify stays on).
- **Caching headers and redirects come from `public/.htaccess`, not `nuxt.config.ts`.** The Nitro `routeRules` are inert on a plain static host — Apache at the Combell origin sets the immutable headers on `/_nuxt`, `/_ipx/**`, `/images/**`, `/_fonts/**` and `/_og/**`, plus `max-age=0, s-maxage=31536000` on HTML/JSON/XML/TXT, that Bunny then inherits at the edge.
- **Bunny's Smart Cache must stay OFF on the pull zone.** It is a MIME allowlist that refuses to cache `text/html`, `application/json` and `application/xml` no matter what the origin sends, and rewrites those responses to `cache-control: no-cache` downstream. With it on, every HTML request was `cdn-cache: MISS` (TTFB ~160ms vs ~110ms off) while `/robots.txt`, carrying the identical header, cached fine — that asymmetry is the tell. Origin headers cannot override it; the only in-product alternative is an Edge Rule with the Override Cache Time action. Off is what makes the `.htaccess` headers above actually apply at the edge.
- **`compressPublicAssets` is deliberately off.** Bunny decodes and re-encodes every response with its own gzip/brotli/zstd encoder per client class and ignores `Cache-Control: no-transform`: measured with marker files, a prebuilt 39 KB brotli at the origin still reached the browser as Bunny's 49 KB brotli (Safari) or 54 KB zstd (Chrome), the exact sizes it produces from the raw file. There is no pull-zone setting to pass origin encoding through, so the `.br`/`.gz` twins Nitro would write (1,084 files, 16 MB per build) are dead weight on this host — don't re-enable the flag or add an `.htaccess` `AddEncoding` rule for them.
- **Nothing may 301 at the origin using a relative target.** Bunny origin-pulls with `Host: vernaillencom.webhosting.be` and forwards it, so any redirect Apache builds from the Host header points off the CDN at the raw Combell pack. That's why `.htaccess` rewrites extensionless URLs to `index.html` internally instead of letting mod_dir's `DirectorySlash` 301 fire, and why the `/links` redirect is spelled out absolutely.
- The FFT radio demo needs a live server, so it stays on Coolify at `radio.vernaillen.dev`; the static build points at it via the `RADIO_ORIGIN_URL` repo variable → `NUXT_PUBLIC_RADIO_URL`.
- Self-hosted analytics script loaded from `c.analytics.apps.vernaillen.dev` (see `app.head.script` in `nuxt.config.ts`)

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
