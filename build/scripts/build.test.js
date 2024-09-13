import { exec } from 'child_process';
import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

    // Read the version from version.txt
    const version = fs.readFileSync(path.join(__dirname, '../../version.txt'), 'utf8').trim();

    // Determine the architecture
    const arch = process.arch === 'x64' ? 'x64' : 'arm64';

    // Construct the expected binary name pattern
    const binaryPattern = `${binaryName}-${version}-linux-${arch}`;

    // Find the binary in the build directory
    const buildDir = path.join(__dirname, '..', 'assets');
    const files = fs.readdirSync(buildDir);
    const binaryFile = files.find(file => file.startsWith(binaryPattern));

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
