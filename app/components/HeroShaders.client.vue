<script setup lang="ts">
import { Shader, Pixelate, Plasma, SineWave, CursorTrail } from 'shaders/vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const primaryColor = ref('#baaf4e')

onMounted(() => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
  if (value) primaryColor.value = value
})

const plasmaColorB = computed(() => isDark.value ? '#0a0908' : '#f9f8f5')
const plasmaContrast = computed(() => isDark.value ? 1.8 : 1.2)
const plasmaIntensity = computed(() => isDark.value ? 2 : 1.4)
const trailBlendMode = computed(() => isDark.value ? 'screen' : 'multiply')
</script>

<template>
  <Shader>
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
