<script setup lang="ts">
const { footer } = useAppConfig()
const { deployedAt } = useRuntimeConfig().public

const deployedAtLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Brussels'
}).format(new Date(deployedAt))
</script>

<template>
  <UFooter
    class="z-10 bg-default border-t border-dusk-200/70 dark:border-dusk-800/40"
    :ui="{ left: 'text-muted text-xs font-mono' }"
  >
    <template #left>
      {{ footer.credits1 }}<br>last deployed {{ deployedAtLabel }}<br><br>{{ footer.credits2 }}
    </template>

    <template #right>
      <template v-if="footer?.links">
        <UButton
          v-for="(link, index) of footer?.links"
          :key="index"
          v-bind="{ size: 'xs', color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>
  </UFooter>
</template>
