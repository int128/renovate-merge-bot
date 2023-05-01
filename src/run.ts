import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { App } from '@octokit/app'
import { queryPulls } from './queries/pulls'
import { determinePullRequestAction, parsePayload } from './pulls'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  appId: string
  appPrivateKey: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const app = new App({
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
    Octokit: GitHub,
  })
  const { data: appAuthenticated } = await app.octokit.rest.apps.getAuthenticated({})
  core.info(`authenticated as ${appAuthenticated.name}`)
  for await (const { octokit, repository } of app.eachRepository.iterator()) {
    await processRepository(octokit, repository.owner.login, repository.name)
  }
}

const processRepository = async (octokit: Octokit, owner: string, repo: string) => {
  const rawPulls = await queryPulls(octokit, { owner, repo })
  core.startGroup(`Pull Requests in ${owner}/${repo}`)
  core.info(JSON.stringify(rawPulls, undefined, 2))
  core.endGroup()
  const pulls = parsePayload(rawPulls)
  for (const pull of pulls) {
    const action = determinePullRequestAction(pull)
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: ${String(action)}`)
    await action.execute(octokit, pull)
  }
}
