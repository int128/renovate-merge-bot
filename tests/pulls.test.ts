import { StatusState } from '../src/generated/graphql-types'
import { parsePullsQuery } from '../src/pulls'
import { payload } from './fixtures/pulls'

test('parse payload', () => {
  const parsed = parsePullsQuery(payload)
  expect(parsed).toStrictEqual([
    {
      automerge: false,
      createdByRenovate: true,
      headRef: 'renovate/octokit-graphql-schema-14.x',
      lastCommitByGitHubToken: false,
      lastCommitSha: 'f3bfa9cdcd779370164d7756ef889325ffadd938',
      lastCommitStatus: StatusState.Pending,
      lastCommitTreeSha: '400a326555a92be4b755055c4203195eb4fda010',
      mergeable: true,
      number: 382,
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
    },
    {
      automerge: true,
      createdByRenovate: true,
      headRef: 'renovate/octokit-graphql-schema-13.x',
      lastCommitByGitHubToken: true,
      lastCommitSha: 'b0b7c9d1fe30a21662c62f809ce064ffef986120',
      lastCommitStatus: undefined,
      lastCommitTreeSha: '8531bcd12dabf62565228111dc7028f29eddb682',
      mergeable: false,
      number: 343,
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
    },
    {
      automerge: false,
      createdByRenovate: false,
      headRef: 'test-fixture-head',
      lastCommitByGitHubToken: false,
      lastCommitSha: '0f9bbfade221f8b590163c664e27c3839fffd3c8',
      lastCommitStatus: StatusState.Success,
      lastCommitTreeSha: '061bbed3cbd6e76a6ddaf4cdb84e0711b2c658b6',
      mergeable: true,
      number: 98,
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
    },
  ])
})
