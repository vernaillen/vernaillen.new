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
  queryCollection('blog')
    .order('date', 'DESC')
    .limit(3)
    .select('path', 'title', 'description', 'date', 'image', 'minRead', 'author')
    .all()
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
    <LazyLandingStats
      :page
      hydrate-on-visible
    />
    <UPageSection
      :ui="{
        container: 'pt-0! lg:grid lg:grid-cols-2 lg:gap-8'
      }"
    >
      <LazyLandingAbout
        :page
        hydrate-on-visible
      />
      <LazyLandingWorkExperience
        :page
        hydrate-on-visible
      />
    </UPageSection>
    <LazyLandingBlog
      :page
      :posts="blogPosts"
      hydrate-on-visible
    />
    <LazyLandingTestimonials
      :page
      hydrate-on-visible
    />
  </UPage>
</template>
