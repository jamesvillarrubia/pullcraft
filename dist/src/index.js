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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrBot = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const prompt_1 = require("./prompt");
const cosmiconfig_1 = require("cosmiconfig");
const openai_1 = __importDefault(require("openai"));
const openWrapper_1 = require("./openWrapper"); // Import the openUrl function
const child_process_1 = require("child_process");
const githubClient_1 = require("./githubClient");
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
class PrBot {
    constructor(openaiApiKey, githubToken) {
        var _a;
        this.openaiApiKey = openaiApiKey;
        if (!this.openaiApiKey) {
            throw new Error("Error: OPENAI_API_KEY is not set");
        }
        this.githubToken = githubToken;
        if (!this.githubToken) {
            throw new Error("Error: GITHUB_TOKEN is not set");
        }
        this.gitHubClient = this.isGhCliAvailable() ? new githubClient_1.GhClient() : new githubClient_1.OctokitClient(this.githubToken);
        const explorer = (0, cosmiconfig_1.cosmiconfigSync)('prbot');
        const config = explorer.search();
        this.exclusions = ((_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.exclusions) || defaultExclusions;
        this.openai = new openai_1.default({
            apiKey: this.openaiApiKey
        });
        this.git = (0, simple_git_1.default)();
    }
    isGhCliAvailable() {
        try {
            (0, child_process_1.execSync)('gh auth status');
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    openUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url) {
                console.error("Error: Please provide a value for the argument.");
                throw new Error("Error: URL is required");
            }
            try {
                return yield (0, openWrapper_1.openUrl)(url); // Call the imported function
            }
            catch (error) {
                console.error(`Error opening URL: ${error.message}`);
                throw error;
            }
        });
    }
    createPr() {
        return __awaiter(this, arguments, void 0, function* (baseBranch = 'develop', compareBranch) {
            try {
                compareBranch = compareBranch || (yield this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
                console.log(`Comparing branches: ${baseBranch} and ${compareBranch}`);
                const body = yield this.differ(baseBranch, compareBranch);
                if (!body) {
                    console.error("Error: PR body could not be retrieved.");
                    return;
                }
                const title = body.split('\n')[0].replace(/^# /, '');
                if (!title) {
                    console.error("Error: PR title could not be extracted from the PR body.");
                    return;
                }
                const repoInfo = yield this.getRepoInfo();
                if (!repoInfo) {
                    console.error("Error: Repository information could not be retrieved.");
                    return;
                }
                const { owner, repo } = repoInfo;
                const existingPrs = yield this.gitHubClient.listPulls({
                    owner,
                    repo,
                    base: baseBranch,
                    head: compareBranch
                });
                if (existingPrs.length > 0) {
                    const pull_number = existingPrs[0].number;
                    console.log(`Updating existing PR #${pull_number}...`);
                    yield this.gitHubClient.updatePull({ owner, repo, pull_number, title, body });
                }
                else {
                    console.log("Creating a new PR...");
                    const response = yield this.gitHubClient.createPull({
                        owner,
                        repo,
                        title,
                        body,
                        base: baseBranch,
                        head: compareBranch
                    });
                    yield this.openUrl(response.url);
                }
            }
            catch (error) {
                console.error(`Error creating PR: ${error.message}`);
            }
        });
    }
    getRepoInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const repoUrl = yield this.git.raw(['config', '--get', 'remote.origin.url']);
                const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)\.git/);
                if (match) {
                    return { owner: match[1], repo: match[2] };
                }
            }
            catch (error) {
                console.error(`Failed to get repo info`);
            }
        });
    }
    getNewFiles(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const outcome = yield this.git.diff(['--diff-filter=A', baseBranch, compareBranch, '--', '.', ...this.exclusions]);
                return outcome;
            }
            catch (error) {
                console.error(`Error getting new files: ${error.message}`);
            }
        });
    }
    getDiff(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const outcome = yield this.git.diff([baseBranch, compareBranch, '--', '.', ...this.exclusions]);
                return outcome;
            }
            catch (error) {
                console.error(`Error getting diff: ${error.message}`);
            }
        });
    }
    getFilenames(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const outcome = yield this.git.diff(['--name-only', baseBranch, compareBranch, '--', '.']);
                return outcome;
            }
            catch (error) {
                console.error(`Error getting filenames: ${error.message}`);
            }
        });
    }
    differ() {
        return __awaiter(this, arguments, void 0, function* (baseBranch = 'develop', compareBranch) {
            try {
                compareBranch = compareBranch || (yield this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
                const textPrompt = prompt_1.prompt;
                const diff = yield this.getDiff(baseBranch, compareBranch);
                const newFiles = yield this.getNewFiles(baseBranch, compareBranch);
                const filenames = yield this.getFilenames(baseBranch, compareBranch);
                if (!diff && !newFiles) {
                    return "No changes found between the specified branches.";
                }
                const finalPrompt = `${textPrompt}${diff}\n\n${newFiles}\n\nFilenames:\n${filenames}`;
                const response = yield this.gptCall(finalPrompt);
                return response;
            }
            catch (error) {
                console.error(`Error generating PR body: ${error.message}`);
            }
        });
    }
    gptCall(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.openai.completions.create({
                    model: 'gpt-3.5-turbo-instruct',
                    prompt: prompt,
                    max_tokens: 1500,
                    n: 1,
                    stop: null,
                    temperature: 0.2
                });
                console.log(response);
                return response.choices[0].text.trim();
            }
            catch (error) {
                console.error(`Error calling OpenAI API: ${error.message}`);
            }
        });
    }
}
exports.PrBot = PrBot;
exports.default = PrBot;
