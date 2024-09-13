import { exec } from 'child_process';
import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Tests', function () {
  let consoleStub;
  let cliPath;

  before(() => {
    consoleStub = sinon.stub(console, 'log');
    sinon.stub(console, 'error');

    // Read the package.json to get the binary name
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
    const binaryName = Object.keys(packageJson.bin)[0];

    // Determine the platform and architecture
    const platform = os.platform();
    const arch = process.arch;

    // Construct the expected binary name pattern
    let binaryPattern;
    if (platform === 'darwin') {
      binaryPattern = `${binaryName}-.*-macos-${arch}`;
    } else if (platform === 'linux') {
      binaryPattern = `${binaryName}-.*-linux-${arch}`;
    } else if (platform === 'win32') {
      binaryPattern = `${binaryName}-.*-win-${arch}.exe`;
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Find the binary in the build directory
    const buildDir = path.join(__dirname, '..', 'assets');
    const files = fs.readdirSync(buildDir);
    const binaryFile = files.find(file => new RegExp(binaryPattern).test(file));

    if (!binaryFile) {
      throw new Error(`Binary file not found matching pattern: ${binaryPattern}`);
    }

    cliPath = path.join(buildDir, binaryFile);
  });

  after(() => {
    consoleStub.restore();
    console.error.restore();
  });

  it('should display help message containing "placeholder"', function (done) {
    this.timeout(10000); // 10 seconds timeout

    exec(`${cliPath} --help`, (error, stdout, stderr) => {
      if (error) {
        return done(error);
      }

      try {
        expect(stdout).to.include('placeholder');
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
