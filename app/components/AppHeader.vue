<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  links: NavigationMenuItem[]
}>()
</script>

<template>
  <header class="sticky top-0 z-10 w-full border-b border-dusk-200/70 bg-dusk-50/80 backdrop-blur-md dark:border-dusk-800/40 dark:bg-dusk-950/70">
    <div class="w-full flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <NuxtLink
        to="/"
        aria-label="Wouter Vernaillen - Home"
        class="flex self-start -mt-px ml-2"
      >
        <SvgoLogo
          ref="logo"
          class="cursor-pointer w-full logo h-8"
          @click="$route.path == '/' ? reloadNuxtApp({ path: '/', ttl: 100 }) : $router.push('/')"
        />
      </NuxtLink>

      <div class="flex items-center gap-1">
        <UNavigationMenu
          :items="links"
          variant="link"
          color="neutral"
          highlight
          :ui="{
            link: 'px-2 py-1 text-sm',
            linkLeadingIcon: 'hidden'
          }"
        />
        <ColorModeButton />
      </div>
    </div>
  </header>
</template>
