import * as Types from './graphql-types.js';

export type ListPullRequestQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  repo: Types.Scalars['String']['input'];
}>;


export type ListPullRequestQuery = { __typename?: 'Query', repository?: { __typename?: 'Repository', name: string, owner:
      | { __typename?: 'Organization', login: string }
      | { __typename?: 'User', login: string }
    , pullRequests: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', id: string, number: number, headRef?: { __typename?: 'Ref', name: string, target?:
            | { __typename: 'Blob' }
            | { __typename: 'Commit', oid: string, tree: { __typename?: 'Tree', oid: string }, committer?: { __typename?: 'GitActor', user?: { __typename?: 'User', login: string } | null } | null }
            | { __typename: 'Tag' }
            | { __typename: 'Tree' }
           | null } | null } | null> | null } } | null };
