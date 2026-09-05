<script setup lang="ts">
// Content remains visible in SSR and without JS. Only the small displacement
// transitions, once, when the element approaches the viewport.
const props = withDefaults(defineProps<{ delay?: number }>(), { delay: 0 })
const element = useTemplateRef('element')
const revealed = ref(false)
const delay = computed(() => `${Math.min(120, Math.max(0, props.delay))}ms`)

const { stop } = useIntersectionObserver(element, ([entry]) => {
  if (entry?.isIntersecting) {
    revealed.value = true
    stop()
  }
}, { rootMargin: '0px 0px 40px 0px' })
</script>

<template>
  <div
    ref="element"
    class="reveal"
    :data-revealed="revealed"
    :style="{ '--reveal-delay': delay }"
  >
    <slot />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    transform: translateY(8px);
    transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    transition-delay: var(--reveal-delay);
  }

  .reveal[data-revealed="true"] {
    transform: none;
  }
}
</style>
