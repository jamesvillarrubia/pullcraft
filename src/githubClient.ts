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

function escapeShellArg (arg: string): string {
  return arg.replace(/`/g, '\\`');
}

export class GhClient extends GitHubClient {
  static createPull: any;
  async listPulls ({ owner, repo, base, head }: { owner: string, repo: string, base: string, head: string }): Promise<any> {
    const result = execSync(`gh pr list --repo ${owner}/${repo} --base ${base} --head ${head} --json number`).toString();
    return JSON.parse(result);
  }

  async updatePull ({ owner, repo, pullNumber, title, body }: { owner: string, repo: string, pullNumber: number, title: string, body: string }) {
    const escapedTitle = escapeShellArg(title);
    const escapedBody = escapeShellArg(body);
    execSync(`gh pr edit ${pullNumber} --repo ${owner}/${repo} --title "${escapedTitle}" --body "${escapedBody}"`);
  }

  async createPull ({ owner, repo, base, head, title, body }: { owner: string, repo: string, base: string, head: string, title: string, body: string }): Promise<any> {
    const escapedTitle = escapeShellArg(title);
    const escapedBody = escapeShellArg(body);
    const result = execSync(`gh pr create --repo ${owner}/${repo} --base ${base} --head ${head} --title "${escapedTitle}" --body "${escapedBody}"`).toString();
    return { data: { html_url: result } };
  }
}
