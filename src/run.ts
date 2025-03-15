import assert from 'assert'
import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'
import { listPullRequest } from './queries/listPullRequest.js'
import { getOctokit } from './github.js'

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
  const repositories = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, { per_page: 100 })
  for (const repository of repositories) {
    core.info(`Processing the repository ${repository.owner.login}`)
    await processRepository(repository.owner.login, repository.name, inputs.dryRun, octokit)
  }
}

const processRepository = async (owner: string, repo: string, dryRun: boolean, octokit: Octokit) => {
  const listPullRequestQuery = await listPullRequest(octokit, { owner, repo })
  core.startGroup(`ListPullRequestQuery(${owner}/${repo})`)
  core.info(JSON.stringify(listPullRequestQuery, undefined, 2))
  core.endGroup()

  const pulls = parseListPullRequestQuery(listPullRequestQuery)
  for (const pull of pulls) {
    const action = determinePullRequestAction(pull)
    core.info(`Pull Request ${owner}/${repo}#${pull.number}: ${action.toString()}`)
    if (dryRun) {
      core.info(`(dry-run)`)
    } else {
      await action.execute(octokit, pull)
    }
  }
}
