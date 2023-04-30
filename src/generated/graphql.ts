import * as Types from './graphql-types';

export type PullsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  repo: Types.Scalars['String'];
}>;


export type PullsQuery = { __typename?: 'Query', repository?: { __typename?: 'Repository', name: string, owner: { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string }, pullRequests: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', number: number, bodyText: string, author?: { __typename?: 'Bot', login: string } | { __typename?: 'EnterpriseUserAccount', login: string } | { __typename?: 'Mannequin', login: string } | { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string } | null, headRef?: { __typename?: 'Ref', name: string, target?: { __typename: 'Blob' } | { __typename: 'Commit', author?: { __typename?: 'GitActor', user?: { __typename?: 'User', login: string } | null } | null, statusCheckRollup?: { __typename?: 'StatusCheckRollup', state: Types.StatusState } | null } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null } | null> | null } } | null };
