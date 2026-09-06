<script setup lang="ts">
import { FFTVisualizer } from '@fft-visualizer/vue'
import '@fft-visualizer/vue/style.css'

const emit = defineEmits<{ unavailable: [] }>()
onErrorCaptured(() => {
  emit('unavailable')
  return false
})
</script>

<template>
  <FFTVisualizer
    v-bind="$attrs"
    @error="emit('unavailable')"
  />
</template>
