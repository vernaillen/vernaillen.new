<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { mapContentNavigation } from '@nuxt/ui/utils/content'
import { findPageBreadcrumb } from '@nuxt/content/utils'

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const { data: surround } = await useAsyncData(`${route.path}-surround`, () =>
  queryCollectionItemSurroundings('blog', route.path, {
    fields: ['description']
  })
)

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))
const blogNavigation = computed(() => navigation.value.find(item => item.path === '/blog')?.children || [])

const breadcrumb = computed(() => mapContentNavigation(findPageBreadcrumb(blogNavigation?.value, page.value?.path)).map(({ icon, ...link }) => link))

defineOgImage({
  component: 'VernaillenBlog',
  props: {
    title: page.value.title,
    description: page.value.description,
    headline: breadcrumb.value.map(item => item.label).join(' > ')
  },
  fonts: ['Space+Grotesk:400', 'Space+Grotesk:500']
})

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

const articleLink = computed(() => `${window?.location}`)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UMain
    v-if="page"
    class="mt-20 px-2"
  >
    <UContainer>
      <ULink
        to="/blog"
        class="text-sm flex items-center gap-1"
      >
        <UIcon name="lucide:chevron-left" />
        Blog
      </ULink>
      <div class="flex flex-col gap-3 mt-8">
        <div class="flex text-xs text-muted items-center justify-center gap-2">
          <span v-if="page.date">
            {{ formatDate(page.date) }}
          </span>
          <span v-if="page.date && page.minRead">
            -
          </span>
          <span v-if="page.minRead">
            {{ page.minRead }} MIN READ
          </span>
        </div>
        <Motion
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        >
          <NuxtImg
            :src="page.image?.src"
            :alt="page.title"
            :class="`h-[${page.image?.height ? page.image.height : 300}px]`"
            class="rounded-lg w-full blog-image-height object-cover object-center"
          />
        </Motion>
        <Motion
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 }"
        >
          <h1 class="text-4xl text-center font-medium max-w-3xl mx-auto mt-4">
            {{ page.title }}
          </h1>
          <p class="text-muted text-center max-w-2xl mx-auto mt-3">
            {{ page.description }}
          </p>
        </Motion>
        <Motion
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.2 }"
        >
          <div class="flex items-center justify-center gap-2 mt-2">
            <UUser
              orientation="vertical"
              color="neutral"
              variant="outline"
              class="justify-center items-center text-center"
              v-bind="page.author"
            />
          </div>
        </Motion>
      </div>
    </UContainer>

    <UContainer class="relative min-h-screen">
      <UPage>
        <UPageBody>
          <ContentRenderer
            v-if="page.body"
            :value="page"
          />

          <div class="flex items-center justify-end gap-2 text-sm text-muted">
            <span class="text-xs">Share on</span>
            <UButton
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-simple-icons-x"
              :to="`https://x.com/intent/tweet?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(articleLink)}`"
              target="_blank"
            />
            <UButton
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-simple-icons-linkedin"
              :to="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleLink)}`"
              target="_blank"
            />
            <UButton
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-simple-icons-bluesky"
              :to="`https://bsky.app/intent/compose?text=${encodeURIComponent(page.title + ' ' + articleLink)}`"
              target="_blank"
            />
            <UButton
              size="sm"
              variant="link"
              color="neutral"
              label="Copy link"
              @click="copyToClipboard(articleLink, 'Article link copied to clipboard')"
            />
          </div>
          <UContentSurround :surround />
        </UPageBody>
        <template
          v-if="page?.body?.toc?.links?.length"
          #right
        >
          <UContentToc
            :links="page.body.toc.links"
            highlight
          />
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
