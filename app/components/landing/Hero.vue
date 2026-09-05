<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

const { footer, global } = useAppConfig()

defineProps<{
  page: IndexCollectionItem
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Static poster paints the shader's resting frame immediately (SSR'd), then
// the lazy WebGL shader crossfades in on top once it has rendered. On mobile
// the shader never hydrates, so the poster stays as the (zero-GL) background.
const shaderReady = ref(false)

// This check must live outside the heavy async component: delayed hydration
// alone doesn't prevent a download when desktop users request reduced motion.
// The mounted guard keeps the first client render identical to the SSR output.
const mounted = useMounted()
const shaderMedia = useMediaQuery('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
const shaderEnabled = computed(() => mounted.value && shaderMedia.value)
watch(shaderEnabled, () => {
  shaderReady.value = false
}, { flush: 'sync' })
</script>

<template>
  <UPageHero
    :ui="{
      root: 'relative overflow-hidden',
      headline: 'flex items-center justify-center',
      title: 'text-shadow-sm',
      links: 'mt-4 flex-col justify-center items-center'
    }"
  >
    <template #top>
      <div
        class="absolute inset-0"
        :class="shaderReady && shaderEnabled ? 'opacity-0 transition-opacity duration-300 ease-out' : (isDark ? 'opacity-30' : 'opacity-50')"
      >
        <!-- Not UColorModeImage: it forwards one identical set of attrs to both
             variants, and the two posters need opposite loading priorities. The
             dark poster is the LCP element (colorMode defaults to dark), so it is
             preloaded at high priority; the light one is display:none there and
             only needs to load lazily. Kept as WebP on purpose — re-encoding to
             AVIF would add encode latency to the critical path. -->
        <NuxtImg
          src="/images/hero-poster-light.webp"
          alt=""
          aria-hidden="true"
          sizes="sm:100vw lg:1280px"
          loading="lazy"
          class="dark:hidden size-full object-cover object-top"
        />
        <NuxtImg
          src="/images/hero-poster-dark.webp"
          alt=""
          aria-hidden="true"
          sizes="sm:100vw lg:1280px"
          fetchpriority="high"
          :preload="{ fetchPriority: 'high' }"
          class="hidden dark:block size-full object-cover object-top"
        />
      </div>
      <LazyHeroShaders
        v-if="shaderEnabled"
        class="absolute inset-0"
        @ready="shaderReady = shaderEnabled"
        @unavailable="shaderReady = false"
      />
    </template>

    <template #headline>
      <div class="hero-reveal hero-reveal-1">
        <UColorModeAvatar
          class="size-18 ring ring-default ring-offset-3 ring-offset-bg"
          :light="global.picture?.light!"
          :dark="global.picture?.dark!"
          :alt="global.picture?.alt!"
        />
      </div>
    </template>

    <template #title>
      <div class="hero-reveal-title">
        {{ page.title }}<br>
      </div>
      <div class="hero-reveal-title pt-5 text-xl sm:text-2xl lg:text-3xl">
        {{ page.title2 }}
      </div>
    </template>

    <template #description>
      <div class="hero-reveal hero-reveal-3">
        {{ page.description }}
      </div>
    </template>

    <template #links>
      <div class="hero-reveal hero-reveal-4">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton
            v-for="link in page.hero.links"
            :key="link.label"
            v-bind="link"
          />
          <UButton
            v-if="global.available"
            :color="global.available ? 'success' : 'error'"
            variant="ghost"
            class="gap-2"
            :to="global.available ? global.meetingLink : ''"
            :label="global.available ? 'Available for new projects' : 'Not available at the moment'"
          >
            <template #leading>
              <span class="relative flex size-2">
                <span
                  class="absolute inline-flex size-full rounded-full opacity-75"
                  :class="global.available ? 'bg-success animate-ping' : 'bg-error'"
                />
                <span
                  class="relative inline-flex size-2 scale-90 rounded-full"
                  :class="global.available ? 'bg-success' : 'bg-error'"
                />
              </span>
            </template>
          </UButton>
        </div>
      </div>

      <div class="gap-x-4 inline-flex mt-4">
        <div
          v-for="(link, index) of footer?.links"
          :key="index"
          class="hero-reveal"
          :style="{ animationDelay: `${100 + index * 20}ms` }"
        >
          <UButton
            v-bind="{ size: 'md', color: 'neutral', variant: 'ghost', ...link }"
          />
        </div>
      </div>
    </template>
  </UPageHero>
</template>

<style scoped>
/* Transform-only reveal: move in without an opacity fade so above-the-fold
   pixels paint in their near-final state on the first frame. Fading from
   opacity:0 left content invisible early, which delayed Speed Index
   (invisible pixels don't count as visually painted). */
@keyframes hero-reveal {
  from { transform: translateY(8px); }
  to { transform: none; }
}

.hero-reveal,
.hero-reveal-title {
  animation: hero-reveal 0.22s ease-out both;
}
.hero-reveal-1 { animation-delay: 0ms; }
.hero-reveal-title { animation-delay: 40ms; }
.hero-reveal-3 { animation-delay: 60ms; }
.hero-reveal-4 { animation-delay: 80ms; }
</style>
