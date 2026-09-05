<script setup lang="ts">
defineProps<{ src: string, poster: string, title: string }>()
const container = useTemplateRef('container')
const video = useTemplateRef('video')
const visible = useElementVisibility(container)
const preference = usePreferredReducedMotion()
const documentVisibility = useDocumentVisibility()
const mounted = useMounted()
const shouldPlay = computed(() => mounted.value && visible.value && preference.value === 'no-preference' && documentVisibility.value === 'visible')

// Mounted the first time it may play and kept from then on: unmounting on every
// scroll-out would refetch the file and restart it from the first frame.
const loaded = ref(false)

watch(shouldPlay, (play) => {
  if (play) loaded.value = true
  if (play) void video.value?.play().catch(() => {})
  else video.value?.pause()
}, { flush: 'sync' })
watch(video, (element) => {
  if (element && shouldPlay.value) void element.play().catch(() => {})
})
onBeforeUnmount(() => video.value?.pause())
</script>

<template>
  <div
    ref="container"
    class="relative h-48 w-full overflow-hidden rounded-lg border border-dusk-200 dark:border-dusk-800/50"
  >
    <NuxtImg
      :src="poster"
      :alt="title"
      format="avif"
      width="640"
      height="145"
      sizes="sm:100vw md:640px"
      loading="lazy"
      class="size-full object-cover"
    />
    <video
      v-if="loaded"
      ref="video"
      autoplay
      loop
      muted
      playsinline
      preload="none"
      aria-hidden="true"
      width="640"
      height="192"
      class="absolute inset-0 size-full object-cover"
    >
      <source
        :src="src.replace(/\.mp4$/, '.webm')"
        type="video/webm"
      >
      <source
        :src="src"
        type="video/mp4"
      >
    </video>
  </div>
</template>
