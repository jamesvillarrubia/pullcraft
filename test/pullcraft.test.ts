// import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from 'chai';
import * as nock from 'nock';
import * as sinon from 'sinon';
import { describe, it } from 'mocha';

// import simpleGit from 'simple-git';
import PullCraft from '../src/index';
// import proxyquire from 'proxyquire';
import childProcess from 'child_process';

delete process.env.OPENAI_API_KEY;
delete process.env.GITHUB_TOKEN;

async function testErrorHandling (
  fn: () => Promise<any>,
  expectedErrorMessage: any
) {
  const consoleErrorStub = sinon.stub(console, 'error');
  try {
    await fn();
    throw new Error('Function did not throw');
  } catch (error: any) {
    expect(error.message).to.equal(expectedErrorMessage);
    expect(consoleErrorStub.calledOnce).to.be.true;
  } finally {
    consoleErrorStub.restore();
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
  });

  afterEach(() => {
    sinon.restore();
    nock.cleanAll();
  });

  describe('Constructor', () => {
    it('should throw an error if OPENAI_API_KEY is not set', () => {
      expect(() => new PullCraft({ githubToken: 'fake-github-token' })).to.throw('Error: OPENAI_API_KEY is not set');
    });

    it('should throw an error if GITHUB_TOKEN is not set', () => {
      expect(() => new PullCraft({ openai: { apiKey: 'fake-openai-api-key' }, githubStrategy: 'octokit' })).to.throw('Error: GITHUB_TOKEN is not set');
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
    it('should throw an error if URL is not provided', async () => {
      const consoleErrorStub = sinon.stub(console, 'error');
      try {
        await pullCraft.openUrl('');
        throw new Error('Function did not throw');
      } catch (error: any) {
        expect(error.message).to.equal('Error: URL is required');
      }
    });

    it('should not open URL if openPr is false', async () => {
      pullCraft.openPr = false;
      const result = await pullCraft.openUrl('http://example.com');
      expect(result).to.be.undefined;
      expect(execStub.called).to.be.false;
    });

    it('should handle unsupported OS', async () => {
      sinon.stub(console, 'log');
      sinon.stub(process, 'platform').value('unsupportedOS');
      const consoleErrorStub = sinon.stub(console, 'error');

      const result = await pullCraft.openUrl('http://example.com');

      expect(result).to.be.undefined;
      expect(execStub.called).to.be.false;
      expect(consoleErrorStub.calledWith('Unsupported OS')).to.be.true;
    });

    it('should handle error when opening URL', async () => {
      sinon.stub(console, 'log');
      sinon.stub(process, 'platform').value('linux');
      execStub.yields(new Error('Failed to open URL'));
      const consoleErrorStub = sinon.stub(console, 'error');

      try {
        await pullCraft.openUrl('http://example.com');
        throw new Error('Function did not throw');
      } catch (error: any) {
        expect(error.message).to.not.be.undefined;
        expect(consoleErrorStub.calledOnce).to.be.true;
        //  .calledWith('Error opening URL: Failed to open URL')).to.be.true;
      }
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

    it('should handle error when getting repository info', async () => {
      sinon.stub(pullCraft.git, 'raw').rejects(new Error('Failed to get repo info'));
      await testErrorHandling(() => pullCraft.getRepoInfo(), 'Failed to get repo info');
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

      await testErrorHandling(() => pullCraft.getNewFiles('develop', 'feature-branch'), errorMessage);
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
      const consoleLogStub = sinon.stub(console, 'log').callsFake((message) => {
        capturedLog = message;
      });

      const result = await pullCraft.getModifiedFiles(baseBranch, compareBranch);

      expect(result).to.equal(shortDiffOutput + '\n\n\nFile file2.txt is too large to display in the diff. Skipping.\n\n\n');
      expect(capturedLog).to.equal('File file2.txt is too large to display in the diff. Skipping.');

      consoleLogStub.restore();
    });

    it('should handle errors', async () => {
      const baseBranch = 'main';
      const compareBranch = 'feature';
      const errorMessage = 'Error getting modified files';

      const gitStub = sinon.stub(pullCraft.git, 'raw');
      gitStub.rejects(new Error(errorMessage));

      await testErrorHandling(() => pullCraft.getModifiedFiles(baseBranch, compareBranch), errorMessage);
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
      await testErrorHandling(() => pullCraft.getFilenames(baseBranch, compareBranch), errorMessage);
    });
  });

  describe('gptCall', () => {
    it('should call OpenAI API', async () => {
      const content = JSON.stringify({ body: 'PR body', title: 'PR title' });
      openaiStub.resolves({ choices: [{ message: { content } }] });
      const response = await pullCraft.gptCall('prompt');
      expect(response).to.equal(content);
      expect(openaiStub.calledOnce).to.be.true;
    });

    it('should handle error when calling OpenAI API', async () => {
      openaiStub.rejects(new Error('Failed to call OpenAI API'));
      sinon.stub(console, 'error');
      const response = await pullCraft.gptCall('prompt');
      expect(response).to.be.undefined;
      expect(openaiStub.calledOnce).to.be.true;
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
      expect(dumpStub.calledOnce).to.be.true;

      // Reset dumpTo option
      pullCraft.dumpTo = '';
    });

    it('should handle errors and log them', async () => {
      // Setup stubs to throw an error
      const consoleErrorStub = sinon.stub(console, 'error');
      const gitStub = sinon.stub(pullCraft.git, 'revparse').throws(new Error('revparse error'));

      const result = await pullCraft.differ('develop');
      expect(result).to.be.undefined;
      expect(consoleErrorStub.calledWith('Error generating PR body: revparse error')).to.be.true;

      consoleErrorStub.restore();
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
      expect(buildTextPromptStub.calledWith(sinon.match.any)).to.be.true;

      // Reset hint
      pullCraft.hint = '';
    });
  });

  describe('createPr', () => {
    it('should create or update a pull request', async () => {
      sinon.stub(console, 'log');
      const content = JSON.stringify({ body: 'PR body', title: 'PR title' });
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: content, exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ data: { html_url: 'http://example.com' } });
      const openUrlStub = sinon.stub(pullCraft, 'openUrl').resolves();

      await pullCraft.createPr('develop');

      expect(gitStub.calledOnceWith(['--abbrev-ref', 'HEAD'])).to.be.true;
      expect(differStub.calledOnceWith('develop', 'feature-branch')).to.be.true;
      expect(getRepoInfoStub.calledOnce).to.be.true;
      expect(listPullsStub.calledOnceWith({ owner: 'owner', repo: 'repo', head: 'feature-branch', base: 'develop' })).to.be.true;
      expect(createPullStub.calledOnceWith({
        owner: 'owner',
        repo: 'repo',
        title: 'PR title',
        body: 'PR body',
        base: 'develop',
        head: 'feature-branch'
      })).to.be.true;
      expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
    });

    it('should handle error when creating or updating a pull request', async () => {
      const consoleErrorStub = sinon.stub(console, 'error');
      const gitStub = sinon.stub(pullCraft.git, 'revparse').rejects(new Error('Failed to get current branch'));
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: 'PR body', exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ url: 'http://example.com' });

      await pullCraft.createPr('develop');

      expect(consoleErrorStub.calledOnceWith('Error creating PR: Failed to get current branch')).to.be.true;
    });

    it('should include hint in PR creation when provided', async () => {
      sinon.stub(console, 'log');
      const content = JSON.stringify({ body: 'PR body with hint', title: 'PR title' });
      const gitStub = sinon.stub(pullCraft.git, 'revparse').resolves('feature-branch\n');
      const differStub = sinon.stub(pullCraft, 'differ').resolves({ response: content, exit: false });
      const getRepoInfoStub = sinon.stub(pullCraft, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
      listPullsStub.resolves([]);
      createPullStub.resolves({ data: { html_url: 'http://example.com' } });
      const openUrlStub = sinon.stub(pullCraft, 'openUrl').resolves();

      pullCraft.hint = 'This is a PR hint';

      await pullCraft.createPr('develop');

      expect(differStub.calledOnceWith('develop', 'feature-branch')).to.be.true;
      expect(createPullStub.calledOnceWith({
        owner: 'owner',
        repo: 'repo',
        title: 'PR title',
        body: 'PR body with hint',
        base: 'develop',
        head: 'feature-branch'
      })).to.be.true;

      // Reset hint
      pullCraft.hint = '';
    });
  });
});
