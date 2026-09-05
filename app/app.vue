<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  titleTemplate: '%s - Wouter Vernaillen',
  twitterCard: 'summary_large_image'
})

// Site-wide structured data: a Person identity (linked as author on blog
// Article schema) and the WebSite node, emitted as JSON-LD for rich results.
useSchemaOrg([
  definePerson({
    name: 'Wouter Vernaillen',
    image: '/images/woutervernaillen.jpg',
    jobTitle: 'Freelance Full Stack Developer',
    sameAs: [
      'https://github.com/vernaillen',
      'https://www.linkedin.com/in/woutervernaillen/',
      'https://x.com/vernaillen'
    ]
  }),
  defineWebSite({
    name: 'Wouter Vernaillen'
  })
])
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UMain class="relative">
        <NuxtPage />
      </UMain>
    </NuxtLayout>

    <AppSearch />
  </UApp>
</template>
