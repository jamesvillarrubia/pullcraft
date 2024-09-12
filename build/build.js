import { copyFile, chmod } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function postbuild () {
  console.log('Starting build process...');

  // Step 1: Bundle the application
  console.log('Bundling application with esbuild...');
  try {
    await esbuild.build({
      entryPoints: ['./src/bin/pullcraft.ts'],
      bundle: true,
      platform: 'node',
      target: 'node14',
      outfile: './build/bundle.js'
    });
    console.log('Bundle created successfully.');
  } catch (error) {
    console.error('Bundling failed:', error);
    process.exit(1);
  }

  const nodePath = process.execPath;
  const sealedPath = path.join(__dirname, '..', 'build', 'pullcraft');

  console.log(`Node path: ${nodePath}`);
  console.log(`Sealed path: ${sealedPath}`);

  // Step 2: Copy node executable
  await copyFile(nodePath, sealedPath);
  console.log('Node executable copied');

  // Step 3: Make it executable
  await chmod(sealedPath, '755');
  console.log('Permissions set');

  // Step 4: Generate the blob
  const generateBlobCommand = 'node --experimental-sea-config build/sea-config.json';
  console.log(`Generating blob: ${generateBlobCommand}`);
  execSync(generateBlobCommand, { stdio: 'inherit' });

  // Step 5: Inject the blob
  const injectCommand = `npx postject ${sealedPath} NODE_SEA_BLOB build/pullcraft.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`;
  console.log(`Injecting blob: ${injectCommand}`);
  execSync(injectCommand, { stdio: 'inherit' });

  console.log('SEA build complete!');
}

postbuild().catch(console.error);
