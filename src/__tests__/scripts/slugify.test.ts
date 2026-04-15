import { describe, it, expect } from 'vitest';
import { slugify } from '../../../scripts/lib/slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('PropertyFinder UAE Data')).toBe('propertyfinder-uae-data');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Tesco UK Products (Full)")).toBe('tesco-uk-products-full');
  });

  it('collapses consecutive separators', () => {
    expect(slugify('Sephora  --  API')).toBe('sephora-api');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  Hello World!  ')).toBe('hello-world');
  });

  it('handles ampersands as "and"', () => {
    expect(slugify('Bayut & Property Finder')).toBe('bayut-and-property-finder');
  });

  it('passes through an already-slugified string unchanged', () => {
    expect(slugify('tesco-products-uk')).toBe('tesco-products-uk');
  });
});
