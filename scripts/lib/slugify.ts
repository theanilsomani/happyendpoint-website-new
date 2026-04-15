export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')       // strip diacritics
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')           // non-alphanumerics → hyphen
    .replace(/-+/g, '-')                   // collapse hyphens
    .replace(/^-|-$/g, '');                // trim hyphens
}
