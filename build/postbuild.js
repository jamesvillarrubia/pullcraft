import { copyFile, chmod } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function postbuild() {
  const nodePath = process.execPath;
  const sealedPath = path.join(__dirname, '..', 'build', 'test-sea');
  
  console.log(`Node path: ${nodePath}`);
  console.log(`Sealed path: ${sealedPath}`);

  // Copy node executable
  await copyFile(nodePath, sealedPath);
  console.log('Node executable copied');
  
  // Make it executable
  await chmod(sealedPath, '755');
  console.log('Permissions set');
  
  // Inject the blob
  const command = `npx postject ${sealedPath} NODE_SEA_BLOB build/test.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  console.log(`Executing command: ${command}`);
  execSync(command, { stdio: 'inherit' });
  
  console.log('SEA build complete!');
}

postbuild().catch(console.error);