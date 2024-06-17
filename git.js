const simpleGit = require('simple-git');

const EXCLUSIONS_BBBBBBB = [
  ":(exclude)**package-lock.json",
  ':(exclude)**pnpm-lock.yaml',
  ':(exclude)**yarn.lock',
  ':(exclude)**/*.jpg',
  ':(exclude)**/*.jpeg',
  ':(exclude)**/*.png',
  ':(exclude)**/*.gif',
  ':(exclude)**/*.bmp',
  ':(exclude)**/*.tiff',
  ':(exclude)**/*.svg',
  ':(exclude)**/*.pdf'
];

async function runDiff() {
  const git = simpleGit();

  try {
    const diffResult = await git.raw([
      'diff',
      'main',
      'fix/json-escaping',
      '--',
      '.',
      ...EXCLUSIONS_BBBBBBB
    ]);
    console.log(diffResult);
  } catch (error) {
    console.error('Error running git diff:', error);
  }
}

runDiff();
