import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { createCursorRule } from '../src/cursor.js';
import fs from 'fs';

describe('Cursor Integration', () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let mkdirSyncStub: sinon.SinonStub;
  let writeFileSyncStub: sinon.SinonStub;
  let existsSyncStub: sinon.SinonStub;
  let processExitStub: sinon.SinonStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
    existsSyncStub = sinon.stub(fs, 'existsSync');
    processExitStub = sinon.stub(process, 'exit');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCursorRule', () => {
    it('should exit with error if file exists and force is not specified', () => {
      // Mock that file exists
      existsSyncStub.returns(true);

      createCursorRule();

      expect(consoleErrorStub.calledWith(
        'Error: .cursor/rules/pullcraft.mdc already exists. Use --force to overwrite.'
      )).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });
  });
});
