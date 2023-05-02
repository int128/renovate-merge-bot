# renovate-merge-bot [![ts](https://github.com/int128/renovate-merge-bot/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/renovate-merge-bot/actions/workflows/ts.yaml)

This is an action for auto-merge of Renovate pull requests.

## Purpose

### Problem to solve

Renovate supports the great feature of [automerge](https://docs.renovatebot.com/key-concepts/automerge/),
but we need to consider the following edge cases:

If any commit is added to a pull request, Renovate does not merge it.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/235568740-0d0418a2-f02b-49e1-ac4e-dd6a7aaed73e.png">

If the commit status is unknown, Renovate does not merge it.
For example, some workflow adds a commit using `GITHUB_TOKEN` which does not trigger GitHub Actions.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/235568978-55c50732-ef6c-4e3d-986b-85da8757c941.png">

### How to solve

If the following conditions are satisfied, this action adds an empty commit to trigger GitHub Actions.

- The pull request is open
- The pull request is created by Renovate
- The pull request is mergeable
- The commit status is unknown
- The last committer is `GITHUB_TOKEN`

If the following conditions are satisfied, this action merges it.

- The pull request is open
- The pull request is created by Renovate
- The pull request is mergeable
- The commit status is success
- The last commit was created at least 1 hour ago

## Getting Started

### New GitHub App

Create your GitHub App from [this link](https://github.com/settings/apps/new?webhook_active=false&url=https://github.com/int128/renovate-merge-bot&contents=write&pull_requests=write&workflows=write).
Here are the required permissions:

- Contents: read and write
- Pull Requests: read and write
- Workflows: read and write

Install the GitHub App to your repositories.

### New repository and workflow

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
    - cron: '0 * * * *'

jobs:
  renovate-merge-bot:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: int128/renovate-merge-bot@v0
        with:
          github-app-id: ${{ secrets.BOT_APP_ID }}
          github-app-private-key: ${{ secrets.BOT_APP_PRIVATE_KEY }}
```

### Confirmation

When the workflow runs, this action finds open pull requests from repositories which the GitHub App is installed.
It performs either of the following actions:

- Add an empty commit to trigger GitHub Actions
- Merge the pull request
- Leave (it will be merged by user)

## Specification

### Inputs

| Name | Default | Description
|------|----------|------------
| `github-app-id` | (required) | GitHub App ID
| `github-app-private-key` | (required) | GitHub App private key
| `dry-run` | `false` | Dry-run

### Outputs

None.
