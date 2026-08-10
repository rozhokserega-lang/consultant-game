/**
 * Guards the mechanical parts of the refactor: every path the app references
 * must exist, every script must parse, and the service worker precache list
 * must not point at files that were moved or renamed.
 *
 * Run from the repo root: node tools/check-integrity.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const report = (where, msg) => problems.push(`${where}: ${msg}`);

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel) => {
  try {
    return statSync(join(ROOT, rel)).isFile();
  } catch {
    return false;
  }
};

/* ── 1. index.html: <script src> / <link href> ───────────────────────────── */

const html = read('index.html');
const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const linkHrefs = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);

const localRefs = [...scriptSrcs, ...linkHrefs].filter((p) => !/^https?:\/\//.test(p));
for (const ref of localRefs) {
  if (!exists(ref)) report('index.html', `missing reference "${ref}"`);
}

/* ── 2. Asset paths referenced from JS/HTML string literals ─────────────── */

const codeFiles = [];
for await (const file of glob('**/*.{js,mjs}', { cwd: ROOT })) {
  const rel = file.split(/[\\/]/).join(posix.sep);
  if (rel.startsWith('node_modules/') || rel.startsWith('reference/')) continue;
  codeFiles.push(rel);
}
codeFiles.sort();

const ASSET_REF = /['"`](assets\/[^'"`${}\s]+\.(?:png|jpg|jpeg|webp|json))['"`]/g;
const TEMPLATED_REF = /['"`](assets\/[^'"`]*\$\{[^'"`]*)['"`]/g;

for (const rel of ['index.html', ...codeFiles]) {
  const text = read(rel);
  for (const [, path] of text.matchAll(ASSET_REF)) {
    if (!exists(path)) report(rel, `missing asset "${path}"`);
  }
  // Templated paths (e.g. `assets/icons/weapons/${name}.png`) can only be
  // checked as far as their static prefix directory.
  for (const [, path] of text.matchAll(TEMPLATED_REF)) {
    const dir = path.slice(0, path.indexOf('${')).replace(/[^/]*$/, '');
    if (dir && !existsSync(join(ROOT, dir))) report(rel, `missing asset dir "${dir}"`);
  }
}

/* ── 3. Every JS file parses ────────────────────────────────────────────── */

for (const rel of codeFiles) {
  try {
    execFileSync(process.execPath, ['--check', join(ROOT, rel)], { stdio: 'pipe' });
  } catch (err) {
    const detail = String(err.stderr || err.message).split('\n').slice(0, 4).join(' ').trim();
    report(rel, `syntax error — ${detail}`);
  }
}

/* ── 4. Service worker precache list is in sync ─────────────────────────── */

try {
  execFileSync(process.execPath, [join(ROOT, 'tools/sync-sw-precache.mjs'), '--check'], {
    cwd: ROOT,
    stdio: 'pipe',
  });
} catch (err) {
  report('sw.js', String(err.stderr || err.message).trim().split('\n')[0]);
}

/* ── 5. No two classic scripts declare the same global ──────────────────── */

// Top-level const/let/class in a classic script live in the shared global
// lexical scope: a second declaration of the same name is a hard SyntaxError
// that only fires in the browser, so catch it here instead.
const TOP_LEVEL_DECL = /^(?:const|let|class|function|var)\s+([A-Za-z_$][\w$]*)/;
const globals = new Map();

for (const ref of scriptSrcs.filter((p) => !/^https?:\/\//.test(p) && exists(p))) {
  for (const line of read(ref).split('\n')) {
    const name = TOP_LEVEL_DECL.exec(line)?.[1];
    if (!name) continue;
    if (globals.has(name)) report(ref, `global "${name}" already declared in ${globals.get(name)}`);
    else globals.set(name, ref);
  }
}

/* ── Result ─────────────────────────────────────────────────────────────── */

if (problems.length) {
  console.error(`FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`OK — ${localRefs.length} html refs, ${codeFiles.length} js files, all assets resolve.`);
