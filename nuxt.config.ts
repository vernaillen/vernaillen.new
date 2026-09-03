// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'

const lastUpdated = (() => {
  try {
    return execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
})()

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    'nuxt-svgo',
    'motion-v/nuxt',
    'nuxt-studio',
    '@nuxt/fonts',
    'nuxt-llms'
  ],

  devtools: {
    enabled: true
  },
  app: {
    head: {
      script: [
        {
          'src': 'https://c.analytics.apps.vernaillen.dev/oa.js',
          'data-key': 'oa_pk_37j7lnJbTNclWg143o0NpWP6oMmJBw11',
          'data-collector': 'https://c.analytics.apps.vernaillen.dev',
          'async': true
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://vernaillen.dev',
    name: 'Wouter Vernaillen',
    description: 'Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.',
    defaultLocale: 'en'
  },

  colorMode: {
    preference: 'dark'
  },

  runtimeConfig: {
    githubToken: '',
    public: {
      deployedAt: new Date().toISOString(),
      // Where the FFT demo's <audio> fetches the SomaFM stream. Empty = the
      // same-origin proxy (server/api/radio.get.ts), used by the full Nitro
      // deploy. On a static host set NUXT_PUBLIC_RADIO_URL to the absolute URL
      // of the radio app's proxy (https://radio.vernaillen.dev/api/radio); the
      // player then loads it crossorigin=anonymous and the proxy's CORS header
      // keeps the WebAudio analyser untainted.
      radioUrl: ''
    }
  },

  routeRules: {
    '/links': { redirect: { to: '/', statusCode: 301 } },
    '/admin/**': { ssr: true, headers: { 'cache-control': 'no-store' } },
    '/__nuxt_studio/**': { ssr: true, headers: { 'cache-control': 'no-store' } },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000' } },
    // ipx URLs encode every transform modifier (format/quality/size) in the path
    // and the source images never change in place, so the rendered variants are
    // safe to treat as immutable.
    '/_ipx/**': { headers: { 'cache-control': 'public, max-age=31536000' } },
    // Every page is prerendered and only changes on deploy, so let Cloudflare
    // cache the HTML at the edge (s-maxage) while browsers always revalidate
    // (max-age=0). CI purges the zone after each Coolify deploy. Listed
    // per-route rather than '/**' so dynamic routes and Nitro's immutable
    // /_nuxt headers are left alone. Needs the "eligible for cache" Cache Rule
    // in the Cloudflare dashboard — by default Cloudflare never caches HTML.
    ...Object.fromEntries([
      '/', '/about', '/career', '/projects', '/open-source',
      '/blog', '/blog/**', '/_payload.json', '/about/_payload.json',
      '/career/_payload.json', '/projects/_payload.json',
      '/open-source/_payload.json'
    ].map(route => [route, {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=31536000' }
    }]))
  },

  // Sourcemaps roughly double the build's heap; the Docker build sets
  // NUXT_SOURCEMAPS=false so it fits on an 8GB host
  sourcemap: process.env.NUXT_SOURCEMAPS === 'false'
    ? false
    : { client: true },

  features: {
    // inline the styles to kill network requests to improve performance
    inlineStyles: true
  },

  experimental: {
    componentIslands: true,
    // SSR renders `.client` components as ServerPlaceholder, which without this
    // flag is an empty <div>. HeroShaders.client.vue's root is `<Shader v-if=
    // "ready">` and `ready` only flips in onMounted, so its first client render
    // is a comment node — a <div>-vs-comment hydration mismatch as soon as the
    // >=1024px media query hydrates it (desktop only; mobile never hydrates it
    // and never warned). Emitting <!--placeholder--> on the server matches, and
    // also drops the stray immediate="true" attr that fell through onto the
    // placeholder. Losing placeholder attrs costs nothing here: the div was
    // empty and absolutely positioned. Both <ClientOnly> usages pass an explicit
    // #fallback, which this flag does not touch.
    clientNodePlaceholder: true
  },

  compatibilityDate: '2026-05-22',

  nitro: {
    compressPublicAssets: true,
    prerender: {
      routes: [
        '/',
        '/api/search-index.json',
        // Baked at build time so the Open Source page has data without a live
        // server — the static-host equivalent of the cached endpoint. Needs
        // NUXT_GITHUB_TOKEN at build; without it the handler ships empty rather
        // than failing the build (see server/api/github-contributions.json.get.ts).
        '/api/github-contributions.json'
      ],
      crawlLinks: true
    }
  },

  vite: {
    optimizeDeps: {
      exclude: [
        // Vite 7.3.x has a catastrophic-backtracking regex bug
        // (vitejs/vite#21800, fixed in 8.0.1) that throws
        // "Maximum call stack size exceeded" when pre-bundling
        // the large shaders/vue chunk. Skip optimization until
        // we upgrade Vite past 8.0.1.
        'shaders/vue',
        '@unhead/schema-org/vue'
      ]
    }
  },

  hooks: {
    // Nuxt prefetches every lazy chunk reachable from a route, which on the
    // homepage meant ~3.5MB of speculative JS — including the 2.5MB shaders
    // library that only ever hydrates at >=1024px. That download competes with
    // the critical path for bandwidth and CPU on exactly the mobile connections
    // that never use it. Dropping prefetch costs the desktop shader a slightly
    // later start (its init is idle-deferred anyway); modulepreload of the
    // chunks a route actually needs is untouched.
    'build:manifest': (manifest) => {
      for (const chunk of Object.values(manifest)) {
        chunk.prefetch = false
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    providers: {
      bunny: false
    },
    defaults: {
      weights: [400, 500, 600, 700],
      subsets: ['latin']
      // font-display defaults to 'swap' in @nuxt/fonts (not configurable here),
      // so the LCP description text paints in the fallback face immediately and
      // swaps to the web font on arrival — no invisible-text delay.
    },
    families: [
      // Preloads intentionally omitted. font-display:swap + @nuxt/fonts' auto
      // fallback metric-overrides mean the LCP H1 (Poppins) paints immediately
      // in a size-matched fallback; the web fonts swap in on arrival with ~0 CLS.
      // Preloading the ~76KB of woff2 put them at highest priority on the critical
      // path, competing with first paint — measured LCP 4.3s→2.1s / Perf 77→98 on
      // mobile (Vercel CDN) once removed.
      { name: 'Geist', provider: 'google' },
      { name: 'Poppins', provider: 'google' },
      { name: 'Geist Mono', provider: 'google' }
    ]
  },

  image: {
    format: ['avif', 'webp'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  },

  llms: {
    domain: 'https://vernaillen.dev',
    title: 'Wouter Vernaillen',
    description: `Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.

vernaillen.dev is the personal site of Wouter Vernaillen — a Belgian freelance Full Stack Developer with 25+ years of experience. The site covers his professional work (Java/Spring backends, Nuxt/Vue frontends), open source projects (notably WPNuxt), and writing about modern web development, AI-assisted coding, and the tools he uses. Built with Nuxt 4, Nuxt UI, and Nuxt Content.`,
    full: {
      title: 'Wouter Vernaillen — Full Documentation',
      description: 'The complete content of vernaillen.dev (home, about, career, projects, blog) in a single Markdown file.'
    },
    notes: [`Last updated: ${lastUpdated}`],
    sections: [
      {
        title: 'Pages',
        links: [
          {
            title: 'Home',
            description: 'Landing page with intro, featured projects, work experience, testimonials, and FAQ.',
            href: '/'
          },
          {
            title: 'About',
            description: 'Personal background: developer, open source maker, sound healer. Building things that bridge worlds.',
            href: '/about'
          },
          {
            title: 'Career',
            description: 'Professional timeline since 2002 — the projects, companies, and technologies across 25+ years.',
            href: '/career'
          },
          {
            title: 'Projects',
            description: 'Open source tools, client work, and personal projects — from enterprise portals to creative coding experiments.',
            href: '/projects'
          },
          {
            title: 'Open Source',
            description: 'Modules, tools, and starters built and maintained, plus pull requests merged into ecosystem projects.',
            href: '/open-source'
          },
          {
            title: 'Blog',
            description: 'Articles on development, Nuxt, open source, and the tools I use.',
            href: '/blog'
          }
        ]
      }
    ]
  },

  ogImage: {
    zeroRuntime: true,
    security: {
      // AVIF encoding saturates the CPU during prerender and starves the OG
      // renderer, which otherwise gives up after the 15s default and fails the
      // build with 408s. zeroRuntime means this budget only applies at build time.
      renderTimeout: 60000
    }
  },

  seo: {
    meta: {
      title: 'Wouter Vernaillen',
      description: 'Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.',
      ogTitle: 'Wouter Vernaillen',
      ogDescription: 'Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.'
    }
  },

  sitemap: {
    sources: ['/api/sitemap']
  },

  studio: {
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'vernaillen',
      repo: 'vernaillen.new'
    }
  },

  svgo: {
    svgo: true,
    autoImportPath: './assets/svg/',

    defaultImport: 'component',
    svgoConfig: {
      multipass: true
    }
  }
})
