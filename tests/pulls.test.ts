import { describe, expect, it } from 'vitest'
import {
  AddEmptyCommitAction,
  determinePullRequestAction,
  LeaveAction,
  type PullRequest,
  parseListPullRequestQuery,
} from '../src/pulls.js'
import { payload } from './fixtures/pulls.js'

describe('parseListPullRequestQuery', () => {
  it('parses an actual payload of GitHub GraphQL API', () => {
    expect(parseListPullRequestQuery(payload)).toStrictEqual<PullRequest[]>([
      {
        headRef: 'renovate/octokit-graphql-schema-14.x',
        lastCommitByGitHubToken: false,
        lastCommitSha: 'f3bfa9cdcd779370164d7756ef889325ffadd938',
        lastCommitTreeSha: '400a326555a92be4b755055c4203195eb4fda010',
        id: 'PR_kwDOG4DTyM5N-piU',
        number: 382,
        owner: 'int128',
        repo: 'list-associated-pull-requests-action',
      },
      {
        headRef: 'renovate/octokit-graphql-schema-13.x',
        lastCommitByGitHubToken: true,
        lastCommitSha: 'b0b7c9d1fe30a21662c62f809ce064ffef986120',
        lastCommitTreeSha: '8531bcd12dabf62565228111dc7028f29eddb682',
        id: 'PR_kwDOG4DTyM5KR8Ys',
        number: 343,
        owner: 'int128',
        repo: 'list-associated-pull-requests-action',
      },
    ])
  })
})

describe('determinePullRequestAction', () => {
  it('returns AddEmptyCommitAction when the last commit was by GITHUB_TOKEN', () => {
    const action = determinePullRequestAction({
      headRef: 'renovate/example',
      lastCommitSha: '0123456789012345678901234567890123456789',
      lastCommitTreeSha: '0123456789012345678901234567890123456789',
      id: 'PR_example',
      number: 1,
      owner: 'example',
      repo: 'example',
      lastCommitByGitHubToken: true,
    })
    expect(action).toBeInstanceOf(AddEmptyCommitAction)
  })

  it('returns LeaveAction otherwise', () => {
    const action = determinePullRequestAction({
      headRef: 'renovate/example',
      lastCommitSha: '0123456789012345678901234567890123456789',
      lastCommitTreeSha: '0123456789012345678901234567890123456789',
      id: 'PR_example',
      number: 1,
      owner: 'example',
      repo: 'example',
      lastCommitByGitHubToken: false,
    })
    expect(action).toBeInstanceOf(LeaveAction)
  })
})
