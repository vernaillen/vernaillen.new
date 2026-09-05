/**
 * Audio sources for the FFT Visualizer demo: a SomaFM live stream, or the
 * visitor's own microphone.
 *
 * Both analyse the signal with the same Rust/WASM FFT the component uses and
 * hand the result to the visualizer through its external-data API. The radio is
 * genuinely stereo (left / right analysed separately); a mic is treated as mono
 * and fed to both channels.
 *
 * SomaFM is listener-supported — the UI shows attribution + a support link.
 * Autoplay policy and mic permission: start() must be called from a user
 * gesture (a click).
 */
import type { FftProcessor } from '@fft-visualizer/vue/wasm'

export const SOMA = {
  name: 'Groove Salad Classic',
  station: 'https://somafm.com/gsclassic/',
  support: 'https://somafm.com/support/',
  songs: 'https://somafm.com/songs/gsclassic.json'
}

// The stream comes through a proxy (server/api/radio.get.ts): SomaFM 403s the
// `Range: bytes=0-` header every browser sends on a media fetch, so we can't
// point <audio> straight at it — the proxy fetches server-side without a Range
// header and pipes it back, which the browser plays cleanly. Same-origin by
// default (`/api/radio`); NUXT_PUBLIC_RADIO_URL overrides it with the absolute
// URL of a separate API origin for static deploys (see below).
function resolveStreamUrl() {
  return useRuntimeConfig().public.radioUrl || '/api/radio'
}

export type AudioSource = 'radio' | 'mic'

export interface DemoAudio {
  start: (onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) => Promise<void>
  stop: () => void
}

export function createDemoAudio(source: AudioSource, bins: number, fftSize = 2048): DemoAudio {
  let ctx: AudioContext | null = null
  let audioEl: HTMLAudioElement | null = null
  let stream: MediaStream | null = null
  let analyserL: AnalyserNode | null = null
  let analyserR: AnalyserNode | null = null
  let procL: FftProcessor | null = null
  let procR: FftProcessor | null = null
  let bufL: Float32Array<ArrayBuffer> | null = null
  let bufR: Float32Array<ArrayBuffer> | null = null
  let rafId: number | null = null

  function analyse(onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) {
    if (!analyserL || !procL || !bufL) return
    analyserL.getFloatTimeDomainData(bufL)
    const left = new Uint8Array(procL.process(bufL))

    // Mono sources (mic) have no second analyser: the same spectrum drives both
    // channels, so stereo presets render a symmetric mirror.
    let right = left
    let mono = left
    if (analyserR && procR && bufR) {
      analyserR.getFloatTimeDomainData(bufR)
      right = new Uint8Array(procR.process(bufR))
      mono = new Uint8Array(bins)
      for (let i = 0; i < bins; i++) mono[i] = (left[i]! + right[i]!) >> 1
    }

    onData(mono, left, right)
    rafId = requestAnimationFrame(() => analyse(onData))
  }

  function openRadioStream() {
    // Kick the stream off before the WASM import so it can buffer while that
    // loads. A same-origin proxy URL needs no crossOrigin (never tainted); an
    // absolute cross-origin URL (static deploy → separate API origin) must set
    // crossOrigin=anonymous so WebAudio can read the samples — the proxy sends
    // the matching Access-Control-Allow-Origin header.
    const streamUrl = resolveStreamUrl()
    audioEl = new Audio()
    audioEl.preload = 'auto'
    if (/^https?:\/\//.test(streamUrl)) audioEl.crossOrigin = 'anonymous'
    audioEl.src = streamUrl
  }

  async function openMic(own: AudioContext) {
    // No browser DSP in the path: echo cancellation, noise suppression and AGC
    // all reshape the very spectrum this demo exists to show.
    const input = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })
    if (ctx !== own) {
      input.getTracks().forEach(track => track.stop())
      return
    }
    stream = input
  }

  async function start(onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) {
    stop()

    // Everything the autoplay policy cares about is done here, synchronously,
    // while we are still in the task the click created: a browser only lets
    // audio through if the AudioContext is constructed — and the element played
    // — inside that gesture. Awaiting the WASM chunk first pushed both into a
    // later task, so the context came up suspended and the element stayed
    // silent. That is what made it look like play needed two clicks: the
    // second one found the module cached, collapsing the await to a microtask
    // that stays inside the gesture. Load the FFT only once the graph is wired,
    // never before, and await play() alongside it so a rejection surfaces as
    // an error instead of a silent stream.
    const own = new AudioContext()
    ctx = own
    const resumed = own.resume() // Initiate while the click is still active.
    let playback: Promise<void> = Promise.resolve()

    analyserL = own.createAnalyser()
    analyserL.fftSize = fftSize

    if (source === 'radio') {
      openRadioStream()

      const srcNode = own.createMediaElementSource(audioEl!)
      srcNode.connect(own.destination) // audible

      const splitter = own.createChannelSplitter(2)
      srcNode.connect(splitter)
      analyserR = own.createAnalyser()
      analyserR.fftSize = fftSize
      splitter.connect(analyserL, 0)
      splitter.connect(analyserR, 1)

      playback = audioEl!.play()
    } else {
      await openMic(own)
      if (ctx !== own) return

      // Deliberately not connected to ctx.destination: routing a mic back to the
      // speakers is a feedback loop.
      own.createMediaStreamSource(stream!).connect(analyserL)
    }

    // Observe failures immediately, even while the WASM module is loading.
    const [wasm] = await Promise.all([import('@fft-visualizer/vue/wasm'), resumed, playback])
    // The import resolving is not the same as the FFT being usable: the package
    // is bundled with vite-plugin-top-level-await, so `FftProcessor` stays
    // undefined until the WASM instance has initialised, and the plugin hands
    // that out as a separate `__tla` promise on the module. Constructing one
    // before it settles throws, which rejected start() and tore the audio back
    // down. That was the real "click play twice": by the second click the module
    // had finished initialising, so the same code worked.
    await (wasm as { __tla?: Promise<void> }).__tla

    // Superseded while the chunk loaded (a source switch, or a stop): the
    // context we built is already closed, so there is nothing left to drive.
    if (ctx !== own) return

    procL = new wasm.FftProcessor(fftSize, bins, 100, 18000, own.sampleRate)
    bufL = new Float32Array(fftSize)

    if (source === 'radio') {
      procR = new wasm.FftProcessor(fftSize, bins, 100, 18000, own.sampleRate)
      bufR = new Float32Array(fftSize)
    }

    analyse(onData)
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (procL) {
      procL.free()
      procL = null
    }
    if (procR) {
      procR.free()
      procR = null
    }
    if (audioEl) {
      audioEl.pause()
      audioEl.removeAttribute('src')
      audioEl.load()
      audioEl = null
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
    if (ctx) {
      ctx.close()
      ctx = null
    }
    analyserL = null
    analyserR = null
    bufL = null
    bufR = null
  }

  return { start, stop }
}
