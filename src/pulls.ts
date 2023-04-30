import { PullsQuery } from './generated/graphql'
import { StatusState } from './generated/graphql-types'

export type PullRequest = {
  owner: string
  repo: string
  number: number
  automerge: boolean
  createdByRenovate: boolean
  lastCommitByGitHubToken: boolean
  lastCommitStatus: StatusState | undefined
}

export const parsePullsQuery = (pulls: PullsQuery): PullRequest[] => {
  if (pulls.repository == null) {
    throw new Error(`pulls.repository === ${String(pulls.repository)}`)
  }
  if (pulls.repository.pullRequests.nodes == null) {
    throw new Error(`pulls.repository.pullRequests.nodes === ${String(pulls.repository.pullRequests.nodes)}`)
  }

  const parsed: PullRequest[] = []
  for (const pull of pulls.repository.pullRequests.nodes) {
    if (pull === null) {
      throw new Error(`pull === ${String(pull)}`)
    }
    if (pull.headRef == null) {
      throw new Error(`pull.headRef === ${String(pull.headRef)}`)
    }
    if (pull.headRef.target?.__typename !== 'Commit') {
      throw new Error(`pull.headRef.target.__typename === ${String(pull.headRef.target?.__typename)}`)
    }
    parsed.push({
      owner: pulls.repository.owner.login,
      repo: pulls.repository.name,
      number: pull.number,
      automerge: pull.bodyText.includes('Automerge: Enabled'),
      createdByRenovate: pull.author?.login === 'renovate',
      lastCommitByGitHubToken: pull.headRef.target.author?.user?.login === 'github-actions[bot]',
      lastCommitStatus: pull.headRef.target.statusCheckRollup?.state,
    })
  }
  return parsed
}
