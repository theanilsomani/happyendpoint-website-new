export interface NavItem {
  label: string;
  href: string;
  order: number;
}

export const navItems: NavItem[] = [
  { label: 'Library',        href: '/library',        order: 1 },
  { label: 'Datasets',       href: '/datasets',       order: 2 },
  { label: 'Free Datasets',  href: '/free-datasets',  order: 3 },
  { label: 'Dictionary',     href: '/dictionary',     order: 4 },
  { label: 'Blog',           href: '/blog',           order: 5 },
  { label: 'About',          href: '/about',          order: 6 },
  { label: 'Contact',        href: '/contact',        order: 7 },
];

export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
