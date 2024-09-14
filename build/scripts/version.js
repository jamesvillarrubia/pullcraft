import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateVersion (version) {
  const filePath = process.argv[3];

  if (!version) {
    console.error('Please provide a version string as an argument.');
    process.exit(1);
  }

  if (!filePath) {
    console.error('Please provide a file path as an argument.');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);

  try {
    let content = await fs.readFile(fullPath, 'utf8');
    content = content.replace(/__VERSION__/g, version);

    await fs.writeFile(fullPath, content);

    console.log(`Version updated to ${version} in ${filePath}`);
  } catch (error) {
    console.error('Error updating version:', error);
    process.exit(1);
  }
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
  if (!options.version) {
    console.error('Error: --version is required');
    process.exit(1);
  }

  if (!options.filePath) {
    console.error('Error: --filePath is required');
    process.exit(1);
  }
}

const options = parseArgs();
validateArgs(options);

updateVersion(options.version);
