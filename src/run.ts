import assert from 'assert'
import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { getOctokit } from './github.js'
import { listPullRequest } from './queries/listPullRequest.js'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'

type Inputs = {
  appId: string
  appPrivateKey: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = getOctokit({
    type: 'app',
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
  })
  const { data: authenticated } = await octokit.rest.apps.getAuthenticated()
  assert(authenticated)
  core.info(`Authenticated as ${authenticated.name}`)
  core.summary.addHeading('renovate-merge-bot summary', 2)
  await processInstallations(inputs, octokit)
}

const processInstallations = async (inputs: Inputs, octokit: Octokit) => {
  const installations = await octokit.paginate(octokit.apps.listInstallations, { per_page: 100 })
  for (const installation of installations) {
    core.info(`Processing the installation ${installation.id}`)
    await processInstallation(inputs, installation.id)
  }
}

const processInstallation = async (inputs: Inputs, installationId: number) => {
  const octokit = getOctokit({
    type: 'installation',
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
    installationId,
  })
  const actions = []
  const repositories = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, { per_page: 100 })
  for (const repository of repositories) {
    core.info(`Processing the repository ${repository.owner.login}`)
    const repositoryActions = await processRepository(repository.owner.login, repository.name, inputs.dryRun, octokit)
    actions.push(...repositoryActions)
  }

  core.summary.addHeading(`GitHub App Installation ${installationId}`, 3)
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
