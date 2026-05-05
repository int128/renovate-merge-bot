import * as core from '@actions/core'
import { getOctokit } from './github.js'
import { run } from './run.js'

try {
  await run(
    {
      dryRun: core.getBooleanInput('dry-run'),
    },
    getOctokit(),
  )
} catch (e) {
  core.setFailed(e instanceof Error ? e : String(e))
  console.error(e)
}
