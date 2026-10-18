const path = require('path');
const corePath = 'C:/Users/brajb/AppData/Roaming/npm/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core';
const core = require(corePath);

const targetDir = process.argv[2];
const manifestPath = path.join(targetDir, 'twa-manifest.json');

(async () => {
  const manifest = await core.TwaManifest.fromFile(manifestPath);
  const err = manifest.validate();
  if (err) {
    console.error('INVALID MANIFEST:', err);
    process.exit(1);
  }
  const gen = new core.TwaGenerator();
  await gen.createTwaProject(targetDir, manifest, new core.ConsoleLog('generate'));
  console.log('TWA project generated at', targetDir);
})().catch((e) => {
  console.error('FAILED:', e && e.message ? e.message : e);
  process.exit(1);
});
