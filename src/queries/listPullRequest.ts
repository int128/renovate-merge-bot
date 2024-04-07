import { Octokit } from '@octokit/rest'
import { ListPullRequestQuery, ListPullRequestQueryVariables } from '../generated/graphql.js'

const query = /* GraphQL */ `
  query listPullRequest($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      owner {
        login
      }
      name
      viewerDefaultMergeMethod
      pullRequests(states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }, first: 100) {
        nodes {
          id
          number
          author {
            login
          }
          mergeable
          bodyText
          headRef {
            name
            target {
              __typename
              ... on Commit {
                oid
                tree {
                  oid
                }
                committedDate
                committer {
                  user {
                    login
                  }
                }
                statusCheckRollup {
                  state
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
