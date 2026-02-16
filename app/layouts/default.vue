<script setup lang="ts">
</script>

<template>
  <div>
    <UContainer class="sm:border-x border-default p-0!">
      <AppHeader :links="navLinks" />
      <slot />
      <AppFooter />
    </UContainer>
  </div>
</template>
