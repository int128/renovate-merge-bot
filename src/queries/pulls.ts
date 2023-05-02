import { GitHub } from '@actions/github/lib/utils'
import { PullsQuery, PullsQueryVariables } from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query pulls($owner: String!, $repo: String!) {
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

export const fetchPulls = async (o: Octokit, v: PullsQueryVariables): Promise<PullsQuery> => {
  return await o.graphql<PullsQuery>(query, v)
}
