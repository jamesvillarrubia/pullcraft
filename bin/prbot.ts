#!/usr/bin/env node

import PrBot from '../src/index.js'; // Adjust the path to where your PrBot class is located
import dotenv from 'dotenv';

// Load environment variables from a .env file if it exists
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const githubToken = 'yes'//process.env.GITHUB_TOKEN;
console.log(openaiApiKey, githubToken)
if (!openaiApiKey || !githubToken) {
    console.error("Error: OPENAI_API_KEY and GITHUB_TOKEN must be set in the environment variables.");
    process.exit(1);
}

const prBot = new PrBot(openaiApiKey, githubToken);

const args = process.argv.slice(2);
const baseBranch = args[0] || 'develop';
const compareBranch = args[1];

prBot.createPr(baseBranch, compareBranch).catch((error:any) => {
    console.error(`Error creating PR: ${error.message}`);
    process.exit(1);
});