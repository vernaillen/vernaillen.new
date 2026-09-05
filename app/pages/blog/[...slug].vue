<script setup lang="ts">
const route = useRoute()

const { data: page, status } = await useAsyncData(() => `blog-${route.path}`, () =>
  queryCollection('blog').path(route.path).first()
)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const { data: surround } = await useAsyncData(() => `blog-surround-${route.path}`, () =>
  queryCollectionItemSurroundings('blog', route.path, {
    fields: ['description']
  })
)

const loading = computed(() => status.value === 'pending' || page.value?.path !== route.path)

defineOgImage('Vernaillen', {
  title: page.value.title,
  description: page.value.description
})

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

// Per-post BlogPosting structured data for rich search results. The author is
// matched to the site-wide Person node defined in app.vue.
useSchemaOrg([
  defineArticle({
    '@type': 'BlogPosting',
    'headline': page.value.title,
    'description': page.value.description,
    'image': page.value.image?.src,
    'datePublished': page.value.date,
    'dateModified': page.value.date,
    'author': { name: page.value.author?.name ?? 'Wouter Vernaillen' }
  })
])

// Build the canonical share URL from site config + route path so it is correct
// during prerender (where `window` is undefined) and identical on server and
// client — `window.location` baked the literal string "undefined" into the
// static HTML and caused a hydration mismatch.
const site = useSiteConfig()
const articleLink = computed(() => `${site.url}${route.path}`)
</script>

<template>
  <UMain
    v-if="page"
    class="mt-15 px-2"
  >
    <UContainer>
      <!-- Terminal-style breadcrumb -->
      <ULink
        to="/blog"
        class="font-mono text-xs text-muted flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        <span class="text-primary opacity-70">&gt;_</span>
        <span>blog</span>
      </ULink>

      <!-- Skeleton header -->
      <div
        v-if="loading"
        class="flex flex-col gap-4 mt-8 mx-auto"
      >
        <div class="flex justify-center">
          <USkeleton class="h-4 w-48" />
        </div>
        <div class="flex flex-col items-center gap-3">
          <USkeleton class="h-10 w-3/4" />
          <USkeleton class="h-5 w-2/3" />
        </div>
        <USkeleton class="h-[400px] w-full rounded-lg" />
        <div class="flex justify-center">
          <USkeleton class="h-10 w-48" />
        </div>
      </div>

      <!-- Loaded header -->
      <div
        v-else
        class="flex flex-col gap-4 mt-8 mx-auto"
      >
        <!-- Metadata row -->
        <ScrollReveal>
          <div class="flex items-center justify-center gap-3 font-mono text-xs text-muted">
            <span v-if="page.date">
              {{ formatPostDate(page.date) }}
            </span>
            <span
              v-if="page.date && page.minRead"
              class="text-primary/50"
            >
              //
            </span>
            <span v-if="page.minRead">
              {{ page.minRead }} min read
            </span>
          </div>
        </ScrollReveal>

        <!-- Title & description -->
        <ScrollReveal>
          <h1 class="text-3xl sm:text-4xl text-center max-w-3xl mx-auto tracking-tight leading-tight">
            {{ page.title }}
          </h1>
          <p class="font-mono text-muted text-center max-w-3xl mx-auto my-3 text-base leading-relaxed text-foreground/80">
            {{ page.description }}
          </p>
        </ScrollReveal>

        <!-- Hero image. The <img> alone is already eager + fetchpriority=high, but
             it sits in the body behind ~85 modulepreload links of equal priority,
             so on a throttled connection it queued behind ~390KB of JS (LCP 4.6s vs
             FCP 1.4s). `preload` emits a <link rel=preload as=image> in <head> that
             unhead sorts ahead of the modulepreloads. Safe since @nuxt/image 2.1:
             the link now carries imagesrcset + imagesizes, so the browser preloads
             the same candidate the <img> picks (2.0 preloaded the largest variant
             unconditionally and double-downloaded on mobile). -->
        <ScrollReveal>
          <NuxtImg
            :src="page.image?.src"
            :alt="page.title"
            format="avif"
            width="900"
            :height="page.image?.height || 300"
            sizes="sm:100vw md:900px"
            loading="eager"
            fetchpriority="high"
            :preload="{ fetchPriority: 'high' }"
            :style="{ height: `${page.image?.height || 300}px` }"
            class="rounded-lg w-full object-cover object-center border border-dusk-200 dark:border-dusk-800/50"
          />
        </ScrollReveal>

        <!-- Author -->
        <ScrollReveal>
          <div class="flex items-center justify-center">
            <UUser
              color="neutral"
              variant="outline"
              class="justify-center items-center text-center"
              v-bind="page.author"
            />
          </div>
        </ScrollReveal>
      </div>
    </UContainer>

    <UContainer class="relative min-h-screen">
      <UPage>
        <UPageBody class="blog-prose">
          <!-- Skeleton body -->
          <div
            v-if="loading"
            class="flex flex-col gap-4 mt-8"
          >
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-4/5" />
            <USkeleton class="h-4 w-2/3" />
          </div>

          <!-- Loaded body -->
          <template v-else>
            <ScrollReveal>
              <ContentRenderer
                v-if="page.body"
                :value="page"
              />
            </ScrollReveal>

            <!-- Below `lg` the TOC aside sits collapsed at the top of the page and
                 its #bottom slot is hidden by the theme, so the comment card is
                 repeated here, where it reads as the end of the article. -->
            <SocialComments
              v-if="page.social?.length"
              :social="page.social"
              class="mt-10 lg:hidden"
            />

            <!-- Share row -->
            <div class="flex items-center justify-end gap-2 mt-10 pt-6 border-t border-dusk-200 dark:border-dusk-800/50">
              <span class="font-mono text-xs text-muted mr-1">share //</span>
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
          </template>
        </UPageBody>
        <template #right>
          <UContentToc
            v-if="!loading && (page?.body?.toc?.links?.length || page?.social?.length)"
            :links="page.body?.toc?.links"
            highlight
          >
            <template
              v-if="page.social?.length"
              #bottom
            >
              <SocialComments :social="page.social" />
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
