// Copies the company-logo SVGs used by the game out of the `simple-icons`
// package and into `src/assets/logos/`, so the client renders logos from local
// bundled assets instead of a runtime CDN (which breaks when slugs change).
//
// Source of truth for which logos are needed is the server's gameData.ts — we
// extract every `slug: '...'` from it, so adding a company there and re-running
// `npm run gen:logos` is all it takes to pull a new icon.
//
// Run from the client package: `npm run gen:logos`.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const gameDataPath = resolve(here, '../../server/src/gameData.ts');
const iconsDir = resolve(here, '../../node_modules/simple-icons/icons');
const outDir = resolve(here, '../src/assets/logos');

const source = await readFile(gameDataPath, 'utf8');
const slugs = [...new Set([...source.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]))];

if (!existsSync(iconsDir)) {
  console.error(`simple-icons not found at ${iconsDir}. Run \`npm install\` first.`);
  process.exit(1);
}

// Start clean so removed companies don't leave orphaned SVGs behind.
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const missing = [];
let copied = 0;
for (const slug of slugs) {
  const src = resolve(iconsDir, `${slug}.svg`);
  if (!existsSync(src)) {
    missing.push(slug);
    continue;
  }
  await writeFile(resolve(outDir, `${slug}.svg`), await readFile(src, 'utf8'));
  copied += 1;
}

console.log(`Copied ${copied}/${slugs.length} logos to src/assets/logos/`);
if (missing.length) {
  console.warn(`\nMissing in simple-icons (fix the slug in gameData.ts):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
