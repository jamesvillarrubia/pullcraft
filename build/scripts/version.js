import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import release from 'release-it';
import opts from '../../.release-it.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(opts);
async function updateVersion () {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Please provide a file path as an argument.');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);

  try {
    const result = await release({
      ci: true,
      'dry-run': true
    });
    const version = result.version;

    let content = await fs.readFile(fullPath, 'utf8');
    content = content.replace(/__VERSION__/g, version);

    await fs.writeFile(fullPath, content);

    console.log(`Version updated to ${version} in ${filePath}`);
  } catch (error) {
    console.error('Error updating version:', error);
    process.exit(1);
  }
}

updateVersion();
