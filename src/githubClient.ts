import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export class GitHubClient {
  async listPulls ({ owner, repo, base, head }:{owner: string, repo: string, base: string, head: string}): Promise<any> {
    throw new Error('Not implemented');
  }

  async updatePull ({ owner, repo, pullNumber, title, body }:{owner: string, repo: string, pullNumber: number, title: string, body: string}) {
    throw new Error('Not implemented');
  }

  async createPull ({ owner, repo, base, head, title, body }:{owner: string, repo: string, base: string, head: string, title: string, body: string}): Promise<any> {
    throw new Error('Not implemented');
  }
}

export class OctokitClient extends GitHubClient {
  octokit: any;

  constructor (githubToken: string) {
    super();
    this.octokit = new Octokit({ auth: githubToken });
  }

  async listPulls ({ owner, repo, base, head }:{owner: string, repo: string, base: string, head: string}): Promise<any> {
    return this.octokit.pulls.list({ owner, repo, base, head });
  }

  async updatePull ({ owner, repo, pullNumber, title, body }:{owner: string, repo: string, pullNumber: number, title: string, body: string}) {
    return this.octokit.pulls.update({ owner, repo, pullNumber, title, body });
  }

  async createPull ({ owner, repo, base, head, title, body }:{owner: string, repo: string, base: string, head: string, title: string, body: string}): Promise<any> {
    return this.octokit.pulls.create({ owner, repo, base, head, title, body });
  }
}

export class GhClient implements GitHubClient {
  private escapeShellArg (arg: string): string {
    // Escape backticks first
    arg = arg.replace(/`/g, '\\`');
    // Then escape single quotes
    // eslint-disable-next-line quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  async listPulls (params: { owner: string; repo: string; base?: string; head?: string }): Promise<any[]> {
    const { owner, repo, base, head } = params;
    const command = `gh pr list --json number,title,headRefName -R ${owner}/${repo} --base '${base}' --head '${head}'`;
    const output = execSync(command).toString().trim();
    return output ? JSON.parse(output) : [];
  }

  async updatePull (params: { owner: string; repo: string; pullNumber: number; title?: string; body?: string }): Promise<void> {
    const { owner, repo, pullNumber, title, body } = params;
    let command = `gh pr edit ${pullNumber} -R ${owner}/${repo}`;
    if (title) command += ` --title ${this.escapeShellArg(title)}`;
    if (body) command += ` --body ${this.escapeShellArg(body)}`;
    execSync(command);
  }

  async createPull (params: { owner: string; repo: string; base: string; head: string; title: string; body?: string }): Promise<{ data: { html_url: string } }> {
    const { owner, repo, base, head, title, body } = params;
    let command = `gh pr create -R ${owner}/${repo} --base ${this.escapeShellArg(base)} --head ${this.escapeShellArg(head)} --title ${this.escapeShellArg(title)}`;
    if (body) command += ` --body ${this.escapeShellArg(body)}`;
    const output = execSync(command).toString().trim();
    return { data: { html_url: output } };
  }
}
