/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from './graphql-types.js';

export type ListPullRequestQueryVariables = Exact<{
  owner: string;
  repo: string;
}>;


export type ListPullRequestQuery = { repository: { name: string, owner:
      | { login: string }
      | { login: string }
    , pullRequests: { nodes: Array<{ id: string, number: number, headRef: { name: string, target:
            | { __typename: 'Blob' }
            | { __typename: 'Commit', oid: string, tree: { oid: string }, author: { name: string | null } | null }
            | { __typename: 'Tag' }
            | { __typename: 'Tree' }
           | null } | null } | null> | null } } | null };
