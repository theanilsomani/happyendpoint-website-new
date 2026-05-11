#!/usr/bin/env -S tsx
/**
 * Generate OG images for API, dataset, platform, and category pages
 * via html2png.dev - dark template with platform name highlighted.
 *
 * Usage:
 *   pnpm tsx scripts/generate-og-images.ts                  # missing only
 *   pnpm tsx scripts/generate-og-images.ts --force          # regenerate all
 *   pnpm tsx scripts/generate-og-images.ts --type api       # one type
 *   pnpm tsx scripts/generate-og-images.ts --slug bayut-api # one slug
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const args = process.argv.slice(2);
const force = args.includes('--force');
const typeFilter = args.includes('--type') ? args[args.indexOf('--type') + 1] : null;
const slugFilter = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;

// ─── Frontmatter parser ────────────────────────────────────────────────────

function parseFm(text: string): Record<string, string | string[] | boolean> {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: Record<string, string | string[] | boolean> = {};
  const lines = m[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const top = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (top) {
      const key = top[1];
      const raw = top[2].trim();
      if (raw === '') {
        const arr: string[] = [];
        i++;
        while (i < lines.length && /^\s+-\s/.test(lines[i])) {
          arr.push(lines[i].replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g, ''));
          i++;
        }
        fm[key] = arr;
        continue;
      }
      if (raw === 'true') { fm[key] = true; i++; continue; }
      if (raw === 'false') { fm[key] = false; i++; continue; }
      if (raw.startsWith('[')) {
        const inner = raw.replace(/^\[|\]$/g, '');
        fm[key] = inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      } else {
        fm[key] = raw.replace(/^['"]|['"]$/g, '');
      }
    }
    i++;
  }
  return fm;
}

function readDir(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => resolve(dir, f));
}

// ─── Platform name lookup ──────────────────────────────────────────────────

const platformDir = resolve(root, 'src/content/platforms');
const platformMap: Record<string, { name: string; category: string }> = {};
for (const file of readDir(platformDir)) {
  const slug = basename(file, '.mdx');
  const fm = parseFm(readFileSync(file, 'utf8'));
  const name = String(fm.name ?? slug);
  const category = String(fm.category ?? '');
  platformMap[slug] = { name, category };
}

// Map platform slug → short display name for the OG highlight
const PLATFORM_DISPLAY: Record<string, string> = {
  bayut: 'BAYUT',
  sephora: 'SEPHORA',
  ikea: 'IKEA',
  tesco: 'TESCO',
  propertyfinder: 'PROPERTYFINDER',
  rightmove: 'RIGHTMOVE',
  priceline: 'PRICELINE',
  morningstar: 'MORNINGSTAR',
  'uae-realestate': 'UAE',
  hm: 'H&M',
  kohls: "KOHL'S",
  fotocasa: 'FOTOCASA',
  klarna: 'KLARNA',
};

function platformDisplay(slug: string): string {
  return PLATFORM_DISPLAY[slug] ?? slug.toUpperCase().replace(/-/g, ' ');
}

function platformFontSize(name: string): number {
  const n = name.length;
  if (n <= 4) return 96;
  if (n <= 6) return 82;
  if (n <= 8) return 70;
  if (n <= 11) return 58;
  if (n <= 14) return 46;
  return 36;
}

function titleFontSize(title: string): number {
  const n = title.length;
  if (n <= 40) return 58;
  if (n <= 65) return 48;
  if (n <= 90) return 40;
  return 34;
}

// ─── Category display names ────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  'real-estate': 'REAL ESTATE',
  retail: 'RETAIL',
  beauty: 'BEAUTY',
  grocery: 'GROCERY',
  fashion: 'FASHION',
  finance: 'FINANCE',
  travel: 'TRAVEL',
  aggregator: 'AGGREGATOR',
};

// ─── HTML template ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// SVG icon paths (24×24 viewBox, stroke-based)
const ICONS = {
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v4c0 1.657 4.03 3 9 3s9-1.343 9-3V5"/><path d="M3 9v4c0 1.657 4.03 3 9 3s9-1.343 9-3V9"/><path d="M3 13v4c0 1.657 4.03 3 9 3s9-1.343 9-3v-4"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><path d="M2 20h20"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>`,
  network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><line x1="12" y1="7.5" x2="5.8" y2="16.7"/><line x1="12" y1="7.5" x2="18.2" y2="16.7"/><line x1="7.5" y1="19" x2="16.5" y2="19"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/><line x1="4" y1="9" x2="2" y2="9"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="4" y1="15" x2="2" y2="15"/><line x1="22" y1="9" x2="20" y2="9"/><line x1="22" y1="12" x2="20" y2="12"/><line x1="22" y1="15" x2="20" y2="15"/><line x1="9" y1="4" x2="9" y2="2"/><line x1="12" y1="4" x2="12" y2="2"/><line x1="15" y1="4" x2="15" y2="2"/><line x1="9" y1="22" x2="9" y2="20"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="15" y1="22" x2="15" y2="20"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
};

// Fixed icon placements: [iconKey, x, y, size, rotation]
const BG_PLACEMENTS: Array<[keyof typeof ICONS, number, number, number, number]> = [
  ['database', 900, 55, 130, 12],
  ['chart', 1070, 380, 95, -20],
  ['code', 40, 390, 110, 15],
  ['globe', 580, -10, 120, -8],
  ['table', 1090, 120, 85, 35],
  ['network', -15, 140, 100, -5],
  ['cpu', 780, 460, 80, 20],
  ['search', 100, 20, 70, -15],
];

function buildBgIcons(): string {
  return BG_PLACEMENTS.map(([icon, x, y, size, rot]) => {
    const iconSvg = ICONS[icon];
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;color:#3b82f6;opacity:0.055;transform:rotate(${rot}deg);">${iconSvg}</div>`;
  }).join('\n  ');
}

function buildPills(pills: string[]): string {
  return pills
    .filter(Boolean)
    .map((p) => `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;letter-spacing:0.1em;color:#64748b;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:6px 14px;border-radius:4px;">${escapeHtml(p)}</span>`)
    .join('<span style="color:#334155;margin:0 2px;">·</span>');
}

function buildHtml(opts: {
  platform: string;
  type: string;
  title: string;
  pills: string[];
}): string {
  const { platform, type, title, pills } = opts;
  const pfs = platformFontSize(platform);
  const tfs = titleFontSize(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #07090f;
    font-family: 'Outfit', sans-serif;
    position: relative;
    overflow: hidden;
  }
</style>
</head>
<body>
  <!-- Radial blue glow -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 900px 600px at 15% 55%,rgba(59,130,246,0.08) 0%,transparent 65%);"></div>

  <!-- Background icons -->
  ${buildBgIcons()}

  <!-- Content -->
  <div style="position:absolute;inset:0;padding:52px 64px;display:flex;flex-direction:column;">

    <!-- Top row: platform name + type badge -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="font-family:'Outfit',sans-serif;font-weight:900;color:#3b82f6;letter-spacing:-0.02em;line-height:1;font-size:${pfs}px;max-width:850px;">${escapeHtml(platform)}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:0.2em;color:#60a5fa;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.28);padding:9px 18px;border-radius:6px;white-space:nowrap;flex-shrink:0;margin-left:24px;margin-top:4px;">${escapeHtml(type)}</div>
    </div>

    <!-- Title -->
    <div style="font-family:'Outfit',sans-serif;font-weight:800;color:#f1f5f9;letter-spacing:-0.025em;line-height:1.12;font-size:${tfs}px;margin-top:28px;max-width:1072px;">${escapeHtml(title)}</div>

    <!-- Spacer -->
    <div style="flex:1;"></div>

    <!-- Bottom bar -->
    <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">${buildPills(pills)}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.08em;color:#334155;flex-shrink:0;margin-left:20px;">happyendpoint.com</div>
    </div>

  </div>
</body>
</html>`;
}

// ─── html2png.dev API ───────────────────────────────────────────────────────

interface ConvertResponse {
  success: boolean;
  url: string;
}

async function generateImage(html: string, outPath: string): Promise<void> {
  const res = await fetch(
    'https://html2png.dev/api/convert?width=1200&height=630&format=png&deviceScaleFactor=2',
    { method: 'POST', headers: { 'Content-Type': 'text/html' }, body: html },
  );
  if (!res.ok) throw new Error(`submit failed: HTTP ${res.status} ${await res.text()}`);
  const meta = (await res.json()) as ConvertResponse;
  if (!meta.success || !meta.url) throw new Error(`unexpected payload: ${JSON.stringify(meta)}`);

  const pngRes = await fetch(meta.url);
  if (!pngRes.ok) throw new Error(`fetch PNG failed: HTTP ${pngRes.status}`);

  const buf = Buffer.from(await pngRes.arrayBuffer());
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Content discovery ────────────────────────────────────────────────────

interface OgItem {
  type: string;
  slug: string;
  platform: string;
  badgeType: string;
  title: string;
  pills: string[];
  outPath: string;
}

function discoverApis(): OgItem[] {
  const dir = resolve(root, 'src/content/apis');
  return readDir(dir).flatMap((file) => {
    const slug = basename(file, '.mdx');
    if (slugFilter && slug !== slugFilter) return [];
    const fm = parseFm(readFileSync(file, 'utf8'));
    if (fm.draft === true) return [];
    const platformSlug = String(fm.platform ?? '');
    const pInfo = platformMap[platformSlug];
    const categoryRaw = pInfo?.category ?? '';
    const catDisplay = CATEGORY_DISPLAY[categoryRaw] ?? categoryRaw.toUpperCase();
    const pdisplay = platformDisplay(platformSlug);
    const name = String(fm.name ?? slug);
    return [{
      type: 'api',
      slug,
      platform: pdisplay,
      badgeType: 'API',
      title: name,
      pills: [catDisplay, 'RAPIDAPI', 'REST API'].filter(Boolean),
      outPath: resolve(root, `public/og/api/${slug}.png`),
    }];
  });
}

function discoverDatasets(): OgItem[] {
  const dir = resolve(root, 'src/content/datasets');
  return readDir(dir).flatMap((file) => {
    const slug = basename(file, '.mdx');
    if (slugFilter && slug !== slugFilter) return [];
    const fm = parseFm(readFileSync(file, 'utf8'));
    if (fm.draft === true) return [];
    const platformSlug = String(fm.platform ?? '');
    const pdisplay = platformDisplay(platformSlug);
    const name = String(fm.name ?? slug);
    const recordCount = String(fm.recordCount ?? '');
    const format = String(fm.format ?? 'CSV');
    const price = String(fm.price ?? '');
    const pills: string[] = [];
    if (recordCount) pills.push(recordCount.toUpperCase());
    pills.push(format.toUpperCase());
    if (price && price.toLowerCase() !== 'contact us') pills.push(price);
    return [{
      type: 'dataset',
      slug,
      platform: pdisplay,
      badgeType: 'DATASET',
      title: name,
      pills,
      outPath: resolve(root, `public/og/datasets/${slug}.png`),
    }];
  });
}

function discoverPlatforms(): OgItem[] {
  const dir = resolve(root, 'src/content/platforms');
  return readDir(dir).flatMap((file) => {
    const slug = basename(file, '.mdx');
    if (slugFilter && slug !== slugFilter) return [];
    const fm = parseFm(readFileSync(file, 'utf8'));
    if (fm.draft === true) return [];
    const pdisplay = platformDisplay(slug);
    const name = String(fm.name ?? slug);
    const categoryRaw = String(fm.category ?? '');
    const catDisplay = CATEGORY_DISPLAY[categoryRaw] ?? categoryRaw.toUpperCase();
    const pills: string[] = [catDisplay];
    if (fm.hasApi === true) pills.push('API');
    if (fm.hasDatasets === true) pills.push('DATASETS');
    return [{
      type: 'platform',
      slug,
      platform: pdisplay,
      badgeType: 'PLATFORM',
      title: name,
      pills,
      outPath: resolve(root, `public/og/platforms/${slug}.png`),
    }];
  });
}

function discoverCategories(): OgItem[] {
  const dir = resolve(root, 'src/content/categories');
  return readDir(dir).flatMap((file) => {
    const slug = basename(file, '.mdx');
    if (slugFilter && slug !== slugFilter) return [];
    const fm = parseFm(readFileSync(file, 'utf8'));
    const catDisplay = CATEGORY_DISPLAY[slug] ?? String(fm.name ?? slug).toUpperCase();
    const name = String(fm.name ?? slug);
    const title = `${name} Data APIs & Datasets`;
    return [{
      type: 'category',
      slug,
      platform: catDisplay,
      badgeType: 'CATEGORY',
      title,
      pills: ['APIS', 'DATASETS', 'HAPPYENDPOINT'],
      outPath: resolve(root, `public/og/categories/${slug}.png`),
    }];
  });
}

function discoverBlogMissing(): OgItem[] {
  const dir = resolve(root, 'src/content/blog/en');
  const TAG_TO_BADGE: Record<string, string> = {
    tutorial: 'TUTORIAL', comparison: 'COMPARISON', 'buying-guide': 'GUIDE',
    architecture: 'GUIDE', evaluation: 'GUIDE', legal: 'GUIDE', scraping: 'GUIDE',
    alerts: 'TUTORIAL',
  };
  const BRAND_TAGS = ['tesco', 'sephora', 'ikea', 'priceline', 'propertyfinder', 'bayut',
    'morningstar', 'rightmove', 'fotocasa', 'klarna', 'hm', 'kohls', 'uae-realestate'];

  return readDir(dir).flatMap((file) => {
    const slug = basename(file, extname(file));
    if (slugFilter && slug !== slugFilter) return [];
    const text = readFileSync(file, 'utf8');
    const fm = parseFm(text);
    if (!fm.coverImage) return [];
    const coverPath = resolve(root, String(fm.coverImage).replace(/^\//, 'public/'));
    if (existsSync(coverPath) && !force) return []; // already exists

    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).map((t) => t.toLowerCase()) : [];
    const title = String(fm.title ?? slug);

    let badge = 'GUIDE';
    for (const t of tags) if (TAG_TO_BADGE[t]) { badge = TAG_TO_BADGE[t]; break; }

    let platform = 'HAPPY ENDPOINT';
    for (const t of tags) {
      if (BRAND_TAGS.includes(t)) {
        platform = platformDisplay(t === 'rapidapi' ? 'rapidapi' : t);
        break;
      }
    }

    // Word count for reading time pill
    const body = text.replace(/^---\n[\s\S]*?\n---/, '').replace(/<[^>]+>/g, ' ').replace(/`{3}[\s\S]*?`{3}/g, ' ');
    const wc = body.split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.max(1, Math.ceil(wc / 200))} MIN READ`;

    const dateStr = String(fm.publishedAt ?? '');
    const datePill = dateStr ? dateStr.replace(/-/g, '.') : '';

    return [{
      type: 'blog',
      slug,
      platform,
      badgeType: badge,
      title,
      pills: [readTime, datePill].filter(Boolean),
      outPath: coverPath,
    }];
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  let items: OgItem[] = [];

  if (!typeFilter || typeFilter === 'api') items.push(...discoverApis());
  if (!typeFilter || typeFilter === 'dataset') items.push(...discoverDatasets());
  if (!typeFilter || typeFilter === 'platform') items.push(...discoverPlatforms());
  if (!typeFilter || typeFilter === 'category') items.push(...discoverCategories());
  if (!typeFilter || typeFilter === 'blog') items.push(...discoverBlogMissing());

  if (items.length === 0) {
    console.warn('Nothing to generate (all exist or no matches).');
    return;
  }

  let generated = 0;
  let skipped = 0;

  for (const item of items) {
    if (existsSync(item.outPath) && !force) {
      console.warn(`skip  [${item.type}] ${item.slug}`);
      skipped++;
      continue;
    }

    const label = `[${item.type}] ${item.slug}`;
    process.stdout.write(`gen   ${label}... `);
    try {
      const html = buildHtml({
        platform: item.platform,
        type: item.badgeType,
        title: item.title,
        pills: item.pills,
      });
      await generateImage(html, item.outPath);
      console.log('ok');
      generated++;
      if (generated < items.length) await delay(500);
    } catch (err) {
      console.error(`FAIL\n      ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }

  console.warn(`\nDone: ${generated} generated, ${skipped} skipped.`);
}

main();
