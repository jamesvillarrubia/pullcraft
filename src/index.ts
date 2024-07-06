import simpleGit from 'simple-git';
import { prompt, titleTemplate, bodyTemplate } from './prompt';
import { cosmiconfigSync } from 'cosmiconfig';
import OpenAI from 'openai';
import { ChildProcess, execSync, exec } from 'child_process';
import { GitHubClient, OctokitClient, GhClient } from './githubClient';

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
  model: 'gpt-3.5-turbo-instruct',
  systemPrompt: prompt,
  titleTemplate,
  bodyTemplate,
  max_tokens: 3000,
  n: 1,
  stop: null,
  temperature: 0.2
};
const baseDefault = 'develop';
const placeholderPattern = '__KEY__';

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
      placeholderPattern: commanderOptions.placeholderPattern || configOptions.placeholderPattern || placeholderPattern
    };
    // console.log('mergedOptions',
    //   openaiDefaults,
    //   configOptions.openai,
    //   commanderOptions.openai,
    //   mergedOptions);

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
      execSync('gh auth status');
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
          return exec(`xdg-open "${url}"`);
        case 'darwin':
          // macOS
          return exec(`open "${url}"`);
        case 'win32':
          // Windows
          return exec(`start "${url}"`);
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

      let response = await this.differ(baseBranch, compareBranch);
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
        await this.openUrl(response.data.html_url.replace(/%0A$/, ''));
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
      // console.log('EXLCUSIONS NEW FILES', this.exclusions);
      const outcome = await this.git.raw([
        'diff',
        '--diff-filter=A',
        baseBranch,
        compareBranch,
        '--',
        '.',
        ...this.exclusions
      ]);
      return outcome;
    } catch (error: any) {
      console.error(`Error getting new files: ${error.message}`);
      throw error;
    }
  }

  async getDiff (baseBranch: string, compareBranch: string): Promise<string> {
    try {
      // console.log('EXLCUSIONS DIFF', this.exclusions);
      const outcome = await this.git.raw([
        'diff',
        baseBranch,
        compareBranch,
        '--',
        '.',
        ...this.exclusions
      ]);
      return outcome;
    } catch (error: any) {
      console.error(`Error getting diff: ${error.message}`);
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

  async differ (baseBranch = 'develop', compareBranch?: string): Promise<any|void> {
    try {
      compareBranch = compareBranch || (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim() as string;

      const diff = await this.getDiff(baseBranch, compareBranch);
      const newFiles = await this.getNewFiles(baseBranch, compareBranch);
      const filenames = await this.getFilenames(baseBranch, compareBranch);

      if (!diff && !newFiles) {
        return 'No changes found between the specified branches.';
      }

      this.standardReplacements = {
        ...this.standardReplacements,
        baseBranch,
        compareBranch
      };

      const finalPrompt = this.buildTextPrompt({ diff, newFiles, filenames });
      // console.log('finalPrompt', finalPrompt);
      const response = await this.gptCall(finalPrompt);
      return response;
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

    return `
        json TEMPLATE:\n{\n
            "title": ${title},\n
            "body": ${body},\n
        }\n
        \n--------\n
        DIFF:\n${diff}
        \n--------\n
        NEW_FILES:\n${newFiles}
        \n--------\n
        FILENAMES:\n${filenames}`;
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
          { role: 'system', content: this.openaiConfig.systemPrompt },
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
