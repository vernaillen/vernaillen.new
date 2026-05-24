<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

const { footer, global } = useAppConfig()

defineProps<{
  page: IndexCollectionItem
}>()
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
      <LazyHeroShaders
        hydrate-on-media-query="(min-width: 1024px)"
        class="absolute inset-0"
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
        {{ page.title }}
      </div>
    </template>

    <template #description>
      <div class="hero-reveal hero-reveal-3">
        {{ page.description }}
      </div>
    </template>

    <template #links>
      <div class="hero-reveal hero-reveal-4">
        <div
          v-if="page.hero.links"
          class="flex items-center gap-2"
        >
          <UButton v-bind="page.hero.links[0]" />
          <UButton
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
/* Transform-only reveal: scale in without an opacity fade so above-the-fold
   pixels paint in their near-final state on the first frame. Fading from
   opacity:0 left content invisible early, which delayed Speed Index
   (invisible pixels don't count as visually painted). */
@keyframes hero-reveal {
  from { transform: scale(1.05); }
  to { transform: scale(1); }
}

.hero-reveal,
.hero-reveal-title {
  animation: hero-reveal 0.25s ease-out both;
}
.hero-reveal-1 { animation-delay: 0ms; }
.hero-reveal-title { animation-delay: 40ms; }
.hero-reveal-3 { animation-delay: 60ms; }
.hero-reveal-4 { animation-delay: 80ms; }
</style>
