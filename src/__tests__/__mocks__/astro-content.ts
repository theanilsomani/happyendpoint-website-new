/**
 * Vitest mock for `astro:content`.
 *
 * Reads MDX frontmatter directly from the filesystem so the smoke tests can
 * run without spinning up the Astro dev server.  Only `getCollection` is
 * implemented — that is all the smoke tests need.
 */
import fs from 'node:fs';
import path from 'node:path';

// The yaml package ships inside the pnpm store as an Astro transitive dep.
// We resolve it from the project root so the path survives across machines.
import { parse as parseYaml } from 'yaml';

/** Mirrors the minimal shape that getCollection() returns. */
interface CollectionEntry {
  id: string;
  data: Record<string, unknown>;
}

const CONTENT_BASE = path.resolve(process.cwd(), 'src/content');

const COLLECTION_DIRS: Record<string, string> = {
  categories: path.join(CONTENT_BASE, 'categories'),
  platforms: path.join(CONTENT_BASE, 'platforms'),
  apis: path.join(CONTENT_BASE, 'apis'),
  datasets: path.join(CONTENT_BASE, 'datasets'),
};

function parseFrontmatter(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return parseYaml(match[1]) as Record<string, unknown>;
}

export async function getCollection(name: string): Promise<CollectionEntry[]> {
  const dir = COLLECTION_DIRS[name];
  if (!dir) throw new Error(`Unknown collection: ${name}`);

  const files = fs.readdirSync(dir).filter(f => /\.(md|mdx)$/.test(f));
  return files.map(file => ({
    id: file.replace(/\.(md|mdx)$/, ''),
    data: parseFrontmatter(path.join(dir, file)),
  }));
}
