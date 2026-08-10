/**
 * One-off migration: pulls the base64 images that were inlined in index.html
 * out into real PNG files under assets/.
 *
 * Run once from the repo root: node tools/extract-inline-assets.mjs
 * Re-running is safe: it skips work when the markers are already gone.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = resolve(ROOT, 'index.html');
const ATLAS_OUT = resolve(ROOT, 'assets/atlases/main_atlas.png');
const ICON_DIR = resolve(ROOT, 'assets/icons/weapons');

const html = readFileSync(INDEX, 'utf8');

const atlasMatch = html.match(/^const ATLAS_B64 = "([A-Za-z0-9+/=]+)";$/m);
if (!atlasMatch) {
  console.log('ATLAS_B64 not found — already extracted.');
} else {
  mkdirSync(dirname(ATLAS_OUT), { recursive: true });
  writeFileSync(ATLAS_OUT, Buffer.from(atlasMatch[1], 'base64'));
  console.log(`main_atlas.png  ${(atlasMatch[1].length / 1024).toFixed(0)} KB base64`);
}

const iconsMatch = html.match(/^window\.WEAPON_ICONS = \{\r?\n([\s\S]*?)\r?\n\};\r?$/m);
if (!iconsMatch) {
  console.log('window.WEAPON_ICONS not found — already extracted.');
} else {
  mkdirSync(ICON_DIR, { recursive: true });
  const entries = [...iconsMatch[1].matchAll(/"([\w]+)": "data:image\/png;base64,([A-Za-z0-9+/=]+)"/g)];
  for (const [, name, b64] of entries) {
    writeFileSync(resolve(ICON_DIR, `${name}.png`), Buffer.from(b64, 'base64'));
  }
  console.log(`weapon icons    ${entries.length} files: ${entries.map((e) => e[1]).join(', ')}`);
}
