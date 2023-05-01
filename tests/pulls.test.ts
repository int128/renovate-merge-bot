import { PullRequestMergeMethod, StatusState } from '../src/generated/graphql-types'
import { PullRequest, PullRequestAction, determinePullRequestAction, parsePayload } from '../src/pulls'
import { payload } from './fixtures/pulls'

describe('parsePayload', () => {
  test('parse an actual payload of GitHub GraphQL API', () => {
    expect(parsePayload(payload)).toStrictEqual<PullRequest[]>([
      {
        automerge: false,
        createdByRenovate: true,
        headRef: 'renovate/octokit-graphql-schema-14.x',
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitSha: 'f3bfa9cdcd779370164d7756ef889325ffadd938',
        lastCommitStatus: StatusState.Pending,
        lastCommitTreeSha: '400a326555a92be4b755055c4203195eb4fda010',
        mergeable: true,
        id: 'PR_kwDOG4DTyM5N-piU',
        number: 382,
        owner: 'int128',
        repo: 'list-associated-pull-requests-action',
        defaultMergeMethod: PullRequestMergeMethod.Squash,
      },
      {
        automerge: true,
        createdByRenovate: true,
        headRef: 'renovate/octokit-graphql-schema-13.x',
        lastCommitTime: new Date('2023-03-11T23:58:14Z'),
        lastCommitByGitHubToken: true,
        lastCommitSha: 'b0b7c9d1fe30a21662c62f809ce064ffef986120',
        lastCommitStatus: undefined,
        lastCommitTreeSha: '8531bcd12dabf62565228111dc7028f29eddb682',
        mergeable: false,
        id: 'PR_kwDOG4DTyM5KR8Ys',
        number: 343,
        owner: 'int128',
        repo: 'list-associated-pull-requests-action',
        defaultMergeMethod: PullRequestMergeMethod.Squash,
      },
      {
        automerge: false,
        createdByRenovate: false,
        headRef: 'test-fixture-head',
        lastCommitTime: new Date('2022-05-28T23:41:47Z'),
        lastCommitByGitHubToken: false,
        lastCommitSha: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
        lastCommitStatus: StatusState.Success,
        lastCommitTreeSha: '061bbed3cbd6e76a6ddaf4cdb84e0711b2c658b6',
        mergeable: true,
        id: 'PR_kwDOG4DTyM44opIm',
        number: 98,
        owner: 'int128',
        repo: 'list-associated-pull-requests-action',
        defaultMergeMethod: PullRequestMergeMethod.Squash,
      },
    ])
  })
})

describe('determinePullRequestAction', () => {
  const pullFixture = {
    headRef: 'renovate/example',
    lastCommitSha: '0123456789012345678901234567890123456789',
    lastCommitTreeSha: '0123456789012345678901234567890123456789',
    id: 'PR_example',
    number: 1,
    owner: 'example',
    repo: 'example',
    defaultMergeMethod: PullRequestMergeMethod.Squash,
  }
  const now = new Date('2023-04-30T13:00:00Z')

  test('ready to merge', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: true,
        createdByRenovate: true,
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitStatus: StatusState.Success,
        mergeable: true,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('AUTOMERGE')
  })

  test('recent pull request', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: true,
        createdByRenovate: true,
        lastCommitTime: new Date('2023-04-30T12:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitStatus: StatusState.Success,
        mergeable: true,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('LEAVE')
  })

  test('last commit was by GITHUB_TOKEN and workflow was not run', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: true,
        createdByRenovate: true,
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: true,
        lastCommitStatus: undefined,
        mergeable: true,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('TRIGGER_WORKFLOW')
  })

  test('workflow is running', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: true,
        createdByRenovate: true,
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitStatus: StatusState.Pending,
        mergeable: true,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('LEAVE')
  })

  test('conflicting pull request', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: true,
        createdByRenovate: true,
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitStatus: StatusState.Success,
        mergeable: false,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('LEAVE')
  })

  test('user pull request', () => {
    const action = determinePullRequestAction(
      {
        ...pullFixture,
        automerge: false,
        createdByRenovate: false,
        lastCommitTime: new Date('2023-04-30T09:47:00Z'),
        lastCommitByGitHubToken: false,
        lastCommitStatus: StatusState.Success,
        mergeable: true,
      },
      now
    )
    expect(action).toBe<PullRequestAction>('LEAVE')
  })
})
