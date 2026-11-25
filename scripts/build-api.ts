import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    await build({
      entryPoints: [resolve(__dirname, 'apiEntry.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: resolve(__dirname, '../api/index.js'),
      format: 'esm',
      // Vercel installs these from package.json. Keeping them external avoids
      // bundling native/SDK internals that expect a normal Node resolution.
      external: ['express', 'dotenv', '@google/genai', '@neondatabase/serverless'],
      sourcemap: false,
    });
    console.log('Vercel API function built to api/index.js');
  } catch (error) {
    console.error('API build failed:', error);
    process.exit(1);
  }
}

main();
