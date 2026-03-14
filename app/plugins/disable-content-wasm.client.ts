// Prevent @nuxt/content from loading the 396KB SQLite WASM database on the client.
// The site is prerendered — client-side content queries fall back to the API endpoint.
// @nuxt/content checks `window.WebAssembly` to decide between WASM and API fetch.
// Nothing else on this site needs WebAssembly, so we can safely remove it.

export default defineNuxtPlugin({
  name: 'disable-content-wasm',
  enforce: 'pre',
  setup() {
    // @ts-expect-error intentionally disabling WebAssembly
    window.WebAssembly = undefined
  }
})
