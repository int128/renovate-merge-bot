import * as core from '@actions/core'
import { GitHub } from '@actions/github/lib/utils'
import { App } from '@octokit/app'
import { queryPulls } from './queries/pulls'
import { PullRequest, determinePullRequestAction, parsePayload } from './pulls'
import { mergePullRequest } from './queries/merge'

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
    if (action === 'TRIGGER_WORKFLOW') {
      core.info(`${pull.owner}/${pull.repo}#${pull.number}: last commit was added by GITHUB_TOKEN`)
      core.info(`${pull.owner}/${pull.repo}#${pull.number}: adding an empty commit to trigger GitHub Actions`)
      return await addEmptyCommitToTriggerWorkflow(octokit, pull)
    }
    if (action === 'AUTOMERGE') {
      core.info(`${pull.owner}/${pull.repo}#${pull.number}: ready to automerge`)
      core.info(`${pull.owner}/${pull.repo}#${pull.number}: merging by ${pull.defaultMergeMethod}`)
      return await mergePullRequest(octokit, {
        id: pull.id,
        mergeMethod: pull.defaultMergeMethod,
      })
    }
    core.info(`${pull.owner}/${pull.repo}#${pull.number}: should be merged by user`)
  }
}

const addEmptyCommitToTriggerWorkflow = async (octokit: Octokit, pull: PullRequest) => {
  const { data: commit } = await octokit.rest.git.createCommit({
    owner: pull.owner,
    repo: pull.repo,
    tree: pull.lastCommitTreeSha,
    parents: [pull.lastCommitSha],
    message: `Empty commit to trigger GitHub Actions`,
  })
  const ref = `heads/${pull.headRef}`
  core.info(`${pull.owner}/${pull.repo}#${pull.number}: updating ref ${ref} to ${commit.sha}`)
  await octokit.rest.git.updateRef({
    owner: pull.owner,
    repo: pull.repo,
    ref,
    sha: commit.sha,
  })
  core.info(`${pull.owner}/${pull.repo}#${pull.number}: updated ref ${ref}`)
}
