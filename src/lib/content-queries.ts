import { getCollection, type CollectionEntry } from 'astro:content';

export type PlatformEntry = CollectionEntry<'platforms'>;
export type ApiEntry      = CollectionEntry<'apis'>;
export type DatasetEntry  = CollectionEntry<'datasets'>;
export type CategoryEntry = CollectionEntry<'categories'>;

export async function getAllPublishedPlatforms(): Promise<PlatformEntry[]> {
  return (await getCollection('platforms')).filter(p => !p.data.draft);
}
export async function getAllPublishedApis(): Promise<ApiEntry[]> {
  return (await getCollection('apis')).filter(a => !a.data.draft);
}
export async function getAllPublishedDatasets(): Promise<DatasetEntry[]> {
  return (await getCollection('datasets')).filter(d => !d.data.draft);
}
export async function getAllCategories(): Promise<CategoryEntry[]> {
  return getCollection('categories');
}

export async function getPlatformBySlug(slug: string): Promise<PlatformEntry | undefined> {
  const all = await getCollection('platforms');
  return all.find(p => p.id === slug);
}
export async function getCategoryBySlug(slug: string): Promise<CategoryEntry | undefined> {
  const all = await getCollection('categories');
  return all.find(c => c.id === slug);
}

export async function getApisForPlatform(platformSlug: string): Promise<ApiEntry[]> {
  const all = await getAllPublishedApis();
  return all.filter(a => a.data.platform === platformSlug);
}
export async function getDatasetsForPlatform(platformSlug: string): Promise<DatasetEntry[]> {
  const all = await getAllPublishedDatasets();
  return all.filter(d => d.data.platform === platformSlug);
}
export async function getPlatformsInCategory(categorySlug: string): Promise<PlatformEntry[]> {
  const all = await getAllPublishedPlatforms();
  return all.filter(p => p.data.category === categorySlug);
}

export async function getRelatedApis(api: ApiEntry, limit = 3): Promise<ApiEntry[]> {
  const all = await getAllPublishedApis();
  const samePlatform = all.filter(a => a.id !== api.id && a.data.platform === api.data.platform);
  if (samePlatform.length >= limit) return samePlatform.slice(0, limit);
  // fill with others sharing at least one tag
  const tagSet = new Set(api.data.tags);
  const byTag = all.filter(a =>
    a.id !== api.id &&
    a.data.platform !== api.data.platform &&
    a.data.tags.some((t: string) => tagSet.has(t)),
  );
  return [...samePlatform, ...byTag].slice(0, limit);
}

export async function getFreeSamplesForPlatform(platformSlug: string): Promise<DatasetEntry[]> {
  const all = await getAllPublishedDatasets();
  return all.filter(d =>
    d.data.platform === platformSlug &&
    (d.data.freeSample !== undefined || d.data.price.toLowerCase() === 'free'),
  );
}

export async function getAllFreeSamples(): Promise<DatasetEntry[]> {
  const all = await getAllPublishedDatasets();
  return all.filter(d =>
    d.data.freeSample !== undefined || d.data.price.toLowerCase() === 'free',
  );
}

export async function getFeaturedPlatforms(limit = 8): Promise<PlatformEntry[]> {
  const all = await getAllPublishedPlatforms();
  const featured = all.filter(p => p.data.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  return [...featured, ...all.filter(p => !p.data.featured)].slice(0, limit);
}
export async function getFeaturedApis(limit = 6): Promise<ApiEntry[]> {
  const all = await getAllPublishedApis();
  const featured = all.filter(a => a.data.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  return [...featured, ...all.filter(a => !a.data.featured)].slice(0, limit);
}
export async function getFeaturedDatasets(limit = 6): Promise<DatasetEntry[]> {
  const all = await getAllPublishedDatasets();
  const featured = all.filter(d => d.data.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  return [...featured, ...all.filter(d => !d.data.featured)].slice(0, limit);
}
