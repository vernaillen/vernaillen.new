// Compare identical routes before/after in fresh contexts, then repeat with a warm cache.
// Usage: node scripts/performance/compare-loading.mjs <puppeteer-core-module-path>
import { writeFile, mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { default: puppeteer } = await import(pathToFileURL(resolve(process.argv[2])).href)
const output = '.unlighthouse/performance/items-6-9'
await mkdir(output, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const results = []
try {
  for (let run = 1; run <= 3; run++) {
    for (const origin of run % 2 ? ['http://127.0.0.1:4174', 'http://127.0.0.1:4173'] : ['http://127.0.0.1:4173', 'http://127.0.0.1:4174']) {
      const context = await browser.createBrowserContext()
      const page = await context.newPage()
      await page.setViewport({ width: 390, height: 844 })
      for (const cache of ['cold', 'repeat']) {
        await page.goto(`${origin}/blog/building-a-stronger-personal-brand`, { waitUntil: 'networkidle0' })
        const metrics = await page.evaluate(() => {
          const resources = performance.getEntriesByType('resource')
          const js = resources.filter(resource => /\.js(\?|$)/.test(resource.name))
          return {
            jsRequests: js.length,
            jsTransfer: js.reduce((sum, item) => sum + item.transferSize, 0),
            jsDecoded: js.reduce((sum, item) => sum + item.decodedBodySize, 0),
            documentTransfer: performance.getEntriesByType('navigation')[0].transferSize,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            resources: js.map(item => ({ name: item.name, transfer: item.transferSize, decoded: item.decodedBodySize }))
          }
        })
        results.push({ run, origin, cache, ...metrics })
      }
      await context.close()
    }
  }
  await writeFile(`${output}/loading-comparison.json`, JSON.stringify({ browser: await browser.version(), viewport: '390x844', throttling: 'none', results }, null, 2) + '\n')
  for (const result of results) {
    const summary = { ...result, resources: undefined }
    console.log(summary)
  }
} finally {
  await browser.close()
}
