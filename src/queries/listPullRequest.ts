import type { Octokit } from '@octokit/action'
import type { ListPullRequestQuery, ListPullRequestQueryVariables } from '../generated/graphql.js'

const query = /* GraphQL */ `
  query listPullRequest($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      owner {
        login
      }
      name
      pullRequests(states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }, first: 100) {
        nodes {
          id
          number
          headRef {
            name
            target {
              __typename
              ... on Commit {
                oid
                tree {
                  oid
                }
                author {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

export const listPullRequest = async (o: Octokit, v: ListPullRequestQueryVariables) =>
  await o.graphql<ListPullRequestQuery>(query, v)
