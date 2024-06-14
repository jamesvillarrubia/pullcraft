import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { prompt } from './prompt';
import { cosmiconfigSync } from 'cosmiconfig';
import OpenAI from 'openai';
import { openUrl } from './openWrapper'; // Import the openUrl function
import { ChildProcess } from 'child_process';
import { execSync } from 'child_process';
import { GitHubClient, OctokitClient, GhClient } from './githubClient';

const defaultExclusions = [
    ":(exclude)**/package-lock.json",
    ":(exclude)**/pnpm-lock.yaml",
    ":(exclude)**/yarn.lock",
    ":(exclude)**/*.jpg",
    ":(exclude)**/*.jpeg",
    ":(exclude)**/*.png",
    ":(exclude)**/*.gif",
    ":(exclude)**/*.bmp",
    ":(exclude)**/*.tiff",
    ":(exclude)**/*.svg",
    ":(exclude)**/*.pdf"
];


export class PrBot {
    openaiApiKey: string;
    githubToken: string;
    gitHubClient: GitHubClient;
    exclusions: string[];
    openai: any;
    git: any;

    constructor(openaiApiKey: string, githubToken: string) {
        this.openaiApiKey = openaiApiKey;
        if (!this.openaiApiKey) {
            throw new Error("Error: OPENAI_API_KEY is not set");
        }

        this.githubToken = githubToken;
        if (!this.githubToken) {
            throw new Error("Error: GITHUB_TOKEN is not set");
        }

        this.gitHubClient = this.isGhCliAvailable() ? new GhClient() : new OctokitClient(this.githubToken);

        const explorer = cosmiconfigSync('prbot');
        const config = explorer.search();
        this.exclusions = config?.config?.exclusions || defaultExclusions;
        this.openai = new OpenAI({
            apiKey: this.openaiApiKey
        });
        this.git = simpleGit();
    }

    isGhCliAvailable() {
        try {
            execSync('gh auth status');
            return true;
        } catch {
            return false;
        }
    }

    async openUrl(url: string): Promise<ChildProcess> {
        if (!url) {
            console.error("Error: Please provide a value for the argument.");
            throw new Error("Error: URL is required");
        }
        try {
            return await openUrl(url); // Call the imported function
        } catch (error: any) {
            console.error(`Error opening URL: ${error.message}`);
            throw error;
        }
    }

    async createPr(baseBranch = 'develop', compareBranch?: string) {
        try {
            compareBranch = compareBranch || (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim() as string;
            console.log(`Comparing branches: ${baseBranch} and ${compareBranch}`);

            const body = await this.differ(baseBranch, compareBranch);
            if (!body) {
                console.error("Error: PR body could not be retrieved.");
                return;
            }
            const title = body.split('\n')[0].replace(/^# /, '');

            if (!title) {
                console.error("Error: PR title could not be extracted from the PR body.");
                return;
            }

            const repoInfo = await this.getRepoInfo();
            if (!repoInfo) {
                console.error("Error: Repository information could not be retrieved.");
                return;
            }

            const { owner, repo } = repoInfo;

            const existingPrs = await this.gitHubClient.listPulls({
                owner,
                repo,
                base: baseBranch,
                head: compareBranch});

            if (existingPrs.length > 0) {
                const pull_number = existingPrs[0].number;
                console.log(`Updating existing PR #${pull_number}...`);
                await this.gitHubClient.updatePull({owner, repo, pull_number, title, body});

            } else {
                console.log("Creating a new PR...");
                const response = await this.gitHubClient.createPull({
                    owner,
                    repo,
                    title,
                    body,
                    base: baseBranch,
                    head: compareBranch});
                await this.openUrl(response.url);
            }
        } catch (error: any) {
            console.error(`Error creating PR: ${error.message}`);
        }
    }

    async getRepoInfo() {
        try {
            const repoUrl = await this.git.raw(['config', '--get', 'remote.origin.url']);
            const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)\.git/);
            if (match) {
                return { owner: match[1], repo: match[2] };
            }
        } catch (error: any) {
            console.error(`Failed to get repo info`);
        }
    }

    async getNewFiles(baseBranch: string, compareBranch: string) {
        try {
            const outcome = await this.git.diff(['--diff-filter=A', baseBranch, compareBranch, '--', '.', ...this.exclusions]);
            return outcome;
        } catch (error: any) {
            console.error(`Error getting new files: ${error.message}`);
        }
    }

    async getDiff(baseBranch: string, compareBranch: string) {
        try {
            const outcome = await this.git.diff([baseBranch, compareBranch, '--', '.', ...this.exclusions]);
            return outcome;
        } catch (error: any) {
            console.error(`Error getting diff: ${error.message}`);
        }
    }

    async getFilenames(baseBranch: string, compareBranch: string) {
        try {
            const outcome = await this.git.diff(['--name-only', baseBranch, compareBranch, '--', '.']);
            return outcome;
        } catch (error: any) {
            console.error(`Error getting filenames: ${error.message}`);
        }
    }

    async differ(baseBranch = 'develop', compareBranch: string) {
        try {
            compareBranch = compareBranch || (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();

            const textPrompt = prompt;

            const diff = await this.getDiff(baseBranch, compareBranch);
            const newFiles = await this.getNewFiles(baseBranch, compareBranch);
            const filenames = await this.getFilenames(baseBranch, compareBranch);

            if (!diff && !newFiles) {
                return "No changes found between the specified branches.";
            }

            const finalPrompt = `${textPrompt}${diff}\n\n${newFiles}\n\nFilenames:\n${filenames}`;
            const response = await this.gptCall(finalPrompt);
            return response;
        } catch (error: any) {
            console.error(`Error generating PR body: ${error.message}`);
        }
    }

    async gptCall(prompt: string) {
        try {
            const response = await this.openai.completions.create({
                model: 'gpt-3.5-turbo-instruct',
                prompt: prompt,
                max_tokens: 1500,
                n: 1,
                stop: null,
                temperature: 0.2
            }); 
            console.log(response)
            return response.choices[0].text.trim();
        } catch (error: any) {
            console.error(`Error calling OpenAI API: ${error.message}`);
        }
    }
}

export default PrBot;
