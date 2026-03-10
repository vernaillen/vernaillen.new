// https://nuxt.com/docs/api/configuration/nuxt-config
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
    '@nuxt/fonts'
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

  routeRules: {
    '/plio/js/script.js': { proxy: 'https://plausible.io/js/script.js' },
    '/plio/api/event': { proxy: 'https://plausible.io/api/event' }
  },

  experimental: {
    componentIslands: true
  },

  compatibilityDate: '2026-02-16',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
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
