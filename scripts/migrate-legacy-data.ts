#!/usr/bin/env -S tsx
/**
 * One-shot migration from the legacy Next.js site to Astro content
 * collections. Input: scripts/legacy-snapshot/*.json. Output: MDX files
 * under src/content/{categories,platforms,apis,datasets}/.
 *
 * Re-runnable: overwrites existing files.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './lib/slugify';
import { renderMdx } from './lib/mdx-writer';
import type {
  LegacyCategory, LegacyPlatform, LegacyAPI,
  LegacyDataset, LegacyFreeDataset,
} from './lib/legacy-types';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const snapshot = resolve(projectRoot, 'scripts/legacy-snapshot');
const contentRoot = resolve(projectRoot, 'src/content');

function read<T>(name: string): T {
  const path = resolve(snapshot, name);
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function write(dir: string, slug: string, content: string) {
  const full = resolve(contentRoot, dir);
  mkdirSync(full, { recursive: true });
  writeFileSync(resolve(full, `${slug}.mdx`), content, 'utf8');
}

/** Remove keys with undefined values so renderMdx never sees them. */
function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

// --- Categories ------------------------------------------------------------
function migrateCategories(items: LegacyCategory[]) {
  for (const c of items) {
    const body = `${c.description}\n\n## About this category\n\n` +
      `Browse platforms, APIs, and datasets in the ${c.name} category below.\n`;
    const frontmatter = {
      name: c.name,
      tagline: c.description.slice(0, 140),
      description: c.description,
      order: 99,
    };
    write('categories', c.slug, renderMdx(compact(frontmatter), body));
  }
  console.log(`categories: ${items.length} written`);
}

// --- Platforms -------------------------------------------------------------
function migratePlatforms(items: LegacyPlatform[], categoriesBySlug: Map<string, LegacyCategory>) {
  const categoriesByName = new Map<string, string>();
  for (const c of categoriesBySlug.values()) categoriesByName.set(c.name, c.slug);

  for (const p of items) {
    const categorySlug = categoriesByName.get(p.category) ?? slugify(p.category);
    const frontmatter = {
      name: p.name,
      domain: p.domain,
      category: categorySlug,
      icon: p.icon ?? undefined,
      tagline: p.description.slice(0, 140),
      description: p.description,
      longDescription: p.longDescription,
      tags: [categorySlug],
      hasApi: p.hasApi,
      hasDatasets: p.hasDatasets,
      hasFreeDatasets: p.hasFreeDatasets,
      featured: false,
      draft: false,
    };
    const body = `${p.longDescription || p.description}\n`;
    write('platforms', p.slug, renderMdx(compact(frontmatter), body));
  }
  console.log(`platforms: ${items.length} written`);
}

// --- APIs ------------------------------------------------------------------
function migrateApis(items: LegacyAPI[]) {
  for (const a of items) {
    const slug = slugify(a.id);
    const frontmatter = {
      name: a.name,
      platform: a.platformSlug,
      rapidApiUrl: a.rapidApiUrl,
      version: a.version ?? undefined,
      description: a.description,
      tags: a.features.map(slugify).slice(0, 6),
      features: a.features,
      endpoints: [],
      openApiFile: a.openApiFile ?? undefined,
      pricing: null,
      icon: a.icon ?? undefined,
      featured: false,
      draft: false,
    };
    const body = `${a.description}\n`;
    write('apis', slug, renderMdx(compact(frontmatter), body));
  }
  console.log(`apis: ${items.length} written`);
}

// --- Datasets (with free samples nested in) --------------------------------
function migrateDatasets(items: LegacyDataset[], freeItems: LegacyFreeDataset[]) {
  const freeByParent = new Map<string, LegacyFreeDataset>();
  for (const f of freeItems) {
    if (f.sampleOfDatasetId) freeByParent.set(f.sampleOfDatasetId, f);
  }
  const matched = new Set<string>();

  for (const d of items) {
    const slug = slugify(d.id);
    const sample = freeByParent.get(d.id);
    if (sample) matched.add(sample.id);
    const frontmatter: Record<string, unknown> = {
      name: d.name,
      platform: d.platformSlug,
      version: d.version,
      description: d.description,
      recordCount: d.recordCount,
      format: d.format,
      price: d.price,
      tags: d.features.map(slugify).slice(0, 6),
      features: d.features,
      featured: false,
      draft: false,
    };
    if (sample) {
      frontmatter.freeSample = {
        id: sample.id,
        name: sample.name,
        version: sample.version,
        description: sample.description,
        recordCount: sample.recordCount,
        format: sample.format,
        features: sample.features,
      };
    }
    const body = `${d.description}\n`;
    write('datasets', slug, renderMdx(compact(frontmatter), body));
  }

  // Orphan free datasets (no parent paid dataset) become standalone entries
  // with price "Free" and no freeSample — so no data is lost.
  const orphans = freeItems.filter(f => !matched.has(f.id));
  for (const f of orphans) {
    const slug = slugify(f.id);
    const frontmatter = {
      name: f.name,
      platform: f.platformSlug,
      version: f.version,
      description: f.description,
      recordCount: f.recordCount,
      format: f.format,
      price: 'Free',
      tags: f.features.map(slugify).slice(0, 6),
      features: f.features,
      featured: false,
      draft: false,
    };
    const body = `${f.description}\n`;
    write('datasets', slug, renderMdx(compact(frontmatter), body));
  }
  console.log(`datasets: ${items.length} paid + ${orphans.length} standalone free written`);
}

// --- Main ------------------------------------------------------------------
function main() {
  const categories = read<LegacyCategory[]>('categories.json');
  const platforms  = read<LegacyPlatform[]>('platforms.json');
  const apis       = read<LegacyAPI[]>('apis.json');
  const datasets   = read<LegacyDataset[]>('datasets.json');
  const freeDs     = read<LegacyFreeDataset[]>('free-datasets.json');

  const categoriesBySlug = new Map(categories.map(c => [c.slug, c]));

  migrateCategories(categories);
  migratePlatforms(platforms, categoriesBySlug);
  migrateApis(apis);
  migrateDatasets(datasets, freeDs);

  console.log('\nMigration complete.');
}

main();
