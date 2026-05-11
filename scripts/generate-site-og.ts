#!/usr/bin/env -S tsx
/**
 * Generate OG images for the site default and key index pages.
 * Run: pnpm tsx scripts/generate-site-og.ts
 *      pnpm tsx scripts/generate-site-og.ts --force
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const force = process.argv.includes('--force');

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Reuse the same icon + template from generate-og-images.ts
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

function bgIcons(): string {
  return BG_PLACEMENTS.map(([icon, x, y, size, rot]) =>
    `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;color:#3b82f6;opacity:0.055;transform:rotate(${rot}deg);">${ICONS[icon]}</div>`
  ).join('\n  ');
}

function pills(items: string[]): string {
  return items.filter(Boolean).map((p) =>
    `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;letter-spacing:0.1em;color:#64748b;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:6px 14px;border-radius:4px;">${escapeHtml(p)}</span>`
  ).join('<span style="color:#334155;margin:0 2px;">·</span>');
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

function buildHtml(opts: { platform: string; type: string; title: string; pillItems: string[] }): string {
  const { platform, type, title, pillItems } = opts;
  const pfs = platformFontSize(platform);
  const tfs = titleFontSize(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>* { margin:0;padding:0;box-sizing:border-box; } body { width:1200px;height:630px;background:#07090f;font-family:'Outfit',sans-serif;position:relative;overflow:hidden; }</style>
</head>
<body>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 900px 600px at 15% 55%,rgba(59,130,246,0.08) 0%,transparent 65%);"></div>
  ${bgIcons()}
  <div style="position:absolute;inset:0;padding:52px 64px;display:flex;flex-direction:column;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="font-family:'Outfit',sans-serif;font-weight:900;color:#3b82f6;letter-spacing:-0.02em;line-height:1;font-size:${pfs}px;max-width:850px;">${escapeHtml(platform)}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:0.2em;color:#60a5fa;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.28);padding:9px 18px;border-radius:6px;white-space:nowrap;flex-shrink:0;margin-left:24px;margin-top:4px;">${escapeHtml(type)}</div>
    </div>
    <div style="font-family:'Outfit',sans-serif;font-weight:800;color:#f1f5f9;letter-spacing:-0.025em;line-height:1.12;font-size:${tfs}px;margin-top:28px;max-width:1072px;">${escapeHtml(title)}</div>
    <div style="flex:1;"></div>
    <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">${pills(pillItems)}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.08em;color:#334155;flex-shrink:0;margin-left:20px;">happyendpoint.com</div>
    </div>
  </div>
</body>
</html>`;
}

interface ConvertResponse { success: boolean; url: string; }

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

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const PAGES = [
  {
    id: 'default',
    outPath: resolve(root, 'public/og-default.png'),
    platform: 'HAPPY ENDPOINT',
    type: 'DATA PLATFORM',
    title: 'Web Scraping APIs & Ready-to-Download Datasets',
    pillItems: ['REAL ESTATE', 'RETAIL', 'BEAUTY', 'RAPIDAPI'],
  },
  {
    id: 'home',
    outPath: resolve(root, 'public/og/site/home.png'),
    platform: 'HAPPY ENDPOINT',
    type: 'CATALOG',
    title: 'Web Scraping APIs & Datasets for Real Estate, Retail, Beauty & More',
    pillItems: ['14 APIS', '13 DATASETS', '13 PLATFORMS'],
  },
  {
    id: 'library',
    outPath: resolve(root, 'public/og/site/library.png'),
    platform: 'LIBRARY',
    type: 'APIs',
    title: 'Browse 14 Ready-to-Use Web Scraping APIs',
    pillItems: ['REST API', 'RAPIDAPI', 'INSTANT ACCESS'],
  },
  {
    id: 'datasets',
    outPath: resolve(root, 'public/og/site/datasets.png'),
    platform: 'DATASETS',
    type: 'DATA',
    title: 'Ready-to-Download Datasets for Retail, Real Estate & Beauty',
    pillItems: ['CSV', 'EXCEL', 'INSTANT DOWNLOAD'],
  },
  {
    id: 'platforms',
    outPath: resolve(root, 'public/og/site/platforms.png'),
    platform: 'PLATFORMS',
    type: 'DIRECTORY',
    title: '13 Data Platforms Across Real Estate, Retail, Beauty & More',
    pillItems: ['REAL ESTATE', 'RETAIL', 'BEAUTY'],
  },
  {
    id: 'categories',
    outPath: resolve(root, 'public/og/site/categories.png'),
    platform: 'CATEGORIES',
    type: 'BROWSE',
    title: 'Browse Data APIs & Datasets by Industry Category',
    pillItems: ['8 CATEGORIES', 'APIS', 'DATASETS'],
  },
];

async function main() {
  let generated = 0;
  for (const page of PAGES) {
    if (existsSync(page.outPath) && !force) {
      console.warn(`skip  ${page.id}`);
      continue;
    }
    process.stdout.write(`gen   ${page.id}... `);
    try {
      await generateImage(buildHtml(page), page.outPath);
      console.log('ok');
      generated++;
      if (generated < PAGES.length) await delay(500);
    } catch (err) {
      console.error(`FAIL\n      ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.warn(`\nDone: ${generated} generated.`);
}

main();
