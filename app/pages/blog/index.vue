<script setup lang="ts">
const { data: page } = await useAsyncData('blog-page', () => {
  return queryCollection('pages').path('/blog').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}
const { data: posts } = await useAsyncData('blogs', () =>
  queryCollection('blog').order('date', 'DESC').all()
)
if (!posts.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'blogs posts not found',
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

defineOgImage('Vernaillen', {
  title,
  description
})
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.links"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    />
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Motion
          v-for="(post, index) in posts"
          :key="index"
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 * index }"
          :in-view-options="{ once: true }"
        >
          <UBlogPost
            variant="naked"
            :to="post.path"
            v-bind="post"
            :image="post.image.src"
            orientation="vertical"
            :ui="{
              root: 'flex flex-col h-full card-glow rounded-lg border border-dusk-200 dark:border-dusk-800/50 p-3 transition-transform duration-400 hover:scale-[1.01]',
              header: 'aspect-auto',
              image: 'border border-dusk-200 dark:border-dusk-800/30 h-48 sm:h-52 md:h-52 lg:h-64 object-cover',
              date: 'font-mono text-xs',
              title: 'tracking-tight text-lg',
              description: 'text-sm line-clamp-2'
            }"
          />
        </Motion>
      </div>
    </UPageSection>
  </UPage>
</template>
