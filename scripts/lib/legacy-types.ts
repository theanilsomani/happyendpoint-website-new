// Mirrors the shapes exported by the old Next.js site at
// D:\Programming\happyendpoint-website\src\data\*.ts
// Re-declared here so the migration script has zero runtime dependency
// on the legacy project.

export type LegacyCategoryName =
  | 'Travel' | 'Grocery' | 'Finance' | 'Real Estate'
  | 'Retail' | 'Fashion' | 'Beauty' | 'Aggregator';

export interface LegacyCategory {
  slug: string;
  name: LegacyCategoryName;
  description: string;
  // icon in legacy is a LucideIcon component — not portable. Dropped here.
  color: string;
}

export interface LegacyPlatform {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  domain: string;
  icon?: string;
  category: LegacyCategoryName;
  hasApi: boolean;
  hasDatasets: boolean;
  hasFreeDatasets: boolean;
}

export interface LegacyAPI {
  id: string;
  platformSlug: string;
  name: string;
  description: string;
  rapidApiUrl: string;
  icon?: string;
  features: string[];
  version?: string;
  openApiFile?: string;
}

export interface LegacyDataset {
  id: string;
  platformSlug: string;
  name: string;
  version: string;
  description: string;
  recordCount: string;
  format: string;
  price: string;
  features: string[];
}

export interface LegacyFreeDataset {
  id: string;
  platformSlug: string;
  name: string;
  version: string;
  description: string;
  recordCount: string;
  format: string;
  features: string[];
  sampleOfDatasetId?: string;
}
