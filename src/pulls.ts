import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit } from '@octokit/rest'
import type { ListPullRequestQuery } from './generated/graphql.js'
import { MergeableState, type PullRequestMergeMethod, StatusState } from './generated/graphql-types.js'
import { mergePullRequest } from './queries/mergePullRequest.js'

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
  pull: PullRequest
  execute(octokit: Octokit): Promise<void>
  toString(): string
}

export const determinePullRequestAction = (pull: PullRequest, now: Date = new Date()): PullRequestAction => {
  if (!pull.createdByRenovate) {
    return new LeaveAction(pull)
  }
  if (!pull.mergeable) {
    return new LeaveAction(pull)
  }
  if (pull.lastCommitByGitHubToken) {
    return new AddEmptyCommitAction(pull)
  }
  const elapsedSec = (now.getTime() - pull.lastCommitTime.getTime()) / 1000
  if (pull.automerge && pull.lastCommitStatus === StatusState.Success && elapsedSec > 3600) {
    return new MergeAction(pull)
  }
  return new LeaveAction(pull)
}

export class AddEmptyCommitAction implements PullRequestAction {
  readonly pull: PullRequest
  constructor(pull: PullRequest) {
    this.pull = pull
  }
  toString(): string {
    return `Add an empty commit to trigger GitHub Actions, because the last committer was GITHUB_TOKEN`
  }
  async execute(octokit: Octokit) {
    core.info(`Creating an empty commit on ${this.pull.lastCommitSha}`)
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: this.pull.owner,
      repo: this.pull.repo,
      tree: this.pull.lastCommitTreeSha,
      parents: [this.pull.lastCommitSha],
      message: `Empty commit to trigger GitHub Actions`,
    })
    core.info(`Updating ref ${this.pull.headRef} to the commit ${commit.sha}`)
    await octokit.rest.git.updateRef({
      owner: this.pull.owner,
      repo: this.pull.repo,
      ref: `heads/${this.pull.headRef}`,
      sha: commit.sha,
    })
    core.info(`Updated ref ${this.pull.headRef}`)
  }
}

export class MergeAction implements PullRequestAction {
  readonly pull: PullRequest
  constructor(pull: PullRequest) {
    this.pull = pull
  }
  toString(): string {
    return `Ready to automerge`
  }
  async execute(octokit: Octokit) {
    core.info(`Merging by method ${this.pull.defaultMergeMethod}`)
    await mergePullRequest(octokit, {
      id: this.pull.id,
      mergeMethod: this.pull.defaultMergeMethod,
    })
  }
}

export class LeaveAction implements PullRequestAction {
  readonly pull: PullRequest
  constructor(pull: PullRequest) {
    this.pull = pull
  }
  toString(): string {
    return `Will be merged by user`
  }
  execute(): Promise<void> {
    return new Promise((r) => r())
  }
}
