<script setup lang="ts">
import { FFTVisualizer } from '@fft-visualizer/vue'
import '@fft-visualizer/vue/style.css'
</script>

<template>
  <FFTVisualizer v-bind="$attrs" />
</template>
