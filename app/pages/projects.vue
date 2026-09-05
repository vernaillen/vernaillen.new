<script setup lang="ts">
const { data: page } = await useAsyncData('projects-page', () => {
  return queryCollection('pages').path('/projects').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const { data: projects } = await useAsyncData('projects', () => {
  return queryCollection('projects').all()
})

const { global } = useAppConfig()

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
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.links"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <template #links>
        <div
          v-if="page.links"
          class="flex items-center gap-2"
        >
          <UButton
            :label="page.links[0]?.label"
            :to="global.meetingLink"
            v-bind="page.links[0]"
          />
          <UButton
            :to="`mailto:${global.email}`"
            v-bind="page.links[1]"
          />
        </div>
      </template>
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <ScrollReveal
        v-for="(project, index) in projects"
        :key="project.title"
      >
        <div
          v-if="project.demo === 'fft'"
          class="mb-16"
        >
          <div class="mb-2 flex items-center gap-3">
            <span class="font-mono text-xs text-muted">
              {{ new Date(project.date).getUTCFullYear() }}
            </span>
            <h2 class="text-lg font-semibold text-highlighted">
              {{ project.title }}
            </h2>
          </div>
          <p class="mb-5 max-w-2xl text-muted">
            {{ project.description }}
          </p>
          <FftVisualizerDemo
            poster="/images/projects/fft-visualizer-hero.png"
            eager
          />
          <ULink
            :to="project.url"
            class="group mt-5 inline-flex items-center text-sm text-primary"
          >
            View Project
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
            />
          </ULink>
        </div>
        <UPageCard
          v-else
          :title="project.title"
          :description="project.description"
          :to="project.url"
          orientation="horizontal"
          variant="naked"
          :reverse="index % 2 === 1"
          class="group"
          :ui="{
            wrapper: 'max-sm:order-last'
          }"
        >
          <template #leading>
            <span class="font-mono text-xs text-muted">
              {{ new Date(project.date).getUTCFullYear() }}
            </span>
          </template>
          <template #footer>
            <ULink
              :to="project.url"
              class="text-sm text-primary flex items-center"
            >
              View Project
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
              />
            </ULink>
          </template>
          <ProjectVideo
            v-if="project.video"
            :src="project.image"
            :title="project.title"
            poster="/images/projects/vue-audiomotion-analyzer-poster.png"
          />
          <NuxtImg
            v-else
            :src="project.image"
            :alt="project.title"
            format="avif"
            width="640"
            height="192"
            loading="lazy"
            class="object-cover w-full h-48 rounded-lg border border-dusk-200 dark:border-dusk-800/50"
          />
        </UPageCard>
      </ScrollReveal>
    </UPageSection>
  </UPage>
</template>
