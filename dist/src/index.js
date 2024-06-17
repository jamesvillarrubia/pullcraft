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
const child_process_1 = require("child_process");
const githubClient_1 = require("./githubClient");
const child_process_2 = require("child_process");
// {
//     "exclusions": [
//         ":(exclude)**/package-lock.json",
//         ":(exclude)**/pnpm-lock.yaml",
//         ":(exclude)**/yarn.lock",
//         ":(exclude)**/*.jpg",
//         ":(exclude)**/*.jpeg",
//         ":(exclude)**/*.png",
//         ":(exclude)**/*.gif",
//         ":(exclude)**/*.bmp",
//         ":(exclude)**/*.tiff",
//         ":(exclude)**/*.svg",
//         ":(exclude)**/*.pdf"
//     ],
//     "openPr": true,
//     "githubStrategy": "gh",
//     "openAi":{
//         "apiKey": "YOUR_OPENAI_API_KEY",
//         "url": "https://api.openai.com/v1/chat/completions",
//         "model": "gpt-3.5-turbo-instruct",
//         "prompt": "YOUR_PROMPT_HERE",
//         "max_tokens": 1500,
//         "n": 1,
//         "stop": null,
//         "temperature": 0.2  
//     }
// }
const configName = "prbot";
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
const githubStrategy = 'gh';
const defaultOpenPr = true;
const openaiDefaults = {
    "url": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-3.5-turbo-instruct",
    "systemPrompt": prompt_1.prompt,
    "titleTemplate": prompt_1.titleTemplate,
    "bodyTemplate": prompt_1.bodyTemplate,
    "max_tokens": 1500,
    "n": 1,
    "stop": null,
    "temperature": 0.2
};
const baseDefault = 'develop';
const placeholderPattern = '__KEY__';
class PrBot {
    constructor(commanderOptions) {
        var _a, _b;
        this.replacements = {};
        this.standardReplacements = {};
        const explorer = (0, cosmiconfig_1.cosmiconfigSync)(configName, { searchStrategy: 'global' });
        const config = explorer.search();
        const configOptions = (config === null || config === void 0 ? void 0 : config.config) || {};
        // Merge options: commanderOptions > configOptions > defaults
        const mergedOptions = {
            openPr: commanderOptions.openPr || configOptions.openPr || defaultOpenPr,
            exclusions: (commanderOptions.exclusions || configOptions.exclusions || defaultExclusions)
                .map((exclusion) => `:(exclude)${exclusion}`),
            baseDefault: commanderOptions.baseDefault || configOptions.baseDefault || baseDefault,
            openaiConfig: Object.assign(Object.assign(Object.assign(Object.assign({}, openaiDefaults), configOptions.openai), commanderOptions.openai), { apiKey: ((_a = commanderOptions.openai) === null || _a === void 0 ? void 0 : _a.apiKey) || ((_b = configOptions.openai) === null || _b === void 0 ? void 0 : _b.apiKey) || process.env.OPENAI_API_KEY }),
            githubStrategy: commanderOptions.githubStrategy || configOptions.githubStrategy || githubStrategy,
            githubToken: commanderOptions.githubToken || configOptions.githubToken || process.env.GITHUB_TOKEN,
            placeholderPattern: commanderOptions.placeholderPattern || configOptions.placeholderPattern || placeholderPattern
        };
        // Assign merged options to instance variables
        this.openPr = mergedOptions.openPr;
        this.exclusions = mergedOptions.exclusions;
        this.baseDefault = mergedOptions.baseDefault;
        this.openaiConfig = mergedOptions.openaiConfig;
        this.githubStrategy = mergedOptions.githubStrategy;
        this.githubToken = mergedOptions.githubToken;
        this.placeholderPattern = mergedOptions.placeholderPattern;
        // Set the OpenAI API key
        if (!this.openaiConfig.apiKey) {
            throw new Error("Error: OPENAI_API_KEY is not set");
        }
        this.openai = new openai_1.default({ apiKey: this.openaiConfig.apiKey });
        // Set the GitHub client
        if (this.githubStrategy !== 'gh' && this.githubStrategy !== 'octokit') {
            throw new Error("Error: githubStrategy must be 'gh' or 'octokit'. Defaults to 'gh'.");
        }
        if (!this.githubToken && this.githubStrategy === 'octokit') {
            throw new Error("Error: GITHUB_TOKEN is not set");
        }
        this.gitHubClient = (this.githubStrategy === 'gh' && this.isGhCliAvailable()) ? new githubClient_1.GhClient() : new githubClient_1.OctokitClient(this.githubToken);
        // Set the Git client
        this.git = (0, simple_git_1.default)();
    }
    replacePlaceholders(template, replacements, placeholderPattern = this.placeholderPattern) {
        return template.replace(new RegExp(Object.keys(replacements).map(key => placeholderPattern.replace('KEY', key)).join('|'), 'g'), match => {
            const key = match.replace(new RegExp(placeholderPattern.replace('KEY', '(.*)')), '$1');
            return replacements[key];
        });
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
            if (this.openPr === false)
                return;
            try {
                const osType = process.platform;
                console.log(`Opening URL: ${url} on ${osType}`);
                switch (osType) {
                    case "linux":
                        // Linux
                        return (0, child_process_2.exec)(`xdg-open "${url}"`);
                    case "darwin":
                        // macOS
                        return (0, child_process_2.exec)(`open "${url}"`);
                    case "win32":
                        // Windows
                        return (0, child_process_2.exec)(`start "${url}"`);
                    default:
                        console.error("Unsupported OS");
                        return;
                }
            }
            catch (error) {
                console.error(`Error opening URL: ${error.message}`);
                throw error;
            }
        });
    }
    createPr() {
        return __awaiter(this, arguments, void 0, function* (baseBranch = this.baseDefault, compareBranch) {
            try {
                compareBranch = compareBranch || (yield this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
                console.log(`Comparing branches: ${baseBranch} and ${compareBranch}`);
                const repoInfo = yield this.getRepoInfo();
                if (!repoInfo) {
                    console.error("Error: Repository information could not be retrieved.");
                    return;
                }
                const { owner, repo } = repoInfo;
                this.standardReplacements = Object.assign(Object.assign({}, this.standardReplacements), { baseBranch,
                    compareBranch,
                    owner,
                    repo });
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
                const existingPrs = yield this.gitHubClient.listPulls({
                    owner,
                    repo,
                    base: baseBranch,
                    head: compareBranch
                });
                if (existingPrs.length > 0) {
                    const pull_number = existingPrs[0].number;
                    console.log(`Updating existing PR #${pull_number}...`);
                    yield this.openUrl('https://github.com/' + owner + '/' + repo + '/pull/' + pull_number);
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
                const diff = yield this.getDiff(baseBranch, compareBranch);
                const newFiles = yield this.getNewFiles(baseBranch, compareBranch);
                const filenames = yield this.getFilenames(baseBranch, compareBranch);
                if (!diff && !newFiles) {
                    return "No changes found between the specified branches.";
                }
                const finalPrompt = this.buildTextPrompt({ diff, newFiles, filenames });
                console.log('finalPrompt', finalPrompt);
                const response = yield this.gptCall(finalPrompt);
                return response;
            }
            catch (error) {
                console.error(`Error generating PR body: ${error.message}`);
            }
        });
    }
    buildTextPrompt({ diff, newFiles, filenames }) {
        const replace = (template) => {
            return this.replacePlaceholders(this.openaiConfig.template, Object.assign(Object.assign({}, this.replacements), this.standardReplacements), this.placeholderPattern);
        };
        return `
        json TEMPLATE:\n{\n
            "title": ${replace(this.openaiConfig.title)},\n
            "body": ${replace(this.openaiConfig.body)},\n
        }\n
        \n--------\n
        DIFF:\n${diff}
        \n--------\n
        NEW_FILES:\n${newFiles}
        \n--------\n
        FILENAMES:\n${filenames}`;
    }
    gptCall(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.openai.chat.completions.create({
                    model: 'gpt-4-turbo',
                    max_tokens: 1500,
                    n: 1,
                    stop: null,
                    temperature: 0.2,
                    messages: [
                        { "role": "system", "content": this.openaiConfig.prompt },
                        { "role": "user", "content": prompt }
                    ],
                    response_format: { "type": "json_object" }
                });
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
