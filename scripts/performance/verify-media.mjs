// Production-build checks with synthetic audio and fake microphone devices.
// Usage: node scripts/performance/verify-media.mjs <puppeteer-core-module-path> [origin]
import assert from 'node:assert/strict'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { default: puppeteer } = await import(pathToFileURL(resolve(process.argv[2])).href)
const origin = process.argv[3] || 'http://127.0.0.1:4173'
const output = '.unlighthouse/performance/items-6-9'
await mkdir(output, { recursive: true })
const fftChunks = []
let rendererChunk
for (const name of await readdir('.output/public/_nuxt')) {
  if (!name.endsWith('.js.map')) continue
  const map = JSON.parse(await readFile(`.output/public/_nuxt/${name}`, 'utf8'))
  if (map.sources.some(source => source.endsWith('FftRenderer.client.vue'))) rendererChunk = name.slice(0, -4)
  if (map.sources.some(source => /@fft-visualizer|FftRenderer/.test(source))) fftChunks.push(name.slice(0, -4))
}
assert.ok(fftChunks.length)
const browser = await puppeteer.launch({
  executablePath: process.env.PERF_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--mute-audio']
})
const results = []
const delay = ms => new Promise(done => setTimeout(done, ms))
async function check(name, run) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const errors = []
  const requests = []
  page.on('pageerror', error => errors.push(String(error)))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  page.on('request', request => requests.push(request.url()))
  await page.setViewport({ width: 1440, height: 900 })
  try {
    const details = await run(page, requests)
    assert.deepEqual(errors, [])
    results.push({ name, status: 'passed', ...details })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ name, status: 'failed', error: String(error), errors })
    await page.screenshot({ path: `${output}/failure-${results.length}.png` }).catch(() => {})
    throw error
  } finally {
    await context.close()
    await writeFile(`${output}/media-verification.json`, JSON.stringify(results, null, 2) + '\n')
  }
}

// A valid, silent WAV is enough to exercise the real HTMLAudio/WebAudio/WASM
// path without depending on the live station or producing audible output.
const wav = Buffer.alloc(44 + 48000 * 10 * 2)
wav.write('RIFF', 0)
wav.writeUInt32LE(wav.length - 8, 4)
wav.write('WAVEfmt ', 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(48000, 24)
wav.writeUInt32LE(96000, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write('data', 36)
wav.writeUInt32LE(wav.length - 44, 40)

try {
  await check('SSR poster, static contribution cards, and idle resource gates', async (page, requests) => {
    await page.setJavaScriptEnabled(false)
    await page.goto(`${origin}/projects`)
    const poster = await page.$eval('img[src*="fft-visualizer-hero"]', img => ({ loading: img.loading, priority: img.fetchPriority, width: img.naturalWidth }))
    assert.equal(poster.loading, 'eager')
    assert.equal(poster.priority, 'high')
    assert.ok(poster.width > 0)
    await page.goto(`${origin}/open-source`)
    assert.ok(await page.$$eval('a[href*="github.com/wpnuxt/"]', nodes => nodes.length > 0))
    assert.ok(!(await page.$eval('body', node => node.textContent)).includes('Fetching data from GitHub'))
    await page.setJavaScriptEnabled(true)
    await page.setViewport({ width: 390, height: 844 })
    await page.goto(`${origin}/projects`)
    await page.waitForSelector('button[aria-label^="Switch to"]')
    await delay(1000)
    assert.equal(await page.$$eval('canvas, video', nodes => nodes.length), 0)
    assert.ok(!requests.some(url => fftChunks.some(chunk => url.endsWith(chunk))))
    assert.ok(!requests.some(url => /\.(webm|mp4)(\?|$)/.test(url)))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390)
    return { poster, idleFftDownloads: 0, idleVideoDownloads: 0 }
  })

  await check('Video visibility and live reduced-motion preference', async (page, requests) => {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(`${origin}/projects`)
    await page.waitForSelector('button[aria-label^="Switch to"]')
    await page.$eval('img[src*="audiomotion-analyzer-poster"]', img => img.scrollIntoView({ block: 'center' }))
    await delay(400)
    assert.ok(!requests.some(url => /\.(webm|mp4)(\?|$)/.test(url)))
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
    await page.waitForFunction(() => document.querySelector('video')?.paused === false)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForFunction(() => document.querySelector('video')?.paused === true)
    await page.$eval('video', video => video.scrollIntoView({ block: 'center' }))
    await page.waitForFunction(() => document.querySelector('video')?.paused === false)
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.waitForFunction(() => document.querySelector('video')?.paused === true)
    return { reducedMotionDownloadGate: true, pauseResume: true }
  })

  await check('First-click radio, source switching, failure/retry and cleanup', async (page) => {
    let failRadio = false
    let failRenderer = true
    await page.setRequestInterception(true)
    page.on('request', async (request) => {
      if (failRenderer && request.url().endsWith(rendererChunk)) {
        failRenderer = false
        await request.abort('failed')
      } else if (/\/api\/radio|radio\.vernaillen\.dev/.test(request.url())) {
        if (failRadio) await request.abort('failed')
        else await request.respond({ status: 200, contentType: 'audio/wav', headers: { 'Access-Control-Allow-Origin': '*' }, body: wav })
      } else await request.continue()
    })
    await page.evaluateOnNewDocument(() => {
      window.__audioContexts = []
      window.__micTracks = []
      window.__micGestures = []
      const Context = window.AudioContext
      window.AudioContext = class extends Context {
        constructor(...args) {
          super(...args)
          window.__audioContexts.push(this)
        }
      }
      // A synthetic MediaStream exercises the app's mic path without asking
      // the OS for a device or recording any real microphone input.
      navigator.mediaDevices.getUserMedia = async () => {
        window.__micGestures.push(navigator.userActivation.isActive)
        const fixture = new Context()
        const stream = fixture.createMediaStreamDestination().stream
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track)
          track.stop = () => {
            stop()
            void fixture.close()
          }
        }
        window.__micTracks.push(...stream.getTracks())
        if (window.__holdMic) await new Promise((release) => {
          window.__releaseMic = release
        })
        return stream
      }
    })
    await page.goto(`${origin}/projects`)
    await page.waitForSelector('button[aria-label^="Switch to"]')
    await (await page.$('::-p-text(Play radio)')).click()
    await page.waitForFunction(() => document.body.textContent.includes('Visualizer could not load'))
    await page.waitForFunction(() => window.__audioContexts.every(ctx => ctx.state === 'closed'))
    await Promise.all([
      page.waitForNavigation(),
      page.$('::-p-text(Reload demo)').then(button => button.click())
    ])
    await page.waitForSelector('button[aria-label^="Switch to"]')
    await (await page.$('::-p-text(Play radio)')).click()
    await page.waitForSelector('canvas')
    await (await page.$('::-p-text(Microphone)')).click()
    await page.waitForFunction(() => document.body.textContent.includes('Live from your microphone'))
    assert.ok(await page.evaluate(() => window.__micGestures.every(Boolean)))
    assert.equal(await page.evaluate(() => window.__audioContexts.filter(ctx => ctx.state !== 'closed').length), 1)
    await (await page.$('::-p-text(Stop)')).click()
    await page.waitForFunction(() => window.__micTracks.every(track => track.readyState === 'ended'))
    failRadio = true
    await (await page.$('::-p-text(Play radio)')).click()
    await page.waitForFunction(() => document.body.textContent.includes('Could not connect to the radio stream.'))
    failRadio = false
    await (await page.$('::-p-text(Play radio)')).click()
    await page.waitForSelector('canvas')
    await page.evaluate(() => {
      window.__holdMic = true
    })
    await (await page.$('::-p-text(Microphone)')).click()
    await page.waitForFunction(() => typeof window.__releaseMic === 'function')
    await page.click('header a[href="/career"]')
    await page.waitForFunction(() => location.pathname === '/career' && window.__audioContexts.every(ctx => ctx.state === 'closed'))
    await page.evaluate(() => window.__releaseMic())
    await page.waitForFunction(() => window.__micTracks.every(track => track.readyState === 'ended'))
    return { rendererRetry: true, pendingMicrophoneCleanup: true, firstClick: true, microphoneGesture: true, retry: true, contextsClosed: true }
  })

  await check('Article hydration, keyboard zoom, focus restoration and one toast region', async (page) => {
    await page.goto(`${origin}/blog/wpnuxt-v2`)
    await page.waitForSelector('button[aria-label^="Switch to"]')
    await delay(500)
    await page.goto(`${origin}/blog/building-a-stronger-personal-brand`)
    await page.waitForSelector('button[aria-label^="Enlarge image:"]')
    const image = await page.$('button[aria-label^="Enlarge image:"]')
    await image.focus()
    await page.keyboard.press('Enter')
    await page.waitForSelector('[role="dialog"]')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'))
    assert.ok(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')?.startsWith('Enlarge image:')))
    assert.equal(await page.$$eval('[aria-label="Notifications (F8)"]', nodes => nodes.length), 1)
    return { hydration: true, keyboardZoom: true, restoredFocus: true, toastRegions: 1 }
  })
} finally {
  await browser.close()
}
