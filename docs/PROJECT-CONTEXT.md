# Happy Endpoint — project context

A handoff document for future Claude Code sessions. Read this first; then `CLAUDE.md` for codebase architecture, then any doc under `docs/` you specifically need.

## What this is

Happy Endpoint is a **B2B catalog site** for web-scraping APIs and structured datasets. Everything we sell is listed on **RapidAPI** — happyendpoint.com is the marketing/catalog surface; sign-up, billing, and API keys live on RapidAPI. Each API or dataset page on our site links straight to its RapidAPI listing.

The previous version of the site was a Next.js app at `D:/Programming/happyendpoint-website` (kept around as the source of legacy content for `pnpm migrate`). The current site is a fork of the **Astro Rocket** starter (itself forked from Velocity), heavily adapted to be Happy-Endpoint-specific. Most upstream-template content has been deleted; what remains is project-specific.

Hosted on **Cloudflare Pages**, fully static (`output: 'static'`).

## What we sell

Two product shapes, sold per platform:

- **APIs** (`/library`, `src/content/apis/`) — request-time data. You hit an endpoint, you get fresh JSON. Pricing per request via RapidAPI's standard plans.
- **Datasets** (`/datasets`, `src/content/datasets/`) — bulk snapshots. You buy the file, you get every row. Per-snapshot pricing.

Many datasets ship a **free sample** (`/free-datasets`) with **identical schema** to the paid version — the user can integrate against the sample and only flip to paid once they're confident. This is a key part of the buying funnel and it shows up in the blog content too.

API documentation (OpenAPI / Scalar) is hosted **separately** at `docs.happyendpoint.com` (different repo). Don't try to render OpenAPI specs in this codebase — the JSON files in `oas-docs/` are reference material for that other project.

## The catalog (what platforms we cover)

Platforms live in `src/content/platforms/*.mdx`. Each platform groups one-or-more APIs and one-or-more datasets. Categories group platforms by industry.

| Category | Platforms |
|---|---|
| Real estate | Bayut, PropertyFinder, Fotocasa, Rightmove, UAE Real Estate (aggregator) |
| Retail / grocery | Tesco, IKEA, Kohl's, H&M |
| Beauty | Sephora |
| Travel | Priceline |
| Finance | Morningstar, Klarna |

The cross-collection joins (which APIs/datasets belong to which platform; which platforms belong to which category) live in `src/lib/content-queries.ts`. Use those helpers — don't re-implement the joins inside page templates.

## How customers buy (the funnel)

1. **Discover** via /library, /datasets, /platforms, /categories, /free-datasets, or a blog post they searched for.
2. **Evaluate** — usually by downloading a free sample for the platform they care about. Schemas are identical so their integration code works for both sample and paid.
3. **Subscribe on RapidAPI** — every product page has a RapidAPI link. Billing is RapidAPI's, the API key is RapidAPI's.
4. **Integrate** — they consume the API/dataset and ship.

The blog reinforces this funnel: most posts end with a "try the free sample" + "view the product on RapidAPI" CTA pair.

## Voice and brand

This is intentional and important. Match it.

- **Tone:** business, technical, direct. **Not** flashy SaaS, not lifestyle-blog, not aspirational. Think DigitalOcean / Stripe technical content, not Notion / Linear marketing.
- **No emojis.** Anywhere.
- **No "we're so excited"** language. Lead with the practical benefit, end with a clear CTA.
- **Voice in blog posts:** see `src/content/blog/en/buyers-guide-to-rapidapi-data-products.mdx` and `datasets-vs-live-apis-which-to-choose.mdx` — those are the canonical voice references. Short paragraphs, opinionated framing, code samples where they earn their space, internal links to library/datasets/free-datasets/contact.
- **Visual:** brand color is **blue (#2563eb)**. Active theme file is `src/styles/themes/blue.css`. Display font is **Outfit**, body is **Manrope**, mono is **JetBrains Mono** (all loaded site-wide). Cards have soft shadows + subtle borders, not brutalist.
- **The container pattern:** `class="container"` (max 1450px, padding scales 24→48→64→96px with viewport). Every page uses it. Inner prose columns get `max-w-5xl` (1024px) for reading comfort. **Don't introduce ad-hoc `mx-auto max-w-Xxl px-6` patterns** — they break the visual rhythm and we just spent a session purging them.

## Architecture in one map

(For details, read `CLAUDE.md`.)

```
src/
  config/site.config.ts        ← brand name, email, theme color, social
  config/nav.config.ts          ← header nav items
  content.config.ts             ← Zod schemas for ALL collections
  content/                      ← markdown/MDX content
    apis/                       ← one MDX per API
    datasets/                   ← one MDX per dataset
    platforms/                  ← one MDX per platform (parent of APIs/datasets)
    categories/                 ← industry groupings
    blog/en/                    ← all blog posts (locale-aware schema, but only en used)
    faqs/, authors/, projects/, stack/, pages/  ← upstream-theme collections, mostly unused
  components/
    he/                         ← ★ Happy Endpoint domain components (use these)
    ui/                         ← design system primitives
    blog/                       ← BlogCard, ArticleHero, RelatedPosts, etc.
    landing/, hero/, layout/, seo/, patterns/, projects/  ← upstream-theme components
  layouts/
    BaseLayout.astro            ← <head>, favicon, theme script
    MarketingLayout.astro       ← THE default for top-level pages
    BlogLayout.astro            ← article pages
    PageLayout.astro            ← legacy, prefer Marketing
    LandingLayout.astro         ← unused on Happy Endpoint
  pages/                        ← routes; index pages use container + Breadcrumbs + max-w-2xl header
  lib/content-queries.ts        ← cross-collection joins (USE THESE)
  styles/themes/blue.css        ← active theme
public/
  companies-logo/               ← platform SVG logos used in homepage hero
  blog/covers/                  ← generated PNG blog covers
docs/
  PROJECT-CONTEXT.md            ← (this file)
  blog-cover-pipeline.md        ← how blog cover PNGs are generated
oas-docs/                       ← OpenAPI specs — for the SEPARATE docs.happyendpoint.com project, not this one
scripts/
  generate-blog-covers.ts       ← html2png.dev pipeline
  generate-redirects.ts         ← legacy URL → new URL
  migrate-legacy-data.ts        ← Next.js → Astro one-shot migration (DESTRUCTIVE — overwrites MDX)
```

## What we built recently (running log)

This is a chronological summary of the substantive sessions on this codebase. New sessions: **append, don't rewrite.**

### Initial migration & launch shape (pre-handoff)
- Migrated content from the legacy Next.js site into Astro content collections.
- Built domain components in `src/components/he/`.
- Set up Cloudflare Pages deploy + redirect pipeline.

### Session: April 2026 — site cleanup, blog system, design consistency
- **404 page** — switched from `LandingLayout` (floating header) to `MarketingLayout` (solid header) so it matches every other page. Removed the "Quick Links → Features / Components" pill.
- **Removed upstream-template references** — deleted `src/pages/components.astro`. Blog posts that referenced `/components` were left in place per user request, will return 404 if clicked.
- **Favicon** — replaced the auto-generated single-letter monogram with a custom "API" wordmark in Impact font, white on brand-blue rounded square. Added the full PNG icon set (16/32/180/192/512) and `favicon.ico`. The old runtime-redraw favicon script is preserved in `BaseLayout.astro` as a commented block (was theme-reactive; we accepted a static cover for the new design).
- **Homepage hero (`src/components/landing/HeroModern.astro`)** — went through several iterations on size and the "Data from platforms you know" logo strip. Final state has the strip merged into the hero (not a separate band), eyebrow + logos left-aligned on desktop. Logo SVGs at `public/companies-logo/`. They're hardcoded in `HeroModern.astro` (not driven by the platforms collection — simpler, edit-by-hand to add/remove).
- **Blog system overhaul:**
  - Deleted 11 upstream-template blog posts and their cover SVGs.
  - Wrote 5 new posts diversifying into the verticals we sell (Tesco grocery, Sephora beauty, IKEA retail, Priceline travel, free-sample evaluation framework).
  - Added `coverImage`, `coverCategory`, `coverSlugLabel` fields to the blog schema (`src/content.config.ts`).
  - Updated `BlogCard.astro` and `ArticleHero.astro` to render the new PNG covers, fall back to the legacy `BlogImageSVG` if present.
  - Built `scripts/generate-blog-covers.ts` — calls keyless `html2png.dev` with the "Technical Brief" HTML template, saves PNGs to `public/blog/covers/{slug}.png`. Idempotent; supports `--force` and `--slug`. **Full design + template + curl examples in `docs/blog-cover-pipeline.md`.**
  - Generated covers for all 10 posts (5 originals + 5 new).
- **Container/spacing consistency** — purged every `mx-auto max-w-Xxl px-6` pattern across pages and layouts. Standardized on `class="container"` with `max-w-5xl` for prose-column inners. The 24px-fixed padding on blog/projects pages was the visual mismatch with the rest of the site.
- **Blog index hero** — replaced the centered "Blog / Articles on Astro Rocket" template hero with the standard left-aligned `<header class="max-w-2xl">` pattern used by `/library`, `/datasets`, etc. Switched layout to `MarketingLayout` for consistency.
- **BlogCard sizing** — added `h-full flex flex-col` + `mt-auto` on meta + line-clamp on title + tag-cap-3 + height-clipped tag row, so all cards in a grid row are equal-height regardless of title/description length or tag count.

## Open / deferred items

These are known non-issues — flagged so future sessions don't think they're bugs to fix unprompted:

- **Contact form backend.** `/api/contact` exists but the email-send wiring is "deferred" per `DEPLOY.md`. Currently uses Resend (configured via `RESEND_API_KEY` env var); confirm before assuming submissions deliver.
- **`pricing` field on API content** — schema-required as `null`. Will be populated when we have a stable RapidAPI pricing surface.
- **Per-entity OG images** — every page currently shares `/og-default.svg`. Blog posts have their own generated covers (used as OG image), but platform/API/dataset pages don't.
- **Two upstream blog posts that link to `/components`** — left in place per user instruction. Those links 404 because we deleted `/components`. Acceptable trade-off.
- **`src/components/landing/`, `hero/`, `projects/`** — most of these are upstream-theme components not used on Happy Endpoint. `HeroModern`, `FeatureMosaic` are used on the homepage; the rest are dead code we haven't bothered to delete.

## Things to NOT do unprompted

- Don't introduce emojis to copy.
- Don't change the brand from blue without asking — the favicon, all generated blog covers, and the `blue.css` theme file would need coordinated updates.
- Don't run `pnpm migrate` casually — it overwrites `src/content/{categories,platforms,apis,datasets}/*.mdx` from the legacy snapshot. It's a one-way sync from the old Next.js dump.
- Don't add Velocity/Astro Rocket template content back. The site is Happy-Endpoint-specific; treat upstream-template files as legacy unless the user asks.
- Don't introduce ad-hoc `mx-auto max-w-Xxl px-6` patterns on new pages. Use `class="container"` + `max-w-Xxl` for inner content.
- Don't generate blog covers without reading `docs/blog-cover-pipeline.md` first — the template, dimensions, frontmatter contract, and storage location are documented there.
