<script setup lang="ts">
defineProps<{
  items: { label: string, content: string }[]
}>()

const openItems = ref<Set<number>>(new Set())

function toggle(index: number) {
  if (openItems.value.has(index)) {
    openItems.value.delete(index)
  } else {
    openItems.value.add(index)
  }
  openItems.value = new Set(openItems.value)
}
</script>

<template>
  <div class="faq-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="faq-item rounded-lg border border-dusk-200 dark:border-dusk-700/50 mb-3 last:mb-0"
    >
      <button
        class="faq-trigger w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:text-primary transition-colors cursor-pointer"
        :aria-expanded="openItems.has(index)"
        @click="toggle(index)"
      >
        <span>{{ item.label }}</span>
        <UIcon
          name="lucide:chevron-down"
          class="shrink-0 size-5 text-muted transition-transform duration-200"
          :class="{ 'rotate-180': openItems.has(index) }"
        />
      </button>
      <!-- Always in DOM for SEO, visually collapsed -->
      <div
        class="faq-content grid transition-[grid-template-rows] duration-200"
        :class="openItems.has(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <div class="overflow-hidden">
          <p class="px-5 py-4 border-t border-dusk-200 dark:border-dusk-700/50 text-sm text-foreground/80 leading-relaxed">
            {{ item.content }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
