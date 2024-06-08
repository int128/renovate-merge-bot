import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { StrategyOptions, createAppAuth } from '@octokit/auth-app'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'
import { listPullRequest } from './queries/listPullRequest.js'

type Inputs = {
  appId: string
  appPrivateKey: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  const auth: StrategyOptions = {
    type: 'app',
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
  }
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth,
  })
  const { data: authenticated } = await octokit.rest.apps.getAuthenticated()
  core.info(`Authenticated as ${authenticated.name}`)
  const installations = await octokit.paginate(octokit.apps.listInstallations, {
    per_page: 100,
  })
  for (const installation of installations) {
    core.info(`Processing the installation ${installation.id}`)
    await processInstallation(inputs, installation.id)
  }
}

const processInstallation = async (inputs: Inputs, installationId: number) => {
  const auth: StrategyOptions = {
    type: 'installation',
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
    installationId,
  }
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth,
  })
  const repositories = await paginateListReposAccessibleToInstallation(octokit, { per_page: 100 })
  for (const repository of repositories) {
    core.info(`Processing the repository ${repository.owner.login}`)
    await processRepository(octokit, repository.owner.login, repository.name, inputs.dryRun)
  }
}

// https://github.com/octokit/plugin-paginate-rest.js/issues/350
const paginateListReposAccessibleToInstallation = async (
  octokit: Octokit,
  params: Parameters<typeof octokit.rest.apps.listReposAccessibleToInstallation>[0],
) => {
  const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, params)
  return repos as unknown as Awaited<
    ReturnType<typeof octokit.rest.apps.listReposAccessibleToInstallation>
  >['data']['repositories']
}

const processRepository = async (octokit: Octokit, owner: string, repo: string, dryRun: boolean) => {
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
