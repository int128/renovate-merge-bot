# renovate-merge-bot [![ts](https://github.com/int128/renovate-merge-bot/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/renovate-merge-bot/actions/workflows/ts.yaml)

This is an action for auto-merge of Renovate pull requests.

## Problem to solve

Renovate supports [automerge](https://docs.renovatebot.com/key-concepts/automerge/) feature.

Renovate does not merge if any commit is added to a pull request.

Renovate does not merge if the status is not success.

If the following conditions are satisfied, this action will add an empty commit.

- Pull request is created by Renovate
- Pull request is mergeable
- The CI status is unknown
- The last committer is `GITHUB_TOKEN`

If the following conditions are satisfied, this action will merge it.

- Pull request is created by Renovate
- Pull request is mergeable
- The CI status is success
- The last commit is created before 1 hour ago


## Getting Started

Create a workflow.

```yaml
jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: int128/renovate-merge-bot@v1
        with:
          github-app-id: ${{ secrets.BOT_APP_ID }}
          github-app-private-key: ${{ secrets.BOT_APP_PRIVATE_KEY }}
```

### Inputs

| Name | Default | Description
|------|----------|------------
| `github-app-id` | (required) | GitHub App ID
| `github-app-private-key` | (required) | GitHub App private key

### Outputs

None.
