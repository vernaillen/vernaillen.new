<script setup lang="ts">
import type { GitHubContributions } from '~/shared/types/github'

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

// Featured project repos to exclude from the OSS grids
const featuredRepos = computed(() =>
  new Set(projects.value?.map(p => p.title.toLowerCase()) ?? [])
)

const { data: github } = await useFetch<GitHubContributions>('/api/github-contributions')

const authoredProjects = computed(() =>
  github.value?.authored?.filter(c => !featuredRepos.value.has(c.repo.split('/').pop()?.toLowerCase() ?? '')) ?? []
)
const contributedProjects = computed(() =>
  github.value?.contributed ?? []
)

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
      <Motion
        v-for="(project, index) in projects"
        :key="project.title"
        :initial="{ opacity: 0, transform: 'translateY(10px)' }"
        :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.2 * index }"
        :in-view-options="{ once: true }"
      >
        <UPageCard
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
              {{ new Date(project.date).getFullYear() }}
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
          <video
            v-if="project.video"
            autoplay
            loop
            muted
            playsinline
            width="640"
            height="192"
            class="object-cover w-full h-48 rounded-lg border border-dusk-200 dark:border-dusk-800/50"
          >
            <source
              :src="project.image.replace('.mp4', '.webm')"
              type="video/webm"
            >
            <source
              :src="project.image"
              type="video/mp4"
            >
          </video>
          <NuxtImg
            v-else
            :src="project.image"
            :alt="project.title"
            width="640"
            height="192"
            loading="lazy"
            class="object-cover w-full h-48 rounded-lg border border-dusk-200 dark:border-dusk-800/50"
          />
        </UPageCard>
      </Motion>
    </UPageSection>

    <UPageSection
      v-if="authoredProjects.length"
      title="Open Source"
      description="Modules, tools, and starters I built and maintain."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Motion
          v-for="(project, index) in authoredProjects"
          :key="project.repo"
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 * index }"
          :in-view-options="{ once: true }"
        >
          <ULink
            :to="project.url"
            target="_blank"
            class="group block h-full rounded-lg border border-(--ui-border) p-4 transition-colors hover:bg-(--ui-bg-elevated)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 text-sm font-medium text-(--ui-text-highlighted)">
                <UIcon
                  name="i-simple-icons-github"
                  class="size-4 shrink-0"
                />
                <span class="truncate">{{ project.repo }}</span>
              </div>
              <div
                v-if="project.stars"
                class="flex shrink-0 items-center gap-1 text-xs text-(--ui-text-dimmed)"
              >
                <UIcon
                  name="i-lucide-star"
                  class="size-3"
                />
                {{ project.stars }}
              </div>
            </div>
            <p class="mt-1 text-sm text-(--ui-text-muted)">
              {{ project.description }}
            </p>
          </ULink>
        </Motion>
      </div>
    </UPageSection>

    <UPageSection
      v-if="contributedProjects.length"
      title="Contributed To"
      description="Pull requests merged into open source projects across the ecosystem."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Motion
          v-for="(contribution, index) in contributedProjects"
          :key="contribution.repo"
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 * index }"
          :in-view-options="{ once: true }"
        >
          <ULink
            :to="contribution.pr || contribution.url"
            target="_blank"
            class="group block h-full rounded-lg border border-(--ui-border) p-4 transition-colors hover:bg-(--ui-bg-elevated)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 text-sm font-medium text-(--ui-text-highlighted)">
                <UIcon
                  name="i-simple-icons-github"
                  class="size-4 shrink-0"
                />
                <span class="truncate">{{ contribution.repo }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-1 text-xs text-(--ui-text-dimmed)">
                <UIcon
                  name="i-lucide-star"
                  class="size-3"
                />
                {{ contribution.stars.toLocaleString() }}
              </div>
            </div>
            <p class="mt-1 text-sm text-(--ui-text-muted)">
              {{ contribution.description }}
            </p>
          </ULink>
        </Motion>
      </div>
    </UPageSection>
  </UPage>
</template>
