import { expect } from 'chai';
import * as nock from 'nock';
import * as sinon from 'sinon';
import simpleGit from 'simple-git';
import PrBot from '../src/index';
import proxyquire from 'proxyquire';
import { GitHubClient, OctokitClient, GhClient } from '../src/githubClient';

import { ChildProcess, exec } from 'child_process';

delete process.env.OPENAI_API_KEY
delete process.env.GITHUB_TOKEN


async function testErrorHandling(fn: () => Promise<any>, expectedErrorMessage:any) {
    const consoleErrorStub = sinon.stub(console, 'error')
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


describe('PrBot', () => {
    let prBot: PrBot;
    let openaiStub: sinon.SinonStub;
    let openUrlStub: sinon.SinonStub;
    let gitStub: sinon.SinonStub;
    let createPullStub: sinon.SinonStub;
    let listPullsStub: sinon.SinonStub;
    let updatePullStub: sinon.SinonStub;
    let execStub: sinon.SinonStub;

    beforeEach(() => {
        prBot = new PrBot({ openai:{apiKey:'fake-openai-api-key'}, githubToken: 'fake-github-token'});
        openaiStub = sinon.stub(prBot.openai.chat.completions, 'create');
        // openUrlStub = sinon.stub(prBot,'openUrl').resolves({} as ChildProcess);
        createPullStub = sinon.stub(prBot.gitHubClient, 'createPull');
        listPullsStub = sinon.stub(prBot.gitHubClient, 'listPulls');
        updatePullStub = sinon.stub(prBot.gitHubClient, 'updatePull');
        execStub = sinon.stub(require('child_process'), 'exec');

    });

    afterEach(() => {
        sinon.restore();
        nock.cleanAll();
    });

    describe('Constructor', () => {
        it('should throw an error if OPENAI_API_KEY is not set', () => {
            expect(() => new PrBot({githubToken:'fake-github-token'})).to.throw("Error: OPENAI_API_KEY is not set");
        });

        it('should throw an error if GITHUB_TOKEN is not set', () => {
            expect(() => new PrBot({openai:{apiKey:'fake-openai-api-key'},githubStrategy:'octokit'})).to.throw("Error: GITHUB_TOKEN is not set");
        });
    });

    describe('replacePlaceholders', () => {
        it('should replace a single placeholder in the template string', () => {
            const template = 'Hello, __name__!';
            const replacements = { name: 'World' };
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, World!');
        });

        it('should replace multiple placeholders in the template string', () => {
            const template = 'Hello, __name__! Welcome to __place__.';
            const replacements = { name: 'Alice', place: 'Wonderland' };
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, Alice! Welcome to Wonderland.');
        });

        it('should handle placeholders with different patterns', () => {
            const template = 'Hello, {{name}}!';
            const replacements = { name: 'Bob' };
            const result = prBot.replacePlaceholders(template, replacements, '{{KEY}}');
            expect(result).to.equal('Hello, Bob!');
        });

        it('should not replace anything if no placeholders match', () => {
            const template = 'Hello, __name__!';
            const replacements = { place: 'World' };
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, __name__!');
        });

        it('should replace placeholders with empty strings if the value is empty', () => {
            const template = 'Hello, __name__!';
            const replacements = { name: '' };
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, !');
        });

        it('should leave placeholder alone if replacements are empty', () => {
            const template = 'Hello, __name__!';
            const replacements = {};
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, __name__!');
        });

        it('should leave template alone if there are no placeholders', () => {
            const template = 'Hello, name!';
            const replacements = {};
            const result = prBot.replacePlaceholders(template, replacements);
            expect(result).to.equal('Hello, name!');
        });
    });


    // describe('openUrl', () => {
    //     it('should open a URL', async () => {
    //         await prBot.openUrl('http://example.com');
    //         expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
    //     });

    //     it('should handle error when opening a URL', async () => {
    //         // openUrlStub.rejects(new Error('Failed to open URL'));
    //         sinon.stub(exec)
    //         sinon.stub(console, 'error');
    //         try {
    //             await prBot.openUrl('http://example.com');
    //         } catch (error) {
    //             expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
    //         }
    //     });
    // });

    describe('openUrl', () => {

        it('should throw an error if URL is not provided', async () => {
            const consoleErrorStub = sinon.stub(console, 'error');
            try {
                await prBot.openUrl('');
                throw new Error('Function did not throw');
            } catch (error: any) {
                expect(error.message).to.equal("Error: URL is required");
            }
        });
    
        it('should not open URL if openPr is false', async () => {
            prBot.openPr = false;
            const result = await prBot.openUrl('http://example.com');
            expect(result).to.be.undefined;
            expect(execStub.called).to.be.false;
        });
    
        it('should handle unsupported OS', async () => {
            sinon.stub(console,'log');
            sinon.stub(process, 'platform').value('unsupportedOS');
            const consoleErrorStub = sinon.stub(console, 'error');
    
            const result = await prBot.openUrl('http://example.com');
    
            expect(result).to.be.undefined;
            expect(execStub.called).to.be.false;
            expect(consoleErrorStub.calledWith('Unsupported OS')).to.be.true;
        });
    
        it('should handle error when opening URL', async () => {
            sinon.stub(console,'log');
            sinon.stub(process, 'platform').value('linux');
            execStub.yields(new Error('Failed to open URL'));
            const consoleErrorStub = sinon.stub(console, 'error');
    
            try {
                await prBot.openUrl('http://example.com');
                throw new Error('Function did not throw');
            } catch (error: any) {
                expect(error.message).to.not.be.undefined;
                expect(consoleErrorStub.calledOnce).to.be.true;
                //  .calledWith('Error opening URL: Failed to open URL')).to.be.true;
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
            sinon.stub(prBot.git, 'raw').rejects(new Error('Failed to get repo info'));
            await testErrorHandling(() => prBot.getRepoInfo(), 'Failed to get repo info');
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
            // const consoleErrorStub = sinon.stub(console, 'error');

            await testErrorHandling(() => prBot.getNewFiles('develop', 'feature-branch'), errorMessage);
            expect(gitStub.calledOnceWith(['--diff-filter=A', 'develop', 'feature-branch', '--', '.', ...prBot.exclusions])).to.be.true;
        });
    });

    describe('getDiff', () => {
        it('should get diff between branches', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const diffOutput = 'diff --git a/file1.txt b/file1.txt\nindex 83db48f..f735c2d 100644\n--- a/file1.txt\n+++ b/file1.txt\n@@ -1 +1 @@\n-Hello\n+Hello World\n';
            const gitStub = sinon.stub(prBot.git, 'diff').resolves(diffOutput);

            const diff = await prBot.getDiff(baseBranch, compareBranch);
            expect(diff).to.equal(diffOutput);
        });

        it('should handle errors', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const errorMessage = 'Error getting diff';
            const gitStub = sinon.stub(prBot.git, 'diff').rejects(new Error(errorMessage));
            await testErrorHandling(() => prBot.getDiff(baseBranch, compareBranch), errorMessage);
        });

    });

    describe('getFilenames', () => {
        it('should get filenames between branches', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const filenamesOutput = 'file1.txt\nfile2.txt\n';
            const gitStub = sinon.stub(prBot.git, 'diff').resolves(filenamesOutput);

            const filenames = await prBot.getFilenames(baseBranch, compareBranch);
            expect(filenames).to.equal(filenamesOutput);
        });

        it('should handle errors', async () => {
            const baseBranch = 'main';
            const compareBranch = 'feature';
            const errorMessage = 'Error getting filenames';
            const gitStub = sinon.stub(prBot.git, 'diff').rejects(new Error(errorMessage));
            await testErrorHandling(() => prBot.getFilenames(baseBranch, compareBranch), errorMessage);
        });
    });

    describe('gptCall', () => {
        it('should call OpenAI API', async () => {
            openaiStub.resolves({ choices: [{ text: 'PR body' }] });
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

    describe('differ', () => {
        it('should return "No changes found" when there are no differences', async () => {
            // Setup stubs to simulate no differences
            
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            const getDiffStub = sinon.stub(prBot, 'getDiff').resolves('');
            const getNewFilesStub = sinon.stub(prBot, 'getNewFiles').resolves('');
            const getFilenamesStub = sinon.stub(prBot, 'getFilenames').resolves('');
            const gptCallStub = sinon.stub(prBot, 'gptCall').resolves('GPT response');

            const result = await prBot.differ('develop', 'feature-branch');
            expect(result).to.equal("No changes found between the specified branches.");
        });

        it('should return GPT response when there are changes', async () => {
            // Setup stubs to simulate differences
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            const getDiffStub = sinon.stub(prBot, 'getDiff').resolves('some diff');
            const getNewFilesStub = sinon.stub(prBot, 'getNewFiles').resolves('newFile.js');
            const getFilenamesStub = sinon.stub(prBot, 'getFilenames').resolves('file1.js\nfile2.js');
            const gptCallStub = sinon.stub(prBot, 'gptCall').resolves('GPT response');
    
            const result = await prBot.differ('develop', 'feature-branch');
            expect(result).to.equal('GPT response');
        });

        it('should handle errors and log them', async () => {
            // Setup stubs to throw an error
            const consoleErrorStub = sinon.stub(console, 'error');
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            gitStub.throws(new Error('revparse error'));



            const result = await prBot.differ('develop');
            expect(result).to.be.undefined;
            expect(consoleErrorStub.calledWith('Error generating PR body: revparse error')).to.be.true;

            consoleErrorStub.restore();
        });
    });


    describe('createPr', () => {
        it('should create or update a pull request', async () => {
            sinon.stub(console, 'log');
            const gitStub = sinon.stub(prBot.git, 'revparse').resolves('feature-branch\n');
            const differStub = sinon.stub(prBot, 'differ').resolves('PR body');
            const getRepoInfoStub = sinon.stub(prBot, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
            listPullsStub.resolves([]);
            createPullStub.resolves({data:{ html_url: 'http://example.com' }});
            const openUrlStub = sinon.stub(prBot, 'openUrl').resolves();
    
            await prBot.createPr('develop');
    
            expect(gitStub.calledOnceWith(['--abbrev-ref', 'HEAD'])).to.be.true;
            // expect(differStub.calledOnceWith('develop', 'feature-branch')).to.be.true;
            expect(getRepoInfoStub.calledOnce).to.be.true;
            expect(listPullsStub.calledOnceWith({ owner: 'owner', repo: 'repo', head: 'feature-branch', base: 'develop'})).to.be.true;
            expect(createPullStub.calledOnceWith({
                owner: 'owner',
                repo: 'repo',
                title: 'PR body',
                body: 'PR body',
                base: 'develop',
                head: 'feature-branch' })).to.be.true;
            // console.log(openUrlStub.args);
            expect(openUrlStub.calledOnceWith('http://example.com')).to.be.true;
        });
    
        it('should handle error when creating or updating a pull request', async () => {
            const consoleErrorStub = sinon.stub(console, 'error');
            const gitStub = sinon.stub(prBot.git, 'revparse').rejects(new Error('Failed to get current branch'));
            const differStub = sinon.stub(prBot, 'differ').resolves('PR body');
            const getRepoInfoStub = sinon.stub(prBot, 'getRepoInfo').resolves({ owner: 'owner', repo: 'repo' });
            listPullsStub.resolves([]);
            createPullStub.resolves({ url: 'http://example.com' });
            // const openUrlStub = sinon.stub(prBot, 'openUrl').resolves();
    
            await prBot.createPr('develop');
    
            expect(consoleErrorStub.calledOnceWith('Error creating PR: Failed to get current branch')).to.be.true;
        });
    });

});
