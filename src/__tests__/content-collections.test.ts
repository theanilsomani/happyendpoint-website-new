import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';

describe('content collections', () => {
  it('loads platforms with valid category references', async () => {
    const [platforms, categories] = await Promise.all([
      getCollection('platforms'),
      getCollection('categories'),
    ]);
    expect(platforms.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
    const catSlugs = new Set(categories.map(c => c.id));
    for (const p of platforms) {
      expect(catSlugs.has(p.data.category)).toBe(true);
    }
  });

  it('loads APIs with valid platform references', async () => {
    const [apis, platforms] = await Promise.all([
      getCollection('apis'),
      getCollection('platforms'),
    ]);
    expect(apis.length).toBeGreaterThan(0);
    const platformSlugs = new Set(platforms.map(p => p.id));
    for (const a of apis) {
      expect(platformSlugs.has(a.data.platform)).toBe(true);
    }
  });

  it('loads datasets with valid platform references', async () => {
    const [datasets, platforms] = await Promise.all([
      getCollection('datasets'),
      getCollection('platforms'),
    ]);
    expect(datasets.length).toBeGreaterThan(0);
    const platformSlugs = new Set(platforms.map(p => p.id));
    for (const d of datasets) {
      expect(platformSlugs.has(d.data.platform)).toBe(true);
    }
  });

  it('any dataset with freeSample has a non-empty recordCount', async () => {
    const datasets = await getCollection('datasets');
    for (const d of datasets) {
      if (d.data.freeSample) {
        expect(d.data.freeSample.recordCount.length).toBeGreaterThan(0);
      }
    }
  });
});
