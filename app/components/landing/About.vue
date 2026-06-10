<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.about.title"
    :ui="{
      container: 'p-0!',
      title: 'mb-4 text-left text-2xl sm:text-2xl lg:text-3xl font-medium section-title',
      description: 'text-left mt-3 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <template #description>
      <MDC
        v-if="page.about?.description"
        :value="page.about.description"
        unwrap="p"
        class="text-sm text-muted prose"
      />
    </template>
  </UPageSection>
</template>
