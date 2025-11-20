// SEO Head Component with React Helmet

import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { SEOMetadata } from '../../types/seo';
import {
  DEFAULT_SEO,
  generatePageTitle,
  generateMetaDescription,
  generateKeywords,
  generateOGTags,
  generateTwitterTags,
} from '../../utils/seo';

interface SEOHeadProps {
  metadata?: Partial<SEOMetadata>;
  structuredData?: object | object[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({ metadata = {}, structuredData }) => {
  // Merge with defaults
  const seoData: SEOMetadata = {
    ...DEFAULT_SEO,
    ...metadata,
    keywords: metadata.keywords || DEFAULT_SEO.keywords,
  };

  // Generate tags
  const ogTags = generateOGTags(seoData);
  const twitterTags = generateTwitterTags(seoData);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{generatePageTitle(seoData.title)}</title>
      <meta name="description" content={generateMetaDescription(seoData.description)} />
      {seoData.keywords && (
        <meta name="keywords" content={generateKeywords(seoData.keywords)} />
      )}
      {seoData.author && <meta name="author" content={seoData.author} />}

      {/* Canonical URL */}
      {seoData.canonicalUrl && <link rel="canonical" href={seoData.canonicalUrl} />}

      {/* Open Graph Tags */}
      {Object.entries(ogTags).map(([key, value]) => (
        <meta key={key} property={key} content={value as string} />
      ))}

      {/* Twitter Card Tags */}
      {Object.entries(twitterTags).map(([key, value]) => (
        <meta key={key} name={key} content={value as string} />
      ))}

      {/* Language & Locale */}
      <meta httpEquiv="content-language" content={seoData.locale?.replace('_', '-') || 'en-PK'} />
      {seoData.alternateLocales?.map(locale => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale.replace('_', '-')}
          href={`${seoData.canonicalUrl}?lang=${locale.split('_')[0]}`}
        />
      ))}

      {/* Article Metadata (if applicable) */}
      {seoData.publishedTime && (
        <meta property="article:published_time" content={seoData.publishedTime} />
      )}
      {seoData.modifiedTime && (
        <meta property="article:modified_time" content={seoData.modifiedTime} />
      )}
      {seoData.section && <meta property="article:section" content={seoData.section} />}
      {seoData.tags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData]
          )}
        </script>
      )}

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Favicon & App Icons (assuming they're in public folder) */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* Theme Color */}
      <meta name="theme-color" content="#1e3a8a" />
      <meta name="msapplication-TileColor" content="#1e3a8a" />

      {/* Viewport (should be in main HTML, but included for completeness) */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    </Helmet>
  );
};

// Pre-configured SEO components for common pages

export const HomePageSEO: React.FC = () => {
  return (
    <SEOHead
      metadata={{
        title: 'Wasilah - Connecting NGOs, Students, and Volunteers in Pakistan',
        description: 'Join Pakistan\'s leading volunteer platform. Find meaningful projects, connect with NGOs, and make a real impact in your community. Start volunteering today!',
        keywords: [
          'volunteer pakistan',
          'ngo pakistan',
          'volunteer opportunities karachi',
          'volunteer opportunities lahore',
          'student volunteer',
          'community service pakistan',
        ],
        canonicalUrl: 'https://wasilah.com/',
      }}
    />
  );
};

export const ProjectsPageSEO: React.FC = () => {
  return (
    <SEOHead
      metadata={{
        title: 'Browse Volunteer Projects',
        description: 'Discover hundreds of volunteer projects across Pakistan. From education to healthcare, find projects that match your passion and skills.',
        canonicalUrl: 'https://wasilah.com/projects',
      }}
    />
  );
};

export const EventsPageSEO: React.FC = () => {
  return (
    <SEOHead
      metadata={{
        title: 'Upcoming Volunteer Events',
        description: 'Join exciting volunteer events happening across Pakistan. Connect with like-minded people and make a difference in your community.',
        canonicalUrl: 'https://wasilah.com/events',
      }}
    />
  );
};

export const NGOsPageSEO: React.FC = () => {
  return (
    <SEOHead
      metadata={{
        title: 'NGOs and Non-Profits',
        description: 'Explore verified NGOs and non-profit organizations in Pakistan. Find organizations working on causes you care about.',
        canonicalUrl: 'https://wasilah.com/ngos',
      }}
    />
  );
};
