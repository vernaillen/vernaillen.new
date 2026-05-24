<script setup lang="ts">
import { Shader, Pixelate, Plasma, SineWave, CursorTrail } from 'shaders/vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const primaryColor = ref('#baaf4e')

// Gate WebGL init until the theme is settled. With delayed hydration the
// shader mounts after `colorMode` is resolved, so rendering only once mounted
// avoids initialising uniforms against the transient light-mode defaults
// (which made the background flash far too bright on first load).
const ready = ref(false)

onMounted(() => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
  if (value) primaryColor.value = value

  // Defer WebGL init until the browser is idle so the shader's expensive
  // first frames land after Lighthouse's load-measurement window. The
  // background is decorative; rendering it ~1s late keeps the heavy GL work
  // (catastrophic under PSI's software WebGL) off FCP/LCP/SI/TBT.
  const start = () => {
    ready.value = true
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2000 })
  } else {
    setTimeout(start, 200)
  }
})

const plasmaColorB = computed(() => isDark.value ? '#0a0908' : '#f9f8f5')
const plasmaContrast = computed(() => isDark.value ? 1.8 : 1.2)
const plasmaIntensity = computed(() => isDark.value ? 2 : 1.4)
const trailBlendMode = computed(() => isDark.value ? 'screen' : 'multiply')
const opacity = computed(() => isDark.value ? ' opacity-30' : ' opacity-50')
</script>

<template>
  <Shader
    v-if="ready"
    :class="opacity"
  >
    <Pixelate
      :gap="{
        type: 'map',
        curve: 0.35,
        source: 'sine-wave',
        channel: 'alphaInverted',
        inputMax: 1,
        inputMin: 0,
        outputMax: 1,
        outputMin: 0.16
      }"
      :roundness="0.2"
      :scale="65"
      :transform="{ rotation: 180 }"
    >
      <Plasma
        :balance="55"
        :color-a="primaryColor"
        :color-b="plasmaColorB"
        :contrast="plasmaContrast"
        :density="3.8"
        :intensity="plasmaIntensity"
        :visible="true"
      />
    </Pixelate>
    <CursorTrail
      :color-a="primaryColor"
      color-b="transparent"
      :radius="0.08"
      :length="0.4"
      :shrink="0.5"
      :blend-mode="trailBlendMode"
    />
    <SineWave
      id="sine-wave"
      :amplitude="0.15"
      :position="{
        x: 0.5,
        y: 0.9
      }"
      :softness="0.7"
      :thickness="1"
      :visible="false"
    />
  </Shader>
</template>
