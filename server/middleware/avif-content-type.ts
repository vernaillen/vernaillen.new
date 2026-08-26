// Prerendered AVIF variants keep the source file's extension (.png/.jpg), so
// Nitro's static handler would label them image/png from the extension. It
// respects an already-set Content-Type though, so claim it here first — this
// middleware runs before static serving. @nuxt/image sorts ipx modifiers
// alphabetically, so every AVIF variant path starts with /_ipx/f_avif.
// (routeRules headers can't do this: they apply after the static handler has
// already set the header.)
export default defineEventHandler((event) => {
  if (event.path.startsWith('/_ipx/f_avif')) {
    setResponseHeader(event, 'Content-Type', 'image/avif')
  }
})
