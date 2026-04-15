export interface NavItem {
  label: string;
  href: string;
  order: number;
}

export const navItems: NavItem[] = [
  { label: 'Library',        href: '/library',        order: 1 },
  { label: 'Datasets',       href: '/datasets',       order: 2 },
  { label: 'Free Datasets',  href: '/free-datasets',  order: 3 },
  { label: 'Platforms',      href: '/platforms',      order: 4 },
  { label: 'Categories',     href: '/categories',     order: 5 },
  { label: 'Blog',           href: '/blog',           order: 6 },
  { label: 'About',          href: '/about',          order: 7 },
  { label: 'Contact',        href: '/contact',        order: 8 },
];

export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
