// SEO Utilities

import type { 
  SEOMetadata, 
  StructuredDataOrganization, 
  StructuredDataArticle, 
  StructuredDataEvent,
  StructuredDataBreadcrumb 
} from '../types/seo';

// Default SEO configuration
export const DEFAULT_SEO: SEOMetadata = {
  title: 'Wasilah - Connecting NGOs, Students, and Volunteers in Pakistan',
  description: 'Wasilah is Pakistan\'s leading platform connecting NGOs with passionate students and volunteers. Find meaningful volunteer opportunities, impactful projects, and community events.',
  keywords: [
    'volunteer pakistan',
    'ngo pakistan',
    'volunteer opportunities',
    'community service',
    'social work pakistan',
    'student volunteer',
    'charity pakistan',
    'donations pakistan',
  ],
  author: 'Wasilah',
  canonicalUrl: 'https://wasilah.com',
  ogType: 'website',
  ogImage: 'https://wasilah.com/og-image.png',
  ogImageAlt: 'Wasilah - Connecting Communities',
  twitterCard: 'summary_large_image',
  twitterSite: '@wasilahpk',
  locale: 'en_PK',
  alternateLocales: ['ur_PK'],
};

// Generate page title with branding
export const generatePageTitle = (pageTitle?: string): string => {
  if (!pageTitle) return DEFAULT_SEO.title;
  return `${pageTitle} | Wasilah`;
};

// Generate meta description with limits
export const generateMetaDescription = (description: string, maxLength: number = 160): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
};

// Generate keywords string
export const generateKeywords = (keywords: string[]): string => {
  return keywords.join(', ');
};

// Generate canonical URL
export const generateCanonicalUrl = (path: string): string => {
  const baseUrl = 'https://wasilah.com';
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

// Create structured data for organization
export const createOrganizationStructuredData = (): StructuredDataOrganization => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wasilah',
    url: 'https://wasilah.com',
    logo: 'https://wasilah.com/logo.png',
    description: 'Pakistan\'s leading platform connecting NGOs with students and volunteers',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PK',
      addressRegion: 'Punjab',
      addressLocality: 'Lahore',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+92-300-0000000',
      contactType: 'Customer Service',
      email: 'support@wasilah.com',
    },
    sameAs: [
      'https://facebook.com/wasilahpk',
      'https://twitter.com/wasilahpk',
      'https://linkedin.com/company/wasilah',
      'https://instagram.com/wasilahpk',
    ],
  };
};

// Create structured data for article/blog post
export const createArticleStructuredData = (
  title: string,
  description: string,
  image: string,
  datePublished: string,
  author: string,
  dateModified?: string
): StructuredDataArticle => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Wasilah',
      logo: {
        '@type': 'ImageObject',
        url: 'https://wasilah.com/logo.png',
      },
    },
  };
};

// Create structured data for event
export const createEventStructuredData = (
  name: string,
  description: string,
  startDate: string,
  location: string,
  locationCity: string,
  endDate?: string,
  image?: string,
  organizer?: string
): StructuredDataEvent => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: name,
    description: description,
    startDate: startDate,
    endDate: endDate,
    location: {
      '@type': 'Place',
      name: location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PK',
        addressLocality: locationCity,
      },
    },
    image: image,
    organizer: organizer ? {
      '@type': 'Organization',
      name: organizer,
      url: 'https://wasilah.com',
    } : undefined,
  };
};

// Create breadcrumb structured data
export const createBreadcrumbStructuredData = (
  items: Array<{ name: string; url?: string }>
): StructuredDataBreadcrumb => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

// Generate Open Graph tags
export const generateOGTags = (metadata: SEOMetadata) => {
  return {
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:type': metadata.ogType || 'website',
    'og:url': metadata.canonicalUrl || DEFAULT_SEO.canonicalUrl,
    'og:image': metadata.ogImage || DEFAULT_SEO.ogImage,
    'og:image:alt': metadata.ogImageAlt || DEFAULT_SEO.ogImageAlt,
    'og:locale': metadata.locale || DEFAULT_SEO.locale,
    'og:site_name': 'Wasilah',
  };
};

// Generate Twitter Card tags
export const generateTwitterTags = (metadata: SEOMetadata) => {
  return {
    'twitter:card': metadata.twitterCard || DEFAULT_SEO.twitterCard,
    'twitter:site': metadata.twitterSite || DEFAULT_SEO.twitterSite,
    'twitter:creator': metadata.twitterCreator || DEFAULT_SEO.twitterSite,
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    'twitter:image': metadata.ogImage || DEFAULT_SEO.ogImage,
    'twitter:image:alt': metadata.ogImageAlt || DEFAULT_SEO.ogImageAlt,
  };
};

// SEO-friendly URL slug generator
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Extract keywords from text
export const extractKeywords = (text: string, count: number = 10): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  const wordFreq = words
    .filter(word => word.length > 3 && !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
};

// Validate image for SEO
export const validateSEOImage = (url: string): boolean => {
  // Check if image URL is valid and accessible
  return url.startsWith('http') && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.webp'));
};

// Generate alt text for images
export const generateAltText = (title: string, context?: string): string => {
  if (context) {
    return `${title} - ${context}`;
  }
  return title;
};
