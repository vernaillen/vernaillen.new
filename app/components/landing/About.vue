<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.about.title"
    :description="page.about.description"
    :ui="{
      container: 'p-0!',
      title: 'text-left text-2xl sm:text-2xl lg:text-3xl font-medium section-title',
      description: 'text-left mt-3 text-sm sm:text-md lg:text-sm text-muted'
    }"
  />
</template>
