import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { createCursorRule } from '../src/cursor.js';
import fs from 'fs';
import path from 'path';

describe('Cursor Integration', () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let processExitStub: sinon.SinonStub;
  const testDir = path.join(process.cwd(), 'test-cursor-temp');

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    processExitStub = sinon.stub(process, 'exit');

    // Clean up any existing test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Create test directory
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    sinon.restore();

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createCursorRule', () => {
    it('should create .cursor/rules directory and file when they do not exist', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        createCursorRule();

        // Check that directories were created
        expect(fs.existsSync('.cursor')).to.be.true;
        expect(fs.existsSync('.cursor/rules')).to.be.true;
        expect(fs.existsSync('.cursor/rules/pullcraft.mdc')).to.be.true;

        // Check file content
        const content = fs.readFileSync('.cursor/rules/pullcraft.mdc', 'utf8');
        expect(content).to.include('---');
        expect(content).to.include('description: PullCraft - AI-powered pull request generator');
        expect(content).to.include('globs:');
        expect(content).to.include('alwaysApply: true');

        // Check console output
        expect(consoleLogStub.calledWith('Created .cursor directory')).to.be.true;
        expect(consoleLogStub.calledWith('Created .cursor/rules directory')).to.be.true;
        expect(consoleLogStub.calledWith('✅ Successfully created .cursor/rules/pullcraft.mdc')).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should not create directories if they already exist', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create directories first
        fs.mkdirSync('.cursor', { recursive: true });
        fs.mkdirSync('.cursor/rules', { recursive: true });

        createCursorRule();

        // Check that file was created
        expect(fs.existsSync('.cursor/rules/pullcraft.mdc')).to.be.true;

        // Should not have logged directory creation
        expect(consoleLogStub.calledWith('Created .cursor directory')).to.be.false;
        expect(consoleLogStub.calledWith('Created .cursor/rules directory')).to.be.false;
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should exit with error if file exists and force is not specified', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create directories and file first
        fs.mkdirSync('.cursor', { recursive: true });
        fs.mkdirSync('.cursor/rules', { recursive: true });
        fs.writeFileSync('.cursor/rules/pullcraft.mdc', 'existing content');

        createCursorRule();

        expect(consoleErrorStub.calledWith(
          'Error: .cursor/rules/pullcraft.mdc already exists. Use --force to overwrite.'
        )).to.be.true;
        expect(processExitStub.calledWith(1)).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should overwrite existing file when force is true', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create directories and file first
        fs.mkdirSync('.cursor', { recursive: true });
        fs.mkdirSync('.cursor/rules', { recursive: true });
        fs.writeFileSync('.cursor/rules/pullcraft.mdc', 'existing content');

        createCursorRule({ force: true });

        // Should not exit with error
        expect(processExitStub.called).to.be.false;
        expect(consoleErrorStub.called).to.be.false;

        // File should be overwritten
        const content = fs.readFileSync('.cursor/rules/pullcraft.mdc', 'utf8');
        expect(content).to.include('description: PullCraft - AI-powered pull request generator');
        expect(content).to.not.include('existing content');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle errors during file creation', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create directories
        fs.mkdirSync('.cursor', { recursive: true });
        fs.mkdirSync('.cursor/rules', { recursive: true });

        // Make the rules directory read-only to cause an error
        fs.chmodSync('.cursor/rules', 0o444);

        createCursorRule();

        expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', sinon.match.string)).to.be.true;
        expect(processExitStub.calledWith(1)).to.be.true;
      } finally {
        // Restore permissions
        try {
          fs.chmodSync('.cursor/rules', 0o755);
        } catch (e) {
          // Ignore errors
        }
        process.chdir(originalCwd);
      }
    });

    it('should handle errors during directory creation', () => {
      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create a file with the same name as the directory to cause an error
        fs.mkdirSync('.cursor', { recursive: true });
        fs.writeFileSync('.cursor/rules', 'this should be a directory');

        createCursorRule();

        expect(consoleErrorStub.calledWith('Error creating Cursor rule file:', sinon.match.string)).to.be.true;
        expect(processExitStub.calledWith(1)).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
