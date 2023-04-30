import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { App } from '@octokit/app'
import { queryPulls } from './queries/pulls'
import { PullRequest, parsePullsQuery } from './pulls'
import { StatusState } from './generated/graphql-types'

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
  const pulls = parsePullsQuery(rawPulls)
  for (const pull of pulls) {
    await processPullRequest(octokit, pull)
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
const processPullRequest = async (octokit: Octokit, pull: PullRequest) => {
  if (!pull.createdByRenovate) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: not Renovate`)
    return
  }

  if (pull.lastCommitByGitHubToken && pull.lastCommitStatus === undefined) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: last commit was by GITHUB_TOKEN`)
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: closing`)
    await octokit.rest.pulls.update({
      owner: pull.owner,
      repo: pull.repo,
      pull_number: pull.number,
      state: 'closed',
    })
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: reopening after 3s`)
    await sleep(3000)
    await octokit.rest.pulls.update({
      owner: pull.owner,
      repo: pull.repo,
      pull_number: pull.number,
      state: 'open',
    })
    return
  }

  if (pull.automerge && pull.lastCommitStatus === StatusState.Success) {
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: ready to automerge`)
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: merging`)
    await octokit.rest.pulls.merge({
      owner: pull.owner,
      repo: pull.repo,
      pull_number: pull.number,
    })
    return
  }
}

const sleep = (ms: number) => new Promise((f) => setTimeout(f, ms))
