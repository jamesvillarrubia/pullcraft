import cp from 'child_process';
let Octokit;
export class GitHubClient {
    async listPulls({ owner, repo, base, head }) {
        throw new Error('Not implemented');
    }
    async updatePull({ owner, repo, pullNumber, title, body }) {
        throw new Error('Not implemented');
    }
    async createPull({ owner, repo, base, head, title, body }) {
        throw new Error('Not implemented');
    }
}
export class OctokitClient extends GitHubClient {
    constructor(githubToken) {
        super();
        this.initializeOctokit(githubToken);
    }
    async initializeOctokit(githubToken) {
        const { Octokit } = await import('@octokit/rest');
        this.octokit = new Octokit({ auth: githubToken });
    }
    async listPulls({ owner, repo, base, head }) {
        return this.octokit.pulls.list({ owner, repo, base, head });
    }
    async updatePull({ owner, repo, pullNumber, title, body }) {
        return this.octokit.pulls.update({ owner, repo, pullNumber, title, body });
    }
    async createPull({ owner, repo, base, head, title, body }) {
        return this.octokit.pulls.create({ owner, repo, base, head, title, body });
    }
}
export class GhClient {
    escapeShellArg(arg) {
        // Escape backticks first
        arg = arg.replace(/`/g, '\\`');
        // Then escape single quotes
        // eslint-disable-next-line quotes
        return `'${arg.replace(/'/g, "'\\''")}'`;
    }
    async listPulls(params) {
        const { owner, repo, base, head } = params;
        const command = `gh pr list --json number,title,headRefName -R ${owner}/${repo} --base '${base}' --head '${head}'`;
        const output = cp.execSync(command).toString().trim();
        return output ? JSON.parse(output) : [];
    }
    async updatePull(params) {
        const { owner, repo, pullNumber, title, body } = params;
        let command = `gh pr edit ${pullNumber} -R ${owner}/${repo}`;
        if (title)
            command += ` --title ${this.escapeShellArg(title)}`;
        if (body)
            command += ` --body ${this.escapeShellArg(body)}`;
        cp.execSync(command);
    }
    async createPull(params) {
        const { owner, repo, base, head, title, body } = params;
        let command = `gh pr create -R ${owner}/${repo} --base ${this.escapeShellArg(base)} --head ${this.escapeShellArg(head)} --title ${this.escapeShellArg(title)}`;
        if (body)
            command += ` --body ${this.escapeShellArg(body)}`;
        const output = cp.execSync(command).toString().trim();
        return { data: { html_url: output } };
    }
}
//# sourceMappingURL=githubClient.js.map