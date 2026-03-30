export type GitHubContribution = {
  repo: string
  description: string
  stars: number
  url: string
  pr?: string
  category: 'authored' | 'contributed'
  pushedAt?: string
}

export type GitHubContributions = {
  authored: GitHubContribution[]
  contributed: GitHubContribution[]
}
