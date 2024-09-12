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
    'before:release': [
      'npm run build',
      async () => {
        const fs = require('fs').promises;
        const path = require('path');
        const version = '${version}'; // release-it will replace this

        // Update version in src/version.ts
        const versionPath = path.join(__dirname, 'src', 'version.ts');
        let versionContent = await fs.readFile(versionPath, 'utf8');
        versionContent = versionContent.replace(/VERSION = '.*?'/, `VERSION = '${version}'`);
        await fs.writeFile(versionPath, versionContent);

        // Update version in README.md
        const readmePath = path.join(__dirname, 'README.md');
        let readmeContent = await fs.readFile(readmePath, 'utf8');
        readmeContent = readmeContent.replace(
          /https:\/\/github\.com\/jamesvillarrubia\/pullcraft\/releases\/download\/v[\d.]+\/pullcraft/g,
          `https://github.com/jamesvillarrubia/pullcraft/releases/download/v${version}/pullcraft`
        );
        await fs.writeFile(readmePath, readmeContent);
      },
    ],
    'after:release': 'npm run build', // Rebuild with the new version
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
