import { describe, it } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { VERSION } from '../src/version';
chai.use(chaiAsPromised);

delete process.env.OPENAI_API_KEY;
delete process.env.GITHUB_TOKEN;

describe('VERSION', () => {
  it('should be a non-empty string', () => {
    expect(VERSION).to.be.a('string');
    expect(VERSION).to.not.equal(undefined);
    expect(VERSION).to.not.equal('');
  });

  it('should match the expected format', () => {
    const versionRegex = /^\d+\.\d+\.\d+(-\w+)?$/;
    expect(VERSION).to.match(versionRegex);
  });

  it('should contain "releaseit" for development versions', () => {
    if (VERSION.includes('-')) {
      expect(VERSION).to.include('releaseit');
    }
  });
});
