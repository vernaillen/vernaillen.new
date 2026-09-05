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

// Prerender into the page payload; static navigation reuses that payload.
const { data: github } = await useFetch<GitHubContributions>('/api/github-contributions.json')

const authoredProjects = computed(() => github.value?.authored ?? [])
const contributedProjects = computed(() => github.value?.contributed ?? [])

const AUTHORED_GROUPS = [
  { owner: 'wpnuxt', title: 'WPNuxt' },
  { owner: 'harmonics-audio', title: 'Harmonics Audio' },
  { owner: 'vernaillen', title: 'Vernaillen' }
]

const authoredGroups = computed(() =>
  AUTHORED_GROUPS
    .map(group => ({
      ...group,
      projects: authoredProjects.value.filter(project => project.repo.startsWith(`${group.owner}/`))
    }))
    .filter(group => group.projects.length)
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
      v-if="!authoredProjects.length && !contributedProjects.length"
      description="Project details are temporarily unavailable. You can browse my repositories on GitHub."
      :links="[{ label: 'Browse GitHub', to: 'https://github.com/vernaillen', target: '_blank' }]"
    />

    <UPageSection
      v-if="authoredProjects.length"
      title="Authored"
      description="Modules, tools, and starters I built and maintain."
      :ui="{
        container: 'pt-0!'
      }"
    >
      <div class="space-y-10">
        <div
          v-for="group in authoredGroups"
          :key="group.owner"
        >
          <h3 class="mb-4 text-base font-semibold text-highlighted">
            {{ group.title }}
          </h3>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScrollReveal
              v-for="project in group.projects"
              :key="project.repo"
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
                    class="flex shrink-0 items-center gap-1 text-xs text-muted"
                  >
                    <UIcon
                      name="i-lucide-star"
                      class="size-3"
                    />
                    {{ project.stars.toLocaleString('en-US') }}
                  </div>
                </div>
                <p class="mt-1 text-sm text-muted">
                  {{ project.description }}
                </p>
              </ULink>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection
      v-if="contributedProjects.length"
      title="Contributed To"
      description="Pull requests merged into open source projects across the ecosystem."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ScrollReveal
          v-for="contribution in contributedProjects"
          :key="contribution.repo"
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
              <div class="flex shrink-0 items-center gap-1 text-xs text-muted">
                <UIcon
                  name="i-lucide-star"
                  class="size-3"
                />
                {{ contribution.stars.toLocaleString('en-US') }}
              </div>
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ contribution.description }}
            </p>
          </ULink>
        </ScrollReveal>
      </div>
    </UPageSection>
  </UPage>
</template>
