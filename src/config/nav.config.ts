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
    label: 'Data Guides',
    href: '#',
    order: 3,
    icon: 'map',
    children: [
      { label: 'Real Estate Data', href: '/real-estate-data/', icon: 'building-2' },
      { label: 'Ecommerce Data',   href: '/ecommerce-data/',   icon: 'shopping-bag' },
      { label: 'Finance Data',     href: '/finance-data/',     icon: 'trending-up' },
      { label: 'Travel Data',      href: '/travel-data/',      icon: 'plane' },
    ],
  },
  {
    label: 'Resources',
    href: '#',
    order: 4,
    icon: 'layers',
    children: [
      { label: 'Free Datasets', href: '/free-datasets', icon: 'gift' },
      { label: 'Dictionary',    href: '/dictionary',    icon: 'book-open' },
      { label: 'Blog',          href: '/blog',          icon: 'newspaper' },
    ],
  },
  { label: 'About',         href: '/about',         order: 5, icon: 'info' },
  { label: 'Contact',       href: '/contact',       order: 6, icon: 'mail' },
];

export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
