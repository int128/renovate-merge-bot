import { StatusState } from '../src/generated/graphql-types'
import { parsePullsQuery } from '../src/pulls'
import { payload } from './fixtures/pulls'

test('parse payload', () => {
  const parsed = parsePullsQuery(payload)
  expect(parsed).toStrictEqual([
    {
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      automerge: false,
      createdByRenovate: true,
      lastCommitByGitHubToken: true,
      lastCommitStatus: undefined,
      number: 382,
    },
    {
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      automerge: true,
      createdByRenovate: true,
      lastCommitByGitHubToken: true,
      lastCommitStatus: undefined,
      number: 343,
    },
    {
      owner: 'int128',
      repo: 'list-associated-pull-requests-action',
      automerge: false,
      createdByRenovate: false,
      lastCommitByGitHubToken: false,
      lastCommitStatus: StatusState.Success,
      number: 98,
    },
  ])
})
