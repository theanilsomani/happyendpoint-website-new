import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Blog collection with Content Layer API
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(100),
      description: z.string().max(200),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      author: z.string().default('Team'),
      image: image().optional(),
      imageAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      svgSlug: z.string().optional(),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      locale: z.enum(['en', 'es', 'fr']).default('en'),
    }),
});

// Pages collection for static pages
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date().optional(),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

// Authors collection
const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      bio: z.string(),
      avatar: image().optional(),
      social: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
    }),
});

// FAQs collection (for JSON-LD FAQ schema)
const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
    order: z.number().default(0),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

// Projects collection — one MDX file per project
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.url().optional(),
      repo: z.url().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      year: z.number().optional(),
      client: z.string().optional(),
      role: z.string().optional(),
      services: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

// Stack collection — one MDX file per tool, editable like blog posts
const stack = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/stack' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    url: z.url(),
    icon: z.string(), // icon name, e.g. 'brand-astro'
    colorOklch: z.string(), // OKLCH params, e.g. '62.5% 0.22 38'
    order: z.number().default(0),
  }),
});

// --- Happy Endpoint domain collections ------------------------------------

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().max(140),
    description: z.string().max(300),
    icon: z.string().optional(),
    order: z.number().default(99),
  }),
});

const platforms = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/platforms' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      domain: z.string(),
      category: z.string(),
      icon: z.string().optional(),
      logo: image().optional(),
      tagline: z.string().max(140),
      description: z.string().max(300),
      longDescription: z.string().optional(),
      tags: z.array(z.string()).default([]),
      hasApi: z.boolean().default(false),
      hasDatasets: z.boolean().default(false),
      hasFreeDatasets: z.boolean().default(false),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const apis = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/apis' }),
  schema: z.object({
    name: z.string(),
    platform: z.string(),
    rapidApiUrl: z.url(),
    version: z.string().optional(),
    description: z.string().max(300),
    tags: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    endpoints: z
      .array(
        z.object({
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
          path: z.string(),
          summary: z.string().optional(),
        }),
      )
      .default([]),
    openApiFile: z.string().optional(),
    pricing: z.null().default(null),
    icon: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const datasets = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/datasets' }),
  schema: z.object({
    name: z.string(),
    platform: z.string(),
    version: z.string().optional(),
    description: z.string().max(300),
    recordCount: z.string(),
    format: z.string(),
    price: z.string(),
    tags: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    freeSample: z
      .object({
        id: z.string(),
        name: z.string(),
        version: z.string().optional(),
        description: z.string().max(300),
        recordCount: z.string(),
        format: z.string(),
        features: z.array(z.string()).default([]),
        downloadUrl: z.string().optional(),
      })
      .optional(),
    icon: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog,
  pages,
  authors,
  faqs,
  stack,
  projects,
  categories,
  platforms,
  apis,
  datasets,
};
