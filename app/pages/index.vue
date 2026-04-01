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

const { data: blogPosts } = await useAsyncData('index-blogs', () =>
  queryCollection('blog').order('date', 'DESC').limit(3).all()
)

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Vernaillen', {
  title,
  description
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
    <LazyLandingBlog
      :page
      :posts="blogPosts"
    />
    <LazyLandingTestimonials :page />
  </UPage>
</template>
