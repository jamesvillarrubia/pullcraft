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
            throw new Error("Not implemented");
        });
    }
    updatePull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pull_number, title, body }) {
            throw new Error("Not implemented");
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            throw new Error("Not implemented");
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
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pull_number, title, body }) {
            return this.octokit.pulls.update({ owner, repo, pull_number, title, body });
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            return this.octokit.pulls.create({ owner, repo, base, head, title, body });
        });
    }
}
exports.OctokitClient = OctokitClient;
class GhClient extends GitHubClient {
    listPulls(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head }) {
            const result = (0, child_process_1.execSync)(`gh pr list --repo ${owner}/${repo} --base ${base} --head ${head} --json number`).toString();
            return JSON.parse(result);
        });
    }
    updatePull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, pull_number, title, body }) {
            (0, child_process_1.execSync)(`gh pr edit ${pull_number} --repo ${owner}/${repo} --title "${title}" --body "${body}"`);
        });
    }
    createPull(_a) {
        return __awaiter(this, arguments, void 0, function* ({ owner, repo, base, head, title, body }) {
            const result = (0, child_process_1.execSync)(`gh pr create --repo ${owner}/${repo} --base ${base} --head ${head} --title "${title}" --body "${body}"`).toString();
            return {url:result};
        });
    }
}
exports.GhClient = GhClient;
