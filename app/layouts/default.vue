<script setup lang="ts">
const navLinks = useNavLinks()
</script>

<template>
  <div>
    <AppHeader :links="navLinks" />
    <slot />
    <AppFooter />
  </div>
</template>
