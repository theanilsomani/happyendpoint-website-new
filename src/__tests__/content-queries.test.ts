import { describe, it, expect } from 'vitest';
import { getApisForPlatform, getAllFreeSamples, getRelatedApis } from '../lib/content-queries';

describe('content-queries', () => {
  it('returns APIs for a given platform', async () => {
    const apis = await getApisForPlatform('propertyfinder');
    expect(apis.length).toBeGreaterThan(0);
    apis.forEach(a => expect(a.data.platform).toBe('propertyfinder'));
  });

  it('returns all free samples (parent + standalone)', async () => {
    const samples = await getAllFreeSamples();
    expect(samples.length).toBeGreaterThan(0);
  });

  it('getRelatedApis excludes the source API', async () => {
    const apis = await (await import('astro:content')).getCollection('apis');
    if (apis.length >= 2) {
      const related = await getRelatedApis(apis[0], 3);
      expect(related.every(r => r.id !== apis[0].id)).toBe(true);
    }
  });
});
