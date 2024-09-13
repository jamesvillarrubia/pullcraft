import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createBundle (options) {
  const { entryPoint, outfile } = options;

  console.log('Starting bundle creation process...');

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile,
      format: 'cjs'
    });
    console.log(`Bundle created successfully at ${outfile}`);
  } catch (error) {
    console.error('Bundling failed:', error);
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
  if (!options.entryPoint) {
    console.error('Error: --entryPoint is required');
    process.exit(1);
  }
}

// Main execution
const cliOptions = parseArgs();
validateArgs(cliOptions);

const bundleOptions = {
  entryPoint: cliOptions.entryPoint,
  outfile: cliOptions.outfile || path.join(__dirname, '..', 'bundle.js')
};

createBundle(bundleOptions).catch(console.error);
