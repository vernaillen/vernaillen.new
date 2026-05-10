<script setup lang="ts">
import type { GitHubContributions } from '#shared/types/github'

const { data: page } = await useAsyncData('open-source-page', () => {
  return queryCollection('pages').path('/open-source').first()
})
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

const { data: projects } = await useAsyncData('open-source-projects', () => {
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
    />

    <UPageSection
      v-if="authoredProjects.length"
      title="Authored"
      description="Modules, tools, and starters I built and maintain."
      :ui="{
        container: 'pt-0!'
      }"
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
            class="group block h-full rounded-lg border border-default p-4 transition-colors hover:bg-elevated"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                <UIcon
                  name="i-simple-icons-github"
                  class="size-4 shrink-0"
                />
                <span class="truncate">{{ project.repo }}</span>
              </div>
              <div
                v-if="project.stars"
                class="flex shrink-0 items-center gap-1 text-xs text-dimmed"
              >
                <UIcon
                  name="i-lucide-star"
                  class="size-3"
                />
                {{ project.stars }}
              </div>
            </div>
            <p class="mt-1 text-sm text-muted">
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
            class="group block h-full rounded-lg border border-default p-4 transition-colors hover:bg-elevated"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                <UIcon
                  name="i-simple-icons-github"
                  class="size-4 shrink-0"
                />
                <span class="truncate">{{ contribution.repo }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-1 text-xs text-dimmed">
                <UIcon
                  name="i-lucide-star"
                  class="size-3"
                />
                {{ contribution.stars.toLocaleString() }}
              </div>
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ contribution.description }}
            </p>
          </ULink>
        </Motion>
      </div>
    </UPageSection>
  </UPage>
</template>
