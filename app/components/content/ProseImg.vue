<script setup lang="ts">
// Override @nuxt/ui's ProseImg to give content images a `sizes` hint. Without it,
// NuxtImg falls back to a density srcset off the markdown `width` and serves the
// full-size original (e.g. 1536px) into a ~700px-wide prose column. Delegating to
// the original component keeps the zoom-dialog behaviour intact.
import ProseImg from '@nuxt/ui/runtime/components/prose/Img.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  src: string
  alt: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <ProseImg
    :src="props.src"
    :alt="props.alt"
    :width="props.width"
    :height="props.height"
    v-bind="$attrs"
    sizes="(max-width: 768px) 100vw, 768px"
  />
</template>
