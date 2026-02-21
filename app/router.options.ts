import type { RouterOptions } from 'vue-router'

export default <RouterOptions>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80
      }
    }

    return { top: 0 }
  }
}
