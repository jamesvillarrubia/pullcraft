#!/usr/bin/env node

import PrBot from '../src/index'; // Adjust the path to where your PrBot class is located
import dotenv from 'dotenv';

// Load environment variables from a .env file if it exists
dotenv.config();


import { Command } from 'commander';
const program = new Command();

program
  .version('1.0.0')
  .option('-e, --exclusions <patterns>', 'File exclusion patterns (comma-separated)', (value) => value.split(','))

  .option('-o, --open-pr', 'Open the PR webpage automatically')
  .option('-g, --github-strategy <strategy>', 'GitHub strategy')
  .option('-p, --placeholder-pattern <pattern>', 'Placeholder Pattern')
  .option('-s, --system-prompt <prompt>', 'System Prompt')
  .option('-t, --title-template <title>', 'Title Template')
  .option('-b, --body-template <body>', 'Body Template')

  .option('--api-key <key>', 'OpenAI API Key')
  .option('--url <url>', 'OpenAI URL')
  .option('--model <model>', 'OpenAI Model')
  .option('--max-tokens <tokens>', 'OpenAI Max Tokens')
  .option('--n <n>', 'OpenAI N')
  .option('--stop <stop>', 'OpenAI Stop')
  .option('--temp <temperature>', 'OpenAI Temperature')

  .parse(process.argv);

const options = program.opts();

// Convert to nested option
const nested = {
    exclusions: options.exclusions,
    openPr: options.openPr,
    githubStrategy: options.githubStrategy,
    openai:{
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
}


const prBot = new PrBot(nested);
prBot.createPr().catch((error:any) => {
    console.error(`Error creating PR: ${error.message}`);
    process.exit(1);
});
