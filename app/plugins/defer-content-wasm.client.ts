// Defer @nuxt/content's SQLite WASM database loading until after hydration.
// This prevents the 396KB WASM from blocking initial paint on the prerendered page.
// After hydration completes, WebAssembly is restored so SPA navigation queries work.

const _WA = window.WebAssembly

export default defineNuxtPlugin({
  name: 'defer-content-wasm',
  enforce: 'pre',
  setup(nuxtApp) {
    // Hide WebAssembly during initial hydration
    // @ts-expect-error intentionally deferring WebAssembly
    window.WebAssembly = undefined

    // Restore after hydration so client-side navigation queries use WASM
    nuxtApp.hook('app:suspense:resolve', () => {
      window.WebAssembly = _WA
    })
  }
})
