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
      <ScrollReveal
        v-for="(stat, index) in page.stats"
        :key="index"
        :delay="index * 40"
        class="flex flex-col items-center justify-center py-6 px-4 bg-elevated/30"
      >
        <span class="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
          {{ stat.value }}
        </span>
        <span class="font-mono text-xs text-muted mt-1">
          {{ stat.label }}
        </span>
      </ScrollReveal>
    </div>
  </UPageSection>
</template>
