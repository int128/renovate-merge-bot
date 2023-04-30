import * as core from '@actions/core'
import * as github from '@actions/github'
import { App } from '@octokit/app'

type Inputs = {
  appId: string
  appPrivateKey: string
}

// eslint-disable-next-line @typescript-eslint/require-await
export const run = async (inputs: Inputs): Promise<void> => {
  const app = new App({
    appId: inputs.appId,
    privateKey: inputs.appPrivateKey,
  })
  await app.eachRepository((r) => core.info(`repo ${r.repository.full_name}`))
}
