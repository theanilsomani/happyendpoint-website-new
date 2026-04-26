#!/usr/bin/env -S tsx
/**
 * Generate blog cover PNGs via html2png.dev.
 *
 * For each MDX in src/content/blog/en/ with `coverImage:` in its frontmatter,
 * builds the "Technical Brief" template HTML, POSTs it to html2png.dev,
 * fetches the resulting PNG via the URL the API returns, and writes it to
 * public/blog/covers/{slug}.png.
 *
 * Idempotent: skips covers that already exist unless --force is passed.
 *
 * Usage:
 *   pnpm tsx scripts/generate-blog-covers.ts                 # only missing
 *   pnpm tsx scripts/generate-blog-covers.ts --force         # regenerate all
 *   pnpm tsx scripts/generate-blog-covers.ts --slug <slug>   # one specific
 *
 * See docs/blog-cover-pipeline.md for the design rationale.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const blogDir = resolve(projectRoot, 'src/content/blog/en');
const outDir = resolve(projectRoot, 'public/blog/covers');

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugFlagIndex = args.indexOf('--slug');
const onlySlug = slugFlagIndex >= 0 ? args[slugFlagIndex + 1] : null;

interface PostMeta {
  slug: string;
  title: string;
  date: Date;
  category: string;
  slugLabel: string;
  wordCount: number;
  outPath: string;
}

const TAG_TO_CATEGORY: Record<string, string> = {
  tutorial: 'TUTORIAL',
  comparison: 'COMPARISON',
  'buying-guide': 'FRAMEWORK',
  'api-evaluation': 'FRAMEWORK',
  architecture: 'FRAMEWORK',
  evaluation: 'FRAMEWORK',
  legal: 'COMPLIANCE',
  compliance: 'COMPLIANCE',
  scraping: 'COMPLIANCE',
  alerts: 'TUTORIAL',
};

function deriveCategory(tags: string[]): string {
  for (const t of tags) {
    if (TAG_TO_CATEGORY[t.toLowerCase()]) return TAG_TO_CATEGORY[t.toLowerCase()];
  }
  return 'GUIDE';
}

function deriveSlugLabel(tags: string[], slug: string): string {
  // Prefer a brand/platform tag if present
  const known = ['tesco', 'sephora', 'ikea', 'priceline', 'propertyfinder', 'bayut', 'rapidapi', 'morningstar'];
  for (const t of tags.map((x) => x.toLowerCase())) {
    if (known.includes(t)) return t.toUpperCase();
  }
  return slug.split('-').slice(0, 2).join(' ').toUpperCase();
}

function parseFrontmatter(text: string): Record<string, string | string[]> {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: Record<string, string | string[]> = {};
  const lines = m[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const top = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (top) {
      const key = top[1];
      const raw = top[2];
      if (raw === '' || raw === null) {
        // multi-line array on following indented lines
        const arr: string[] = [];
        i++;
        while (i < lines.length && /^\s+-\s/.test(lines[i])) {
          arr.push(lines[i].replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g, ''));
          i++;
        }
        fm[key] = arr;
        continue;
      }
      // Inline array
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

function countWords(text: string): number {
  // strip frontmatter and JSX/HTML tags
  const body = text.replace(/^---\n[\s\S]*?\n---/, '').replace(/<[^>]+>/g, ' ').replace(/`{3}[\s\S]*?`{3}/g, ' ');
  return body.split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  return `${Math.max(1, Math.ceil(words / 200))} MIN READ`;
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(p: PostMeta): string {
  return `<!DOCTYPE html>
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
  .top-meta { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500; color: #1e293b;
    letter-spacing: 0.18em; display: flex; gap: 14px; align-items: center;
  }
  .brand .sep { opacity: 0.3; }
  .brand .label { color: #64748b; }
  .accent {
    background: #2563eb; color: white;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.2em;
    padding: 8px 14px; border-radius: 6px;
  }
  .title {
    font-family: 'Outfit', sans-serif; font-weight: 800;
    font-size: 60px; line-height: 1.05; letter-spacing: -0.025em;
    color: #0f172a; max-width: 920px;
  }
  .footer {
    border-top: 1px solid #e2e8f0; padding-top: 20px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .footer-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500; letter-spacing: 0.12em;
    color: #475569; display: flex; gap: 14px;
  }
  .footer-meta .dot { color: #cbd5e1; }
  .footer-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500; color: #94a3b8; letter-spacing: 0.08em;
  }
  .corner { position: absolute; width: 16px; height: 16px; border: 2px solid #2563eb; }
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
      <div class="accent">${escapeHtml(p.category)}</div>
    </div>

    <h1 class="title">${escapeHtml(p.title)}</h1>

    <div class="footer">
      <div class="footer-meta">
        <span>${escapeHtml(readingTime(p.wordCount))}</span>
        <span class="dot">·</span>
        <span>${escapeHtml(formatDate(p.date))}</span>
        <span class="dot">·</span>
        <span>${escapeHtml(p.slugLabel)}</span>
      </div>
      <div class="footer-url">happyendpoint.com</div>
    </div>
  </div>
</body>
</html>`;
}

interface ConvertResponse {
  success: boolean;
  url: string;
  filename: string;
  format: string;
}

async function generate(p: PostMeta): Promise<void> {
  const html = buildHtml(p);

  // Step 1: POST HTML, get JSON with the URL
  const submitRes = await fetch(
    'https://html2png.dev/api/convert?width=1200&height=630&format=png&deviceScaleFactor=2',
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/html' },
      body: html,
    },
  );
  if (!submitRes.ok) {
    throw new Error(`html2png submit failed: HTTP ${submitRes.status} ${await submitRes.text()}`);
  }
  const meta = (await submitRes.json()) as ConvertResponse;
  if (!meta.success || !meta.url) {
    throw new Error(`html2png returned unexpected payload: ${JSON.stringify(meta)}`);
  }

  // Step 2: GET the URL, save the PNG
  const pngRes = await fetch(meta.url);
  if (!pngRes.ok) {
    throw new Error(`html2png fetch failed: HTTP ${pngRes.status}`);
  }
  const buf = Buffer.from(await pngRes.arrayBuffer());
  mkdirSync(dirname(p.outPath), { recursive: true });
  writeFileSync(p.outPath, buf);
}

function discoverPosts(): PostMeta[] {
  const files = readdirSync(blogDir).filter((f) => f.endsWith('.mdx'));
  const out: PostMeta[] = [];
  for (const file of files) {
    const slug = basename(file, extname(file));
    if (onlySlug && slug !== onlySlug) continue;
    const text = readFileSync(resolve(blogDir, file), 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm.coverImage) continue;
    const title = String(fm.title ?? slug);
    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
    const category = String(fm.coverCategory ?? deriveCategory(tags));
    const slugLabel = String(fm.coverSlugLabel ?? deriveSlugLabel(tags, slug));
    const date = new Date(String(fm.publishedAt));
    const wordCount = countWords(text);
    const outPath = resolve(projectRoot, String(fm.coverImage).replace(/^\//, 'public/'));
    out.push({ slug, title, date, category, slugLabel, wordCount, outPath });
  }
  return out;
}

async function main() {
  const posts = discoverPosts();
  if (posts.length === 0) {
    console.warn('No posts found with coverImage frontmatter (after --slug filter).');
    return;
  }
  for (const p of posts) {
    if (existsSync(p.outPath) && !force) {
      console.warn(`skip   ${p.slug} (exists; use --force to regenerate)`);
      continue;
    }
    process.stdout.write(`gen    ${p.slug}... `);
    try {
      await generate(p);
      console.warn('ok');
    } catch (err) {
      console.error(`\nfailed ${p.slug}:`, (err as Error).message);
      process.exitCode = 1;
    }
  }
}

main();
