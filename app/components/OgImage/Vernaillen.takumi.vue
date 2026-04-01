<script lang="ts" setup>
defineOptions({
  inheritAttrs: false
})
const props = withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Wouter Vernaillen',
  description: 'Freelance Full Stack Developer'
})

const titleHtml = computed(() => {
  return `${props.title}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="56" viewBox="0 0 14 56" style="display:inline;vertical-align:bottom;margin-left:14px;margin-top:6px;"><circle cx="7" cy="45" r="7" fill="#9c8e1b"/></svg>`
})
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-between"
    style="background-color: #0a0908; font-family: 'Geist', sans-serif; position: relative; overflow: hidden;"
  >
    <!-- Subtle accent line -->
    <div
      style="position: absolute; bottom: 0; left: 64px; width: 115px; height: 2px; background-color: #9c8e1b;"
    />

    <!-- Top: Logo -->
    <div style="padding: 0 64px 0; display: flex;">
      <svg
        viewBox="0 0 754 276"
        width="120"
        height="44"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#9c8e1b"
          d="M0 0 H92 V184 H172 V0 H264 V184 H344 V0 H436 V276 H0 Z"
        />
        <path
          fill="#f9f8f5"
          d="M490 0 H582 V184 H662 V0 H754 V276 H490 Z"
        />
      </svg>
    </div>

    <!-- Center: Title & Description -->
    <div style="padding: 0 64px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <!-- eslint-disable vue/no-v-html -->
      <div
        style="font-size: 52px; font-weight: 500; color: #f9f8f5; line-height: 1.5; margin: 0;"
        v-html="titleHtml"
      />
      <p style="font-size: 24px; font-family: 'Geist Mono', serif; font-weight: 400; color: #918d82; margin-top: 16px; line-height: 1.4;">
        {{ description }}
      </p>
    </div>

    <!-- Bottom: URL -->
    <div style="padding: 0 64px 40px; display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px; color: #656158; font-weight: 400;">vernaillen.dev</span>
    </div>
  </div>
</template>
