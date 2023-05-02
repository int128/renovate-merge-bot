import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    appId: core.getInput('github-app-id', { required: true }),
    appPrivateKey: core.getInput('github-app-private-key', { required: true }),
    dryRun: core.getBooleanInput('dry-run'),
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
