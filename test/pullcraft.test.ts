// import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import nock from 'nock'; // Change this line

import * as sinon from 'sinon';
import PullCraft from '../src/index';
import childProcess from 'child_process';

import fs from 'fs';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

delete process.env.OPENAI_API_KEY;
delete process.env.GITHUB_TOKEN;

async function testErrorHandling (
  fn: () => Promise<any>,
  expectedErrorMessage: any,
  consoleErrorStub: sinon.SinonStub
) {
  try {
    await fn();
    throw new Error('Function did not throw');
  } catch (error: any) {
    expect(error.message).to.equal(expectedErrorMessage);
    expect(consoleErrorStub.calledOnce).to.equal(true);
  }
}

describe('PullCraft', () => {
  let pullCraft: PullCraft;
  let openaiStub: sinon.SinonStub;
  let openUrlStub: sinon.SinonStub;
  let gitStub: sinon.SinonStub;
  let createPullStub: sinon.SinonStub;
  let listPullsStub: sinon.SinonStub;
  let updatePullStub: sinon.SinonStub;
  let execStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  // let consoleWarnStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;

  beforeEach(() => {
    pullCraft = new PullCraft({
      openai: { apiKey: 'fake-openai-api-key' },
      githubToken: 'fake-github-token'
    });
    openaiStub = sinon.stub(pullCraft.openai.chat.completions, 'create');
    // openUrlStub = sinon.stub(pullCraft,'openUrl').resolves({} as ChildProcess);
    createPullStub = sinon.stub(pullCraft.gitHubClient, 'createPull');
    listPullsStub = sinon.stub(pullCraft.gitHubClient, 'listPulls');
    updatePullStub = sinon.stub(pullCraft.gitHubClient, 'updatePull');
    execStub = sinon.stub(childProcess, 'exec');
    consoleErrorStub = sinon.stub(console, 'error');
    // consoleWarnStub = sinon.stub(console, 'warn');
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
    nock.cleanAll();
    consoleErrorStub.restore();
    // consoleWarnStub.restore();
    consoleLogStub.restore();
  });

  describe('Constructor', () => {
    it('should throw an error if OPENAI_API_KEY is not set', () => {
      expect(() => new PullCraft({ githubToken: 'fake-github-token' })).to.throw('Error: OPENAI_API_KEY is not set');
    });

    it('should throw an error if GITHUB_TOKEN is not set', () => {
      expect(() => new PullCraft({ openai: { apiKey: 'fake-openai-api-key' }, githubStrategy: 'octokit' })).to.throw('Error: GITHUB_TOKEN is not set');
    });

    it('should throw an error for invalid githubStrategy', () => {
      expect(() => new PullCraft({
        openai: { apiKey: 'fake-key' },
        githubToken: 'fake-token',
        githubStrategy: 'invalid'
      })).to.throw('Error: githubStrategy must be \'gh\' or \'octokit\'. Defaults to \'gh\'.');
    });
  });

  describe('replacePlaceholders', () => {
    it('should replace a single placeholder in the template string', () => {
      const template = 'Hello, __name__!';
      const replacements = { name: 'World' };
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, World!');
    });

    it('should replace multiple placeholders in the template string', () => {
      const template = 'Hello, __name__! Welcome to __place__.';
      const replacements = { name: 'Alice', place: 'Wonderland' };
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, Alice! Welcome to Wonderland.');
    });

    it('should handle placeholders with different patterns', () => {
      const template = 'Hello, {{name}}!';
      const replacements = { name: 'Bob' };
      const result = pullCraft.replacePlaceholders(template, replacements, '{{KEY}}');
      expect(result).to.equal('Hello, Bob!');
    });

    it('should not replace anything if no placeholders match', () => {
      const template = 'Hello, __name__!';
      const replacements = { place: 'World' };
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, __name__!');
    });

    it('should replace placeholders with empty strings if the value is empty', () => {
      const template = 'Hello, __name__!';
      const replacements = { name: '' };
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, !');
    });

    it('should leave placeholder alone if replacements are empty', () => {
      const template = 'Hello, __name__!';
      const replacements = {};
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, __name__!');
    });

    it('should leave template alone if there are no placeholders', () => {
      const template = 'Hello, name!';
      const replacements = {};
      const result = pullCraft.replacePlaceholders(template, replacements);
      expect(result).to.equal('Hello, name!');
    });
  });

  describe('openUrl', () => {
    let platformStub: sinon.SinonStub;
    beforeEach(() => {
      platformStub = sinon.stub(process, 'platform');
    });

    afterEach(() => {
      platformStub.restore();
    });

    it('should throw an error when URL is not provided', async () => {
      await expect(pullCraft.openUrl('')).to.be.rejectedWith('Error: URL is required');
      expect(consoleErrorStub.calledWith('Error: Please provide a value for the argument.')).to.equal(true);
    });

    it('should open URL on Linux', async () => {
      platformStub.value('linux');
      await pullCraft.openUrl('https://example.com');
      expect(execStub.calledWith('xdg-open "https://example.com"')).to.equal(true);
      expect(consoleLogStub.calledWith('Opening URL: https://example.com on linux')).to.equal(true);
    });

    it('should open URL on macOS', async () => {
      platformStub.value('darwin');
      await pullCraft.openUrl('https://example.com');
      expect(execStub.calledWith('open "https://example.com"')).to.equal(true);
      expect(consoleLogStub.calledWith('Opening URL: https://example.com on darwin')).to.equal(true);
    });

    it('should open URL on Windows', async () => {
      platformStub.value('win32');
      await pullCraft.openUrl('https://example.com');
      expect(execStub.calledWith('start "https://example.com"')).to.equal(true);
      expect(consoleLogStub.calledWith('Opening URL: https://example.com on win32')).to.equal(true);
    });

    it('should log error for unsupported OS', async () => {
      platformStub.value('freebsd');
      await pullCraft.openUrl('https://example.com');
      expect(consoleErrorStub.calledWith('Unsupported OS')).to.equal(true);
    });

    it('should not open URL if openPr is false', async () => {
      pullCraft.openPr = false;
      await pullCraft.openUrl('http://example.com');
      expect(execStub.called).to.equal(false);
    });

    it('should handle unsupported OS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'unsupported' });

      await pullCraft.openUrl('http://example.com');

      expect(consoleErrorStub.calledWith('Unsupported OS')).to.equal(true);
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle error when opening URL', async () => {
      execStub.throws(new Error('Failed to open URL'));

      try {
        await pullCraft.openUrl('http://example.com');
      } catch (error: any) {
        expect(error.message).to.equal('Failed to open URL');
      }

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.args[0][0]).to.equal('Error opening URL: Failed to open URL');
    });
  });

  describe('getRepoInfo', () => {
    it('should get repository info with ssh', async () => {
      sinon.stub(pullCraft.git, 'raw').resolves('git@github.com:owner/repo.git\n');
      const repoInfo = await pullCraft.getRepoInfo();
      expect(repoInfo).to.deep.equal({ owner: 'owner', repo: 'repo' });
    });

    it('should get repository info with https', async () => {
      sinon.stub(pullCraft.git, 'raw').resolves('https://github.com/owner/repo\n');
      const repoInfo = await pullCraft.getRepoInfo();
      expect(repoInfo).to.deep.equal({ owner: 'owner', repo: 'repo' });
    });

    it('should throw an error for invalid repo URL', async () => {
      sinon.stub(pullCraft.git, 'raw').resolves('invalid-url');
      await expect(pullCraft.getRepoInfo()).to.be.rejectedWith('Failed to get repo info from invalid-url');
    });
  });

  describe('getNewFiles', () => {
    it('should get new files', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'raw');

      // Stub for the first call to get new filenames
      gitStub.onFirstCall().resolves('file1.txt\nfile2.txt\n');

      // Stubs for subsequent calls to get file diffs
      gitStub.onSecondCall().resolves('diff --git a/file1.txt b/file1.txt\n...');
      gitStub.onThirdCall().resolves('diff --git a/file2.txt b/file2.txt\n...');

      const result = await pullCraft.getNewFiles('develop', 'feature-branch');

      expect(gitStub.getCall(0).args[0]).to.deep.equal(['diff', '--name-only', '--diff-filter=A', 'develop', 'feature-branch']);

      expect(gitStub.getCall(1).args[0]).to.deep.equal(['diff', 'develop', 'feature-branch', '--', 'file1.txt']);

      expect(gitStub.getCall(2).args[0]).to.deep.equal(['diff', 'develop', 'feature-branch', '--', 'file2.txt']);

      expect(result).to.equal(
        'diff --git a/file1.txt b/file1.txt\n...diff --git a/file2.txt b/file2.txt\n...'
      );
    });
    it('should handle large files', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'raw');

      gitStub.onFirstCall().resolves('large_file.txt\n');

      // Simulate a large file diff
      const largeDiff = 'diff\n'.repeat(pullCraft.diffThreshold + 1);
      gitStub.onSecondCall().resolves(largeDiff);

      const result = await pullCraft.getNewFiles('develop', 'feature-branch');

      expect(result).to.include('File large_file.txt is too large to display in the diff. Skipping.');
    });

    it('should handle error when getting new files', async () => {
      const errorMessage = 'Failed to get new files';
      const gitStub = sinon.stub(pullCraft.git, 'raw').rejects(new Error(errorMessage));

      await expect(pullCraft.getNewFiles('develop', 'feature-branch')).to.be.rejectedWith(errorMessage);
      expect(consoleErrorStub.calledOnce).to.equal(true);
    });

    it('should handle large new files', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'raw');
      gitStub.onFirstCall().resolves('large_file.txt\n');
      gitStub.onSecondCall().resolves('a\n'.repeat(pullCraft.diffThreshold + 1));

      const result = await pullCraft.getNewFiles('develop', 'feature-branch');

      expect(result).to.include('File large_file.txt is too large to display in the diff. Skipping.');
    });
  });

  describe('getModifiedFiles', () => {
    it('should get diff for modified files between branches', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const modifiedFilenamesOutput = 'file1.txt\nfile2.txt\n';
      const diffOutput1 = 'diff --git a/file1.txt b/file1.txt\nindex 83db48f..f735c2d 100644\n--- a/file1.txt\n+++ b/file1.txt\n@@ -1 +1 @@\n-Hello\n+Hello World\n';
      const diffOutput2 = 'diff --git a/file2.txt b/file2.txt\nindex 83db48f..f735c2d 100644\n--- a/file2.txt\n+++ b/file2.txt\n@@ -1 +1 @@\n-Goodbye\n+Goodbye World\n';

      const gitStub = sinon.stub(pullCraft.git, 'raw');
      gitStub.onCall(0).resolves(modifiedFilenamesOutput);
      gitStub.onCall(1).resolves(diffOutput1);
      gitStub.onCall(2).resolves(diffOutput2);

      const result = await pullCraft.getModifiedFiles(baseBranch, compareBranch);

      expect(result).to.equal(diffOutput1 + diffOutput2);
      expect(gitStub.callCount).to.equal(3);
      expect(gitStub.getCall(0).args[0]).to.deep.equal(['diff', '--name-only', '--diff-filter=M', baseBranch, compareBranch]);
      expect(gitStub.getCall(1).args[0]).to.deep.equal(['diff', baseBranch, compareBranch, '--', 'file1.txt']);
      expect(gitStub.getCall(2).args[0]).to.deep.equal(['diff', baseBranch, compareBranch, '--', 'file2.txt']);
    });

    it('should skip files over diffThreshold lines', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const modifiedFilenamesOutput = 'file1.txt\nfile2.txt\n';
      const shortDiffOutput = 'Short diff';
      const longDiffOutput = 'a\n'.repeat(pullCraft.diffThreshold + 1);

      const gitStub = sinon.stub(pullCraft.git, 'raw');
      gitStub.onCall(0).resolves(modifiedFilenamesOutput);
      gitStub.onCall(1).resolves(shortDiffOutput);
      gitStub.onCall(2).resolves(longDiffOutput);

      let capturedLog = '';
      consoleLogStub.callsFake((message) => {
        capturedLog = message;
      });

      const result = await pullCraft.getModifiedFiles(baseBranch, compareBranch);

      expect(result).to.equal(shortDiffOutput + '\n\n\nFile file2.txt is too large to display in the diff. Skipping.\n\n\n');
      expect(capturedLog).to.equal('File file2.txt is too large to display in the diff. Skipping.');
    });

    it('should handle errors', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const errorMessage = 'Error getting modified files';

      const gitStub = sinon.stub(pullCraft.git, 'raw');
      gitStub.rejects(new Error(errorMessage));

      await expect(pullCraft.getModifiedFiles(baseBranch, compareBranch)).to.be.rejectedWith(errorMessage);
      expect(consoleErrorStub.calledOnce).to.equal(true);
    });
    it('should handle large files', async () => {
      pullCraft.diffThreshold = 5;
      sinon.stub(pullCraft.git, 'raw')
        .onFirstCall().resolves('file1\nfile2')
        .onSecondCall().resolves('1\n2\n3\n4\n5\n6')
        .onThirdCall().resolves('1\n2\n3\n4');

      const result = await pullCraft.getModifiedFiles('base', 'compare');

      expect(result).to.include('File file1 is too large to display in the diff');
      expect(result).to.include('1\n2\n3\n4');
    });
  });

  describe('getFilenames', () => {
    it('should get filenames between branches', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const filenamesOutput = 'file1.txt\nfile2.txt\n';
      const gitStub = sinon.stub(pullCraft.git, 'raw').resolves(filenamesOutput);
      const filenames = await pullCraft.getFilenames(baseBranch, compareBranch);
      expect(filenames).to.equal(filenamesOutput);
    });

    it('should handle errors', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const errorMessage = 'Error getting filenames';
      const gitStub = sinon.stub(pullCraft.git, 'raw').rejects(new Error(errorMessage));
      await expect(pullCraft.getFilenames(baseBranch, compareBranch)).to.be.rejectedWith(errorMessage);
      expect(consoleErrorStub.calledOnce).to.equal(true);
    });
  });

  describe('gptCall', () => {
    it('should call OpenAI API', async () => {
      const content = JSON.stringify({ body: 'PR body', title: 'PR title' });
      openaiStub.resolves({ choices: [{ message: { content } }] });
      const response = await pullCraft.gptCall('prompt');
      expect(response).to.equal(content);
      expect(openaiStub.calledOnce).to.equal(true);
    });

    it('should handle error when calling OpenAI API', async () => {
      openaiStub.rejects(new Error('Failed to call OpenAI API'));
      const response = await pullCraft.gptCall('prompt');
      expect(response).to.equal(undefined);
      expect(openaiStub.calledOnce).to.equal(true);
    });

    it('should include hint in system prompt when provided', async () => {
      openaiStub.resolves({ choices: [{ message: { content: '{"title":"Test Title","body":"Test Body"}' } }] });
      pullCraft.hint = 'This is a test hint';

      await pullCraft.gptCall('Test prompt');

      expect(openaiStub.calledOnce).to.equal(true);
      const callArgs = openaiStub.firstCall.args[0];
      expect(callArgs.messages[0].content).to.include('This is a test hint');
    });
  });

  describe('differ', () => {
    it('should return response with exit true when there are no differences', async () => {
      // Setup stubs to simulate no differences
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getDiffStub = sinon.stub(pullCraft, 'getModifiedFiles').resolves('');
      const getNewFilesStub = sinon.stub(pullCraft, 'getNewFiles').resolves('');
      const getFilenamesStub = sinon.stub(pullCraft, 'getFilenames').resolves('');

      const result = await pullCraft.differ('develop', 'feature-branch');
      expect(result).to.deep.equal({
        response: 'No changes found between the specified branches.',
        exit: true
      });
    });

    it('should return GPT response when there are changes', async () => {
      // Setup stubs to simulate differences
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getDiffStub = sinon.stub(pullCraft, 'getModifiedFiles').resolves('some diff');
      const getNewFilesStub = sinon.stub(pullCraft, 'getNewFiles').resolves('newFile.js');
      const getFilenamesStub = sinon.stub(pullCraft, 'getFilenames').resolves('file1.js\nfile2.js');
      const buildTextPromptStub = sinon.stub(pullCraft, 'buildTextPrompt').returns('prompt');
      const gptCallStub = sinon.stub(pullCraft, 'gptCall').resolves('GPT response');

      const result = await pullCraft.differ('develop', 'feature-branch');
      expect(result).to.deep.equal({
        response: 'GPT response',
        exit: false
      });
    });

    it('should handle dumpTo option', async () => {
      // Setup stubs and temporary dumpTo option
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getDiffStub = sinon.stub(pullCraft, 'getModifiedFiles').resolves('some diff');
      const getNewFilesStub = sinon.stub(pullCraft, 'getNewFiles').resolves('newFile.js');
      const getFilenamesStub = sinon.stub(pullCraft, 'getFilenames').resolves('file1.js\nfile2.js');
      const dumpStub = sinon.stub(pullCraft, 'dump');

      pullCraft.dumpTo = 'test-dump.txt';

      const result = await pullCraft.differ('develop', 'feature-branch');
      expect(result).to.deep.equal({
        response: 'Diff dumped to test-dump.txt',
        exit: true
      });
      expect(dumpStub.calledOnce).to.equal(true);

      // Reset dumpTo option
      pullCraft.dumpTo = '';
    });

    it('should handle errors and log them', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').throws(new Error('revparse error'));

      const result = await pullCraft.differ('develop');
      expect(result).to.equal(undefined);
      expect(consoleErrorStub.calledWith('Error generating PR body: revparse error')).to.equal(true);
    });

    it('should include hint in GPT response when provided', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getDiffStub = sinon.stub(pullCraft, 'getModifiedFiles').resolves('some diff');
      const getNewFilesStub = sinon.stub(pullCraft, 'getNewFiles').resolves('newFile.js');
      const getFilenamesStub = sinon.stub(pullCraft, 'getFilenames').resolves('file1.js\nfile2.js');
      const buildTextPromptStub = sinon.stub(pullCraft, 'buildTextPrompt').returns('prompt with hint');
      const gptCallStub = sinon.stub(pullCraft, 'gptCall').resolves('GPT response with hint');

      pullCraft.hint = 'This is a hint';

      const result = await pullCraft.differ('develop', 'feature-branch');
      expect(result).to.deep.equal({
        response: 'GPT response with hint',
        exit: false
      });
      expect(buildTextPromptStub.calledWith(sinon.match.any)).to.equal(true);

      // Reset hint
      pullCraft.hint = '';
    });
    it('should return early if dumpTo is set', async () => {
      const gitStub = sinon.stub(pullCraft.git);
      gitStub.revparse.resolves('feature-branch');

      const getModifiedFilesStub = sinon.stub(pullCraft, 'getModifiedFiles').resolves('modified content');
      const getNewFilesStub = sinon.stub(pullCraft, 'getNewFiles').resolves('new content');
      const getFilenamesStub = sinon.stub(pullCraft, 'getFilenames').resolves('modified-file.txt\nnew-file.txt');
      const dumpStub = sinon.stub(pullCraft, 'dump');

      pullCraft.dumpTo = 'dump.txt';

      const result = await pullCraft.differ('develop');

      expect(result).to.deep.equal({ response: 'Diff dumped to dump.txt', exit: true });
      expect(dumpStub.calledOnce).to.equal(true);

      const dumpContent = dumpStub.firstCall.args[0];
      expect(dumpContent).to.equal('modified content');
      expect(dumpContent).to.not.include('new content');
      expect(dumpContent).to.not.include('modified-file.txt\nnew-file.txt');

      expect(getModifiedFilesStub.calledOnce).to.equal(true);
      expect(getNewFilesStub.calledOnce).to.equal(true);
      expect(getFilenamesStub.calledOnce).to.equal(true);

      pullCraft.dumpTo = '';

      // Restore the original methods
      getModifiedFilesStub.restore();
      getNewFilesStub.restore();
      getFilenamesStub.restore();
    });
  });

  describe('createPr', () => {
    it('should create or update a pull request', async () => {
      const content = JSON.stringify({ body: 'PR body', title: 'PR title' });
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: content, exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ data: { html_url: 'http://example.com' } });
      const openUrlStub = sinon.stub(pullCraft, 'openUrl').resolves();

      await pullCraft.createPr('develop');

      expect(gitStub.calledOnceWith(['--abbrev-ref', 'HEAD'])).to.equal(true);
      expect(differStub.calledOnceWith('develop', 'feature-branch')).to.equal(true);
      expect(getRepoInfoStub.calledOnce).to.equal(true);
      expect(listPullsStub.calledOnceWith({ owner: 'owner', repo: 'repo', head: 'feature-branch', base: 'develop' })).to.equal(true);
      expect(createPullStub.calledOnceWith({
        owner: 'owner',
        repo: 'repo',
        title: 'PR title',
        body: 'PR body',
        base: 'develop',
        head: 'feature-branch'
      })).to.equal(true);
      expect(openUrlStub.calledOnceWith('http://example.com')).to.equal(true);
    });

    it('should handle error when creating or updating a pull request', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').rejects(new Error('Failed to get current branch'));
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: 'PR body', exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ url: 'http://example.com' });

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnceWith('Error creating PR: Failed to get current branch')).to.equal(true);
    });

    it('should include hint in PR creation when provided', async () => {
      const content = JSON.stringify({ body: 'PR body with hint', title: 'PR title' });
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: content, exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ data: { html_url: 'http://example.com' } });
      const openUrlStub = sinon.stub(pullCraft, 'openUrl').resolves();

      pullCraft.hint = 'This is a PR hint';

      await pullCraft.createPr('develop');

      expect(differStub.calledOnceWith('develop', 'feature-branch')).to.equal(true);
      expect(createPullStub.calledOnceWith({
        owner: 'owner',
        repo: 'repo',
        title: 'PR title',
        body: 'PR body with hint',
        base: 'develop',
        head: 'feature-branch'
      })).to.equal(true);

      // Reset hint
      pullCraft.hint = '';
    });

    it('should handle error when getting repository info', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').rejects(new Error('Failed to get repo info'));

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('Error creating PR: Failed to get repo info');
    });

    it('should handle error when parsing AI response', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: 'Invalid JSON', exit: false });

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('AI Response could not be parsed');
    });

    it('should handle missing body in AI response', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: JSON.stringify({ title: 'PR Title' }), exit: false });

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('PR body could not be retrieved');
    });

    it('should handle missing title in AI response', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: JSON.stringify({ body: 'PR Body' }), exit: false });

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('PR title could not be retrieved');
    });

    it('should handle error when differ returns undefined', async () => {
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      const differStub = sinon.stub(pullCraft, 'differ').resolves(undefined);

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('Cannot destructure');
    });
    it('should handle case when getRepoInfo returns null', async () => {
      // @ts-expect-error - testing
      sinon.stub(pullCraft, 'getRepoInfo').resolves(null);

      await pullCraft.createPr();

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(consoleErrorStub.firstCall.args[0]).to.include('Repository information could not be retrieved');
    });

    it('should handle case when differ returns exit: true', async () => {
      sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      sinon.stub(pullCraft, 'differ').resolves({ response: 'No changes', exit: true });

      const result = await pullCraft.createPr();

      expect(result).to.equal(undefined);
    });
  });

  describe('dump', () => {
    it('should dump diff to a file', () => {
      const fsWriteFileSync = sinon.stub(fs, 'writeFileSync');
      pullCraft.dumpTo = 'test-dump.txt';
      pullCraft.dump('Test diff content');

      expect(fsWriteFileSync.calledOnceWith('test-dump.txt', 'Test diff content')).to.equal(true);
      fsWriteFileSync.restore();
    });
  });

  describe('buildTextPrompt', () => {
    it('should build text prompt with replacements', () => {
      pullCraft.replacements = { customKey: 'CustomValue' };
      pullCraft.standardReplacements = { baseBranch: 'main', compareBranch: 'feature' };
      pullCraft.openaiConfig.titleTemplate = 'PR: __customKey__ from __compareBranch__ to __baseBranch__';
      pullCraft.openaiConfig.bodyTemplate = 'Changes in __compareBranch__';

      const result = pullCraft.buildTextPrompt({
        diff: 'Test diff',
        newFiles: 'New files',
        filenames: 'file1.txt\nfile2.txt'
      });

      expect(result).to.include('PR: CustomValue from feature to main');
      expect(result).to.include('Changes in feature');
      expect(result).to.include('Test diff');
      expect(result).to.include('New files');
      expect(result).to.include('file1.txt\nfile2.txt');
    });
  });

  describe('isGhCliAvailable', () => {
    it('should return false when gh CLI is not available', () => {
      const execSyncStub = sinon.stub(childProcess, 'execSync').throws();
      const result = pullCraft.isGhCliAvailable();
      expect(result).to.equal(false);
      execSyncStub.restore();
    });
  });
});
