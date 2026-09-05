// Usage: node scripts/performance/profile.mjs <puppeteer-core-module-path> [output-directory]
// This is a synthetic desktop RAF/long-task profile, not presented-frame FPS or INP.
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = process.argv[2]
if (!modulePath) throw new Error('Pass the installed puppeteer-core module path (version 25.10.0 for this baseline).')
const { default: puppeteer } = await import(pathToFileURL(resolve(modulePath)).href)
const output = resolve(process.argv[3] || '.unlighthouse/performance/baseline-2026-09-05')
const recordTrace = process.env.PERF_TRACE !== '0'
const origin = process.env.PERF_ORIGIN || 'https://vernaillen.dev'
await mkdir(output, { recursive: true })
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms))
const browser = await puppeteer.launch({
  executablePath: process.env.PERF_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})

try {
  const browserSession = await browser.target().createCDPSession()
  const gpu = await browserSession.send('SystemInfo.getInfo')
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  const consoleMessages = []
  page.on('console', (message) => {
    if (['warn', 'error'].includes(message.type())) consoleMessages.push(message.text())
  })
  await page.evaluateOnNewDocument(() => {
    const audit = { label: 'home-startup', frames: [], longTasks: [], shifts: [], lcp: [], marks: [] }
    window.__performanceAudit = audit
    let previous = null
    let previousLabel = audit.label
    function frame(time) {
      if (previous !== null && previousLabel === audit.label) audit.frames.push({ label: audit.label, time, gap: time - previous })
      previous = time
      previousLabel = audit.label
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) audit.longTasks.push({ start: entry.startTime, duration: entry.duration })
    }).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) audit.shifts.push({ start: entry.startTime, value: entry.value, recentInput: entry.hadRecentInput })
    }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) audit.lcp.push({ start: entry.startTime, size: entry.size, url: entry.url, element: entry.element?.tagName })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    audit.marks.push({ label: audit.label, time: performance.now() })
  })

  if (recordTrace) await page.tracing.start({
    path: `${output}/desktop-interactions.trace.json`,
    screenshots: true,
    categories: ['devtools.timeline', 'v8.execute', 'blink.user_timing', 'loading', 'cc', 'gpu', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame']
  })
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await delay(8000)
  async function mark(label) {
    await page.evaluate((nextLabel) => {
      window.__performanceAudit.label = nextLabel
      window.__performanceAudit.marks.push({ label: nextLabel, time: performance.now() })
      performance.mark(nextLabel)
    }, label)
  }
  await mark('home-idle')
  await delay(5000)
  await page.screenshot({ path: `${output}/desktop-hero.png` })
  const heroState = await page.evaluate(() => ({
    canvases: [...document.querySelectorAll('canvas')].map(canvas => ({ width: canvas.width, height: canvas.height, rect: canvas.getBoundingClientRect().toJSON() })),
    posterOpacity: document.querySelector('img[src*="hero-poster-dark"]')?.parentElement ? getComputedStyle(document.querySelector('img[src*="hero-poster-dark"]').parentElement).opacity : null,
    shaderResources: performance.getEntriesByType('resource').filter(entry => entry.decodedBodySize > 1000000).map(entry => ({ name: entry.name, bytes: entry.decodedBodySize, transferBytes: entry.transferSize })),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  }))
  await mark('home-scroll')
  for (let index = 0; index < 30; index++) {
    await page.mouse.wheel({ deltaY: 100 })
    await delay(100)
  }
  await mark('home-below-fold-idle')
  await delay(4000)
  await mark('home-scroll-back')
  for (let index = 0; index < 30; index++) {
    await page.mouse.wheel({ deltaY: -100 })
    await delay(100)
  }
  await mark('navigate-projects')
  await page.click('header a[href="/projects"]')
  await page.waitForFunction(() => location.pathname === '/projects')
  await delay(3000)
  await mark('return-home')
  await page.click('header a[href="/"]')
  await page.waitForFunction(() => location.pathname === '/')
  await delay(6000)
  await mark('end')

  const samples = await page.evaluate(() => window.__performanceAudit)
  if (recordTrace) await page.tracing.stop()
  const segments = samples.marks.slice(0, -1).map((mark, index) => {
    const end = samples.marks[index + 1].time
    const gaps = samples.frames.filter(frame => frame.label === mark.label && frame.time >= mark.time && frame.time < end).map(frame => frame.gap).sort((a, b) => a - b)
    const tasks = samples.longTasks.filter(task => task.start >= mark.time && task.start < end)
    const percentile = ratio => gaps[Math.max(0, Math.ceil(gaps.length * ratio) - 1)] ?? null
    return {
      label: mark.label, durationMs: end - mark.time, samples: gaps.length,
      medianRafGapMs: percentile(0.5), p95RafGapMs: percentile(0.95), maxRafGapMs: gaps.at(-1) ?? null,
      rafGapsOver25Ms: gaps.filter(gap => gap > 25).length,
      rafGapsOver50Ms: gaps.filter(gap => gap > 50).length,
      longTaskCount: tasks.length, longTaskTotalMs: tasks.reduce((total, task) => total + task.duration, 0),
      longestTaskMs: Math.max(0, ...tasks.map(task => task.duration))
    }
  })
  const result = {
    recordedAt: new Date().toISOString(), url: origin, browser: await browser.version(),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    throttling: 'none', headless: true, traceEnabled: recordTrace,
    methodology: 'One synthetic run. RAF heartbeat and Long Tasks observer; scripted 100px wheel inputs every ~100ms. Trace recording adds overhead. RAF gaps are not GPU-presented FPS, and this does not measure real-user INP.',
    gpu: gpu.gpu, heroState, errors, consoleMessages, segments
  }
  await writeFile(`${output}/desktop-interactions.json`, JSON.stringify(result, null, 2) + '\n')
  await writeFile(`${output}/desktop-interactions.samples.json`, JSON.stringify(samples) + '\n')
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
} finally {
  await browser.close()
}
