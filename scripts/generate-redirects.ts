#!/usr/bin/env -S tsx
/**
 * Reads the datasets collection and emits per-slug redirects for
 * free-dataset URLs from the old Next.js site. Called by `pnpm
 * generate-redirects`. Output: scripts/generated/redirects-datasets.txt
 * which is concatenated into public/_redirects by the build.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const datasetsDir = resolve(root, 'src/content/datasets');
const outDir = resolve(root, 'scripts/generated');
mkdirSync(outDir, { recursive: true });

type Frontmatter = {
  freeSample?: { id?: string };
  price?: string;
};

function parseFrontmatter(path: string): Frontmatter {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: Record<string, unknown> = {};
  // Very shallow YAML parser — we only need freeSample.id and price
  const lines = m[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const topMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (topMatch) {
      const key = topMatch[1];
      const val = topMatch[2];
      if (key === 'price') {
        fm.price = val.replace(/^"(.*)"$/, '$1');
      }
      if (key === 'freeSample' && (val === '' || val === null)) {
        // nested object follows; pick off `id:` at indent 2
        const fs: Record<string, unknown> = {};
        i++;
        while (i < lines.length && /^\s/.test(lines[i])) {
          const childMatch = lines[i].match(/^\s{2}([a-zA-Z_]+):\s*(.*)$/);
          if (childMatch) {
            fs[childMatch[1]] = childMatch[2].replace(/^"(.*)"$/, '$1');
          }
          i++;
        }
        fm.freeSample = fs as { id?: string };
        continue;
      }
    }
    i++;
  }
  return fm as Frontmatter;
}

function main() {
  const files = readdirSync(datasetsDir).filter(f => f.endsWith('.mdx'));
  const lines: string[] = ['# Generated: free-dataset legacy URLs → new parent dataset URLs'];
  let count = 0;

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    const fm = parseFrontmatter(resolve(datasetsDir, file));
    if (fm.freeSample?.id) {
      // Old legacy URL used the free dataset's id; new URL points to parent paid dataset
      lines.push(`/free-datasets/${fm.freeSample.id}    /datasets/${slug}    301`);
      count++;
    }
  }

  const outPath = resolve(outDir, 'redirects-datasets.txt');
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`generate-redirects: wrote ${count} free-dataset redirects to ${outPath}`);
}

main();
