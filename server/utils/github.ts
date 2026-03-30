import { Octokit } from 'octokit'

let _octokit: Octokit | undefined

export function useOctokit() {
  if (!_octokit) {
    _octokit = new Octokit({ auth: process.env.NUXT_GITHUB_TOKEN })
  }
  return _octokit
}

type RepoCache = Map<string, { stargazers_count: number, owner: { type: string } }>
const repoCache: RepoCache = new Map()

export async function fetchRepo(owner: string, name: string) {
  const key = `${owner}/${name}`
  if (repoCache.has(key)) {
    return repoCache.get(key)!
  }
  const octokit = useOctokit()
  const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
    owner,
    repo: name
  })
  const repo = { stargazers_count: data.stargazers_count, owner: { type: data.owner.type } }
  repoCache.set(key, repo)
  return repo
}
