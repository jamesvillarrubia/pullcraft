import { expect } from 'chai';
import * as nock from 'nock';
import * as sinon from 'sinon';
import simpleGit from 'simple-git';
import PrBot from '../src/index';
import proxyquire from 'proxyquire';

import { ChildProcess } from 'child_process';


describe('PrBot', () => {
    let prBot: PrBot;
    let openaiStub: sinon.SinonStub;
    let openUrlStub: sinon.SinonStub;
    let gitStub: sinon.SinonStub;

    beforeEach(() => {
        openUrlStub = sinon.stub().resolves({} as ChildProcess);
        const { PrBot } = proxyquire('../src/index', {
            '../src/openWrapper': { openUrl: openUrlStub }
        });

        prBot = new PrBot('fake-openai-api-key', 'fake-github-token');
        openaiStub = sinon.stub(prBot.openai.completions, 'create');
    });

    afterEach(() => {
        sinon.restore();
        nock.cleanAll();
    });

    describe('Constructor', () => {
        it('should throw an error if OPENAI_API_KEY is not set', () => {
            //@ts-expect-error
            expect(() => new PrBot(null, 'fake-github-token')).to.throw("Error: OPENAI_API_KEY is not set");
        });

        it('should throw an error if GITHUB_TOKEN is not set', () => {
            //@ts-expect-error
            expect(() => new PrBot('fake-openai-api-key', null)).to.throw("Error: GITHUB_TOKEN is not set");
        });
    });

    describe('openUrl', () => {
        it('should open a URL', async () => {
            await prBot.openUrl('http://example.com');
            expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
        });

        it('should handle error when opening a URL', async () => {
            openUrlStub.rejects(new Error('Failed to open URL'));
            sinon.stub(console, 'error');
            try {
                await prBot.openUrl('http://example.com');
            } catch (error) {
                expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
            }
        });
    });

    describe('getRepoInfo', () => {
        it('should get repository info', async () => {
            sinon.stub(prBot.git, 'raw').resolves('git@github.com:owner/repo.git\n');
            const repoInfo = await prBot.getRepoInfo();
            expect(repoInfo).to.deep.equal({ owner: 'owner', repo: 'repo' });
        });

        it('should handle error when getting repository info', async () => {
            const gitStub = sinon.stub(prBot.git, 'raw').rejects(new Error('Failed to get repo info'));
            const consoleErrorStub = sinon.stub(console, 'error');
            const repoInfo = await prBot.getRepoInfo();
            expect(repoInfo).to.be.undefined;
            expect(consoleErrorStub.calledWith('Failed to get repo info')).to.be.true;
        });
    });

    describe('getNewFiles', () => {
        it('should get new files', async () => {
            const gitStub = sinon.stub(prBot.git, 'diff').resolves('diff --git a/file.txt b/file.txt\n');
            const result = await prBot.getNewFiles('develop', 'feature-branch');
            expect(gitStub.calledOnceWith(['--diff-filter=A', 'develop', 'feature-branch', '--', '.', ...prBot.exclusions])).to.be.true;
            expect(result).to.equal('diff --git a/file.txt b/file.txt\n');
        
        });

        it('should handle error when getting new files', async () => {
            const errorMessage = 'Failed to get new files';
            const gitStub = sinon.stub(prBot.git, 'diff').rejects(new Error(errorMessage));
            const consoleErrorStub = sinon.stub(console, 'error');
            const newFiles = await prBot.getNewFiles('develop', 'feature-branch');
            expect(gitStub.calledOnceWith(['--diff-filter=A', 'develop', 'feature-branch', '--', '.', ...prBot.exclusions])).to.be.true;
            expect(newFiles).to.be.undefined;
            expect(consoleErrorStub.calledWith(`Error getting new files: ${errorMessage}`)).to.be.true;
        });
    });


    describe('getDiff', () => {
        it('should get diff between branches', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const diffOutput = 'diff --git a/file1.txt b/file1.txt\nindex 83db48f..f735c2d 100644\n--- a/file1.txt\n+++ b/file1.txt\n@@ -1 +1 @@\n-Hello\n+Hello World\n';
            const gitStub = sinon.stub(prBot.git, 'diff').resolves(diffOutput);
            // sinon.stub(prBot, 'git').get(() => prBot.git); // Ensure prBot uses the stubbed git instance

            const diff = await prBot.getDiff(baseBranch, compareBranch);
            expect(diff).to.equal(diffOutput);
        });

        it('should handle errors', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const errorMessage = 'Error getting diff';
            const gitStub = sinon.stub(prBot.git, 'diff').rejects(new Error(errorMessage));
            // sinon.stub(prBot, 'git').get(() => prBot.git); // Ensure prBot uses the stubbed git instance

            const consoleErrorStub = sinon.stub(console, 'error');
            const diff = await prBot.getDiff(baseBranch, compareBranch);
            expect(diff).to.be.undefined;
            expect(consoleErrorStub.calledWith(`Error getting diff: ${errorMessage}`)).to.be.true;
        });
    });
    describe('getFilenames', () => {
        it('should get filenames between branches', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const filenamesOutput = 'file1.txt\nfile2.txt\n';
            const gitStub = sinon.stub(prBot.git, 'diff').resolves(filenamesOutput);
            // sinon.stub(prBot, 'git').get(() => PrBot.git); // Ensure prBot uses the stubbed git instance

            const filenames = await prBot.getFilenames(baseBranch, compareBranch);
            expect(filenames).to.equal(filenamesOutput);
        });

        it('should handle errors', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const errorMessage = 'Error getting filenames';
            const gitStub = sinon.stub(prBot.git, 'diff').rejects(new Error(errorMessage));
            // sinon.stub(prBot, 'git').get(() => PrBot.git); // Ensure prBot uses the stubbed git instance

            const consoleErrorStub = sinon.stub(console, 'error');
            const filenames = await prBot.getFilenames(baseBranch, compareBranch);
            expect(filenames).to.be.undefined;
            expect(consoleErrorStub.calledWith(`Error getting filenames: ${errorMessage}`)).to.be.true;
        });
    });

    describe('gptCall', () => {
        it('should call OpenAI API', async () => {
            openaiStub.resolves({ data: { choices: [{ text: 'PR body' }] } });
            const response = await prBot.gptCall('prompt');
            expect(response).to.equal('PR body');
            expect(openaiStub.calledOnce).to.be.true;
        });

        it('should handle error when calling OpenAI API', async () => {
            openaiStub.rejects(new Error('Failed to call OpenAI API'));
            sinon.stub(console, 'error');
            const response = await prBot.gptCall('prompt');
            expect(response).to.be.undefined;
            expect(openaiStub.calledOnce).to.be.true;
        });
    });

    describe('createPr', () => {
        it('should create a new PR', async () => {
            sinon.stub(console, 'log');
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            const differStub = sinon.stub(prBot, 'differ').resolves('PR body');
            const getRepoInfoStub = sinon.stub(prBot, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
            const pullsListStub = sinon.stub(prBot.octokit.pulls, 'list').resolves({ data: [] });
            const pullsCreateStub = sinon.stub(prBot.octokit.pulls, 'create').resolves({ data: { html_url: 'http://example.com' } });
            const openUrlStub = sinon.stub(prBot, 'openUrl').resolves();

            await prBot.createPr('develop');
    
            expect(gitStub.calledOnceWith(['--abbrev-ref', 'HEAD'])).to.be.true;
            expect(differStub.calledOnceWith('develop', 'feature-branch')).to.be.true;
            expect(getRepoInfoStub.calledOnce).to.be.true;
            expect(pullsListStub.calledOnceWith({ owner: 'owner', repo: 'repo', base: 'develop', head: 'feature-branch'})).to.be.true;
            expect(pullsCreateStub.calledOnce).to.be.true;
            expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
        });

        it('should update an existing PR', async () => {
            sinon.stub(console, 'log');
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            const differStub = sinon.stub(prBot, 'differ').resolves('PR body');
            const getRepoInfoStub = sinon.stub(prBot, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
            const pullsListStub = sinon.stub(prBot.octokit.pulls, 'list').resolves({ data: [{ number: 1 }] });
            const pullsUpdateStub = sinon.stub(prBot.octokit.pulls, 'update').resolves();

            await prBot.createPr('develop');

            expect(gitStub.calledOnceWith(['--abbrev-ref', 'HEAD'])).to.be.true;
            expect(differStub.calledOnceWith('develop', 'feature-branch')).to.be.true;
            expect(getRepoInfoStub.calledOnce).to.be.true;
            expect(pullsListStub.calledOnceWith({ owner: 'owner', repo: 'repo', base: 'develop', head: 'feature-branch' })).to.be.true;
            expect(pullsUpdateStub.calledOnce).to.be.true;
        });
    });
});
