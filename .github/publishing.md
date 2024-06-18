# Publishing to NPM and Github

This repository is setup to use github action workflows to auto-publish as a result of merged PRs to the `main` branch.  Other branches will version and update as well to beta and pre-release branches as necessary.

After submitting a PR the following will happen:
1. Tests are run
2. The PR's title is checked against [Conventional Commit]() standards. The PR title must start with `feat|fix|docs|ci|style|refactor|perf|test|chore`.  Of that set, `refactor|style|perf|chore` trigger a patch because they may impact functionality.  This modification is configured in the `package.json`.

After merging a PR the following will happen:
1. Tests are run
2. The type of pull request is checked against [Conventional Commit]() standards.  The PR title must start with `feat|fix|docs|ci|style|refactor|perf|test|chore`.
3. The amended commit is tagged with the verison number.
4. The amended commit is tarballed and published to npm.

Once a month, an update-dependencies check will happen:
1. default branch is checked out
2. npm-check-updates is run to modify the package.json
3. git commit is made
4. git is pushed to defualt branch
5. a pr is created with the appropriate changes