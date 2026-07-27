<script setup lang="ts">
defineProps<{
  social: { name: string, url: string, icon?: string }[]
}>()

// Icons for the `social` frontmatter, listed as literals so @nuxt/icon bundles
// them for client-side navigation (a name built at runtime is never scanned).
// A post can still override any of these with an explicit `icon`.
const socialIcons: Record<string, string> = {
  mastodon: 'i-simple-icons-mastodon',
  x: 'i-simple-icons-x',
  bluesky: 'i-simple-icons-bluesky',
  linkedin: 'i-simple-icons-linkedin',
  github: 'i-simple-icons-github'
}
</script>

<template>
  <div class="rounded-lg border border-primary/25 bg-primary/5 p-3">
    <p class="flex items-center gap-1.5 font-mono text-xs text-primary">
      <UIcon
        name="i-lucide-message-square-text"
        class="size-4 shrink-0"
      />
      comment //
    </p>
    <p class="mt-1.5 text-xs text-muted leading-snug">
      Got thoughts on this post? Join the conversation:
    </p>
    <div class="mt-2.5 flex flex-wrap gap-2">
      <UButton
        v-for="s in social"
        :key="s.url"
        size="xs"
        variant="soft"
        color="primary"
        :icon="s.icon || socialIcons[s.name] || `i-simple-icons-${s.name}`"
        :to="s.url"
        target="_blank"
      />
    </div>
  </div>
</template>
