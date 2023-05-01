import { GitHub } from '@actions/github/lib/utils'
import { MergePullRequestMutation, MergePullRequestMutationVariables } from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  mutation mergePullRequest($id: ID!, $mergeMethod: PullRequestMergeMethod) {
    mergePullRequest(input: { pullRequestId: $id, mergeMethod: $mergeMethod }) {
      clientMutationId
    }
  }
`

export const mergePullRequest = async (
  o: Octokit,
  v: MergePullRequestMutationVariables
): Promise<MergePullRequestMutation> => {
  return await o.graphql<MergePullRequestMutation>(query, v)
}
