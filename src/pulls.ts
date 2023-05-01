import * as core from '@actions/core'
import { PullsQuery } from './generated/graphql'
import { MergeableState, PullRequestMergeMethod, StatusState } from './generated/graphql-types'
import { mergePullRequest } from './queries/merge'
import { GitHub } from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

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

export type PullRequestAction = AddEmptyCommitAction | MergeAction | LeaveAction

export const determinePullRequestAction = (pull: PullRequest, now: Date = new Date()): PullRequestAction => {
  if (!pull.createdByRenovate) {
    return new LeaveAction()
  }
  if (!pull.mergeable) {
    return new LeaveAction()
  }
  if (pull.lastCommitByGitHubToken && pull.lastCommitStatus === undefined) {
    return new AddEmptyCommitAction()
  }
  const elapsedSec = (now.getTime() - pull.lastCommitTime.getTime()) / 1000
  if (pull.automerge && pull.lastCommitStatus === StatusState.Success && elapsedSec > 3600) {
    return new MergeAction()
  }
  return new LeaveAction()
}

export class AddEmptyCommitAction {
  async execute(octokit: Octokit, pull: PullRequest) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: last commit was added by GITHUB_TOKEN`)
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: adding an empty commit to trigger GitHub Actions`)
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: pull.owner,
      repo: pull.repo,
      tree: pull.lastCommitTreeSha,
      parents: [pull.lastCommitSha],
      message: `Empty commit to trigger GitHub Actions`,
    })
    const ref = `heads/${pull.headRef}`
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: updating ref ${ref} to ${commit.sha}`)
    await octokit.rest.git.updateRef({
      owner: pull.owner,
      repo: pull.repo,
      ref,
      sha: commit.sha,
    })
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: updated ref ${ref}`)
  }
}

export class MergeAction {
  async execute(octokit: Octokit, pull: PullRequest) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: ready to automerge`)
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: merging by ${pull.defaultMergeMethod}`)
    return await mergePullRequest(octokit, {
      id: pull.id,
      mergeMethod: pull.defaultMergeMethod,
    })
  }
}

export class LeaveAction {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(_: Octokit, pull: PullRequest) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: should be merged by user`)
  }
}
