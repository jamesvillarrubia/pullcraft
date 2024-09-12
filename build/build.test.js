import { exec } from 'child_process';
import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Tests', function () {
  let consoleStub;

  before(() => {
    consoleStub = sinon.stub(console, 'log');
    sinon.stub(console, 'error');
  });

  after(() => {
    consoleStub.restore();
    console.error.restore();
  });

  it('should display help message containing "placeholder"', function (done) {
    this.timeout(10000); // 10 seconds timeout

    const cliPath = path.join(__dirname, 'pullcraft');

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
