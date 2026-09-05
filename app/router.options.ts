import type { RouterOptions } from 'vue-router'

export default <RouterOptions>{
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    const router = useRouter()

    const position = () => {
      if (savedPosition) return savedPosition
      if (to.hash) {
        return {
          el: to.hash,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' as const : 'smooth' as const,
          top: 80
        }
      }
      return { top: 0, left: 0 }
    }

    if (to.path === from.path) {
      if (to.hash || from.hash || savedPosition) return position()
      return false
    }
    if (!from.matched.length) return position()

    // Resolve against the incoming DOM, not the outgoing page's height or IDs.
    // This matters for hashes and back/forward restoration with page transitions.
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:finish', () => {
        requestAnimationFrame(() => {
          resolve(router.currentRoute.value.fullPath === to.fullPath ? position() : false)
        })
      })
    })
  }
}
