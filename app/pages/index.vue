<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => {
  return queryCollection('index').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage({
  component: 'Vernaillen',
  props: {
    title,
    description
  },
  fonts: ['Space+Grotesk:400', 'Space+Grotesk:500']
})
</script>

<template>
  <UPage v-if="page">
    <LandingHero :page />
    <LandingStats :page />
    <UPageSection
      :ui="{
        container: 'pt-0! lg:grid lg:grid-cols-2 lg:gap-8'
      }"
    >
      <LazyLandingAbout :page />
      <LazyLandingWorkExperience :page />
    </UPageSection>
    <LandingBlog :page />
    <LazyLandingTestimonials :page />
  </UPage>
</template>
