<script setup lang="ts">
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

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Vernaillen', {
  title,
  description
})

type CareerEvent = NonNullable<typeof page.value>['events'][number]

const groupedEvents = computed((): Record<CareerEvent['category'], CareerEvent[]> => {
  const grouped: Record<CareerEvent['category'], CareerEvent[]> = {
    'Open Source': [],
    'Freelance': [],
    'Employed': []
  }
  for (const event of page.value?.events || []) {
    grouped[event.category].push(event)
  }
  return grouped
})
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
        class="grid grid-cols-1 lg:grid-cols-3 lg:gap-4 last:mb-0"
      >
        <div class="lg:col-span-1 mb-2 lg:mb-0">
          <h2
            class="lg:sticky lg:top-16 text-xl font-semibold tracking-tight text-highlighted"
          >
            {{ category }}
          </h2>
        </div>

        <div class="lg:col-span-2 space-y-8">
          <ScrollReveal
            v-for="(event, index) in eventsInCategory"
            :key="`${category}-${index}`"
          >
            <div
              class="group relative pl-6 border-l border-default"
            >
              <div class="mb-1 text-sm font-medium text-muted">
                <span>{{ event.location }}</span>
                <span
                  v-if="event.location && event.date"
                  class="mx-1"
                >&middot;</span>
                <span v-if="event.date">{{ event.date }}</span>
              </div>

              <h3 class="text-lg font-semibold text-highlighted">
                {{ event.title }}
              </h3>

              <div
                v-if="event.stack"
                class="mt-2 flex flex-wrap gap-1.5"
              >
                <UBadge
                  v-for="tech in event.stack"
                  :key="tech"
                  :label="tech"
                  size="sm"
                  variant="soft"
                  class="opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
            <div
              v-if="event.links"
              class="mt-2 pl-6"
            >
              <UButton
                v-for="link in event.links"
                :key="link.label"
                v-bind="link"
                color="neutral"
                class="mr-2"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </UPageSection>
  </UPage>
</template>
