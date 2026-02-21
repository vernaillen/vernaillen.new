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

- Deployed to **Vercel** as static site (`nuxt generate`)
- Plausible analytics proxied via Vercel rewrites in `vercel.json`

## Known Quirks

- `@shikijs/engine-javascript` and `@shikijs/engine-oniguruma` are explicit deps to work around pnpm strict hoisting on Vercel
- Server-side `queryCollection` must be imported from `@nuxt/content/server` (not auto-imports) to satisfy typecheck
- `defineOgImage` component props go inside the `props` key, not at the top level
