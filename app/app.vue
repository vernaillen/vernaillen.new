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
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'preload', as: 'image', href: '/images/woutervernaillen.jpg' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  titleTemplate: '%s - Wouter Vernaillen',
  twitterCard: 'summary_large_image'
})

const navLinks = useNavLinks()

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation('blog')
    ])
  }, {
    transform: data => data.flat()
  }),
  // lazy: true prevents blocking hydration; data is prerendered into payload at build time
  // so the client picks it up without a network request or WASM query
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections('blog')
    ])
  }, {
    transform: data => data.flat()
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

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
