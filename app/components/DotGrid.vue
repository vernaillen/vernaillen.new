<script setup lang="ts">
const props = withDefaults(defineProps<{
  spacing?: number
  dotRadius?: number
  baseOpacity?: number
}>(), {
  spacing: 14,
  dotRadius: 1,
  baseOpacity: 0.35
})

const canvasRef = useTemplateRef('canvas')

useDotGrid(canvasRef, {
  spacing: props.spacing,
  dotRadius: props.dotRadius,
  baseOpacity: props.baseOpacity
})
</script>

<template>
  <canvas
    ref="canvas"
    class="pointer-events-none absolute inset-0 w-full h-full z-[-1]"
    aria-hidden="true"
  />
</template>
