export interface NavChild {
  label: string;
  href: string;
  icon?: string;
}

export interface NavItem {
  label: string;
  href: string;
  order: number;
  icon?: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { label: 'Library',       href: '/library',       order: 1, icon: 'plug' },
  { label: 'Datasets',      href: '/datasets',      order: 2, icon: 'database' },
  {
    label: 'Resources',
    href: '#',
    order: 3,
    icon: 'layers',
    children: [
      { label: 'Free Datasets', href: '/free-datasets', icon: 'gift' },
      { label: 'Dictionary',    href: '/dictionary',    icon: 'book-open' },
      { label: 'Blog',          href: '/blog',          icon: 'newspaper' },
    ],
  },
  { label: 'About',         href: '/about',         order: 4, icon: 'info' },
  { label: 'Contact',       href: '/contact',       order: 5, icon: 'mail' },
];

export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
