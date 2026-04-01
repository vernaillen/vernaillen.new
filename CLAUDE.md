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
- `defineOgImage` v6 API: first arg is component name string, second arg is props object directly (e.g. `defineOgImage('Vernaillen', { title, description })`)

## Do NOT (Project-Specific)
- Do NOT use `queryCollection` from auto-imports in server routes — import from `@nuxt/content/server`
- Do NOT use old `defineOgImage({ component, props })` syntax — use v6 API: `defineOgImage('Name', { ...props })`
- Do NOT add `@shikijs/*` packages — already explicit deps for Vercel
- Do NOT run `pnpm dev` — ask the user to start it

## Blog Post Conventions
- Numbered files: lower number = newer (993 is newer than 999)
- Frontmatter: title, description, minRead, date, image (src + optional height), author
- Author: Wouter Vernaillen / Full Stack Developer / /images/woutervernaillen.jpg
- Images: `public/images/blog/{number}.{slug}/`
- Drafts: prefix filename with dot (`.draft-title.md`)
