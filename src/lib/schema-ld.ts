import type { BreadcrumbList, FAQPage, WithContext } from 'schema-dts';
import siteConfig from '@/config/site.config';
import type { DatasetEntry, ApiEntry, PlatformEntry } from './content-queries';

type BreadcrumbItem = { name: string; url: string };

export function breadcrumbListSchema(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPageSchema(faqs: Array<{ question: string; answer: string }>): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function datasetSchema(dataset: DatasetEntry, platform: PlatformEntry | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: dataset.data.name,
    description: dataset.data.description,
    url: `${siteConfig.url}/datasets/${dataset.id}`,
    keywords: dataset.data.tags.join(', '),
    creator: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    distribution: dataset.data.format.split(/[,/]/).map((f: string) => ({
      '@type': 'DataDownload',
      encodingFormat: f.trim(),
    })),
    isBasedOn: platform ? `https://${platform.data.domain}` : undefined,
    variableMeasured: dataset.data.features,
  };
}

export function softwareApplicationSchema(api: ApiEntry, _platform: PlatformEntry | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: api.data.name,
    description: api.data.description,
    url: `${siteConfig.url}/library/${api.id}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      url: api.data.rapidApiUrl,
      availability: 'https://schema.org/InStock',
    },
    featureList: api.data.features,
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  };
}
