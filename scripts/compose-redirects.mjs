import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const base = resolve(root, 'public/_redirects');
const gen = resolve(root, 'scripts/generated/redirects-datasets.txt');
const out = resolve(root, 'dist/_redirects');

const baseText = existsSync(base) ? readFileSync(base, 'utf8') : '';
const genText = existsSync(gen) ? readFileSync(gen, 'utf8') : '';
const combined = baseText.trimEnd() + '\n\n' + genText.trimEnd() + '\n';
writeFileSync(out, combined, 'utf8');
console.log('compose-redirects: wrote', out);
