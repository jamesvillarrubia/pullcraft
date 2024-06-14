#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = __importDefault(require("../src/index.js")); // Adjust the path to where your PrBot class is located
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from a .env file if it exists
dotenv_1.default.config();
const openaiApiKey = process.env.OPENAI_API_KEY;
const githubToken = 'yes'; //process.env.GITHUB_TOKEN;
console.log(openaiApiKey, githubToken);
if (!openaiApiKey || !githubToken) {
    console.error("Error: OPENAI_API_KEY and GITHUB_TOKEN must be set in the environment variables.");
    process.exit(1);
}
const prBot = new index_js_1.default(openaiApiKey, githubToken);
const args = process.argv.slice(2);
const baseBranch = args[0] || 'develop';
const compareBranch = args[1];
prBot.createPr(baseBranch, compareBranch).catch((error) => {
    console.error(`Error creating PR: ${error.message}`);
    process.exit(1);
});
