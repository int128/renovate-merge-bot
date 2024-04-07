import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { determinePullRequestAction, parseListPullRequestQuery } from './pulls.js'
import { listPullRequest } from './queries/listPullRequest.js'
import { App } from '@octokit/app'

type Inputs = {
  appId: string
  appPrivateKey: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  const app = new App({
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
    Octokit,
  })
  const { data: appAuthenticated } = await app.octokit.rest.apps.getAuthenticated()
  core.info(`Authenticated as ${appAuthenticated.name}`)
  for await (const { octokit, repository } of app.eachRepository.iterator()) {
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
