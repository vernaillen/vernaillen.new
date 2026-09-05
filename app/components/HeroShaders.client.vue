<script setup lang="ts">
import { Shader, Pixelate, Plasma, SineWave, CursorTrail } from 'shaders/vue'

const emit = defineEmits<{ ready: [], unavailable: [] }>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const primaryColor = ref('#baaf4e')

// Gate WebGL init until the theme is settled. With delayed hydration the
// shader mounts after `colorMode` is resolved, so rendering only once mounted
// avoids initialising uniforms against the transient light-mode defaults
// (which made the background flash far too bright on first load).
const ready = ref(false)

// Skip the shader entirely on devices without a hardware GPU. Under software
// WebGL (SwiftShader in PageSpeed's headless Chrome, llvmpipe in VMs) each
// frame costs huge main-thread time, so the continuous render loop racks up
// ~30s of Total Blocking Time. Those devices keep the static poster instead;
// only real GPUs get the animated shader. WEBGL_debug_renderer_info being
// blocked (a privacy default in some browsers) still implies a real context,
// so we assume hardware in that case rather than disabling for everyone.
function hasGpuAcceleration() {
  let gl: WebGLRenderingContext | null = null
  try {
    gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return false
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return true
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  } finally {
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

let idleHandle: number | undefined
let timeoutHandle: ReturnType<typeof setTimeout> | undefined
let disposed = false

function unavailable() {
  ready.value = false
  if (!disposed) emit('unavailable')
}

onBeforeUnmount(() => {
  disposed = true
  if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
})

onMounted(() => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
  if (value) primaryColor.value = value

  if (!hasGpuAcceleration()) return

  // Respect prefers-reduced-motion: keep the static poster and never start the
  // continuous WebGL animation for users who asked for reduced motion.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  // Initial load and return navigation both need time to paint and handle input.
  // Keep the poster until the library reports its actual first rendered frame.
  const start = () => {
    if (disposed) return
    ready.value = true
  }
  if ('requestIdleCallback' in window) {
    idleHandle = window.requestIdleCallback(start, { timeout: 2000 })
  } else {
    timeoutHandle = setTimeout(start, 200)
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
    @ready="!disposed && emit('ready')"
    @unavailable="unavailable"
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
