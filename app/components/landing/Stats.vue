<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
}>()
</script>

<template>
  <UPageSection
    v-if="page.stats?.length"
    :ui="{
      container: 'pt-8 lg:pt-12 pb-24 lg:pb-32'
    }"
  >
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-px border border-dusk-200 dark:border-dusk-800/50 rounded-lg overflow-hidden">
      <Motion
        v-for="(stat, index) in page.stats"
        :key="index"
        :initial="{ opacity: 0, transform: 'translateY(10px)' }"
        :animate="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.1 * index }"
        class="flex flex-col items-center justify-center py-6 px-4 bg-elevated/30"
      >
        <span class="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
          {{ stat.value }}
        </span>
        <span class="font-mono text-xs text-muted mt-1">
          {{ stat.label }}
        </span>
      </Motion>
    </div>
  </UPageSection>
</template>
