import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    const outfile = resolve(__dirname, '../api/index.js');
    await build({
      entryPoints: [resolve(__dirname, 'apiEntry.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile,
      format: 'esm',
      // Vercel installs these from package.json. Keeping them external avoids
      // bundling native/SDK internals that expect a normal Node resolution.
      external: ['express', 'dotenv', '@google/genai', '@neondatabase/serverless', '@libsql/client'],
      sourcemap: false,
    });

    // The old admin project deploys with rootDirectory = admin-web. It still
    // needs an api/index.js inside that directory or Vercel reports
    // "unused_function". Keep an identical copy in sync on every build.
    const adminOutfile = resolve(__dirname, '../admin-web/api/index.js');
    mkdirSync(dirname(adminOutfile), { recursive: true });
    copyFileSync(outfile, adminOutfile);

    console.log('Vercel API function built to api/index.js (+ admin-web copy)');
  } catch (error) {
    console.error('API build failed:', error);
    process.exit(1);
  }
}

main();
