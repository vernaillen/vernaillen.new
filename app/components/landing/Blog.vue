<script setup lang="ts">
import type { IndexCollectionItem, BlogCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
  posts?: BlogCollectionItem[] | null
}>()
</script>

<template>
  <UPageSection
    v-if="posts?.length"
    :title="page.blog.title"
    :description="page.blog.description"
    :ui="{
      container: 'py-24 lg:py-32 sm:gap-6 lg:gap-8',
      title: 'text-left text-2xl sm:text-2xl lg:text-3xl font-medium section-title',
      description: 'text-left mt-2 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <UBlogPosts
      orientation="vertical"
      class="gap-4 lg:gap-y-4"
    >
      <UBlogPost
        v-for="(post, index) in posts"
        :key="index"
        orientation="horizontal"
        variant="naked"
        v-bind="post"
        :to="post.path"
        class="card-glow"
        :ui="{
          root: 'group relative lg:items-start lg:flex ring-0 hover:ring-0 sm:px-4! sm:pb-4 rounded-lg border border-dusk-200/70 dark:border-dusk-800/40 transition-all',
          body: '',
          header: 'hidden',
          footer: 'pb-2 px-2',
          date: 'font-mono text-xs'
        }"
      >
        <template #footer>
          <UButton
            size="xs"
            variant="ghost"
            class="gap-0"
            label="Read Article"
          >
            <template #trailing>
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
              />
            </template>
          </UButton>
        </template>
      </UBlogPost>
    </UBlogPosts>
  </UPageSection>
</template>
