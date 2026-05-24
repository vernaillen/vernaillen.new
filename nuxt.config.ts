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
    '@nuxtjs/plausible',
    '@nuxt/fonts',
    'nuxt-llms'
  ],

  devtools: {
    enabled: true
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
    githubToken: ''
  },

  routeRules: {
    '/plio/js/script.js': { proxy: 'https://plausible.io/js/script.js' },
    '/plio/api/event': { proxy: 'https://plausible.io/api/event' },
    '/admin/**': { ssr: true },
    '/__nuxt_studio/**': { ssr: true }
  },

  sourcemap: {
    client: true
  },

  features: {
    // inline the styles to kill network requests to improve performance
    inlineStyles: true
  },

  experimental: {
    componentIslands: true
  },

  compatibilityDate: '2026-05-22',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  vite: {
    optimizeDeps: {
      exclude: [
        '@plausible-analytics/tracker',
        // Vite 7.3.x has a catastrophic-backtracking regex bug
        // (vitejs/vite#21800, fixed in 8.0.1) that throws
        // "Maximum call stack size exceeded" when pre-bundling
        // the large shaders/vue chunk. Skip optimization until
        // we upgrade Vite past 8.0.1.
        'shaders/vue'
      ]
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
    },
    families: [
      // Preload the above-the-fold fonts. fontless disables preload by
      // default once `subsets` is set, which left the hero title (Poppins)
      // and description (Geist) discovered only after the HTML downloaded,
      // pushing FCP/LCP to ~2s. Re-enabling preload starts them in parallel.
      { name: 'Geist', provider: 'google', preload: true },
      { name: 'Poppins', provider: 'google', preload: true },
      { name: 'Geist Mono', provider: 'google' }
    ]
  },

  image: {
    format: ['webp'],
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
    zeroRuntime: true
  },

  plausible: {
    apiHost: 'https://vernaillen.dev/plio'
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
