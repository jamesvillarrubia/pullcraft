import { copyFile, chmod } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBinaryName (binaryName, version) {
  const platform = os.platform();
  const arch = os.arch();

  let outputName;
  if (platform === 'darwin') {
    outputName = `${binaryName}-${version}-macos-${arch}`;
  } else if (platform === 'linux') {
    outputName = `${binaryName}-${version}-linux-${arch}`;
  } else if (platform === 'win32') {
    outputName = `${binaryName}-${version}-win-${arch}.exe`;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return outputName;
}

async function createSEA (options) {
  const {
    binaryName,
    blobName,
    seaConfigPath,
    sentinelFuse,
    version
  } = options;

  console.log('Starting SEA creation process...');

  const nodePath = process.execPath;
  const buildDir = path.join(__dirname, '..');
  const assetsDir = path.join(buildDir, 'assets');
  const outputName = getBinaryName(binaryName, version);
  const sealedPath = path.join(assetsDir, outputName);

  console.log(`Node path: ${nodePath}`);
  console.log(`Build directory: ${buildDir}`);
  console.log(`Assets directory: ${assetsDir}`);
  console.log(`Final executable path: ${sealedPath}`);

  // Ensure assets directory exists
  await fs.promises.mkdir(assetsDir, { recursive: true });

  // Step 1: Copy node executable
  await copyFile(nodePath, sealedPath);
  console.log('Node executable copied');

  // Step 2: Make it executable
  await chmod(sealedPath, '755');
  console.log('Permissions set');

  // Step 3: Generate the blob
  const generateBlobCommand = `node --experimental-sea-config ${seaConfigPath} --experimental-default-type=module`;
  console.log(`Generating blob: ${generateBlobCommand}`);
  execSync(generateBlobCommand, { stdio: 'inherit' });

  // Step 4: Inject the blob
  const injectCommand = `npx postject ${sealedPath} NODE_SEA_BLOB ${blobName} --sentinel-fuse ${sentinelFuse} --macho-segment-name NODE_SEA`;
  console.log(`Injecting blob: ${injectCommand}`);
  execSync(injectCommand, { stdio: 'inherit' });

  console.log(`Package created: ${sealedPath}`);
  console.log('SEA build complete!');
}

// Parse command-line arguments
function parseArgs () {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  return options;
}

// Validate required arguments
function validateArgs (options) {
  if (!options.binaryName) {
    console.error('Error: --binaryName is required');
    process.exit(1);
  }
  if (!options.version) {
    console.error('Error: --version is required');
    process.exit(1);
  }
}

// Main execution
const cliOptions = parseArgs();
validateArgs(cliOptions);

const seaOptions = {
  binaryName: cliOptions.binaryName,
  blobName: cliOptions.blobName || path.join(__dirname, '..', 'prep.blob'),
  seaConfigPath: cliOptions.seaConfigPath || path.join(__dirname, '..', 'sea-config.json'),
  sentinelFuse: cliOptions.sentinelFuse || 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  version: cliOptions.version
};

createSEA(seaOptions).catch(console.error);
