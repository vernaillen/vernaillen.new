<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  links: NavigationMenuItem[]
}>()
</script>

<template>
  <UHeader
    title="Wouter Vernaillen"
    to="/"
  >
    <template #title>
      <SvgoLogo
        class="cursor-pointer w-full logo h-8"
        role="img"
        aria-label="Wouter Vernaillen, home"
      />
    </template>

    <template #default>
      <UNavigationMenu
        :items="links"
        variant="link"
        color="neutral"
        :ui="{
          link: 'px-2 py-1 font-mono',
          linkLeadingIcon: 'hidden'
        }"
      />
    </template>

    <template #right>
      <ColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu
        :items="links"
        orientation="vertical"
        color="neutral"
        variant="link"
        :ui="{
          link: 'font-mono'
        }"
      />
    </template>
  </UHeader>
</template>
