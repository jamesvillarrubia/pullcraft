import { simpleGit } from 'simple-git';
import { systemPrompt, titleTemplate, bodyTemplate, hintPrompt } from './prompt.js';
import { cosmiconfigSync } from 'cosmiconfig';
import OpenAI from 'openai';
import cp, { ChildProcess } from 'child_process';
import { GitHubClient, OctokitClient, GhClient } from './githubClient.js';
import fs from 'fs';

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
  systemPrompt,
  titleTemplate,
  bodyTemplate,
  max_tokens: 3000,
  n: 1,
  stop: null,
  temperature: 0.2
};
const baseDefault = 'develop';
const placeholderPattern = '__KEY__';
const diffThreshold = 400;

function filterUndefined (obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj || {}).filter(([_, v]) => v !== undefined));
}

export class PullCraft {
  githubToken: string;
  gitHubClient: GitHubClient;
  exclusions: string[];
  openai: any;
  git: any;
  config: any;
  openPr: boolean;
  githubStrategy: string;
  openaiConfig: any;
  baseDefault: string;
  placeholderPattern: string;
  commanderOptions: any;
  replacements: any = {};
  standardReplacements: any = {};
  diffThreshold: number;
  dumpTo: string;
  hint: string;

  constructor (commanderOptions: any) {
    const explorer = cosmiconfigSync(configName, { searchStrategy: 'global' });
    const config = explorer.search();
    const configOptions = config?.config || {};
    configOptions.openai = configOptions.openai || {};

    // Merge options: commanderOptions > configOptions > defaults
    // console.log('commanderOptions', commanderOptions);
    const mergedOptions = {
      openPr: commanderOptions.openPr || configOptions.openPr || defaultOpenPr,
      exclusions: (commanderOptions.exclusions || configOptions.exclusions || defaultExclusions)
        .map((exclusion: string) => `:(exclude)${exclusion}`),
      baseDefault: commanderOptions.baseDefault || configOptions.baseDefault || baseDefault,
      openaiConfig: Object.assign(
        openaiDefaults,
        filterUndefined(configOptions.openai),
        filterUndefined(commanderOptions.openai),
        { apiKey: commanderOptions.openai?.apiKey || configOptions.openai?.apiKey || process.env.OPENAI_API_KEY }
      ),
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
    this.hint = commanderOptions.hint;

    // Set the OpenAI API key
    if (!this.openaiConfig.apiKey) {
      throw new Error('Error: OPENAI_API_KEY is not set');
    }
    this.openai = new OpenAI({ apiKey: this.openaiConfig.apiKey });

    // Set the GitHub client
    if (this.githubStrategy !== 'gh' && this.githubStrategy !== 'octokit') {
      throw new Error('Error: githubStrategy must be \'gh\' or \'octokit\'. Defaults to \'gh\'.');
    }
    if (!this.githubToken && this.githubStrategy === 'octokit') {
      throw new Error('Error: GITHUB_TOKEN is not set');
    }
    this.gitHubClient = (this.githubStrategy === 'gh' && this.isGhCliAvailable()) ? new GhClient() : new OctokitClient(this.githubToken);

    // Set the Git client
    this.git = simpleGit();
  }

  replacePlaceholders (template: string, replacements: any, placeholderPattern = this.placeholderPattern) {
    return template.replace(
      new RegExp(
        Object.keys(replacements).map(key => placeholderPattern.replace('KEY', key)).join('|'), 'g'
      ), match => {
        if (match && placeholderPattern) {
          const key = match.replace(new RegExp(placeholderPattern.replace('KEY', '(.*)')), '$1');
          return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
        } else {
          return match;
        }
      }
    );
  }

  isGhCliAvailable () {
    try {
      cp.execSync('gh auth status');
      return true;
    } catch {
      return false;
    }
  }

  async openUrl (url: string): Promise<ChildProcess|void> {
    if (!url) {
      console.error('Error: Please provide a value for the argument.');
      throw new Error('Error: URL is required');
    }
    if (this.openPr === false) return;
    try {
      const osType = process.platform;
      console.log(`Opening URL: ${url} on ${osType}`);
      // console.log(JSON.stringify({url}, null, 2));
      switch (osType) {
        case 'linux':
          // Linux
          return cp.exec(`xdg-open "${url}"`);
        case 'darwin':
          // macOS
          return cp.exec(`open "${url}"`);
        case 'win32':
          // Windows
          return cp.exec(`start "${url}"`);
        default:
          console.error('Unsupported OS');
      }
    } catch (error:any) {
      console.error(`Error opening URL: ${error.message}`);
      throw error;
    }
  }

  async createPr (baseBranch = this.baseDefault, compareBranch?: string) {
    try {
      compareBranch = compareBranch || (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim() as string;
      console.log(`Comparing branches: ${baseBranch} and ${compareBranch}`);

      const repoInfo = await this.getRepoInfo();
      if (!repoInfo) {
        console.error('Error: Repository information could not be retrieved.');
        return;
      }
      const { owner, repo } = repoInfo;

      this.standardReplacements = {
        ...this.standardReplacements,
        owner,
        repo
      };

      let { response, exit = false } = await this.differ(baseBranch, compareBranch);

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
      } catch (error:any) {
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

      const existingPrs = await this.gitHubClient.listPulls({
        owner,
        repo,
        base: baseBranch,
        head: compareBranch
      });

      if (existingPrs.length > 0) {
        const pullNumber = existingPrs[0].number;
        console.log(`Updating existing PR #${pullNumber}...`);
        await this.gitHubClient.updatePull({ owner, repo, pullNumber, title, body });
        await this.openUrl('https://github.com/' + owner + '/' + repo + '/pull/' + pullNumber);
      } else {
        console.log('Creating a new PR...');
        const response = await this.gitHubClient.createPull({
          owner,
          repo,
          title,
          body,
          base: baseBranch,
          head: compareBranch
        });
        await this.openUrl(response.data.html_url.trim().replace('\n', ''));
      }
    } catch (error: any) {
      console.error(`Error creating PR: ${error.message}`);
    }
  }

  async getRepoInfo (): Promise<{ owner: string, repo: string }> {
    try {
      const repoUrl = await this.git.raw(['config', '--get', 'remote.origin.url']);
      const match = repoUrl.trim().match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
      throw new Error(`Failed to get repo info from ${repoUrl}`);
    } catch (error: any) {
      console.error('Failed to get repo info');
      throw error;
    }
  }

  async getNewFiles (baseBranch: string, compareBranch: string): Promise<string> {
    try {
      // Fetch only new files
      const newFilenames = await this.git.raw([
        'diff',
        '--name-only',
        '--diff-filter=A', // Filter for added files
        baseBranch,
        compareBranch
      ]);

      const newFiles = newFilenames.split('\n').filter(Boolean);

      let totalNewFiles = '';

      for (const file of newFiles) {
        const fileDiff = await this.git.raw([
          'diff',
          baseBranch,
          compareBranch,
          '--',
          file
        ]);

        const lineCount = fileDiff.split('\n').length;
        if (lineCount <= this.diffThreshold) {
          totalNewFiles += fileDiff;
        } else {
          totalNewFiles += `\n\n\nFile ${file} is too large to display in the diff. Skipping.\n\n\n`;
        }
      }

      return totalNewFiles;
    } catch (error: any) {
      console.error(`Error getting new files: ${error.message}`);
      throw error;
    }
  }

  async getModifiedFiles (baseBranch: string, compareBranch: string): Promise<string> {
    try {
      // Fetch only modified files
      const modifiedFilenames = await this.git.raw([
        'diff',
        '--name-only',
        '--diff-filter=M', // Filter for modified files
        baseBranch,
        compareBranch
      ]);

      const modifiedFiles = modifiedFilenames.split('\n').filter(Boolean);
      let totalModifiedFiles = '';

      for (const file of modifiedFiles) {
        const fileDiff = await this.git.raw([
          'diff',
          baseBranch,
          compareBranch,
          '--',
          file
        ]);

        const lineCount = fileDiff.split('\n').length;
        if (lineCount <= this.diffThreshold) {
          totalModifiedFiles += fileDiff;
        } else {
          console.log(`File ${file} is too large to display in the diff. Skipping.`);
          totalModifiedFiles += `\n\n\nFile ${file} is too large to display in the diff. Skipping.\n\n\n`;
        }
      }

      return totalModifiedFiles;
    } catch (error: any) {
      console.error(`Error getting modified files: ${error.message}`);
      throw error;
    }
  }

  async getFilenames (baseBranch: string, compareBranch: string): Promise<string> {
    try {
      // console.log('EXLCUSIONS FILENAMES', this.exclusions);
      const outcome = await this.git.raw([
        'diff',
        '--name-only',
        baseBranch,
        compareBranch
      ]);
      return outcome;
    } catch (error: any) {
      console.error(`Error getting filenames: ${error.message}`);
      throw error;
    }
  }

  dump (diff: string, location = 'diffdump.txt'): void {
    location = this.dumpTo || location;
    fs.writeFileSync(location, diff);
  }

  async differ (baseBranch = 'develop', compareBranch?: string): Promise<any|void> {
    try {
      compareBranch = compareBranch || (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim() as string;

      const diff = await this.getModifiedFiles(baseBranch, compareBranch);
      const newFiles = await this.getNewFiles(baseBranch, compareBranch);
      const filenames = await this.getFilenames(baseBranch, compareBranch);

      if (!diff && !newFiles) {
        return { response: 'No changes found between the specified branches.', exit: true };
      }

      if (this.dumpTo) {
        this.dump(diff);
        return { response: `Diff dumped to ${this.dumpTo}`, exit: true };
      }

      this.standardReplacements = {
        ...this.standardReplacements,
        baseBranch,
        compareBranch
      };

      const finalPrompt = this.buildTextPrompt({ diff, newFiles, filenames });

      const response = await this.gptCall(finalPrompt);

      return { response, exit: false };
    } catch (error: any) {
      console.error(`Error generating PR body: ${error.message}`);
    }
  }

  buildTextPrompt ({ diff, newFiles, filenames }:{ diff: string, newFiles: string, filenames: string }): string {
    const replace = (template: string) => {
      return this.replacePlaceholders(template, {
        ...this.replacements,
        ...this.standardReplacements
      }, this.placeholderPattern);
    };
    // console.log(this.openaiConfig.titleTemplate, this.openaiConfig.bodyTemplate);
    const title = replace(this.openaiConfig.titleTemplate);
    const body = replace(this.openaiConfig.bodyTemplate);

    return `json TEMPLATE:\n{\n"title": ${title},\n"body": ${body}\n}\n
        \n--------\nDIFF:     \n\`\`\`diff\n${diff}    \`\`\`\n
        \n--------\nNEW_FILES:\n\`\`\`diff\n${newFiles}\`\`\`\n
        \n--------\nFILENAMES:\n${filenames}`;
  }

  async gptCall (prompt: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        max_tokens: 1500,
        n: 1,
        stop: null,
        temperature: 0.2,
        messages: [
          { role: 'system', content: this.openaiConfig.systemPrompt + ((this.hint) ? hintPrompt + this.hint : '') },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }

      });
      return response.choices[0].message?.content || '';
    } catch (error: any) {
      console.error(`Error calling OpenAI API: ${error.message}`);
    }
  }
}

export default PullCraft;
