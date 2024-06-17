# Publishing to NPM and Github


## Introduction
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



## Setup for the first time
First add a `.release-it.js` file with the following content:

```javascript
module.exports = {
  "git":{
    "requireCleanWorkingDir": false,
    "commit": false,
    "pushArgs": ["--tags"]
  },
  "github": {
    "release": true
  },
  "npm": {
    "ignoreVersion": true,
    "publish": true,
    "skipChecks": true
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "whatBump": (commits,options)=>{
          let defaults = {
            build: 'ignore',
            ci: 'ignore',
            docs: 'ignore',
            feat: 'minor',
            fix: 'patch',
            perf: 'patch',
            refactor: 'ignore',
            test: 'ignore'
          }
          let types = (options?.preset?.types || [])
          .reduce((a, v) => {
            return { ...a, [v.type]: v.release}
          }, {}) 

          types = Object.assign({},defaults,types)
          let breakings = 0
          let features = 0
          let levelSet = ['major','minor','patch','ignore']
          let level = Math.min.apply(Math, commits.map(commit => {
            let level = levelSet.indexOf(types[commit.type])
            level = level<0?3:level
            if (commit.notes.length > 0) {
              breakings += commit.notes.length
            }
            if(commit.type === 'feat'){
              features += 1;
            }
            return level
          }))
      
          return {
            level: level,
            reason: breakings === 1
              ? `There is ${breakings} BREAKING CHANGE and ${features} features`
              : `There are ${breakings} BREAKING CHANGES and ${features} features`
          }
      },
      "preset": {
        "name": "angular",
        "types": [
          {
            "type": "refactor",
            "release": "patch"
          },
          {
            "type": "style",
            "release": "patch"
          },
          {
            "type": "perf",
            "release": "patch"
          },
          {
            "type": "chore",
            "release": "patch"
          },
          {
            "type": "ci",
            "release": "patch"
          }
        ]
      }
    }
  }
}
```


NPM Install with these commands:
```shell
npm install --save-dev @release-it/conventional-changelog conventional-changelog-angular release-it 
```


Change the package.json to use this version:
```json
{ 
    "version": "0.0.0-releaseit" 
}
```

Then also add the following scripts:
```json
{   
    "release": "release-it --dry-run --ci --config .release-it.js"
}
```


The library best works when you enable the following github workflows.

```yaml

### pr_title_check.yml 

name: "PR Title Format Check"

on:
  pull_request_target:
    types:
      - opened
      - edited
      - synchronize

jobs:
  main:
    name: Validate PR title
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        id: lint_pr_title
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: marocchino/sticky-pull-request-comment@v2
        # When the previous steps fails, the workflow would stop. By adding this
        # condition you can continue the execution with the populated error message.
        if: always() && (steps.lint_pr_title.outputs.error_message != null)
        with:
          header: pr-title-lint-error
          message: |
            Hey there and thank you for opening this pull request! 👋🏼
            
            We require pull request titles to follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/) and it looks like your proposed title needs to be adjusted.

            Details:
            
            ```
            ${{ steps.lint_pr_title.outputs.error_message }}
            ```

      # Delete a previous comment when the issue has been resolved
      - if: ${{ steps.lint_pr_title.outputs.error_message == null }}
        uses: marocchino/sticky-pull-request-comment@v2
        with:   
          header: pr-title-lint-error
          delete: true
```


```yaml

# publish.yml

name: Publish

on: 
  workflow_dispatch:
  push: 
    branches:
      - main
      - beta
      - alpha

jobs:
  test: 
    name: 'Node.js v${{ matrix.node }}'
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    strategy:
      matrix:
        node:
          - 18
          - 20
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '${{ matrix.node }}'
      - uses: actions/checkout@v4
      - name: 'Cache node_modules'
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-v${{ matrix.node }}-${{ hashFiles('**/package.json') }}
          restore-keys: |
            ${{ runner.os }}-node-v${{ matrix.node }}-
      - name: Install dependencies
        run: npm ci
      - name: Run linters
        run: npm run lint
      - name: Run tests
        run: npm run coverage
  release:
    name: Release
    needs: test
    if: github.ref_name == 'main'
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
      - run: npm ci
      - run: npm run build --if-present
      - run: npx release-it --ci
  prerelease:
    needs: test
    name: PreRelease
    if: github.ref_name != 'main'
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
      - run: npm ci
      - run: npm run build --if-present
      - run: npx release-it --ci --preRelease=${{github.ref_name}}
```


Once your github repo is established, make sure to tag the starting version.
```shell
git tag v0.0.0 $(git rev-list --max-parents=0 HEAD)
git push --tags
```


Next you need to make an npm library 
