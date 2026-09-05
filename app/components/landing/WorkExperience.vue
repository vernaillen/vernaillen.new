<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.experience.title"
    :ui="{
      container: 'p-0! gap-4 sm:gap-4',
      title: 'mb-4 text-left text-2xl sm:text-2xl lg:text-3xl section-title',
      description: 'mt-2'
    }"
  >
    <template #description>
      <div class="flex flex-col gap-2">
        <ScrollReveal
          v-for="(experience, index) in page.experience.items"
          :key="index"
          class="text-muted flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2"
        >
          <p class="shrink-0 font-mono text-xs">
            {{ experience.date }}
          </p>
          <USeparator class="hidden min-w-4 flex-1 sm:flex" />
          <ULink
            class="min-w-0 flex flex-wrap items-baseline gap-x-1 text-sm"
            :to="experience.company.url"
            target="_blank"
          >
            <span class="text-sm">
              {{ experience.position }}
            </span>
            <span
              class="min-w-0"
              :style="{ color: `color-mix(in oklch, ${experience.company.color} 60%, var(--ui-text-muted))` }"
            >
              <span class="font-medium">{{ experience.company.name }}</span>
              <UIcon
                :name="experience.company.logo"
                class="ml-1 inline-block shrink-0 align-middle"
              />
            </span>
          </ULink>
        </ScrollReveal>
      </div>
    </template>
  </UPageSection>
</template>
