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
exports.PullCraft = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const prompt_1 = require("./prompt");
const cosmiconfig_1 = require("cosmiconfig");
const openai_1 = __importDefault(require("openai"));
const child_process_1 = require("child_process");
const githubClient_1 = require("./githubClient");
const fs_1 = __importDefault(require("fs"));
const configName = 'pullcraft';
const defaultExclusions = [
    '***package-lock.json',
    '***pnpm-lock.yaml',
    '***yarn.lock',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.png',
    '**/*.gif',
    '**/*.bmp',
    '**/*.tiff',
    '**/*.svg',
    '**/*.pdf'
];
const githubStrategy = 'gh';
const defaultOpenPr = true;
const openaiDefaults = {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    systemPrompt: prompt_1.prompt,
    titleTemplate: prompt_1.titleTemplate,
    bodyTemplate: prompt_1.bodyTemplate,
    max_tokens: 3000,
    n: 1,
    stop: null,
    temperature: 0.2
};
const baseDefault = 'develop';
const placeholderPattern = '__KEY__';
const diffThreshold = 1000;
function filterUndefined(obj) {
    return Object.fromEntries(Object.entries(obj || {}).filter(([_, v]) => v !== undefined));
}
class PullCraft {
    constructor(commanderOptions) {
        var _a, _b;
        this.replacements = {};
        this.standardReplacements = {};
        const explorer = (0, cosmiconfig_1.cosmiconfigSync)(configName, { searchStrategy: 'global' });
        const config = explorer.search();
        const configOptions = (config === null || config === void 0 ? void 0 : config.config) || {};
        configOptions.openai = configOptions.openai || {};
        // Merge options: commanderOptions > configOptions > defaults
        // console.log('commanderOptions', commanderOptions);
        const mergedOptions = {
            openPr: commanderOptions.openPr || configOptions.openPr || defaultOpenPr,
            exclusions: (commanderOptions.exclusions || configOptions.exclusions || defaultExclusions)
                .map((exclusion) => `:(exclude)${exclusion}`),
            baseDefault: commanderOptions.baseDefault || configOptions.baseDefault || baseDefault,
            openaiConfig: Object.assign(openaiDefaults, filterUndefined(configOptions.openai), filterUndefined(commanderOptions.openai), { apiKey: ((_a = commanderOptions.openai) === null || _a === void 0 ? void 0 : _a.apiKey) || ((_b = configOptions.openai) === null || _b === void 0 ? void 0 : _b.apiKey) || process.env.OPENAI_API_KEY }),
            githubStrategy: commanderOptions.githubStrategy || configOptions.githubStrategy || githubStrategy,
            githubToken: commanderOptions.githubToken || configOptions.githubToken || process.env.GITHUB_TOKEN,
            placeholderPattern: commanderOptions.placeholderPattern || configOptions.placeholderPattern || placeholderPattern,
            diffThreshold: commanderOptions.diffThreshold || configOptions.diffThreshold || diffThreshold,
            dumpTo: commanderOptions.dumpTo || configOptions.dumpTo || null
        };
        // Assign merged options to instance variables
        this.openPr = mergedOptions.openPr;
        this.exclusions = mergedOptions.exclusions;
        this.baseDefault = mergedOptions.baseDefault;
        this.openaiConfig = mergedOptions.openaiConfig;
        this.githubStrategy = mergedOptions.githubStrategy;
        this.githubToken = mergedOptions.githubToken;
        this.placeholderPattern = mergedOptions.placeholderPattern;
        this.diffThreshold = mergedOptions.diffThreshold;
        this.dumpTo = mergedOptions.dumpTo;
        // Set the OpenAI API key
        if (!this.openaiConfig.apiKey) {
            throw new Error('Error: OPENAI_API_KEY is not set');
        }
        this.openai = new openai_1.default({ apiKey: this.openaiConfig.apiKey });
        // Set the GitHub client
        if (this.githubStrategy !== 'gh' && this.githubStrategy !== 'octokit') {
            throw new Error('Error: githubStrategy must be \'gh\' or \'octokit\'. Defaults to \'gh\'.');
        }
        if (!this.githubToken && this.githubStrategy === 'octokit') {
            throw new Error('Error: GITHUB_TOKEN is not set');
        }
        this.gitHubClient = (this.githubStrategy === 'gh' && this.isGhCliAvailable()) ? new githubClient_1.GhClient() : new githubClient_1.OctokitClient(this.githubToken);
        // Set the Git client
        this.git = (0, simple_git_1.default)();
    }
    replacePlaceholders(template, replacements, placeholderPattern = this.placeholderPattern) {
        return template.replace(new RegExp(Object.keys(replacements).map(key => placeholderPattern.replace('KEY', key)).join('|'), 'g'), match => {
            if (match && placeholderPattern) {
                const key = match.replace(new RegExp(placeholderPattern.replace('KEY', '(.*)')), '$1');
                return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
            }
            else {
                return match;
            }
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
                console.error('Error: Please provide a value for the argument.');
                throw new Error('Error: URL is required');
            }
            if (this.openPr === false)
                return;
            try {
                const osType = process.platform;
                console.log(`Opening URL: ${url} on ${osType}`);
                // console.log(JSON.stringify({url}, null, 2));
                switch (osType) {
                    case 'linux':
                        // Linux
                        return (0, child_process_1.exec)(`xdg-open "${url}"`);
                    case 'darwin':
                        // macOS
                        return (0, child_process_1.exec)(`open "${url}"`);
                    case 'win32':
                        // Windows
                        return (0, child_process_1.exec)(`start "${url}"`);
                    default:
                        console.error('Unsupported OS');
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
                    console.error('Error: Repository information could not be retrieved.');
                    return;
                }
                const { owner, repo } = repoInfo;
                this.standardReplacements = Object.assign(Object.assign({}, this.standardReplacements), { owner,
                    repo });
                let { response, exit = false } = yield this.differ(baseBranch, compareBranch);
                if (exit) {
                    return;
                }
                // console.log('creatPr->differ->response', response);
                if (!response) {
                    console.error('Error: Response could not be retrieved.');
                    return;
                }
                try {
                    response = JSON.parse(response);
                }
                catch (error) {
                    console.log(error);
                    console.log(JSON.stringify(response));
                    console.error('Error: AI Response could not be parsed.', error.message);
                    return;
                }
                const { title, body } = response;
                if (!body) {
                    console.error('Error: PR body could not be retrieved.');
                    return;
                }
                if (!title) {
                    console.error('Error: PR title could not be retrieved.');
                    return;
                }
                const existingPrs = yield this.gitHubClient.listPulls({
                    owner,
                    repo,
                    base: baseBranch,
                    head: compareBranch
                });
                if (existingPrs.length > 0) {
                    const pullNumber = existingPrs[0].number;
                    console.log(`Updating existing PR #${pullNumber}...`);
                    yield this.gitHubClient.updatePull({ owner, repo, pullNumber, title, body });
                    yield this.openUrl('https://github.com/' + owner + '/' + repo + '/pull/' + pullNumber);
                }
                else {
                    console.log('Creating a new PR...');
                    const response = yield this.gitHubClient.createPull({
                        owner,
                        repo,
                        title,
                        body,
                        base: baseBranch,
                        head: compareBranch
                    });
                    yield this.openUrl(response.data.html_url.trim().replace('\n', ''));
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
                const match = repoUrl.trim().match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
                if (match) {
                    return { owner: match[1], repo: match[2] };
                }
                throw new Error(`Failed to get repo info from ${repoUrl}`);
            }
            catch (error) {
                console.error('Failed to get repo info');
                throw error;
            }
        });
    }
    getNewFiles(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch only new files
                const newFilenames = yield this.git.raw([
                    'diff',
                    '--name-only',
                    '--diff-filter=A', // Filter for added files
                    baseBranch,
                    compareBranch
                ]);
                const newFiles = newFilenames.split('\n').filter(Boolean);
                let totalNewFiles = '';
                for (const file of newFiles) {
                    const fileDiff = yield this.git.raw([
                        'diff',
                        baseBranch,
                        compareBranch,
                        '--',
                        file
                    ]);
                    const lineCount = fileDiff.split('\n').length;
                    if (lineCount <= this.diffThreshold) {
                        totalNewFiles += fileDiff;
                    }
                    else {
                        totalNewFiles += `\n\n\nFile ${file} is too large to display in the diff. Skipping.\n\n\n`;
                    }
                }
                return totalNewFiles;
            }
            catch (error) {
                console.error(`Error getting new files: ${error.message}`);
                throw error;
            }
        });
    }
    getModifiedFiles(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch only modified files
                const modifiedFilenames = yield this.git.raw([
                    'diff',
                    '--name-only',
                    '--diff-filter=M', // Filter for modified files
                    baseBranch,
                    compareBranch
                ]);
                const modifiedFiles = modifiedFilenames.split('\n').filter(Boolean);
                let totalModifiedFiles = '';
                for (const file of modifiedFiles) {
                    const fileDiff = yield this.git.raw([
                        'diff',
                        baseBranch,
                        compareBranch,
                        '--',
                        file
                    ]);
                    const lineCount = fileDiff.split('\n').length;
                    if (lineCount <= this.diffThreshold) {
                        totalModifiedFiles += fileDiff;
                    }
                    else {
                        totalModifiedFiles += `\n\n\nFile ${file} is too large to display in the diff. Skipping.\n\n\n`;
                    }
                }
                return totalModifiedFiles;
            }
            catch (error) {
                console.error(`Error getting modified files: ${error.message}`);
                throw error;
            }
        });
    }
    getFilenames(baseBranch, compareBranch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // console.log('EXLCUSIONS FILENAMES', this.exclusions);
                const outcome = yield this.git.raw([
                    'diff',
                    '--name-only',
                    baseBranch,
                    compareBranch
                ]);
                return outcome;
            }
            catch (error) {
                console.error(`Error getting filenames: ${error.message}`);
                throw error;
            }
        });
    }
    dump(diff, location = 'diffdump.txt') {
        location = this.dumpTo || location;
        fs_1.default.writeFileSync(location, diff);
    }
    differ() {
        return __awaiter(this, arguments, void 0, function* (baseBranch = 'develop', compareBranch) {
            try {
                compareBranch = compareBranch || (yield this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
                const diff = yield this.getModifiedFiles(baseBranch, compareBranch);
                const newFiles = yield this.getNewFiles(baseBranch, compareBranch);
                const filenames = yield this.getFilenames(baseBranch, compareBranch);
                if (!diff && !newFiles) {
                    return { response: 'No changes found between the specified branches.', exit: true };
                }
                if (this.dumpTo) {
                    this.dump(diff);
                    return { response: `Diff dumped to ${this.dumpTo}`, exit: true };
                }
                this.standardReplacements = Object.assign(Object.assign({}, this.standardReplacements), { baseBranch,
                    compareBranch });
                const finalPrompt = this.buildTextPrompt({ diff, newFiles, filenames });
                // this.dump(newFiles, 'newfiles.txt');
                // this.dump(diff, 'diff.txt');
                // this.dump(filenames, 'filenames.txt');
                const response = yield this.gptCall(finalPrompt);
                return { response, exit: false };
            }
            catch (error) {
                console.error(`Error generating PR body: ${error.message}`);
            }
        });
    }
    buildTextPrompt({ diff, newFiles, filenames }) {
        const replace = (template) => {
            return this.replacePlaceholders(template, Object.assign(Object.assign({}, this.replacements), this.standardReplacements), this.placeholderPattern);
        };
        // console.log(this.openaiConfig.titleTemplate, this.openaiConfig.bodyTemplate);
        const title = replace(this.openaiConfig.titleTemplate);
        const body = replace(this.openaiConfig.bodyTemplate);
        return `json TEMPLATE:\n{\n"title": ${title},\n"body": ${body}\n}\n
        \n--------\nDIFF:     \n\`\`\`diff\n${diff}    \`\`\`\n
        \n--------\nNEW_FILES:\n\`\`\`diff\n${newFiles}\`\`\`\n
        \n--------\nFILENAMES:\n${filenames}`;
    }
    gptCall(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield this.openai.chat.completions.create({
                    model: 'gpt-4-turbo',
                    max_tokens: 1500,
                    n: 1,
                    stop: null,
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: this.openaiConfig.systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
                return ((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || '';
            }
            catch (error) {
                console.error(`Error calling OpenAI API: ${error.message}`);
            }
        });
    }
}
exports.PullCraft = PullCraft;
exports.default = PullCraft;
