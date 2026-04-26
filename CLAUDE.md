# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is **happyendpoint.com** — a marketing/catalog site for APIs and datasets sold on RapidAPI. It is a fork of the **Astro Rocket** starter (itself a fork of Velocity). Treat the upstream theme as a starting point — branding, content, and the Happy Endpoint domain model (`platforms` → `apis` / `datasets`) are project-specific.

The site is **static** (`output: 'static'` in `astro.config.mjs`) and ships to **Cloudflare Pages**. The Next.js predecessor lives at `D:/Programming/happyendpoint-website` and is the source of legacy data for the migration script.

**For broader product, business, voice/brand context, and a running log of recent work**, read `docs/PROJECT-CONTEXT.md` — it covers what we sell, who we sell to, what conventions to match, and what NOT to do unprompted.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Astro dev server at http://localhost:4321 |
| `pnpm build` | Runs `generate-redirects` → `astro build` → `pagefind` → `compose-redirects` |
| `pnpm preview` | Serve `dist/` locally |
| `pnpm check` | Astro/TS type check (`astro check`) |
| `pnpm lint` / `pnpm lint:fix` | ESLint (Astro + typescript-eslint) |
| `pnpm format` / `pnpm format:check` | Prettier with Astro + Tailwind plugins |
| `pnpm validate` | `lint` + `check` + `build` — run before declaring work done |
| `pnpm test` | Vitest unit tests (node env) |
| `pnpm test -- <pattern>` | Run a single test file/pattern (e.g. `pnpm test -- contact`) |
| `pnpm test:e2e` | Playwright |
| `pnpm migrate` | Re-run legacy → MDX migration (see "Migration" below) |

Node 22.12+ and pnpm 9+ are required.

## Architecture

### Content-driven, statically rendered

Almost every "page" is generated from a content collection. Routes use `[slug].astro` files that call `getStaticPaths()` against a collection. To understand the site, start in `src/content.config.ts` — it defines all Zod schemas:

- `platforms` (e.g. Bayut, Sephora) — top-level entities; have a `category` and flags `hasApi` / `hasDatasets` / `hasFreeDatasets`.
- `apis` and `datasets` — children of platforms (joined via the `platform` field, which is the platform's slug/id).
- `categories` — group platforms (real-estate, retail, …).
- `blog`, `pages`, `authors`, `faqs`, `projects`, `stack` — inherited from the upstream theme; `blog` is locale-aware (`en` | `es` | `fr`).

Cross-collection queries live in `src/lib/content-queries.ts` (`getApisForPlatform`, `getRelatedApis`, etc.). Use these helpers — don't re-implement filtering inside page files.

OpenAPI specs for the APIs live in `oas-docs/*.json`. Scalar docs are hosted separately on `docs.happyendpoint.com` (different project), so do not try to render OpenAPI here.

### Pages and routing

`src/pages/` mixes hand-authored marketing pages (`index.astro`, `about.astro`, `why-happyendpoint.astro`, `use-cases.astro`, `contact.astro`, `privacy.astro`, `terms.astro`, `faq.astro`) with collection-driven dynamic routes:

- `library/` — APIs index + `[slug]` detail
- `platforms/`, `categories/`, `datasets/` — index + `[slug]` detail
- `free-datasets/` — index page only; per-slug URLs are handled via `_redirects`
- `blog/[...slug].astro` — blog router
- `api/contact.ts`, `api/newsletter.ts` — Resend-backed form endpoints

Sitemap excludes `/search`, `/components`, `/projects` (see `astro.config.mjs`). `robots.txt`, `rss.xml`, `manifest.webmanifest`, and `favicon.svg` are generated from `*.ts` route files in `src/pages/`.

### Components

- `src/components/he/` — **Happy Endpoint domain components** (EntityCard, EntityGrid, EntityHero, EndpointTable, FilterPanel, FreeSampleBlock, PlatformLogosStrip, PricingSlot, FAQSection, …). Use these for any platform/API/dataset UI.
- `src/components/ui/` — design-system primitives (form, data-display, feedback, overlay, primitives/Icon, marketing). Imported via barrel exports from `@/components/ui`.
- `src/components/{layout,seo,blog,landing,patterns,hero,projects}/` — upstream theme components.

The design system is a three-tier OKLCH token system: `src/styles/tokens/` (primitives) → `src/styles/themes/*.css` (semantic) → Tailwind v4 `@theme` in `src/styles/global.css`. Brand color edits go in `src/styles/themes/blue.css` (the active theme). Switching themes at runtime is supported via `ThemeSelector`, but the canonical brand for this site is **blue**.

Path alias `@/*` → `src/*` (`tsconfig.json`). Use it instead of relative imports across module boundaries.

### Build pipeline

`pnpm build` runs four phases in order; each one matters:

1. `generate-redirects` (`scripts/generate-redirects.ts`) — reads `src/content/datasets/*.mdx`, writes `scripts/generated/redirects-datasets.txt` mapping legacy free-dataset URLs to current slugs.
2. `astro build` — produces `dist/`.
3. `pagefind --site dist` — generates the static search index at `dist/pagefind/`.
4. `compose-redirects` (`scripts/compose-redirects.mjs`) — concatenates `public/_redirects` + the generated dataset redirects into `dist/_redirects`.

If you touch the redirect logic, the failure mode is silent: `dist/_redirects` simply ends up missing rules. Verify the file after build.

`public/_headers` ships static security headers (HSTS, X-Frame-Options, Referrer-Policy, asset cache rules) — Cloudflare Pages serves these automatically.

### Migration from the legacy Next.js site

`pnpm migrate` (`scripts/migrate-legacy-data.ts`) reads `scripts/legacy-snapshot/*.json` and **overwrites** MDX files under `src/content/{categories,platforms,apis,datasets}/`. To refresh:

1. In the legacy repo: `node scripts/dump-legacy.mjs` to regenerate the snapshot JSON.
2. Copy snapshot JSONs into `scripts/legacy-snapshot/` here.
3. `pnpm migrate`, then review the diff before committing — handwritten edits to migrated MDX files will be lost on re-run.

### Forms and email

`src/pages/api/contact.ts` and `src/pages/api/newsletter.ts` use **Resend** (`RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`, `RESEND_AUDIENCE_ID`). DEPLOY.md notes the contact backend is "deferred / post-launch" — confirm wiring status before assuming submissions deliver email.

### Tests

- Vitest is configured for **node env** (`vitest.config.ts`). The config aliases `astro:content` to `src/__tests__/__mocks__/astro-content.ts` because `astro:content` is a virtual module not available outside the Astro runtime — when you write tests that touch collections, mock through that file.
- Existing tests focus on API endpoint validation (`contact.test.ts`, `newsletter.test.ts`), content schemas, and content queries.
- Playwright is installed for E2E but no test files are tracked here yet.

## Conventions

- **Strict TS** (`astro/tsconfigs/strict`). Prefer `unknown` + narrowing over `any`; the lint rule warns on `any`.
- **No `console.log` in committed code** — only `console.warn` / `console.error` (lint rule). Migration/build scripts use `console.log` and that's fine because they're CLI tools.
- **Prettier**: 2-space, single quotes, trailing commas (es5), 100-col print width, semicolons. Astro + Tailwind plugins reorder classes — let them.
- **Frontmatter is the source of truth** for content. Don't introduce config files that duplicate fields already in collection schemas.
- **Don't import from `node_modules` paths** in app code (some `.claude/settings.local.json` permissions reference them — those are debug-only).

## Deployment

Deploys to Cloudflare Pages. The CI workflow at `.github/workflows/deploy.yml` runs `lint` + `check` + `build` on push/PR to `main`; the actual deploy step is currently commented out (Pages auto-builds from the connected git repo). Required env vars on Pages: `SITE_URL`, `NODE_VERSION=22.12.0`, optional verification + analytics IDs. Full instructions in `DEPLOY.md`.

`wrangler.toml` is present for the rare case of `wrangler pages deploy dist` — production deploys flow through the Pages git integration.
