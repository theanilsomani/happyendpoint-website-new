import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type Vertical = 'real-estate' | 'ecommerce' | 'finance' | 'travel';

export async function getTopicHub(vertical: Vertical) {
  const all = await getCollection('topics');
  return all.find(t => t.data.vertical === vertical && t.data.isHub) ?? null;
}

export async function getTopicSubPages(vertical: Vertical) {
  const all = await getCollection('topics');
  return all.filter(t => t.data.vertical === vertical && !t.data.isHub && !t.data.draft);
}

export async function getTopicBySlug(vertical: Vertical, slug: string) {
  const all = await getCollection('topics');
  const prefix = `${vertical}-data-`;
  return all.find(t => t.data.vertical === vertical && !t.data.isHub && t.id === `${prefix}${slug}`) ?? null;
}

export async function getStaticPathsForVertical(vertical: Vertical) {
  const subPages = await getTopicSubPages(vertical);
  const prefix = `${vertical}-data-`;
  return subPages.map(t => ({
    params: { slug: t.id.replace(prefix, '') },
    props: { topic: t },
  }));
}

export async function resolveTopicRelations(topic: CollectionEntry<'topics'>) {
  const [allApis, allDatasets] = await Promise.all([
    getCollection('apis'),
    getCollection('datasets'),
  ]);
  const apis = allApis.filter(a => topic.data.relatedApiSlugs.includes(a.id));
  const datasets = allDatasets.filter(d => topic.data.relatedDatasetSlugs.includes(d.id));
  return { apis, datasets };
}
