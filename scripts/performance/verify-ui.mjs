// Exercise production-build behavior in isolated browser contexts, including
// slow/failed GPU initialization and reduced-motion preferences.
// Usage: node scripts/performance/verify-ui.mjs <puppeteer-core-module-path> [origin]
import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const { default: puppeteer } = await import(pathToFileURL(resolve(process.argv[2])).href)
const origin = process.argv[3] || 'http://127.0.0.1:4173'
const output = '.unlighthouse/performance/items-1-5'
await mkdir(output, { recursive: true })
const shaderFiles = []
for (const name of await readdir('.output/public/_nuxt')) {
  if (name.endsWith('.js') && (await readFile(`.output/public/_nuxt/${name}`, 'utf8')).includes('swiftshader')) shaderFiles.push(name)
}
assert.ok(shaderFiles.length, 'Discover the actual shader chunk in this build')
const browser = await puppeteer.launch({
  executablePath: process.env.PERF_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const results = []
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms))
const posterOpacity = page => page.$eval('img[src*="hero-poster-dark"]', image => Number(getComputedStyle(image.parentElement).opacity))

async function scenario(name, run, knownWarnings = []) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const errors = []
  const warnings = []
  const requests = []
  page.on('pageerror', error => errors.push(String(error)))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) warnings.push(`${page.url()}: ${message.text()}`)
  })
  page.on('request', request => requests.push(request.url()))
  await page.setViewport({ width: 1440, height: 900 })
  try {
    const details = await run(page, requests)
    assert.deepEqual(errors, [], 'No page exceptions')
    assert.deepEqual(warnings.filter(warning => !knownWarnings.includes(warning)), [], 'No unexpected hydration warnings')
    results.push({ name, status: 'passed', warnings, ...details })
    console.log(`PASS ${name}${warnings.length ? ' (known warning recorded)' : ''}`)
  } catch (error) {
    results.push({ name, status: 'failed', error: String(error), errors, warnings })
    await page.screenshot({ path: `${output}/failure-${results.length}.png` })
    throw error
  } finally {
    await context.close()
    await writeFile(`${output}/ui-verification.json`, JSON.stringify(results, null, 2) + '\n')
  }
}

try {
  await scenario('Mobile layout and shader download gate', async (page, requests) => {
    const widths = []
    for (const width of [320, 375, 390, 768]) {
      await page.setViewport({ width, height: 844 })
      await page.goto(origin)
      await page.waitForSelector('button[aria-label="Switch to light mode"]')
      await page.evaluate(() => window.scrollTo(0, 1200))
      await delay(350)
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }))
      assert.equal(dimensions.document, dimensions.viewport)
      assert.equal(await page.$$eval('canvas', nodes => nodes.length), 0)
      widths.push(dimensions)
    }
    assert.ok(!requests.some(url => shaderFiles.some(file => url.includes(file))), 'Mobile must not request the shader')
    return { widths }
  })

  await scenario('Reduced motion: no shader, reveal movement, theme wipe or smooth hash scroll', async (page, requests) => {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.evaluateOnNewDocument(() => {
      window.__themeTransitions = 0
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = (...args) => {
        window.__themeTransitions++
        return start(...args)
      }
      window.__scrollCalls = []
      const scroll = window.scrollTo.bind(window)
      window.scrollTo = (...args) => {
        window.__scrollCalls.push(args)
        return scroll(...args)
      }
    })
    await page.goto(origin)
    await page.waitForSelector('button[aria-label="Switch to light mode"]')
    await delay(400)
    assert.ok(!requests.some(url => shaderFiles.some(file => url.includes(file))))
    assert.equal(await page.$$eval('canvas', nodes => nodes.length), 0)
    assert.ok(await page.$$eval('.reveal', nodes => nodes.every(node => getComputedStyle(node).transform === 'none' && getComputedStyle(node).opacity === '1')))
    await page.focus('button[aria-label="Switch to light mode"]')
    await page.keyboard.press('Enter')
    await page.waitForSelector('button[aria-label="Switch to dark mode"]')
    assert.equal(await page.evaluate(() => window.__themeTransitions), 0)
    await page.goto(`${origin}/blog/wpnuxt-v2`)
    const hash = await page.$eval('main a[href^="#"]', link => link.getAttribute('href'))
    await page.click(`main a[href="${hash}"]`)
    await page.waitForFunction(() => window.__scrollCalls.some(args => args[0]?.behavior === 'instant'))
    return { shaderRequests: 0, themeTransitions: 0, hash }
  // The prerendered Shiki <style> is minified; MDC hydrates equivalent, spaced
  // CSS text. Diagnosed separately from motion behavior; see the results report.
  }, [`${origin}/blog/wpnuxt-v2: Hydration completed but contains mismatches.`])

  await scenario('Poster stays visible until real GPU initialization finishes', async (page) => {
    await page.evaluateOnNewDocument(() => {
      const requestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu)
      navigator.gpu.requestAdapter = async (...args) => {
        await new Promise((release) => {
          window.__releaseGpu = release
        })
        return requestAdapter(...args)
      }
    })
    await page.goto(origin)
    await page.waitForFunction(() => typeof window.__releaseGpu === 'function')
    await delay(500)
    assert.ok(await posterOpacity(page) > 0, 'Poster must survive more than two frames of initialization')
    await page.evaluate(() => window.__releaseGpu())
    await page.waitForFunction(() => getComputedStyle(document.querySelector('img[src*="hero-poster-dark"]').parentElement).opacity === '0')
    assert.ok(await page.$$eval('canvas', nodes => nodes.some(node => node.width > 0)))
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.waitForFunction(() => document.querySelectorAll('canvas').length === 0)
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('img[src*="hero-poster-dark"]').parentElement).opacity) > 0)
    return { slowGpuHandoff: 'passed', livePreferenceChange: 'passed' }
  })

  await scenario('GPU unavailable retains the poster', async (page) => {
    await page.evaluateOnNewDocument(() => {
      navigator.gpu.requestAdapter = async () => {
        window.__gpuFailed = true
        return null
      }
    })
    await page.goto(origin)
    await page.waitForFunction(() => window.__gpuFailed)
    await delay(500)
    assert.ok(await posterOpacity(page) > 0)
    assert.equal(await page.$$eval('canvas', nodes => nodes.length), 0)
    return { fallback: 'visible' }
  })

  await scenario('Navigation, header stability, back/forward restoration and keyboard theme toggle', async (page) => {
    await page.goto(origin)
    await page.waitForSelector('button[aria-label="Switch to light mode"]')
    await page.evaluate(() => {
      window.__originalHeader = document.querySelector('header')
    })
    await page.evaluate(() => window.scrollTo(0, 1200))
    await delay(400)
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.click('header a[href="/projects"]')
    await page.waitForFunction(() => location.pathname === '/projects' && window.scrollY === 0)
    assert.ok(await page.evaluate(() => window.__originalHeader === document.querySelector('header')))
    await page.goBack()
    await page.waitForFunction(y => location.pathname === '/' && Math.abs(window.scrollY - y) < 2, {}, scrollBefore)
    await page.goForward()
    await page.waitForFunction(() => location.pathname === '/projects' && window.scrollY === 0)
    await page.focus('button[aria-label="Switch to light mode"]')
    await page.keyboard.press('Enter')
    await page.waitForSelector('button[aria-label="Switch to dark mode"]')
    await delay(450)
    await page.click('header a[href="/"]')
    await page.waitForFunction(() => location.pathname === '/')
    await page.click('header a[href="/career"]')
    await page.waitForFunction(() => location.pathname === '/career')
    await delay(400)
    return { restoredScrollY: scrollBefore, persistentHeader: true, rapidNavigation: 'passed', keyboardTheme: 'passed' }
  })
} finally {
  await browser.close()
}
