import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { ListPullRequestQuery } from './generated/graphql.js'

export type PullRequest = {
  owner: string
  repo: string
  id: string
  number: number
  headRef: string
  lastCommitByGitHubToken: boolean
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
      headRef: pull.headRef.name,
      lastCommitByGitHubToken: pull.headRef.target.committer?.user?.login === 'github-actions[bot]',
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

export const determinePullRequestAction = (pull: PullRequest): PullRequestAction => {
  if (pull.lastCommitByGitHubToken) {
    return new AddEmptyCommitAction(pull)
  }
  return new LeaveAction(pull)
}

export class AddEmptyCommitAction implements PullRequestAction {
  readonly pull: PullRequest
  constructor(pull: PullRequest) {
    this.pull = pull
  }
  toString(): string {
    return `AddEmptyCommit`
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

export class LeaveAction implements PullRequestAction {
  readonly pull: PullRequest
  constructor(pull: PullRequest) {
    this.pull = pull
  }
  toString(): string {
    return `Leave`
  }
  execute(): Promise<void> {
    return new Promise((r) => r())
  }
}
