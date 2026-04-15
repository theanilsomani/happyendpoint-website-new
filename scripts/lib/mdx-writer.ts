type Frontmatter = Record<string, unknown>;

function needsQuoting(s: string): boolean {
  if (/[:#\[\]{}&*!|>'"%@`\n]/.test(s)) return true;
  if (/^(\s|-|\?|:|>)/.test(s)) return true;
  if (/^(true|false|null|yes|no|~|)$/i.test(s)) return true;
  if (/^-?\d/.test(s)) return true;
  return false;
}

function renderScalar(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v === '') return '""';
    return needsQuoting(v) ? JSON.stringify(v) : v;
  }
  throw new Error(`renderScalar: unsupported type ${typeof v}`);
}

function renderValue(key: string, value: unknown, indent: number): string[] {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}${key}: []`];
    const lines = [`${pad}${key}:`];
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const entries = Object.entries(item as Frontmatter);
        if (entries.length === 0) {
          lines.push(`${pad}  - {}`);
          continue;
        }
        const [firstKey, firstValue] = entries[0];
        lines.push(`${pad}  - ${firstKey}: ${renderScalar(firstValue)}`);
        for (const [k, v] of entries.slice(1)) {
          lines.push(...renderValue(k, v, indent + 2));
        }
      } else {
        lines.push(`${pad}  - ${renderScalar(item)}`);
      }
    }
    return lines;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Frontmatter);
    if (entries.length === 0) return [`${pad}${key}: {}`];
    const lines = [`${pad}${key}:`];
    for (const [k, v] of entries) {
      lines.push(...renderValue(k, v, indent + 1));
    }
    return lines;
  }
  return [`${pad}${key}: ${renderScalar(value)}`];
}

export function renderMdx(frontmatter: Frontmatter, body: string): string {
  const lines: string[] = ['---'];
  for (const [k, v] of Object.entries(frontmatter)) {
    lines.push(...renderValue(k, v, 0));
  }
  lines.push('---');
  lines.push('');
  lines.push(body);
  lines.push('');
  return lines.join('\n');
}
