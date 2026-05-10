import type { GitHubContribution } from '#shared/types/github'

// Repos to hide from the Open Source section (meta repos, profiles, etc.)
const HIDDEN_REPOS = new Set([
  'vernaillen/vernaillen',
  'vernaillen/.github',
  'vernaillen/vernaillen.github.io',
  'vernaillen/renovate-config',
  'vernaillen/woonuxt-wpnuxt-test',
  'vernaillen/vue-typescript-tonejs-test',
  'vernaillen/vernaillen.dev.old',
  'vernaillen/vernaillen-website'
])

const EMPTY: { authored: GitHubContribution[], contributed: GitHubContribution[] } = {
  authored: [],
  contributed: []
}

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  if (!config.githubToken) {
    console.warn('[github-contributions] NUXT_GITHUB_TOKEN is not set — returning empty data.')
    return EMPTY
  }

  try {
    return await fetchGitHubContributions()
  } catch (error) {
    const status = (error as { status?: number })?.status
    const message = (error as Error)?.message ?? String(error)
    if (status === 401) {
      console.warn(
        '[github-contributions] GitHub returned 401 Bad credentials — your NUXT_GITHUB_TOKEN is invalid or expired. Generate a new one at https://github.com/settings/personal-access-tokens/new'
      )
    } else if (status === 403) {
      console.warn(`[github-contributions] GitHub returned 403 (rate-limited or forbidden): ${message}`)
    } else {
      console.warn(`[github-contributions] Failed to fetch GitHub data${status ? ` (HTTP ${status})` : ''}: ${message}`)
    }
    return EMPTY
  }
}, {
  maxAge: 60 * 60 // cache for 1 hour
})

async function fetchGitHubContributions() {
  const octokit = useOctokit()

  const userResponse = await octokit.request('GET /user')
  const username = userResponse.data.login

  // Fetch contributed-to repos (excludes own repos)
  const contributedTo = await octokit.graphql<{
    user: {
      repositoriesContributedTo: {
        nodes: Array<{
          nameWithOwner: string
          description: string | null
          stargazerCount: number
          url: string
        } | null>
      }
    }
  }>(`{
    user(login: "${username}") {
      repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, PULL_REQUEST_REVIEW]) {
        nodes {
          nameWithOwner
          description
          stargazerCount
          url
        }
      }
    }
  }`)

  // Fetch own public repos (non-fork, non-archived)
  const ownRepos = await octokit.graphql<{
    user: {
      repositories: {
        nodes: Array<{
          nameWithOwner: string
          description: string | null
          stargazerCount: number
          url: string
          isFork: boolean
          pushedAt: string
        }>
      }
    }
  }>(`{
    user(login: "${username}") {
      repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC, isFork: false) {
        nodes {
          nameWithOwner
          description
          stargazerCount
          url
          isFork
          pushedAt
        }
      }
    }
  }`)

  // Fetch PRs to external repos
  const { data: prData } = await octokit.request('GET /search/issues', {
    q: `type:pr+author:"${username}"+-user:"${username}"`,
    per_page: 100,
    page: 1
  })

  // Filter: only merged or open PRs
  const filteredPrs = prData.items.filter(pr => pr.pull_request?.merged_at || pr.state === 'open')

  // Build PR map: repo -> best PR (prefer merged, then most recent)
  const prMap = new Map<string, { title: string, url: string, state: string, merged: boolean }>()
  for (const pr of filteredPrs) {
    const [owner, name] = pr.repository_url.split('/').slice(-2)
    const repo = `${owner}/${name}`
    const existing = prMap.get(repo)
    const merged = !!pr.pull_request?.merged_at
    if (!existing || (merged && !existing.merged)) {
      prMap.set(repo, {
        title: pr.title,
        url: pr.html_url,
        state: merged ? 'merged' : 'open',
        merged
      })
    }
  }

  // Build contributed-to list (filter nulls from deleted repos)
  const contributed: GitHubContribution[] = contributedTo.user.repositoriesContributedTo.nodes
    .filter((node): node is NonNullable<typeof node> => node !== null)
    .filter(node => !node.nameWithOwner.startsWith(`${username}/`))
    .map((node) => {
      const pr = prMap.get(node.nameWithOwner)
      return {
        repo: node.nameWithOwner,
        description: pr?.title || node.description || '',
        stars: node.stargazerCount,
        url: node.url,
        pr: pr?.url,
        category: 'contributed' as const
      }
    })
    .sort((a, b) => b.stars - a.stars)

  // Also add repos with PRs that aren't in contributedTo
  const contributedRepos = new Set(contributed.map(c => c.repo))
  for (const [repo, pr] of prMap) {
    if (!contributedRepos.has(repo)) {
      const [owner, name] = repo.split('/')
      try {
        const repoData = await fetchRepo(owner!, name!)
        contributed.push({
          repo,
          description: pr.title,
          stars: repoData.stargazers_count,
          url: `https://github.com/${repo}`,
          pr: pr.url,
          category: 'contributed'
        })
      } catch {
        contributed.push({
          repo,
          description: pr.title,
          stars: 0,
          url: `https://github.com/${repo}`,
          pr: pr.url,
          category: 'contributed'
        })
      }
    }
  }
  contributed.sort((a, b) => b.stars - a.stars)

  // Build authored list (non-fork own repos, excluding hidden, sorted by latest activity)
  const authored: GitHubContribution[] = ownRepos.user.repositories.nodes
    .filter(node => !HIDDEN_REPOS.has(node.nameWithOwner))
    .map(node => ({
      repo: node.nameWithOwner,
      description: node.description || '',
      stars: node.stargazerCount,
      url: node.url,
      pushedAt: node.pushedAt,
      category: 'authored' as const
    }))
    .sort((a, b) => new Date(b.pushedAt!).getTime() - new Date(a.pushedAt!).getTime())

  return {
    authored,
    contributed
  }
}
