"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhClient = exports.OctokitClient = exports.GitHubClient = void 0;
const rest_1 = require("@octokit/rest");
const child_process_1 = require("child_process");
class GitHubClient {
    listPulls(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head }) {
            throw new Error('Not implemented');
        });
    }
    updatePull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pullNumber, title, body }) {
            throw new Error('Not implemented');
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            throw new Error('Not implemented');
        });
    }
}
exports.GitHubClient = GitHubClient;
class OctokitClient extends GitHubClient {
    constructor(githubToken) {
        super();
        this.octokit = new rest_1.Octokit({ auth: githubToken });
    }
    listPulls(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head }) {
            return this.octokit.pulls.list({ owner, repo, base, head });
        });
    }
    updatePull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pullNumber, title, body }) {
            return this.octokit.pulls.update({ owner, repo, pullNumber, title, body });
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            return this.octokit.pulls.create({ owner, repo, base, head, title, body });
        });
    }
}
exports.OctokitClient = OctokitClient;
class GhClient {
    escapeShellArg(arg) {
        // Escape backticks first
        arg = arg.replace(/`/g, '\\`');
        // Then escape single quotes
        // eslint-disable-next-line quotes
        return `'${arg.replace(/'/g, "'\\''")}'`;
    }
    listPulls(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo, base, head } = params;
            const command = `gh pr list --json number,title,headRefName -R ${owner}/${repo} --base '${base}' --head '${head}'`;
            const output = (0, child_process_1.execSync)(command).toString().trim();
            return output ? JSON.parse(output) : [];
        });
    }
    updatePull(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo, pullNumber, title, body } = params;
            let command = `gh pr edit ${pullNumber} -R ${owner}/${repo}`;
            if (title)
                command += ` --title ${this.escapeShellArg(title)}`;
            if (body)
                command += ` --body ${this.escapeShellArg(body)}`;
            (0, child_process_1.execSync)(command);
        });
    }
    createPull(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo, base, head, title, body } = params;
            let command = `gh pr create -R ${owner}/${repo} --base ${this.escapeShellArg(base)} --head ${this.escapeShellArg(head)} --title ${this.escapeShellArg(title)}`;
            if (body)
                command += ` --body ${this.escapeShellArg(body)}`;
            const output = (0, child_process_1.execSync)(command).toString().trim();
            return { data: { html_url: output } };
        });
    }
}
exports.GhClient = GhClient;
