---
title: "WPNuxt 2.0: A Complete Rewrite for Headless WordPress with Nuxt"
description: Announcing WPNuxt 2.0 — a ground-up rewrite bringing type-safe composables, multi-layer caching, Gutenberg block rendering, authentication, and an AI-powered MCP server to the WordPress + Nuxt stack
minRead: 9
date: 2026-02-16
image: 
  src: /images/blog/990.wpnuxt-v2/wpnuxt.png
  height: 400
author:
  name: Wouter Vernaillen
  description: Full Stack Developer
  avatar:
    src: /images/woutervernaillen.jpg
    alt: Wouter Vernaillen
---

## Introducing WPNuxt 2.0

After months of development spanning 16 alpha releases, 5 betas, and over 250 commits, WPNuxt 2.0 is here. This is a complete rewrite of the WordPress-Nuxt integration module, built from the ground up for Nuxt 4.

WPNuxt connects WordPress with Nuxt via GraphQL, generating type-safe composables from your queries so you can fetch and render WordPress content without writing boilerplate. Version 2 takes this foundation and adds multi-layer caching, Gutenberg block rendering, a full authentication module, and an AI-powered development workflow via MCP.

If you've been building headless WordPress sites with Nuxt — or thinking about it — this release changes what's possible.

## What Changed and Why

WPNuxt v1 started as a single module wrapping `nuxt-graphql-middleware`. It worked, but it had limitations: composable naming was inconsistent, caching was basic, there was no built-in support for Gutenberg blocks or authentication, and serverless deployments on platforms like Vercel hit issues with jsdom in the server bundle.

Version 2 addresses all of this. The three packages (`@wpnuxt/core`, `@wpnuxt/blocks`, `@wpnuxt/auth`) now live in a unified monorepo with synchronized versions, shared testing infrastructure, and a 42-combination CI compatibility matrix covering WordPress 6.4-6.9 and Nuxt 3.17-4.3.

---

## Simplified Composable API

The composable API is cleaner in v2. The configurable prefix is gone — all composables use a consistent `use` naming convention. The separate `useAsync*` composables are replaced by a `lazy` option.

```diff
- const { data } = await useWPPosts()
+ const { data } = await usePosts()

- const { data } = await useWPPageByUri({ uri })
+ const { data } = await usePageByUri({ uri })

- const { data } = useAsyncWPPosts()
+ const { data } = usePosts(undefined, { lazy: true })
```

Every composable is auto-imported and fully typed. The module generates TypeScript declarations from your GraphQL queries and fragments at build time, so you get autocomplete and type checking all the way from WordPress through to your Vue templates.

### New Composable Options

Each composable now accepts options for retry, timeout, and caching:

```ts [app/pages/blog/[...slug].vue]
const { data: post } = await usePostByUri({
  uri: route.params.slug
}, {
  retry: 3,
  retryDelay: 1000,
  timeout: 5000,
  clientCache: false
})
```

Retry uses exponential backoff by default. Timeouts create an `AbortController` under the hood and clean up properly when the request completes or the component unmounts.

---

## Multi-Layer Caching

One of the biggest improvements in v2 is a structured three-layer caching system that works out of the box:

| Layer | Scope | What It Does |
|-------|-------|-------------|
| **Server (Nitro)** | All users | SWR-based caching of GraphQL responses (~1-5ms vs ~200-500ms uncached) |
| **Client (GraphQL)** | Per browser | Deduplicates identical queries during navigation |
| **Payload** | Per request | Prevents refetch during SSR-to-client hydration |

Configure it in `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  wpNuxt: {
    cache: {
      enabled: true,
      maxAge: 300,
      swr: true
    }
  }
})
```

You can also disable caching per-query for content that needs to be fresh, like authenticated or preview content:

```ts
const { data } = await useViewer(undefined, {
  clientCache: false
})
```

The SSG support deserves a special mention. WPNuxt normalizes WordPress URIs with trailing slashes to ensure consistent cache keys between prerendered payloads and client-side navigation. The `getCachedData` functions are defined at module level (not inside the composable) to maintain stable function references across SSR and hydration, preventing Nuxt's "incompatible options" warnings.

---

## The WPContent Component

A new `<WPContent>` component handles WordPress content rendering:

```vue [app/pages/[...slug].vue]
<template>
  <WPContent :node="page" />
</template>
```

WPContent automatically detects whether `@wpnuxt/blocks` is installed. If it is, content renders through the `BlockRenderer` for structured Gutenberg blocks. Otherwise, it falls back to sanitized HTML via the built-in `v-sanitize-html` directive.

The component also intercepts clicks on internal links and uses `navigateTo()` for client-side navigation. It respects modifier keys (Ctrl/Cmd+click for new tab), `target="_blank"`, `download` attributes, and `rel="external"` — so link behavior stays predictable.

---

## Gutenberg Block Rendering

The `@wpnuxt/blocks` package renders WordPress Gutenberg blocks as Vue components. Each block type maps to a dedicated component:

| Component | Block Type |
|-----------|-----------|
| `CoreParagraph` | `core/paragraph` |
| `CoreHeading` | `core/heading` |
| `CoreImage` | `core/image` |
| `CoreButton` | `core/button` |
| `CoreButtons` | `core/buttons` |
| `CoreQuote` | `core/quote` |
| `CoreGallery` | `core/gallery` |
| `CoreSpacer` | `core/spacer` |
| `CoreDetails` | `core/details` |

Install the blocks package alongside core:

```bash
pnpm add @wpnuxt/blocks
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@wpnuxt/blocks']
})
```

The blocks module automatically extends the `Post` and `Page` GraphQL fragments to include `editorBlocks` data. It also detects `@nuxt/ui` and uses its components where appropriate — for example, `CoreButton` renders as a `UButton` when Nuxt UI is available.

Override any block by creating your own component in `components/blocks/`. A `CoreParagraph.vue` in your project takes precedence over the built-in version, giving you full control over rendering without ejecting from the system.

---

## Authentication Module

The `@wpnuxt/auth` package adds WordPress authentication with three supported flows:

| Method | Flow | WordPress Plugin |
|--------|------|------------------|
| **Password** | Username/password via GraphQL mutation | Headless Login for WPGraphQL |
| **External OAuth** | Google, GitHub, etc. | Headless Login for WPGraphQL |
| **WordPress OAuth** | Redirect to WordPress login | miniOrange WP OAuth Server |

All three methods store JWT tokens in secure httpOnly cookies with automatic refresh handling.

```ts [app/pages/login.vue]
const { user, isAuthenticated, login, logout } = useWPAuth()

await login({ username: 'demo', password: 'secret' })
```

The `useWPUser()` composable provides role checking:

```ts
const { hasRole, isAdmin, isEditor } = useWPUser()
```

Authentication is SSR-compatible — cookies are included in server-side requests, so authenticated content renders correctly on first load.

---

## Serverless-Ready HTML Sanitization

Version 1 used `@radya/nuxt-dompurify`, which pulled jsdom (~5.7 MB) into the server bundle. This broke SSR on serverless platforms like Vercel where the bundle size matters.

Version 2 replaces this with a built-in `v-sanitize-html` directive. On the server, HTML passes through as-is (WordPress is a trusted source). On the client, DOMPurify loads lazily using the native browser DOM — no jsdom required.

The directive API is identical, so no template changes are needed when upgrading.

---

## AI-Powered Development with MCP

WPNuxt 2 ships with a [Model Context Protocol](https://modelcontextprotocol.io/) server that integrates with AI assistants like Claude Code. Add it to your project's `.mcp.json`:

```json [.mcp.json]
{
  "mcpServers": {
    "wpnuxt": {
      "type": "sse",
      "url": "https://wpnuxt.com/mcp"
    }
  }
}
```

The MCP server provides tools across several categories:

**WordPress Discovery** — Connect to your WordPress site and explore content types, menus, taxonomies, installed plugins, and available Gutenberg blocks.

**Content Fetching** — Fetch posts, pages, and sample content directly, or run custom GraphQL queries.

**Code Generation** — Scaffold pages, components, GraphQL queries, and block renderers for your WPNuxt project. The `wpnuxt_init` tool generates a complete project structure.

**Migration** — The `wpnuxt_migrate` tool scans v1 projects, identifies breaking changes, detects anti-patterns, and generates compatibility helpers for upgrading.

**Documentation Proxy** — The `nuxt_docs` and `nuxt_ui_docs` tools proxy official Nuxt and Nuxt UI documentation, so you only need one MCP server for your WPNuxt project.

---

## The wpnuxi CLI

A new standalone CLI tool handles project scaffolding and diagnostics:

```bash
# Create a new WPNuxt project
npx wpnuxi init my-site

# Display environment info
npx wpnuxi info

# Run health checks
npx wpnuxi doctor
```

The `doctor` command runs six checks: environment variables, URL validity, GraphQL endpoint reachability, introspection support, schema download, and plugin detection. It gives you a clear diagnostic when something isn't connecting.

---

## Vercel Auto-Configuration

WPNuxt v2 auto-detects Vercel deployments and applies the right settings:

- Native SWR for proper ISR (Incremental Static Regeneration) handling
- SSR forced for all routes (fixes catch-all route classification issues)
- WordPress uploads proxy (`/wp-content/uploads/**` forwarded to your WordPress site)
- `@nuxt/image` IPX configuration with proper WordPress domain aliases

No manual Vercel configuration needed — it just works.

---

## Interactive First-Run Setup

Running `nuxt prepare` for the first time triggers an interactive setup that:

- Prompts for your WordPress URL
- Creates `.env` and `.env.example` files
- Sets up `.mcp.json` for AI assistant integration
- Adds `.queries/` to `.gitignore`
- Creates the `extend/queries/` folder for custom GraphQL queries

This removes the "where do I start?" friction for new projects.

---

## Extending Queries

WPNuxt provides default GraphQL queries for posts, pages, menus, and settings. You can override any of these or add your own by creating `.gql` files in the `extend/queries/` folder:

```graphql [extend/queries/CustomPosts.gql]
query CustomPosts($limit: Int = 10) {
  posts(first: $limit) {
    nodes {
      ...Post
      customField
    }
  }
}
```

This generates `useCustomPosts()` and a lazy variant automatically — fully typed, auto-imported, and cached.

---

## Breaking Changes

If you're upgrading from v1, here are the key changes:

### Composable Naming

| v1 | v2 |
|----|-----|
| `useWPPosts()` | `usePosts()` |
| `useWPPageByUri()` | `usePageByUri()` |
| `useAsyncWPPosts()` | `usePosts(undefined, { lazy: true })` |

### Removed Options

| Removed | Alternative |
|---------|-------------|
| `composablesPrefix` | Fixed `use` prefix |
| `frontendUrl` | Not needed |
| `defaultMenuName` | Pass menu name to query |
| `enableCache` / `cacheMaxAge` | `cache: { enabled, maxAge, swr }` |
| `staging` | Use environment variables |

### Removed Composables

| Removed | Alternative |
|---------|-------------|
| `useFeaturedImage()` | Access `post.featuredImage.node` directly |
| `useWPUri()` | Use `useRoute().params` |

### Minimum Requirements

| Dependency | v1 | v2 |
|---|---|---|
| Nuxt | 3.x | 3.17+ |
| Node.js | 18+ | 20+ |
| nuxt-graphql-middleware | 4.x | 5.x |

The WPNuxt MCP server includes a `wpnuxt_migrate` tool that can scan your v1 project and guide you through the upgrade.

---

## Getting Started

### New Project

The fastest way to start a new WPNuxt project:

```bash
npx wpnuxi init my-wordpress-site
```

Or manually:

```bash
pnpm add @wpnuxt/core
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@wpnuxt/core'],
  wpNuxt: {
    wordpressUrl: 'https://your-wordpress-site.com'
  }
})
```

### Adding Blocks and Auth

```bash
pnpm add @wpnuxt/blocks @wpnuxt/auth
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@wpnuxt/core',
    '@wpnuxt/blocks',
    '@wpnuxt/auth'
  ]
})
```

Run `nuxt prepare` and WPNuxt handles the rest — downloading the GraphQL schema, generating composables, and setting up type declarations.

---

## What's Next

WPNuxt 2.0 is stable and ready for production. Here's what's on the roadmap for upcoming releases:

- **Cursor-based pagination** for large content sets
- **Deeper inner block nesting** for complex Gutenberg layouts
- **Additional default queries** for taxonomies and search
- **Expanded test coverage** for components and module setup logic

Feedback, feature requests, and bug reports are welcome on the [GitHub repository](https://github.com/vernaillen/wpnuxt).

---

## Resources

**Getting Started:**
- [WPNuxt Documentation](https://wpnuxt.com)
- [GitHub Repository](https://github.com/vernaillen/wpnuxt)
- [npm: @wpnuxt/core](https://www.npmjs.com/package/@wpnuxt/core)

**WordPress Requirements:**
- [WPGraphQL Plugin](https://www.wpgraphql.com/)
- [WPGraphQL Content Blocks](https://developer.flavor.dev/wp-graphql-content-blocks/) (for `@wpnuxt/blocks`)
- [Headless Login for WPGraphQL](https://github.com/AxeWP/wp-graphql-headless-login) (for `@wpnuxt/auth`)

**Related Posts:**
- [Discovering Nuxt](/blog/discoveringnuxt)
