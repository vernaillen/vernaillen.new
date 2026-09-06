export default defineNuxtPlugin(() => {
  // Keep Nuxt's built-in hash offset and scroll restoration behavior. Only the
  // hash animation preference varies; an explicit smooth option ignores CSS.
  const router = useRouter()
  watch(usePreferredReducedMotion(), (preference) => {
    Object.assign(router.options, { scrollBehaviorType: preference === 'reduce' ? 'auto' : 'smooth' })
  }, { immediate: true, flush: 'sync' })
})
