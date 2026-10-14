import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    await build({
      entryPoints: [resolve(__dirname, '../server.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: resolve(__dirname, '../dist/server.js'),
      format: 'esm',
      external: ['express', 'dotenv', '@google/genai', '@libsql/client'],
      sourcemap: false,
    });
    console.log('Server built to dist/server.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
