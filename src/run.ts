import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { App } from '@octokit/app'
import { fetchPulls } from './queries/pulls'
import { determinePullRequestAction, parsePayload } from './pulls'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  appId: string
  appPrivateKey: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  const app = new App({
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
    Octokit: GitHub,
  })
  const { data: appAuthenticated } = await app.octokit.rest.apps.getAuthenticated()
  core.info(`Authenticated as ${appAuthenticated.name}`)
  for await (const { octokit, repository } of app.eachRepository.iterator()) {
    await processRepository(octokit, repository.owner.login, repository.name, inputs.dryRun)
  }
}

const processRepository = async (octokit: Octokit, owner: string, repo: string, dryRun: boolean) => {
  const pullsQuery = await fetchPulls(octokit, { owner, repo })
  core.startGroup(`Repository ${owner}/${repo}`)
  core.info(JSON.stringify(pullsQuery, undefined, 2))
  core.endGroup()

  const pulls = parsePayload(pullsQuery)
  for (const pull of pulls) {
    const action = determinePullRequestAction(pull)
    core.info(`Pull Request ${owner}/${repo}#${pull.number}: ${action.toString()}`)
    if (!dryRun) {
      await action.execute(octokit, pull)
    }
  }
}
