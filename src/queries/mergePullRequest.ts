import type { Octokit } from '@octokit/rest'
import type { MergePullRequestMutation, MergePullRequestMutationVariables } from '../generated/graphql.js'

const query = /* GraphQL */ `
  mutation mergePullRequest($id: ID!, $mergeMethod: PullRequestMergeMethod) {
    mergePullRequest(input: { pullRequestId: $id, mergeMethod: $mergeMethod }) {
      clientMutationId
    }
  }
`

export const mergePullRequest = async (
  o: Octokit,
  v: MergePullRequestMutationVariables,
): Promise<MergePullRequestMutation> => {
  return await o.graphql<MergePullRequestMutation>(query, v)
}
