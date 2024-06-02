import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'
import { listPullRequest } from './queries/listPullRequest.js'

type Inputs = {
  appId: string
  appPrivateKey: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  const appAuth = createAppAuth({
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
  })
  const octokit = new Octokit({
    authStrategy: appAuth,
  })
  const { data: appAuthenticated } = await octokit.rest.apps.getAuthenticated()
  core.info(`Authenticated as ${appAuthenticated.name}`)
  const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
    per_page: 100,
  })
  core.info(`This app is installed into ${repos.total_count} repositories`)
  for (const repository of repos.repositories) {
    await processRepository(octokit, repository.owner.login, repository.name, inputs.dryRun)
  }
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
