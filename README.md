# trigger-github-actions-bot [![ts](https://github.com/int128/trigger-github-actions-bot/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/trigger-github-actions-bot/actions/workflows/ts.yaml)

This is an action to trigger GitHub Actions for `GITHUB_TOKEN`.

## Purpose

According to the specification of GitHub Actions, the default token of `GITHUB_TOKEN` does not trigger any workflow.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/235568978-55c50732-ef6c-4e3d-986b-85da8757c941.png">

This action adds an empty commit to trigger GitHub Actions when a pull request satisfies the following conditions:

- The pull request is open
- The last committer is `GITHUB_TOKEN`

## Getting Started

### Create GitHub App

Create your GitHub App from [this link](https://github.com/settings/apps/new?webhook_active=false&url=https://github.com/int128/trigger-github-actions-bot&contents=write).
Here are the required permissions:

- Contents: read and write

Install the GitHub App to your repositories.

### Create repository and workflow

Create a new repository.
Add the following secrets:

- `BOT_APP_ID` = App ID of the GitHub App
- `BOT_APP_PRIVATE_KEY` = Private key of the GitHub App

Create a workflow.

```yaml
name: run

on:
  workflow_dispatch:
  schedule:
    - cron: "0 * * * *"

jobs:
  trigger-github-actions-bot:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: int128/trigger-github-actions-bot@v2
        with:
          github-app-id: ${{ secrets.BOT_APP_ID }}
          github-app-private-key: ${{ secrets.BOT_APP_PRIVATE_KEY }}
```

This action finds open pull requests from repositories which the GitHub App is installed.
It adds an empty commit to trigger GitHub Actions.

## Specification

### Inputs

| Name                     | Default    | Description            |
| ------------------------ | ---------- | ---------------------- |
| `github-app-id`          | (required) | GitHub App ID          |
| `github-app-private-key` | (required) | GitHub App private key |
| `dry-run`                | `false`    | Dry-run                |

### Outputs

None.
