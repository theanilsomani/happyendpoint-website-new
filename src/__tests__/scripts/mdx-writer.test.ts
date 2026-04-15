import { describe, it, expect } from 'vitest';
import { renderMdx } from '../../../scripts/lib/mdx-writer';

describe('renderMdx', () => {
  it('produces a YAML frontmatter block and a body', () => {
    const output = renderMdx(
      { name: 'Hello', tags: ['a', 'b'] },
      'Some body text.',
    );
    expect(output).toBe(
      [
        '---',
        'name: Hello',
        'tags:',
        '  - a',
        '  - b',
        '---',
        '',
        'Some body text.',
        '',
      ].join('\n'),
    );
  });

  it('quotes strings containing colons or hashes', () => {
    const output = renderMdx({ title: 'A: B' }, 'body');
    expect(output).toContain('title: "A: B"');
  });

  it('emits null for null values (not empty string)', () => {
    const output = renderMdx({ pricing: null }, 'body');
    expect(output).toContain('pricing: null');
  });

  it('serialises nested objects with indentation', () => {
    const output = renderMdx(
      { freeSample: { recordCount: '1,000', features: ['x'] } },
      'body',
    );
    expect(output).toContain('freeSample:\n  recordCount: "1,000"\n  features:\n    - x');
  });

  it('serialises booleans as true/false', () => {
    const output = renderMdx({ featured: true, draft: false }, 'body');
    expect(output).toContain('featured: true');
    expect(output).toContain('draft: false');
  });

  it('serialises numbers verbatim', () => {
    const output = renderMdx({ order: 3 }, 'body');
    expect(output).toContain('order: 3');
  });
});
