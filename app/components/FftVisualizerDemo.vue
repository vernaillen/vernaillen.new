<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { FFTVisualizer } from '@fft-visualizer/vue'
import '@fft-visualizer/vue/style.css'
import { createDemoAudio, type AudioSource, type DemoAudio, SOMA } from './fftRadio'

const { poster } = defineProps<{
  // Optional still shown before playback starts (e.g. the project image).
  poster?: string
}>()

// Only raster stills go through ipx's AVIF transform — a video or vector poster
// would be mangled by it, so those are left untouched.
const posterFormat = computed(() =>
  /\.(mp4|webm|mov|gif|svg)$/i.test(poster ?? '') ? undefined : 'avif'
)

const BANDS = 80

const data = ref<Uint8Array>(new Uint8Array(BANDS))
const dataLeft = ref<Uint8Array>(new Uint8Array(BANDS))
const dataRight = ref<Uint8Array>(new Uint8Array(BANDS))

// The source currently playing, the one being connected, and the last failure.
const source = ref<AudioSource | null>(null)
const pending = ref<AudioSource | null>(null)
const error = ref('')
const playing = computed(() => source.value !== null)
let audio: DemoAudio | null = null

const sources: { id: AudioSource, icon: string, label: string }[] = [
  { id: 'radio', icon: 'i-lucide-radio', label: 'Play radio' },
  { id: 'mic', icon: 'i-lucide-mic', label: 'Microphone' }
]

// One button per source: it starts that source, or stops it when it's the one
// playing. Picking the other source while one plays just switches over.
function sourceButton(s: typeof sources[number]) {
  const isActive = source.value === s.id
  const isPending = pending.value === s.id
  return {
    icon: isActive ? 'i-lucide-square' : (isPending ? 'i-lucide-loader-circle' : s.icon),
    label: isActive ? 'Stop' : (isPending ? 'Connecting…' : s.label),
    color: isActive ? 'neutral' as const : 'primary' as const,
    variant: isActive ? 'subtle' as const : 'solid' as const,
    ui: { leadingIcon: isPending ? 'animate-spin' : '' }
  }
}

const nowPlaying = ref('')
let npTimer: ReturnType<typeof setInterval> | null = null

type VizProps = Partial<InstanceType<typeof FFTVisualizer>['$props']>

// Curated looks — each is guaranteed to read well, and together they show the
// component's range. Selecting one only swaps the look via v-bind; it never
// touches the audio (playback is driven solely by the source buttons).
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

// Bumped by every start and stop, so a source that is still connecting when the
// user clicks again knows it has been superseded and tears itself down instead
// of coming up alongside the newer one.
let runId = 0

async function toggle(next: AudioSource) {
  const wasActive = source.value === next
  stop()
  if (wasActive) return

  const id = runId
  pending.value = next
  const instance = createDemoAudio(next, BANDS)
  try {
    await instance.start(feed)
  } catch {
    instance.stop()
    if (id !== runId) return
    pending.value = null
    error.value = next === 'mic'
      ? 'No microphone — permission denied, or no input device available.'
      : 'Could not connect to the radio stream.'
    return
  }
  if (id !== runId) {
    instance.stop()
    return
  }
  audio = instance
  pending.value = null
  source.value = next
  if (next === 'radio') startNowPlaying()
}

function stop() {
  runId++
  audio?.stop()
  audio = null
  source.value = null
  pending.value = null
  error.value = ''
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
        :format="posterFormat"
        alt=""
        aria-hidden="true"
        loading="lazy"
        class="absolute inset-0 size-full object-contain"
      />

      <div
        v-if="!playing"
        class="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[1px]"
      >
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton
            v-for="s in sources"
            :key="s.id"
            v-bind="sourceButton(s)"
            @click="toggle(s.id)"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <UButton
        v-for="s in sources"
        :key="s.id"
        v-bind="sourceButton(s)"
        @click="toggle(s.id)"
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
      <span
        v-if="error"
        class="text-error"
      >{{ error }}</span>
      <template v-else-if="source === 'mic'">
        ♫ Live from your microphone — analysed in the page, never sent anywhere.
      </template>
      <template v-else>
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
      </template>
    </p>
  </div>
</template>
