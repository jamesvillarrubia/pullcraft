import { copyFile, chmod, readFile } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
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

async function postbuild (options) {
  const {
    entryPoint,
    outfile,
    binaryName,
    blobName,
    seaConfigPath,
    sentinelFuse
  } = options;

  console.log('Starting build process...');

  // Step 1: Bundle the application
  console.log('Bundling application with esbuild...');
  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile,
      define: {
        'process.env.VERSION': JSON.stringify(version)
      }
    });
    console.log('Bundle created successfully.');
  } catch (error) {
    console.error('Bundling failed:', error);
    process.exit(1);
  }

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

  // Step 2: Copy node executable
  await copyFile(nodePath, sealedPath);
  console.log('Node executable copied');

  // Step 3: Make it executable
  await chmod(sealedPath, '755');
  console.log('Permissions set');

  // Step 4: Generate the blob
  const generateBlobCommand = `node --experimental-sea-config ${seaConfigPath} --experimental-default-type=module`;
  console.log(`Generating blob: ${generateBlobCommand}`);
  execSync(generateBlobCommand, { stdio: 'inherit' });

  // Step 5: Inject the blob
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
  if (!options.entryPoint) {
    console.error('Error: --entryPoint is required');
    process.exit(1);
  }
  if (!options.binaryName) {
    console.error('Error: --binaryName is required');
    process.exit(1);
  }
}

// Main execution
const cliOptions = parseArgs();
validateArgs(cliOptions);

const buildOptions = {
  entryPoint: cliOptions.entryPoint,
  outfile: cliOptions.outfile || path.join(__dirname, '..', 'bundle.js'),
  binaryName: cliOptions.binaryName,
  blobName: cliOptions.blobName || path.join(__dirname, '..', 'prep.blob'),
  seaConfigPath: cliOptions.seaConfigPath || path.join(__dirname, '..', 'sea-config.json'),
  sentinelFuse: cliOptions.sentinelFuse || 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
};

postbuild(buildOptions).catch(console.error);
