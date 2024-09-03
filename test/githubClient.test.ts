import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { GitHubClient, OctokitClient, GhClient } from '../src/githubClient';
import childProcess from 'child_process';

// chai.use(chaiAsPromised);

describe('GitHubClient', () => {
  describe('Generic Functions', () => {
    let client: GitHubClient;

    beforeEach(() => {
      client = new GitHubClient();
    });

    it('should throw "Not implemented" for listPulls', async () => {
      try {
        await client.listPulls({ owner: 'test', repo: 'test', base: 'main', head: 'feature' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('Not implemented');
        } else {
          expect.fail('Unexpected error type');
        }
      }
    });

    it('should throw "Not implemented" for updatePull', async () => {
      try {
        await client.updatePull({ owner: 'test', repo: 'test', pullNumber: 1, title: 'Test', body: 'Test' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('Not implemented');
        } else {
          expect.fail('Unexpected error type');
        }
      }
    });

    it('should throw "Not implemented" for createPull', async () => {
      try {
        await client.createPull({ owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test', body: 'Test' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('Not implemented');
        } else {
          expect.fail('Unexpected error type');
        }
      }
    });
  });

  describe('OctokitClient', () => {
    let client: OctokitClient;
    let octokitStub: {
    pulls: {
      list: sinon.SinonStub;
      update: sinon.SinonStub;
      create: sinon.SinonStub;
    };
    paginate: sinon.SinonStub;
    request: sinon.SinonStub;
  };

    beforeEach(() => {
      octokitStub = {
        pulls: {
          list: sinon.stub(),
          update: sinon.stub(),
          create: sinon.stub()
        },
        paginate: sinon.stub(),
        request: sinon.stub()
      };

      client = new OctokitClient('test-token');
      (client as any).octokit = octokitStub;
    });

    it('should call octokit.pulls.list for listPulls', async () => {
      const params = { owner: 'test', repo: 'test', base: 'main', head: 'feature' };
      await client.listPulls(params);
      expect(octokitStub.pulls.list.calledOnceWith(params)).to.be.true;
    });

    it('should call octokit.pulls.update for updatePull', async () => {
      const params = { owner: 'test', repo: 'test', pullNumber: 1, title: 'Test', body: 'Test' };
      await client.updatePull(params);
      expect(octokitStub.pulls.update.calledOnceWith(params)).to.be.true;
    });

    it('should call octokit.pulls.create for createPull', async () => {
      const params = { owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test', body: 'Test' };
      await client.createPull(params);
      expect(octokitStub.pulls.create.calledOnceWith(params)).to.be.true;
    });
  });

  describe('GhClient', () => {
    let client: GhClient;
    let execSyncStub: sinon.SinonStub;

    beforeEach(() => {
      execSyncStub = sinon.stub(childProcess, 'execSync');
      client = new GhClient();
    });

    afterEach(() => {
      execSyncStub.restore();
    });

    it('should call gh cli for listPulls', async () => {
      execSyncStub.returns(Buffer.from('[{"number": 1}]'));
      const result = await client.listPulls({ owner: 'test', repo: 'test', base: 'main', head: 'feature' });
      expect(execSyncStub.calledOnce).to.be.true;
      expect(execSyncStub.firstCall.args[0]).to.include('gh pr list');
      expect(result).to.deep.equal([{ number: 1 }]);
    });

    it('should call gh cli for updatePull', async () => {
      execSyncStub.returns(Buffer.from(''));
      await client.updatePull({ owner: 'test', repo: 'test', pullNumber: 1, title: 'Test', body: 'Test' });
      expect(execSyncStub.calledOnce).to.be.true;
      expect(execSyncStub.firstCall.args[0]).to.include('gh pr edit');
    });

    it('should call gh cli for createPull', async () => {
      execSyncStub.returns(Buffer.from('https://github.com/test/test/pull/1'));
      const result = await client.createPull({ owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test', body: 'Test' });
      expect(execSyncStub.calledOnce).to.be.true;
      expect(execSyncStub.firstCall.args[0]).to.include('gh pr create');
      expect(result).to.deep.equal({ data: { html_url: 'https://github.com/test/test/pull/1' } });
    });

    it('should escape shell arguments', async () => {
      execSyncStub.returns(Buffer.from('https://github.com/test/test/pull/1'));
      await client.createPull({ owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test`with`backticks', body: 'Test`body' });
      const callArg = execSyncStub.firstCall.args[0] as string;
      expect(callArg).to.include('\'Test\\`with\\`backticks\'');
      expect(callArg).to.include('\'Test\\`body\'');
    });

    it('should handle errors from gh cli', async () => {
      execSyncStub.throws(new Error('CLI Error'));

      try {
        await client.listPulls({ owner: 'test', repo: 'test', base: 'main', head: 'feature' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('CLI Error');
        } else {
          expect.fail('Unexpected error type');
        }
      }

      try {
        await client.updatePull({ owner: 'test', repo: 'test', pullNumber: 1, title: 'Test', body: 'Test' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('CLI Error');
        } else {
          expect.fail('Unexpected error type');
        }
      }

      try {
        await client.createPull({ owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test', body: 'Test' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.equal('CLI Error');
        } else {
          expect.fail('Unexpected error type');
        }
      }
    });

    it('should handle empty output from gh cli', async () => {
      execSyncStub.returns(Buffer.from(''));

      const listResult = await client.listPulls({ owner: 'test', repo: 'test', base: 'main', head: 'feature' });
      expect(listResult).to.deep.equal([]);

      await client.updatePull({ owner: 'test', repo: 'test', pullNumber: 1, title: 'Test', body: 'Test' });
      // No assertion needed for updatePull as it doesn't return anything

      const createResult = await client.createPull({ owner: 'test', repo: 'test', base: 'main', head: 'feature', title: 'Test', body: 'Test' });
      expect(createResult).to.deep.equal({ data: { html_url: '' } });
    });

    it('should handle invalid JSON output from gh cli for listPulls', async () => {
      execSyncStub.returns(Buffer.from('Invalid JSON'));

      try {
        await client.listPulls({ owner: 'test', repo: 'test', base: 'main', head: 'feature' });
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error).to.be.an('error');
        if (error instanceof Error) {
          expect(error.message).to.include('Unexpected token');
        } else {
          expect.fail('Unexpected error type');
        }
      }
    });

    it('should include title and body in updatePull command when provided', async () => {
      execSyncStub.returns(Buffer.from(''));
      await client.updatePull({
        owner: 'test',
        repo: 'test',
        pullNumber: 1,
        title: 'New Title',
        body: 'New Body'
      });
      expect(execSyncStub.calledOnce).to.be.true;
      const callArg = execSyncStub.firstCall.args[0] as string;
      expect(callArg).to.include('--title \'New Title\'');
      expect(callArg).to.include('--body \'New Body\'');
    });

    it('should not include title and body in updatePull command when not provided', async () => {
      execSyncStub.returns(Buffer.from(''));
      await client.updatePull({
        owner: 'test',
        repo: 'test',
        pullNumber: 1
      });
      expect(execSyncStub.calledOnce).to.be.true;
      const callArg = execSyncStub.firstCall.args[0] as string;
      expect(callArg).to.not.include('--title');
      expect(callArg).to.not.include('--body');
    });

    it('should include body in createPull command when provided', async () => {
      execSyncStub.returns(Buffer.from('https://github.com/test/test/pull/1'));
      await client.createPull({
        owner: 'test',
        repo: 'test',
        base: 'main',
        head: 'feature',
        title: 'Test',
        body: 'Test Body'
      });
      expect(execSyncStub.calledOnce).to.be.true;
      const callArg = execSyncStub.firstCall.args[0] as string;
      expect(callArg).to.include('--body \'Test Body\'');
    });

    it('should not include body in createPull command when not provided', async () => {
      execSyncStub.returns(Buffer.from('https://github.com/test/test/pull/1'));
      await client.createPull({
        owner: 'test',
        repo: 'test',
        base: 'main',
        head: 'feature',
        title: 'Test'
      });
      expect(execSyncStub.calledOnce).to.be.true;
      const callArg = execSyncStub.firstCall.args[0] as string;
      expect(callArg).to.not.include('--body');
    });
  });
});
