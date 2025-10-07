#!/usr/bin/env node

import PullCraft from '../index.js'; // Adjust the path to where your PullCraft class is located
import dotenv from 'dotenv';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Read version from package.json
// For npm installs: read from package.json at runtime
// For SEA bundles: VERSION_PLACEHOLDER is replaced at build time by esbuild
let VERSION = '__VERSION_PLACEHOLDER__';

// If running from npm install (not bundled), read version from package.json
if (VERSION === '__VERSION_PLACEHOLDER__') {
  try {
    if (import.meta.url) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const packageJsonPath = join(__dirname, '../../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      VERSION = packageJson.version;
    }
  } catch (error) {
    VERSION = '0.0.0-dev';
  }
}

// Load environment variables from a .env file if it exists
dotenv.config();
const program = new Command();

program
  .version(VERSION)
  .arguments('[baseBranch] [compareBranch]')
  .option('-n, --base-branch <baseBranch>', 'Base branch')
  .option('-c, --compare-branch <compareBranch>', 'Compare branch')
  .option(
    '-e, --exclusions <patterns>',
    'File exclusion patterns (comma-separated)',
    (value) => value.split(',')
  )
  .option('-o, --open-pr', 'Open the PR webpage automatically')
  .option('-g, --github-strategy <strategy>', 'GitHub strategy')
  .option('-p, --placeholder-pattern <pattern>', 'Placeholder Pattern')
  .option('-s, --system-prompt <prompt>', 'System Prompt')
  .option('-t, --title-template <title>', 'Title Template')
  .option('-d, --description-template <body>', 'Description Template')
  .option(
    '-f, --diff-threshold <threshold>',
    'Max number of changed lines in a file, defaults to 1000'
  )
  .option('-h, --hint <hint>', 'Hint for the AI about the type of changes')
  .option('--api-key <key>', 'OpenAI API Key')
  .option('--url <url>', 'OpenAI URL')
  .option('--model <model>', 'OpenAI Model')
  .option('--max-tokens <tokens>', 'OpenAI Max Tokens')
  .option('--n <n>', 'OpenAI N')
  .option('--stop <stop>', 'OpenAI Stop')
  .option('--temp <temperature>', 'OpenAI Temperature')
  .option('--dumpTo <filename>', 'Dump the diff to a file')
  .parse(process.argv);

const options = program.opts();
const baseBranch = program.args[0] || options.baseBranch;
const compareBranch = program.args[1] || options.compareBranch;

// Convert to nested option
const nested = {
  exclusions: options.exclusions,
  openPr: options.openPr,
  githubStrategy: options.githubStrategy,
  diffThreshold: options.diffThreshold,
  dumpTo: options.dumpTo,
  hint: options.hint,
  openai: {
    apiKey: options.apiKey,
    url: options.url,
    model: options.model,
    maxTokens: options.maxTokens,
    n: options.n,
    stop: options.stop,
    temp: options.temp,
    systemPrompt: options.systemPrompt,
    placeholderPattern: options.placeholderPattern,
    titleTemplate: options.titleTemplate,
    bodyTemplate: options.bodyTemplate
  }
};

const pullCraft = new PullCraft(nested);
pullCraft.createPr(baseBranch, compareBranch).catch((error: any) => {
  console.error(`Error creating PR: ${error.message}`);
  process.exit(1);
});
