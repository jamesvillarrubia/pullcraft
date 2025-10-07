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
    it('should create .cursor/rules directory and file when they do not exist', () => {
      // Mock that directories and file don't exist
      existsSyncStub.returns(false);

      createCursorRule();

      // Should create .cursor directory
      expect(mkdirSyncStub.calledWith('.cursor', { recursive: true })).to.be.true;
      expect(consoleLogStub.calledWith('Created .cursor directory')).to.be.true;

      // Should create .cursor/rules directory
      expect(mkdirSyncStub.calledWith('.cursor/rules', { recursive: true })).to.be.true;
      expect(consoleLogStub.calledWith('Created .cursor/rules directory')).to.be.true;

      // Should write the rules file
      expect(writeFileSyncStub.calledOnce).to.be.true;
      const writeCall = writeFileSyncStub.getCall(0);
      expect(writeCall).to.not.be.null;
      if (writeCall) {
        const [filePath, content, encoding] = writeCall.args;
        expect(filePath).to.equal('.cursor/rules/pullcraft.mdc');
        expect(content).to.include('---');
        expect(content).to.include('description: PullCraft - AI-powered pull request generator');
        expect(content).to.include('globs:');
        expect(content).to.include('alwaysApply: true');
        expect(encoding).to.equal('utf8');
      }

      // Should log success message
      expect(consoleLogStub.calledWith('✅ Successfully created .cursor/rules/pullcraft.mdc')).to.be.true;
    });

    it('should not create directories if they already exist', () => {
      // Mock that directories exist but file doesn't
      existsSyncStub.callsFake((path: string) => {
        if (path === '.cursor/rules/pullcraft.mdc') return false;
        return true; // .cursor and .cursor/rules exist
      });

      createCursorRule();

      // Should not create directories
      expect(mkdirSyncStub.calledWith('.cursor', { recursive: true })).to.be.false;
      expect(mkdirSyncStub.calledWith('.cursor/rules', { recursive: true })).to.be.false;

      // Should still write the file
      expect(writeFileSyncStub.calledOnce).to.be.true;
    });

    it('should exit with error if file exists and force is not specified', () => {
      // Mock that file exists
      existsSyncStub.returns(true);

      createCursorRule();

      expect(consoleErrorStub.calledWith(
        'Error: .cursor/rules/pullcraft.mdc already exists. Use --force to overwrite.'
      )).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should overwrite existing file when force is true', () => {
      // Mock that file exists
      existsSyncStub.returns(true);

      createCursorRule({ force: true });

      // Should not exit with error
      expect(processExitStub.called).to.be.false;
      expect(consoleErrorStub.called).to.be.false;

      // Should write the file
      expect(writeFileSyncStub.calledOnce).to.be.true;
    });

    it('should handle errors during file creation', () => {
      existsSyncStub.returns(false);
      const error = new Error('Permission denied');
      writeFileSyncStub.throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', 'Permission denied')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle errors during directory creation', () => {
      existsSyncStub.returns(false);
      const error = new Error('Permission denied');
      mkdirSyncStub.throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', 'Permission denied')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle errors during .cursor directory creation', () => {
      existsSyncStub.returns(false);
      const error = new Error('Permission denied');
      mkdirSyncStub.onFirstCall().throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', 'Permission denied')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle errors during .cursor/rules directory creation', () => {
      existsSyncStub.returns(false);
      const error = new Error('Permission denied');
      mkdirSyncStub.onFirstCall().returns(undefined);
      mkdirSyncStub.onSecondCall().throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', 'Permission denied')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should create only .cursor directory if .cursor/rules already exists', () => {
      existsSyncStub.callsFake((path: string) => {
        if (path === '.cursor') return false;
        if (path === '.cursor/rules') return true;
        if (path === '.cursor/rules/pullcraft.mdc') return false;
        return false;
      });

      createCursorRule();

      // Should create .cursor directory
      expect(mkdirSyncStub.calledWith('.cursor', { recursive: true })).to.be.true;
      expect(consoleLogStub.calledWith('Created .cursor directory')).to.be.true;

      // Should not create .cursor/rules directory
      expect(mkdirSyncStub.calledWith('.cursor/rules', { recursive: true })).to.be.false;

      // Should still write the file
      expect(writeFileSyncStub.calledOnce).to.be.true;
    });

    it('should handle case when both directories already exist', () => {
      existsSyncStub.callsFake((path: string) => {
        if (path === '.cursor/rules/pullcraft.mdc') return false;
        return true; // Both .cursor and .cursor/rules exist
      });

      createCursorRule();

      // Should not create any directories
      expect(mkdirSyncStub.calledWith('.cursor', { recursive: true })).to.be.false;
      expect(mkdirSyncStub.calledWith('.cursor/rules', { recursive: true })).to.be.false;

      // Should still write the file
      expect(writeFileSyncStub.calledOnce).to.be.true;
    });

    it('should handle error with undefined error message', () => {
      existsSyncStub.returns(false);
      const error = new Error() as any;
      error.message = undefined;
      writeFileSyncStub.throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', undefined)).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle error with null error message', () => {
      existsSyncStub.returns(false);
      const error = new Error() as any;
      error.message = null;
      writeFileSyncStub.throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', null)).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle error with empty error message', () => {
      existsSyncStub.returns(false);
      const error = new Error('');
      writeFileSyncStub.throws(error);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', '')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle non-Error exception', () => {
      existsSyncStub.returns(false);
      writeFileSyncStub.throws('String error');

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', 'String error')).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });

    it('should handle undefined exception', () => {
      existsSyncStub.returns(false);
      writeFileSyncStub.throws(undefined);

      createCursorRule();

      expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', undefined)).to.be.true;
      expect(processExitStub.calledWith(1)).to.be.true;
    });
  });
});
