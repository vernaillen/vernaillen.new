<script setup lang="ts">
// Keep the image and its responsive source set in SSR. Load the zoom dialog
// only on demand, without bringing Motion's layout engine into every article.
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  src: string
  alt: string
  width?: string | number
  height?: string | number
  zoom?: boolean
}>(), { zoom: true })
const open = ref(false)
const reducedMotion = usePreferredReducedMotion()
</script>

<template>
  <component
    :is="zoom ? 'button' : 'span'"
    :type="zoom ? 'button' : undefined"
    :aria-label="zoom ? `Enlarge image: ${alt || 'article image'}` : undefined"
    :class="['inline-block max-w-full', zoom && 'cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary']"
    @click="zoom && (open = true)"
  >
    <NuxtImg
      :src="props.src"
      :alt="props.alt"
      :width="props.width"
      :height="props.height"
      v-bind="$attrs"
      sizes="sm:100vw md:768px"
      format="avif"
      loading="lazy"
      class="max-w-full rounded-lg"
    />
  </component>
  <LazyUModal
    v-if="open"
    v-model:open="open"
    :title="alt || 'Article image'"
    :transition="reducedMotion !== 'reduce'"
    :ui="{ content: 'sm:max-w-5xl', body: 'flex justify-center' }"
  >
    <template #body>
      <NuxtImg
        :src="src"
        :alt="alt"
        sizes="sm:100vw lg:1024px"
        format="avif"
        class="max-h-[75vh] w-auto object-contain"
      />
    </template>
  </LazyUModal>
</template>
