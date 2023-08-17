import assert from 'assert'
import * as core from '@actions/core'
import { ListPullRequestQuery } from './generated/graphql'
import { MergeableState, PullRequestMergeMethod, StatusState } from './generated/graphql-types'
import { mergePullRequest } from './queries/mergePullRequest'
import { Octokit } from '@octokit/rest'

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

export const parseListPullRequestQuery = (pulls: ListPullRequestQuery): PullRequest[] => {
  assert(pulls.repository != null)
  assert(pulls.repository.pullRequests.nodes != null)

  const parsed: PullRequest[] = []
  for (const pull of pulls.repository.pullRequests.nodes) {
    assert(pull != null)
    assert(pull.headRef != null)
    assert(pull.headRef.target != null)
    assert.strictEqual(pull.headRef.target.__typename, 'Commit')

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

export type PullRequestAction = {
  execute(octokit: Octokit, pull: PullRequest): Promise<void>
  toString(): string
}

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

export class AddEmptyCommitAction implements PullRequestAction {
  toString(): string {
    return `Add an empty commit to trigger GitHub Actions, because the last committer was GITHUB_TOKEN`
  }
  async execute(octokit: Octokit, pull: PullRequest) {
    core.info(`Creating an empty commit on ${pull.lastCommitSha}`)
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: pull.owner,
      repo: pull.repo,
      tree: pull.lastCommitTreeSha,
      parents: [pull.lastCommitSha],
      message: `Empty commit to trigger GitHub Actions`,
    })
    core.info(`Updating ref ${pull.headRef} to the commit ${commit.sha}`)
    await octokit.rest.git.updateRef({
      owner: pull.owner,
      repo: pull.repo,
      ref: `heads/${pull.headRef}`,
      sha: commit.sha,
    })
    core.info(`Updated ref ${pull.headRef}`)
  }
}

export class MergeAction implements PullRequestAction {
  toString(): string {
    return `Ready to automerge`
  }
  async execute(octokit: Octokit, pull: PullRequest) {
    core.info(`Merging by method ${pull.defaultMergeMethod}`)
    await mergePullRequest(octokit, {
      id: pull.id,
      mergeMethod: pull.defaultMergeMethod,
    })
  }
}

export class LeaveAction implements PullRequestAction {
  toString(): string {
    return `Will be merged by user`
  }
  execute(): Promise<void> {
    return new Promise((r) => r())
  }
}
