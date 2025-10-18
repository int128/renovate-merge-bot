import { createAppAuth, type StrategyOptions } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

export const getOctokit = (auth: StrategyOptions) =>
  new Octokit({
    authStrategy: createAppAuth,
    auth,
  })
