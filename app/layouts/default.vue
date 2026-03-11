<script setup lang="ts">
const navLinks = useNavLinks()
</script>

<template>
  <div>
    <UContainer class="sm:border-x border-dusk-200 dark:border-dusk-800/50 p-0!">
      <AppHeader :links="navLinks" />
      <slot />
      <AppFooter />
    </UContainer>
  </div>
</template>
