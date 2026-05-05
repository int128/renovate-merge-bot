import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'
import { listPullRequest } from './queries/listPullRequest.js'

type Inputs = {
  dryRun: boolean
}

export const run = async (inputs: Inputs, octokit: Octokit): Promise<void> => {
  const actions = []
  const repositories = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, { per_page: 100 })
  for (const repository of repositories) {
    core.info(`Processing the repository ${repository.full_name}`)
    const repositoryActions = await processRepository(repository.owner.login, repository.name, inputs.dryRun, octokit)
    actions.push(...repositoryActions)
  }

  core.summary.addTable([
    [
      { data: 'Pull Request', header: true },
      { data: 'Action', header: true },
    ],
    ...actions.map((action) => [`${action.pull.owner}/${action.pull.repo}#${action.pull.number}`, action.toString()]),
  ])
  await core.summary.write()
}

const processRepository = async (owner: string, repo: string, dryRun: boolean, octokit: Octokit) => {
  core.startGroup(`GraphQL: listPullRequest(${owner}/${repo})`)
  const listPullRequestQuery = await listPullRequest(octokit, { owner, repo })
  core.info(JSON.stringify(listPullRequestQuery, undefined, 2))
  core.endGroup()

  const pulls = parseListPullRequestQuery(listPullRequestQuery)
  const actions = pulls.map((pull) => determinePullRequestAction(pull))
  for (const action of actions) {
    if (dryRun) {
      core.info(`${action.pull.owner}/${action.pull.repo}#${action.pull.number}: ${action.toString()} (dry-run)`)
    } else {
      core.info(`${action.pull.owner}/${action.pull.repo}#${action.pull.number}: ${action.toString()}`)
      await action.execute(octokit)
    }
  }
  return actions
}
