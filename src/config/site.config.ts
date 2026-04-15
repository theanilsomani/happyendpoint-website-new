import { SITE_URL, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION } from 'astro:env/server';

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  author: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  socialLinks: string[];
  twitter?: { site: string; creator: string };
  verification?: { google?: string; bing?: string };
  authorImage?: string;
  /**
   * Set to false if your blog post images already match your theme color
   * and you don't want the brand color overlay applied on top of them.
   */
  blogImageOverlay?: boolean;
  /**
   * Branding configuration
   * Logo files: Replace SVGs in src/assets/branding/
   * Favicon: Replace in public/favicon.svg
   */
  branding: {
    /** Logo alt text for accessibility */
    logo: {
      alt: string;
      /** Path to logo image for structured data (e.g. '/logo.png'). Add a PNG to public/ and set this. */
      imageUrl?: string;
    };
    /** Favicon path (lives in public/) */
    favicon: {
      svg: string;
    };
    /** Theme colors for manifest and browser UI */
    colors: {
      /** Browser toolbar color (hex) */
      themeColor: string;
      /** PWA splash screen background (hex) */
      backgroundColor: string;
    };
  };
}

const siteConfig: SiteConfig = {
  name: 'Happy Endpoint',
  description:
    'APIs and datasets for real-estate, travel, grocery, finance, retail, fashion, and beauty — sold on RapidAPI. Free samples available.',
  url: SITE_URL || 'https://happyendpoint.com',
  ogImage: '/og-default.svg',
  author: 'Happy Endpoint',
  email: 'hello@happyendpoint.com',
  socialLinks: [
    'https://rapidapi.com/user/happyendpoint',
  ],
  twitter: { site: '@happyendpoint', creator: '@happyendpoint' },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    bing: BING_SITE_VERIFICATION,
  },
  blogImageOverlay: true,
  branding: {
    logo: { alt: 'Happy Endpoint', imageUrl: '/favicon.svg' },
    favicon: { svg: '/favicon.svg' },
    colors: { themeColor: '#2563eb', backgroundColor: '#ffffff' },
  },
};

export default siteConfig;
