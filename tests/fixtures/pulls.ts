import type { ListPullRequestQuery } from '../../src/generated/graphql.js'

/*
https://docs.github.com/en/graphql/overview/explorer

{
  "owner": "int128",
  "repo": "list-associated-pull-requests-action"
}
*/
export const payload: ListPullRequestQuery = {
  repository: {
    owner: {
      login: 'int128',
    },
    name: 'list-associated-pull-requests-action',
    pullRequests: {
      nodes: [
        {
          id: 'PR_kwDOG4DTyM5N-piU',
          number: 382,
          headRef: {
            name: 'renovate/octokit-graphql-schema-14.x',
            target: {
              __typename: 'Commit',
              oid: 'f3bfa9cdcd779370164d7756ef889325ffadd938',
              tree: {
                oid: '400a326555a92be4b755055c4203195eb4fda010',
              },
              committer: {
                user: {
                  login: 'renovate[bot]',
                },
              },
            },
          },
        },
        {
          id: 'PR_kwDOG4DTyM5KR8Ys',
          number: 343,
          headRef: {
            name: 'renovate/octokit-graphql-schema-13.x',
            target: {
              __typename: 'Commit',
              oid: 'b0b7c9d1fe30a21662c62f809ce064ffef986120',
              tree: {
                oid: '8531bcd12dabf62565228111dc7028f29eddb682',
              },
              committer: {
                user: {
                  login: 'github-actions[bot]',
                },
              },
            },
          },
        },
      ],
    },
  },
}
