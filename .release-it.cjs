module.exports = {
  "git":{
    "requireCleanWorkingDir": false,
    "commit": true,
    "pushArgs": ["--tags"],
    "commitArgs": ['-a'],
    "commitMessage": 'chore: release v${version} [skip ci]'
  },
  "github": {
    "release": true,
    "assets": ["./build/pullcraft"]
  },
  "npm": {
    "ignoreVersion": true,
    "publish": true,
    "skipChecks": true
  },
  "hooks": {
    "before:release": "./.release-it-version.sh ${version}",
    "after:release": "npm run build"
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
