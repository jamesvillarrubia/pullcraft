import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { prompt } from './prompt';
import { cosmiconfigSync } from 'cosmiconfig';
import OpenAI from 'openai';
import { openUrl } from './openWrapper'; // Import the openUrl function
import { ChildProcess } from 'child_process';
import { execSync } from 'child_process';


export class GitHubClient {
    async listPulls({owner,repo,base,head}:{owner: string, repo: string, base: string, head: string}): Promise<any>  {
        throw new Error("Not implemented");
    }

    async updatePull({owner, repo, pull_number, title, body}:{owner: string, repo: string, pull_number: number, title: string, body: string}) {
        throw new Error("Not implemented");
    }

    async createPull({owner, repo, base, head, title, body}:{owner: string, repo: string, base: string, head: string, title: string, body: string}): Promise<any>  {
        throw new Error("Not implemented");
    }
}

export class OctokitClient extends GitHubClient {
    octokit: any;

    constructor(githubToken: string) {
        super();
        this.octokit = new Octokit({ auth: githubToken });
    }

    async listPulls({owner,repo,base,head}:{owner: string, repo: string, base: string, head: string}): Promise<any>  {
        return this.octokit.pulls.list({ owner, repo, base, head });
    }

    async updatePull({owner, repo, pull_number, title, body}:{owner: string, repo: string, pull_number: number, title: string, body: string}) {
        return this.octokit.pulls.update({ owner, repo, pull_number, title, body });
    }

    async createPull({owner, repo, base, head, title, body}:{owner: string, repo: string, base: string, head: string, title: string, body: string}): Promise<any>  {
        return this.octokit.pulls.create({ owner, repo, base, head, title, body });
    }
}

export class GhClient extends GitHubClient {
    async listPulls({owner,repo,base,head}:{owner: string, repo: string, base: string, head: string}): Promise<any> {
        const result = execSync(`gh pr list --repo ${owner}/${repo} --base ${base} --head ${head} --json number`).toString();
        return JSON.parse(result);
    }

    async updatePull({owner, repo, pull_number, title, body}:{owner: string, repo: string, pull_number: number, title: string, body: string}) {
        execSync(`gh pr edit ${pull_number} --repo ${owner}/${repo} --title "${title}" --body "${body}"`);
    }

    async createPull({owner, repo, base, head, title, body}:{owner: string, repo: string, base: string, head: string, title: string, body: string}): Promise<any>  {
        const result = execSync(`gh pr create --repo ${owner}/${repo} --base ${base} --head ${head} --title "${title}" --body "${body}"`).toString();
        return { data: { html_url: result } }
    }
}