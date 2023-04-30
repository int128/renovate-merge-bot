import { PullsQuery } from './generated/graphql'
import { MergeableState, StatusState } from './generated/graphql-types'

export type PullRequest = {
  owner: string
  repo: string
  number: number
  mergeable: boolean
  automerge: boolean
  createdByRenovate: boolean
  headRef: string
  lastCommitByGitHubToken: boolean
  lastCommitStatus: StatusState | undefined
  lastCommitSha: string
  lastCommitTreeSha: string
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
      mergeable: pull.mergeable === MergeableState.Mergeable,
      automerge: pull.bodyText.includes('Automerge: Enabled'),
      createdByRenovate: pull.author?.login === 'renovate',
      headRef: pull.headRef.name,
      lastCommitByGitHubToken: pull.headRef.target.author?.user?.login === 'github-actions[bot]',
      lastCommitStatus: pull.headRef.target.statusCheckRollup?.state,
      lastCommitSha: pull.headRef.target.oid,
      lastCommitTreeSha: pull.headRef.target.tree.oid,
    })
  }
  return parsed
}
