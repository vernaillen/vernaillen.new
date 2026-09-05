<script setup lang="ts">
const colorMode = useColorMode()
const reducedMotion = usePreferredReducedMotion()
let activeTransition: ViewTransition | undefined
let activeAnimation: Animation | undefined

function cancelTransition() {
  activeAnimation?.cancel()
  activeTransition?.skipTransition()
  activeAnimation = undefined
  activeTransition = undefined
}

watch(reducedMotion, (preference) => {
  if (preference === 'reduce') cancelTransition()
})
onBeforeUnmount(cancelTransition)

const nextTheme = computed(() => (colorMode.value === 'dark' ? 'light' : 'dark'))

const switchTheme = () => {
  colorMode.preference = nextTheme.value
}

const startViewTransition = async (event: MouseEvent) => {
  // A click during the previous wipe skips that transition and starts a new
  // one from the current state, so no toggle is ever dropped.
  cancelTransition()
  if (!document.startViewTransition || reducedMotion.value === 'reduce') {
    switchTheme()
    return
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX
  const y = event.detail === 0 ? rect.top + rect.height / 2 : event.clientY
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(async () => {
    switchTheme()
    await nextTick()
  })
  activeTransition = transition

  try {
    await transition.ready
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition.skipTransition()
      return
    }
    activeAnimation = document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 300,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    )
    await activeAnimation.finished
  } catch {
    // A skipped transition or cancelled animation still applies the new theme.
  } finally {
    await transition.finished.catch(() => {})
    if (activeTransition === transition) {
      activeAnimation = undefined
      activeTransition = undefined
    }
  }
}
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-label="`Switch to ${nextTheme} mode`"
      :icon="`i-lucide-${nextTheme === 'dark' ? 'sun' : 'moon'}`"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      @click="startViewTransition"
    />
    <template #fallback>
      <div class="size-4" />
    </template>
  </ClientOnly>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  z-index: 9999;
}
::view-transition-old(root) {
  z-index: 1;
}
</style>
