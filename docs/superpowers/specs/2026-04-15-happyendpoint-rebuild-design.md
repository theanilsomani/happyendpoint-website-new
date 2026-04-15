# Happy Endpoint Website Rebuild — Design Spec

**Date:** 2026-04-15
**Status:** Approved for implementation planning
**Domain:** happyendpoint.com
**Goal:** Rebuild happyendpoint.com as a content-driven SEO-optimized marketing + catalog site for APIs and datasets sold on RapidAPI. Replace the existing Next.js site (D:\Programming\happyendpoint-website) using the Astro Rocket template.

---

## 1. Overview

Happy Endpoint sells web-scraping APIs and structured datasets on RapidAPI. The website's purpose is to (a) rank for platform-name and data keywords, (b) educate buyers, and (c) funnel them to the RapidAPI product listings. No auth, no billing, no dashboards — pure marketing + catalog.

**Primary conversion goal:** user clicks through to a RapidAPI listing or downloads a free dataset sample.

**Non-goals:** user accounts, self-serve billing, in-app API key management, API documentation (lives at `docs.happyendpoint.com`, a separate project).

---

## 2. Tech stack & hosting

- **Framework:** Astro 6 (template-default), TypeScript strict mode
- **Styling:** Tailwind CSS v4 with `@theme` directive
- **Content:** MDX via Astro content collections, Zod schemas for validation
- **Interactivity:** React 19 islands, only where needed (filter UI, contact form, search)
- **Search:** Pagefind (static, build-time indexed)
- **Email:** Resend (contact form)
- **Hosting:** Cloudflare Pages via `@astrojs/cloudflare` adapter
- **Package manager:** pnpm (per template)
- **Node:** >= 22.12.0 (per template)

**Adapter swap:** `astro.config.mjs` currently configured for Netlify/Vercel. Switch to `@astrojs/cloudflare`. Remove unused adapter configs and their devDeps.

**Rendering model:** static-first. Every content page is pre-rendered at build time. Server endpoints exist only for the contact form (Cloudflare Function).

---

## 3. Information architecture

### URL map

| URL | Purpose |
|---|---|
| `/` | Home |
| `/library` | All APIs index, client-side filtered |
| `/library/[api-slug]` | API detail page |
| `/datasets` | All paid datasets index, client-side filtered |
| `/datasets/[dataset-slug]` | Dataset detail (free sample embedded if present) |
| `/free-datasets` | Lead-gen index of all free samples |
| `/platforms` | All platforms grid, filterable by category |
| `/platforms/[platform-slug]` | Platform hub: description + APIs + datasets + FAQs |
| `/categories` | All categories |
| `/categories/[category-slug]` | Category hub: platforms + APIs + datasets |
| `/blog` | Blog index |
| `/blog/[post-slug]` | Blog post |
| `/about` | About |
| `/contact` | Contact form (Resend) |
| `/faq` | FAQ |
| `/use-cases` | Use cases |
| `/why-happyendpoint` | Value prop page |
| `/privacy`, `/terms` | Legal |
| `/search` | Pagefind search results |

**Dropped from old site:** `/login`, `/signup`, `/pricing` (standalone), `/apis` (renamed to `/library`), `/free-datasets/[slug]` (folded into parent dataset page).

### Filtering model

Index pages (`/library`, `/datasets`, `/platforms`, `/free-datasets`) render all items server-side in the HTML. A small React island handles client-side filtering — platform, category, tag, text search. **No URL query parameters for filters.** Reasons:

- One canonical URL per index — no thin duplicate pages for Google to filter out.
- All items are crawlable in the initial HTML regardless of filter state.
- Avoids the known SEO weakness of tag/filter archive pages.

### Cross-linking (the SEO glue)

- **API detail** → parent platform hub; related APIs (same platform + shared tags); inline free-sample CTA if platform has any free dataset; link to paid dataset counterpart if exists.
- **Dataset detail** → parent platform; related datasets; API counterpart on same platform; inline free-sample block if present.
- **Platform hub** → all APIs, all datasets, all free samples for that platform; category breadcrumb.
- **Category hub** → all platforms, top APIs, top datasets in category.
- Breadcrumbs with `BreadcrumbList` JSON-LD on every detail page.

---

## 4. Content model

Five new content collections in `src/content/`, joined to existing `blog`, `faqs`, `pages`, `authors`, `stack`. Each entity is an MDX file: frontmatter for structured fields, MDX body for long-form SEO content.

### `platforms/[slug].mdx`

```yaml
name: PropertyFinder
domain: propertyfinder.ae
category: real-estate          # reference() → categories collection
icon: /logos/propertyfinder.svg
tagline: "UAE's leading property portal"
description: <short, for cards>
tags: [real-estate, uae, listings, rentals]
featured: true                 # appears on homepage platform strip
```

MDX body: long-form hub description, "what data you'll find," use cases. This is the SEO anchor for platform-name queries.

### `apis/[slug].mdx`

```yaml
name: PropertyFinder Listings API
platform: propertyfinder       # reference() → platforms
rapidApiUrl: https://rapidapi.com/...
version: "2.0"
tags: [listings, real-estate, rentals]
features: [search, filters, pagination, photos]
endpoints:                     # optional structured list
  - { method: GET, path: /search, summary: "..." }
pricing: null                  # placeholder; filled when RapidAPI data available
```

MDX body: what the API does, example request/response, use cases, integration tips.

### `datasets/[slug].mdx`

```yaml
name: PropertyFinder Properties Dataset
platform: propertyfinder
version: "2024-Q4"
recordCount: 250000
format: [json, csv, parquet]
price: 499                     # or null, or "contact"
tags: [listings, real-estate, historical]
features: [geocoded, deduplicated, daily-updates]
freeSample:                    # optional — nests free data inside parent
  recordCount: 1000
  sampleSize: "2.3 MB"
  downloadUrl: /samples/propertyfinder-properties-sample.json
  format: json
```

MDX body: schema description, collection methodology, sample fields, use cases. Free samples are **not a separate collection** — they live inline on their parent paid dataset.

### `categories/[slug].mdx`

```yaml
name: Real Estate
tagline: "Property listings, rentals, and market data"
icon: ...
order: 1
```

MDX body: long-form category overview (substantive SEO content, e.g. "The UAE real estate data landscape").

### `blog/[slug].mdx`

Already supported by template. Seed with 3–5 SEO-ready posts on topics like:

- "How to scrape PropertyFinder data legally"
- "Comparing UAE real estate data sources"
- "Building a property-alert app with the PropertyFinder API"
- "Datasets vs live APIs: which do you need?"
- "A buyer's guide to RapidAPI data products"

### Validation rules

- All collections defined in `src/content.config.ts` with strict Zod schemas.
- Cross-collection refs via Astro's `reference()`: platform↔category, api↔platform, dataset↔platform.
- Build fails on broken references (catches typos and orphaned items at build time).

### Migration

A one-shot migration script reads the old TS data files (`D:\Programming\happyendpoint-website\src\data\*.ts`) and emits MDX files with frontmatter. Free datasets from the old `free-datasets.ts` are merged into their parent paid datasets' `freeSample` field (lookup via `sampleOfDatasetId`). Script lives in `scripts/migrate-legacy-data.ts`, runs once, output is committed.

---

## 5. Page templates

### API detail (`/library/[slug]`)

1. Breadcrumb → hero (platform logo, name, tags, primary CTA to RapidAPI)
2. Description (MDX body)
3. Endpoints table (if defined) + pricing slot (empty placeholder for now)
4. Code example (request/response)
5. **Free sample CTA** block (if platform has any free dataset → drives to download)
6. Related APIs on same platform (EntityCards)
7. "Looking for bulk data?" — linked paid dataset if one exists on this platform
8. FAQ section (from FAQ collection, filtered by platform or tag)
9. Final CTA

### Dataset detail (`/datasets/[slug]`)

1. Breadcrumb → hero (record count badge, format badges, price, CTA to purchase on RapidAPI)
2. Description + methodology (MDX body)
3. Schema / sample fields table
4. **Free sample download block** inline (if `freeSample` set)
5. Related datasets + API counterpart on same platform
6. FAQ, CTA

### Platform hub (`/platforms/[slug]`)

1. Breadcrumb → hero (logo, tagline, category chip)
2. Long-form description (MDX body — primary SEO content)
3. APIs section: EntityCard grid of every API on this platform
4. Datasets section: EntityCard grid of every dataset
5. Free samples section (aggregates all `freeSample` blocks for platform)
6. Use cases (optional MDX body section)
7. FAQ, CTA

### Category hub (`/categories/[slug]`)

1. Breadcrumb → hero
2. Long-form MDX body
3. Platforms grid
4. Featured APIs + featured datasets
5. FAQ, CTA

### Index pages (`/library`, `/datasets`, `/platforms`, `/free-datasets`)

1. Hero + intro copy
2. Filter panel (left or top): platform, category, tag, text search
3. Results grid (EntityCards)
4. Pagination if >30 items

### Home (`/`)

1. Hero — tagline + subhead + two CTAs ("Browse APIs" / "Browse Datasets") + code/response snippet mock
2. Platform logos strip (featured platforms, instant trust signal)
3. Featured APIs (3-column EntityCard grid)
4. Featured Datasets (3-column grid)
5. Categories row
6. "Try free samples" CTA band → `/free-datasets`
7. How it works (Browse → Subscribe on RapidAPI → Integrate)
8. Latest blog posts (3)
9. FAQ (top 5–6)
10. Footer CTA + footer

---

## 6. Components

### New

- **`EntityCard.astro`** — Piloterr-style card: icon + title + subtext + metric row + tag chips. Variants: API, Dataset, Platform, Category, FreeSample. Used on every index and related-items section.
- **`FilterPanel.tsx`** (React island) — client-side filter and search for index pages. Controls: platform select, category select, tag multi-select, text input. Filters a list of rendered cards via `hidden` class (SEO-safe).
- **`FreeSampleBlock.astro`** — download CTA block. Used on API detail, dataset detail, platform hub, homepage CTA band.
- **`EndpointTable.astro`** — renders API endpoints from frontmatter.
- **`Breadcrumbs.astro`** — renders breadcrumb UI and `BreadcrumbList` JSON-LD.
- **`FAQSection.astro`** — renders FAQ list and `FAQPage` JSON-LD.
- **`PricingSlot.astro`** — empty-state-aware pricing block; shows placeholder ("Pricing available on RapidAPI →") when `pricing: null`.
- **`PlatformLogosStrip.astro`** — homepage trust bar.

### Reused from template

- Layouts (`BaseLayout`, `MarketingLayout`, `PageLayout`, `BlogLayout`)
- Hero components
- Blog components
- SEO components
- Landing/pattern components

---

## 7. Visual system & theming

### Brand color

**Deep blue** primary. Single tokens file at `src/styles/theme.css` drives the whole palette via Tailwind v4's `@theme` directive:

```css
@theme {
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #2563eb;   /* primary */
  --color-brand-600: #1d4ed8;
  --color-brand-700: #1e40af;
  --color-brand-900: #1e3a8a;
  --color-ink:       #0f172a;
  --color-muted:     #64748b;
  --color-surface:   #ffffff;
  --color-subtle:    #f8fafc;
  --color-border:    #e2e8f0;
}
```

Changing brand color later = edit these values; everything else cascades.

### Typography

- Headings: Outfit Variable (already in template)
- Body: Manrope Variable
- Code: JetBrains Mono Variable
- Sizes conservative, line-height generous, display headings have tight letter-spacing.

### Layout language

- Ring-1 borders, soft shadows, generous whitespace
- Small-caps labels for metadata rows
- Pill-shaped tag chips
- Subtle hover states
- Mobile-first responsive
- No neon gradients, no animated backgrounds, no glassmorphism

Reference: Piloterr (`instruction/Screenshot_*.jpeg`) — business, not flashy SaaS.

---

## 8. SEO strategy

### Per-page

- Unique `<title>` and `<meta description>` per entity, auto-derived from frontmatter and overridable
- Open Graph + Twitter card metadata per page
- OG images: start with a single static brand OG image; upgrade to per-entity generated OG images later
- Canonical URL per entity
- Single `<h1>` per page; semantic heading hierarchy
- Landmark regions: `<main>`, `<nav>`, `<article>`, `<aside>`
- Explicit image dimensions; font preloading; no CLS

### Structured data (JSON-LD)

| Schema | Rendered on |
|---|---|
| `Organization` | Every page (footer-rendered) |
| `BreadcrumbList` | Every detail page |
| `Dataset` | Every dataset detail page (Google Dataset Search eligibility) |
| `SoftwareApplication` / `Product` | Every API detail page |
| `FAQPage` | Any page with FAQ section |
| `BlogPosting` / `Article` | Blog posts |
| `ItemList` | Index pages (optional) |

### Crawlability

- `sitemap.xml` via `@astrojs/sitemap`, including all collections
- `robots.txt` allows all, points to sitemap
- RSS feed for blog (template already ships this)
- Pagefind static search index built at build time

### Performance (Core Web Vitals)

- Zero client JS on most pages. Client JS only on: filter islands (lazy-loaded), Pagefind search, contact form.
- Images via Astro's `<Image>` component: WebP/AVIF, lazy, responsive srcset.
- Fonts self-hosted via fontsource (template default).
- Target: Lighthouse 95+ on Performance, SEO, Accessibility, Best Practices.

---

## 9. Redirects (old Next.js → new Astro)

Cloudflare Pages `_redirects` file at project root. All redirects are 301 (permanent) unless noted.

```
# APIs: type-first renamed
/apis                               /library                         301
/apis/:slug                         /library/:slug                   301

# Datasets: same path, no redirect needed
# (omitted — 200 natively)

# Free datasets
/free-datasets                      /free-datasets                   200
/free-datasets/:slug                /datasets/:parent-slug           301

# Dropped pages
/login                              /                                301
/signup                             /                                301
/pricing                            /library                         301
```

The per-slug free-dataset → parent-dataset redirect map is generated at build time by a script that reads the `datasets` collection and emits one line per `freeSample`-bearing dataset. Script: `scripts/generate-redirects.ts`. Output appended to `_redirects` before deploy.

---

## 10. Contact form

**Backend is deferred.** User has not yet chosen an email-sending provider (Resend, Postmark, SendGrid, Cloudflare Email Routing, etc.). In this phase we ship the **UI only**, matching the overall visual design:

- `/contact` page aligned with site-wide design tokens, typography, and spacing
- Form fields: name, email, subject, message, honeypot (hidden)
- Client-side validation (required fields, email format)
- Submit button in a "disabled / coming soon" state **OR** posts to a stubbed endpoint that returns a friendly success message without actually sending — whichever the implementation plan chooses (prefer stub endpoint so the UX reads as complete).
- No real network integration, no API keys required to build or deploy.

When a provider is chosen later, swap the stub for a real Cloudflare Function handler. The form UI does not change.

Suggested alternative contact channels on the page until backend is live: direct email link, RapidAPI provider contact, optional Calendly or similar.

---

## 11. Testing

- **`astro check`** — type-safe content refs catch broken links at build time
- **`vitest`** — unit tests for slug utilities, redirect-map generator, migration script
- **`playwright`** — smoke tests: home loads, one API page loads, filters work, contact form POSTs successfully to a mock
- Manual Lighthouse pass on 5 representative pages (home, library, API detail, dataset detail, platform hub)
- Manual a11y pass (axe DevTools) on same 5 pages
- Manual mobile QA at 375px, 768px, 1440px

---

## 12. Implementation phases

Expanded to a full task breakdown in the subsequent implementation plan. High-level sequence:

### Phase 1 — Foundation

- Cloudflare adapter swap; remove Vercel/Netlify configs and deps
- `src/styles/theme.css` tokens; Tailwind `@theme` wiring
- Nav, footer, base layouts with `Organization` JSON-LD
- Content collection schemas (5 new + existing)
- Migration script: old TS data → MDX files (one-shot; committed output)

### Phase 2 — Core data pages

- Platform hub template + `/platforms` index with filters
- API detail template + `/library` index with filters
- Dataset detail template + `/datasets` index with filters
- `FreeSampleBlock` component; `/free-datasets` index
- Category hub + `/categories` index
- Breadcrumbs, cross-linking, JSON-LD

### Phase 3 — Marketing & supporting pages

- Home (all 10 sections)
- About, Contact (UI only — backend deferred), FAQ, Use cases, Why Happy Endpoint, Privacy, Terms
- Blog with 3–5 seeded SEO posts
- Pagefind search page

### Phase 4 — Polish & ship

- `_redirects` with generated free-dataset map
- Sitemap, robots, RSS verified
- Lighthouse + a11y + mobile QA
- Deploy to Cloudflare Pages

---

## 13. Success criteria

- All old-site platform/API/dataset content is present on the new site (nothing lost in migration).
- Every page has unique title, meta description, canonical URL, and appropriate JSON-LD.
- Lighthouse ≥ 95 on Performance, SEO, Accessibility, Best Practices for the five representative pages.
- No broken internal links at build time (enforced by `astro check` + reference validation).
- All old URLs resolve: either identical path, or 301 to the correct new URL.
- Contact page UI is complete, styled, and validates client-side; backend stubbed until a provider is chosen.
- Site deploys cleanly to Cloudflare Pages on push to `main`.

---

## 14. Open items deferred to later

- RapidAPI pricing data per API (user to provide; `pricing` field is schemaed and slot is rendered now).
- Per-entity generated OG images (static brand OG for now; auto-generation later).
- Additional blog posts beyond the initial 3–5 seeds (ongoing content work).
- Brand color change (one-file swap, as designed).
- Contact form backend provider selection and integration (UI ships in this phase).
