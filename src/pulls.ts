import { PullsQuery } from './generated/graphql'
import { MergeableState, PullRequestMergeMethod, StatusState } from './generated/graphql-types'

export type PullRequest = {
  owner: string
  repo: string
  id: string
  number: number
  defaultMergeMethod: PullRequestMergeMethod
  mergeable: boolean
  automerge: boolean
  createdByRenovate: boolean
  headRef: string
  lastCommitTime: Date
  lastCommitByGitHubToken: boolean
  lastCommitStatus: StatusState | undefined
  lastCommitSha: string
  lastCommitTreeSha: string
}

export type PullRequestAction = 'TRIGGER_WORKFLOW' | 'AUTOMERGE' | 'LEAVE'

export const determinePullRequestAction = (pull: PullRequest, now: Date = new Date()): PullRequestAction => {
  if (!pull.createdByRenovate) {
    return 'LEAVE'
  }
  if (!pull.mergeable) {
    return 'LEAVE'
  }
  if (pull.lastCommitByGitHubToken && pull.lastCommitStatus === undefined) {
    return 'TRIGGER_WORKFLOW'
  }
  const elapsedSec = (now.getTime() - pull.lastCommitTime.getTime()) / 1000
  if (pull.automerge && pull.lastCommitStatus === StatusState.Success && elapsedSec > 3600) {
    return 'AUTOMERGE'
  }
  return 'LEAVE'
}

export const parsePayload = (pulls: PullsQuery): PullRequest[] => {
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
      id: pull.id,
      number: pull.number,
      defaultMergeMethod: pulls.repository.viewerDefaultMergeMethod,
      mergeable: pull.mergeable === MergeableState.Mergeable,
      automerge: pull.bodyText.includes('Automerge: Enabled'),
      createdByRenovate: pull.author?.login === 'renovate',
      headRef: pull.headRef.name,
      lastCommitTime: new Date(pull.headRef.target.committedDate),
      lastCommitByGitHubToken: pull.headRef.target.committer?.user?.login === 'github-actions[bot]',
      lastCommitStatus: pull.headRef.target.statusCheckRollup?.state,
      lastCommitSha: pull.headRef.target.oid,
      lastCommitTreeSha: pull.headRef.target.tree.oid,
    })
  }
  return parsed
}
