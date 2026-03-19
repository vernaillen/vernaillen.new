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
        @click="$route.path == '/' ? reloadNuxtApp({ path: '/', ttl: 100 }) : $router.push('/')"
      />
    </template>

    <template #right>
      <UNavigationMenu
        :items="links"
        variant="link"
        color="neutral"
        :ui="{
          link: 'px-2 py-1 font-mono',
          linkLeadingIcon: 'hidden'
        }"
      />
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
      <ColorModeButton />
    </template>
  </UHeader>
</template>
