# Running the Web CI workflow

The `Web CI` workflow verifies the web application by installing dependencies and running:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Automatic runs

The workflow runs automatically when a pull request or push changes any of these paths:

- `apps/web/**`
- `package.json`
- `package-lock.json`
- `.github/workflows/web-ci.yml`

For an assistant such as Claude, the usual path is:

1. Commit changes on a branch.
2. Push the branch to GitHub.
3. Open or update a pull request.
4. GitHub Actions starts `Web CI` automatically if the changed files match the workflow paths.
5. Read the result in the pull request Checks tab or in the repository Actions tab.

## Manual run from the GitHub UI

This repository also supports manual workflow runs through `workflow_dispatch`.

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Select **Web CI**.
4. Click **Run workflow**.
5. Choose the branch to validate.
6. Click **Run workflow** again.

## Manual run from GitHub CLI

If the environment has `gh` authenticated with permission to run workflows, execute:

```sh
gh workflow run web-ci.yml --ref <branch-name>
```

Then watch the result:

```sh
gh run list --workflow web-ci.yml
gh run watch
```

## What Claude can and cannot do

Claude can prepare the workflow file and commit it. Claude can trigger it only if the environment provides authenticated GitHub access, for example a configured `gh` CLI or an integration that can push branches/open pull requests. Without that access, a human must push the branch, open the pull request, or click **Run workflow** in GitHub.
