<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { FFTVisualizer } from 'vue-fft-visualizer'
import 'vue-fft-visualizer/style.css'
import { createRadioAudio, type RadioAudio, SOMA } from './fftRadio'

const { poster } = defineProps<{
  // Optional still shown before playback starts (e.g. the project image).
  poster?: string
}>()

const BANDS = 80

const data = ref<Uint8Array>(new Uint8Array(BANDS))
const dataLeft = ref<Uint8Array>(new Uint8Array(BANDS))
const dataRight = ref<Uint8Array>(new Uint8Array(BANDS))

const playing = ref(false)
const loading = ref(false)
let radio: RadioAudio | null = null

const nowPlaying = ref('')
let npTimer: ReturnType<typeof setInterval> | null = null

type VizProps = Partial<InstanceType<typeof FFTVisualizer>['$props']>

// Curated looks — each is guaranteed to read well, and together they show the
// component's range. Selecting one only swaps the look via v-bind; it never
// touches the audio (radio playback is driven solely by the Play/Stop button).
const presets: { name: string, props: VizProps }[] = [
  {
    name: 'Radial',
    props: {
      radial: true, radialInnerRadius: 0.35, barSpace: 0.2,
      reflexRatio: 0.65, reflexAlpha: 0.5, glow: 0.9,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      showPeaks: false, smoothing: 0.65
    }
  },
  {
    name: 'Stereo',
    props: {
      stereo: true, barSpace: 0.4, reflexRatio: 0.35, reflexAlpha: 0.5, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      showPeaks: false, smoothing: 0.65
    }
  },
  {
    name: 'Reflected',
    props: {
      gradient: 'aurora', glow: 0.5, barSpace: 0.3,
      reflexRatio: 0.3, reflexAlpha: 0.3, showPeaks: false, smoothing: 0.65
    }
  },
  {
    name: 'LED meter',
    props: {
      ledBars: true, ledShape: 'meter', barSpace: 0.35,
      gradient: [
        { stop: 0, color: '#22dd66' },
        { stop: 0.6, color: '#ffd000' },
        { stop: 1, color: '#ff3344' }
      ]
    }
  },
  {
    name: 'Lumi bars',
    props: {
      lumiBars: true, bands: 40, barSpace: 0.05,
      reflexRatio: 0.35, reflexAlpha: 0.25, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      colorMode: 'bar-level', stereo: true,
      showPeaks: true, peakDecay: 0.99, smoothing: 0.65
    }
  },
  {
    name: 'Lazers',
    props: {
      radial: true, radialInnerRadius: 0, barSpace: 0.35, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      stereo: true, showPeaks: false, smoothing: 0.5, bands: 40
    }
  }
]

const active = ref(0)
const activeProps = computed(() => presets[active.value]!.props)

function feed(mono: Uint8Array, left: Uint8Array, right: Uint8Array) {
  data.value = mono
  dataLeft.value = left
  dataRight.value = right
}

function clearBars() {
  data.value = new Uint8Array(BANDS)
  dataLeft.value = new Uint8Array(BANDS)
  dataRight.value = new Uint8Array(BANDS)
}

async function toggle() {
  if (playing.value) {
    stop()
    return
  }
  loading.value = true
  radio = createRadioAudio(BANDS)
  try {
    await radio.start(feed)
  } catch {
    stop()
    loading.value = false
    return
  }
  loading.value = false
  playing.value = true
  startNowPlaying()
}

function stop() {
  radio?.stop()
  radio = null
  playing.value = false
  stopNowPlaying()
  clearBars()
}

// SomaFM now-playing (CORS-enabled JSON); the newest song is first.
async function refreshNowPlaying() {
  try {
    const res = await fetch(SOMA.songs, { cache: 'no-store' })
    const json = await res.json()
    const s = json?.songs?.[0]
    nowPlaying.value = s ? `${s.artist} — ${s.title}` : ''
  } catch {
    // leave the previous value; attribution still shows the station name
  }
}

function startNowPlaying() {
  refreshNowPlaying()
  npTimer = setInterval(refreshNowPlaying, 20000)
}

function stopNowPlaying() {
  if (npTimer) {
    clearInterval(npTimer)
    npTimer = null
  }
  nowPlaying.value = ''
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="not-prose">
    <div
      class="relative w-full overflow-hidden rounded-xl border border-dusk-200 dark:border-dusk-800/50"
      style="aspect-ratio: 16 / 6; min-height: 220px"
    >
      <ClientOnly>
        <FFTVisualizer
          mode="external"
          :data="data"
          :data-left="dataLeft"
          :data-right="dataRight"
          :bands="BANDS"
          background="#0a0a12"
          :show-stats="false"
          v-bind="activeProps"
        />
        <template #fallback>
          <div class="absolute inset-0 grid place-items-center bg-[#0a0a12] text-sm text-white/50">
            Loading visualizer…
          </div>
        </template>
      </ClientOnly>

      <NuxtImg
        v-if="poster && !playing"
        :src="poster"
        alt=""
        aria-hidden="true"
        loading="lazy"
        class="absolute inset-0 size-full object-contain"
      />

      <button
        v-if="!playing"
        type="button"
        class="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[1px] transition hover:bg-black/25"
        :aria-label="loading ? 'Loading radio' : 'Play live radio'"
        @click="toggle"
      >
        <span class="flex flex-col items-center gap-2 text-white">
          <UIcon
            :name="loading ? 'i-lucide-loader-circle' : 'i-lucide-play'"
            :class="['size-12', loading && 'animate-spin']"
          />
          <span class="text-sm font-medium">
            {{ loading ? 'Connecting…' : 'Play live radio' }}
          </span>
        </span>
      </button>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <UButton
        :icon="playing ? 'i-lucide-square' : (loading ? 'i-lucide-loader-circle' : 'i-lucide-radio')"
        :label="playing ? 'Stop' : (loading ? 'Connecting…' : 'Play radio')"
        :color="playing ? 'neutral' : 'primary'"
        :variant="playing ? 'subtle' : 'solid'"
        :ui="{ leadingIcon: loading && !playing ? 'animate-spin' : '' }"
        @click="toggle"
      />
      <div class="ml-auto flex flex-wrap gap-1.5">
        <UButton
          v-for="(p, i) in presets"
          :key="p.name"
          :label="p.name"
          size="xs"
          :color="i === active ? 'primary' : 'neutral'"
          :variant="i === active ? 'soft' : 'ghost'"
          @click="active = i"
        />
      </div>
    </div>

    <p class="mt-3 text-xs text-muted">
      <span v-if="nowPlaying">♫ {{ nowPlaying }} · </span>
      <ULink
        :to="SOMA.station"
        target="_blank"
        class="text-primary"
      >{{ SOMA.name }}</ULink>
      on
      <ULink
        to="https://somafm.com"
        target="_blank"
        class="text-primary"
      >SomaFM</ULink> ·
      <ULink
        :to="SOMA.support"
        target="_blank"
        class="text-primary"
      >support them</ULink>
    </p>
  </div>
</template>
