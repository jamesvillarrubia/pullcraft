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
  });
});
