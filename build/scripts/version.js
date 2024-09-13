import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateVersion () {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Please provide a file path as an argument.');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);

  try {
    let content = await fs.readFile(fullPath, 'utf8');

    const packageJson = JSON.parse(await fs.readFile(path.resolve(__dirname, '..', '..', 'package.json'), 'utf8'));
    const version = packageJson.version;

    content = content.replace(/const VERSION = '.*?';/, `const VERSION = '${version}';`);

    await fs.writeFile(fullPath, content);
    console.log(`Updated version to ${version} in ${filePath}`);
  } catch (error) {
    console.error('Error updating version:', error);
    process.exit(1);
  }
}

updateVersion();
