import * as Types from './graphql-types';

export type MergePullRequestMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
  mergeMethod?: Types.InputMaybe<Types.PullRequestMergeMethod>;
}>;


export type MergePullRequestMutation = { __typename?: 'Mutation', mergePullRequest?: { __typename?: 'MergePullRequestPayload', clientMutationId?: string | null } | null };

export type PullsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  repo: Types.Scalars['String']['input'];
}>;


export type PullsQuery = { __typename?: 'Query', repository?: { __typename?: 'Repository', name: string, viewerDefaultMergeMethod: Types.PullRequestMergeMethod, owner: { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string }, pullRequests: { __typename?: 'PullRequestConnection', nodes?: Array<{ __typename?: 'PullRequest', id: string, number: number, mergeable: Types.MergeableState, bodyText: string, author?: { __typename?: 'Bot', login: string } | { __typename?: 'EnterpriseUserAccount', login: string } | { __typename?: 'Mannequin', login: string } | { __typename?: 'Organization', login: string } | { __typename?: 'User', login: string } | null, headRef?: { __typename?: 'Ref', name: string, target?: { __typename: 'Blob' } | { __typename: 'Commit', oid: string, committedDate: string, tree: { __typename?: 'Tree', oid: string }, committer?: { __typename?: 'GitActor', user?: { __typename?: 'User', login: string } | null } | null, statusCheckRollup?: { __typename?: 'StatusCheckRollup', state: Types.StatusState } | null } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null } | null> | null } } | null };
