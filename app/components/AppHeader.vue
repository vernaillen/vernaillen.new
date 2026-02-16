<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  links: NavigationMenuItem[]
}>()
</script>

<template>
  <header class="sticky top-0 z-10 w-full border-b border-dusk-200/70 bg-dusk-50/70 backdrop-blur-sm dark:border-dusk-800/50 dark:bg-dusk-950/60">
    <div class="w-full flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <NuxtLink
        to="/"
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
          :ui="{
            link: 'px-2 py-1 text-sm text-dusk-600 hover:text-dusk-900 dark:text-dusk-300 dark:hover:text-white',
            linkLeadingIcon: 'hidden'
          }"
        />
        <ColorModeButton />
      </div>
    </div>
  </header>
</template>
