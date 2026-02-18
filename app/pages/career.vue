<script setup lang="ts">
type Event = {
  title: string
  date: string
  location: string
  url?: string
  category: 'Freelance' | 'Employment'
}

const { data: page } = await useAsyncData('career', () => {
  return queryCollection('career').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

useSeoMeta({
  title: page.value?.seo?.title || page.value?.title,
  ogTitle: page.value?.seo?.title || page.value?.title,
  description: page.value?.seo?.description || page.value?.description,
  ogDescription: page.value?.seo?.description || page.value?.description
})

const groupedEvents = computed((): Record<Event['category'], Event[]> => {
  const events = page.value?.events || []
  const grouped: Record<Event['category'], Event[]> = {
    Freelance: [],
    Employment: []
  }
  for (const event of events) {
    if (grouped[event.category]) grouped[event.category].push(event)
  }
  return grouped
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' })
}
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <template #links>
        <UButton
          v-if="page.links"
          v-bind="page.links[0]"
        />
      </template>
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <div
        v-for="(eventsInCategory, category) in groupedEvents"
        :key="category"
        class="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 mb-16 last:mb-0"
      >
        <div class="lg:col-span-1 mb-4 lg:mb-0">
          <h2
            class="lg:sticky lg:top-16 text-xl font-semibold tracking-tight text-highlighted"
          >
            {{ category }}
          </h2>
        </div>

        <div class="lg:col-span-2 space-y-8">
          <div
            v-for="(event, index) in eventsInCategory"
            :key="`${category}-${index}`"
            class="group relative pl-6 border-l border-default"
          >
            <NuxtLink
              v-if="event.url"
              :to="event.url"
              target="_blank"
              class="absolute inset-0"
            />
            <div class="mb-1 text-sm font-medium text-muted">
              <span>{{ event.location }}</span>
              <span
                v-if="event.location && event.date"
                class="mx-1"
              >&middot;</span>
              <span v-if="event.date">{{ formatDate(event.date) }}</span>
            </div>

            <h3 class="text-lg font-semibold text-highlighted">
              {{ event.title }}
            </h3>
          </div>
        </div>
      </div>
    </UPageSection>
  </UPage>
</template>
