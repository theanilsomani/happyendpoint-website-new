# Blog cover image pipeline

How Happy Endpoint generates blog post cover images: brand-aligned PNG covers rendered via the keyless [html2png.dev](https://html2png.dev) HTML→PNG service.

## Why this exists

Each blog post needs a cover image used in three places:

1. The blog index card (`BlogCard.astro`)
2. The article hero on the post page (`ArticleHero.astro`)
3. The Open Graph / Twitter Card preview when shared on social or surfaced by search engines

A cover that's text-rendered from the post's title (rather than a generic stock photo) does three things at once: it stays on-brand without a designer in the loop, the title is readable as a thumbnail, and Google indexes the OG image for image search.

## Dimensions and format

- **1200 × 630 PNG** — the Open Graph / Twitter standard. Anything else gets cropped or letterboxed by Facebook, LinkedIn, Slack, and X.
- Rendered at `deviceScaleFactor=2` so the PNG is internally 2400 × 1260 — sharp on retina displays, sharp when Google rescales it.
- Final file size: ~80–250 KB per cover. Acceptable for OG (Facebook recommends < 300 KB).
- Stored under `public/blog/covers/{slug}.png`. `public/` because we want a stable, predictable static URL — no Astro image pipeline processing required for OG to work.

## Frontmatter contract

The blog content schema (`src/content.config.ts`) has an optional `coverImage: z.string()` field:

```yaml
---
title: "Tesco grocery API: pulling product, price, and availability data at scale"
description: "..."
publishedAt: 2026-04-26
author: "Happy Endpoint Team"
tags: ['tesco', 'grocery', 'tutorial']
coverImage: /blog/covers/tesco-grocery-api-product-price-availability.png
---
```

When `coverImage` is set, `BlogCard` and `ArticleHero` render a plain `<img>` pointing at it. When it's not set, the components fall back to the legacy `BlogImageSVG` system (hand-authored SVGs in `src/assets/blog/{slug}.svg`).

## The HTML template

The template renders a "technical brief" — a clean white card on a subtle dotted-grid background, brand-blue accents, schematic corner brackets. Outfit for the title, JetBrains Mono for technical labels.

Variables (interpolated by the generation script):

| Placeholder | Source | Example |
|---|---|---|
| `{{TITLE}}` | post `title` | `"Tesco grocery API: pulling product, price, and availability data at scale"` |
| `{{CATEGORY}}` | post `coverCategory` (frontmatter, optional) or derived from tags | `"TUTORIAL"` |
| `{{DATE}}` | post `publishedAt`, formatted `YYYY.MM.DD` | `"2026.04.26"` |
| `{{READ_TIME}}` | computed from word count at 200 wpm | `"8 MIN READ"` |
| `{{SLUG_LABEL}}` | post `coverSlugLabel` (frontmatter, optional) or derived | `"TESCO API"` |

Full template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    margin: 0;
    padding: 0;
    font-family: 'Outfit', sans-serif;
    background: #f8fafc;
    background-image: radial-gradient(#dbeafe 1.2px, transparent 1.2px);
    background-size: 24px 24px;
    background-position: 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card {
    width: 1080px;
    height: 510px;
    background: #ffffff;
    border: 1px solid #2563eb;
    border-radius: 16px;
    box-shadow: 0 16px 48px -12px rgba(37, 99, 235, 0.12), 0 4px 16px -4px rgba(15, 23, 42, 0.06);
    padding: 56px 64px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .top-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: #1e293b;
    letter-spacing: 0.18em;
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .brand .sep { opacity: 0.3; }
  .brand .label { color: #64748b; }
  .accent {
    background: #2563eb;
    color: white;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    padding: 8px 14px;
    border-radius: 6px;
  }
  .title {
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 60px;
    line-height: 1.05;
    letter-spacing: -0.025em;
    color: #0f172a;
    max-width: 920px;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .footer-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: #475569;
    display: flex;
    gap: 14px;
  }
  .footer-meta .dot { color: #cbd5e1; }
  .footer-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    letter-spacing: 0.08em;
  }
  .corner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid #2563eb;
  }
  .corner.tl { top: 16px; left: 16px; border-right: none; border-bottom: none; }
  .corner.tr { top: 16px; right: 16px; border-left: none; border-bottom: none; }
  .corner.bl { bottom: 16px; left: 16px; border-right: none; border-top: none; }
  .corner.br { bottom: 16px; right: 16px; border-left: none; border-top: none; }
</style>
</head>
<body>
  <div class="card">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="top-meta">
      <div class="brand">
        <span>HAPPY ENDPOINT</span>
        <span class="sep">·</span>
        <span class="label">TECHNICAL BRIEF</span>
      </div>
      <div class="accent">{{CATEGORY}}</div>
    </div>

    <h1 class="title">{{TITLE}}</h1>

    <div class="footer">
      <div class="footer-meta">
        <span>{{READ_TIME}}</span>
        <span class="dot">·</span>
        <span>{{DATE}}</span>
        <span class="dot">·</span>
        <span>{{SLUG_LABEL}}</span>
      </div>
      <div class="footer-url">happyendpoint.com</div>
    </div>
  </div>
</body>
</html>
```

## How html2png.dev works

The keyless API returns JSON, not the PNG bytes. Two-step:

1. **POST HTML** — `https://html2png.dev/api/convert?width=1200&height=630&format=png&deviceScaleFactor=2`, body is the HTML, `Content-Type: text/html`. Response is JSON: `{ success, url, filename, format, cached, timestamp }`.
2. **GET the URL** — fetch the `url` from the JSON response. That's your PNG.

Sample curl:

```bash
# Step 1 — submit HTML, capture JSON
curl -sS -X POST "https://html2png.dev/api/convert?width=1200&height=630&format=png&deviceScaleFactor=2" \
  -H "Content-Type: text/html" \
  --data-binary @cover.html

# {"success":true,"url":"https://html2png.dev/api/blob/<id>.png","filename":"...","format":"png","cached":false,"timestamp":"..."}

# Step 2 — download the PNG
curl -sS "https://html2png.dev/api/blob/<id>.png" --output cover.png
```

## Generation script

`scripts/generate-blog-covers.ts` orchestrates the whole pipeline:

1. Read all `src/content/blog/en/*.mdx` files.
2. Parse frontmatter; for each post that has a `coverImage` field set, derive the inputs (`title`, `category`, `date`, `read_time`, `slug_label`).
3. Build HTML from the template above using string interpolation.
4. POST to html2png.dev, follow the JSON to fetch the PNG, save to the path the frontmatter declared (`public/blog/covers/{slug}.png`).
5. Idempotent: skip posts whose PNG already exists unless `--force` is passed.
6. Emit a one-line status per post.

Run it locally:

```bash
pnpm tsx scripts/generate-blog-covers.ts          # generate missing covers
pnpm tsx scripts/generate-blog-covers.ts --force  # regenerate all covers
pnpm tsx scripts/generate-blog-covers.ts --slug tesco-grocery-api-product-price-availability  # regenerate one
```

## Regenerating

When you publish a new post, set `coverImage: /blog/covers/{slug}.png` in the frontmatter, then run `pnpm tsx scripts/generate-blog-covers.ts`. The script picks up the new slug, generates the PNG, and exits.

When you change the template (font, colour, layout), bump it and run with `--force` to regenerate every cover.

## SEO rationale

- **1200 × 630** is what Open Graph and Twitter Cards specify. Lower resolutions get blurred when scaled. Higher just wastes bandwidth.
- **PNG over JPEG** because the design has flat colour and crisp text — JPEG compression artefacts on type look terrible at thumbnail size. PNG-24 with sharp text indexes well in Google Image Search.
- **Title-as-design** so the cover is meaningful when seen as a thumbnail in a search result or a Slack unfurl. A generic stock photo doesn't earn the click; a title does.
- **Stable URL** (`/blog/covers/{slug}.png`) means crawlers cache it once and re-use it. Renaming a cover means breaking inbound social previews — don't.

## Tradeoffs we accepted

- **External service.** html2png.dev is a third party. If they go down, we can't generate new covers (existing ones are committed to the repo, so the site is unaffected). Mitigation: covers are generated once per post and committed; the live site never calls the API.
- **No Astro image optimization.** PNGs in `public/` skip Astro's image pipeline. Trade-off: simpler URLs and direct social-network compatibility, at the cost of no auto-webp conversion. At ~150 KB per file this is fine.
- **System fonts not used.** The template loads Outfit + JetBrains Mono from Google Fonts. Adds 1–2s to each render but keeps brand consistency. Alternative would be embedding the fonts as base64 in the HTML; not worth the complexity.
