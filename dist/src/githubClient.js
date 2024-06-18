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
function escapeShellArg(arg) {
    return arg.replace(/`/g, '\\`');
}
class GhClient extends GitHubClient {
    listPulls(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head }) {
            const result = (0, child_process_1.execSync)(`gh pr list --repo ${owner}/${repo} --base ${base} --head ${head} --json number`).toString();
            return JSON.parse(result);
        });
    }
    updatePull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pullNumber, title, body }) {
            const escapedTitle = escapeShellArg(title);
            const escapedBody = escapeShellArg(body);
            (0, child_process_1.execSync)(`gh pr edit ${pullNumber} --repo ${owner}/${repo} --title "${escapedTitle}" --body "${escapedBody}"`);
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            const escapedTitle = escapeShellArg(title);
            const escapedBody = escapeShellArg(body);
            const result = (0, child_process_1.execSync)(`gh pr create --repo ${owner}/${repo} --base ${base} --head ${head} --title "${escapedTitle}" --body "${escapedBody}"`).toString();
            return { data: { html_url: result } };
        });
    }
}
exports.GhClient = GhClient;
