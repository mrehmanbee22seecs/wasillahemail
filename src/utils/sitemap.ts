// Sitemap Generation Utility

import type { SitemapEntry } from '../types/seo';

// Base URL for the site
const BASE_URL = 'https://wasilah.com';

// Static pages configuration
const STATIC_PAGES: SitemapEntry[] = [
  {
    loc: '/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: '/about',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: '/projects',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: '/events',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: '/ngos',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: '/volunteer',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    loc: '/donations',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    loc: '/contact',
    changefreq: 'monthly',
    priority: 0.6,
  },
  {
    loc: '/login',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    loc: '/signup',
    changefreq: 'monthly',
    priority: 0.5,
  },
];

// Generate sitemap XML
export const generateSitemapXML = (entries: SitemapEntry[]): string => {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const urls = entries.map(entry => {
    let url = `  <url>\n`;
    url += `    <loc>${BASE_URL}${entry.loc}</loc>\n`;
    
    if (entry.lastmod) {
      url += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }
    
    if (entry.changefreq) {
      url += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }
    
    if (entry.priority !== undefined) {
      url += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    }
    
    url += `  </url>\n`;
    return url;
  }).join('');
  
  const footer = '</urlset>';
  
  return header + urls + footer;
};

// Generate sitemap from dynamic data
export const generateDynamicSitemap = async (
  projects: Array<{ id: string; updatedAt?: Date }>,
  events: Array<{ id: string; updatedAt?: Date }>,
  ngos: Array<{ id: string; updatedAt?: Date }>
): Promise<SitemapEntry[]> => {
  const dynamicEntries: SitemapEntry[] = [];
  
  // Add projects
  projects.forEach(project => {
    dynamicEntries.push({
      loc: `/projects/${project.id}`,
      lastmod: project.updatedAt?.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  });
  
  // Add events
  events.forEach(event => {
    dynamicEntries.push({
      loc: `/events/${event.id}`,
      lastmod: event.updatedAt?.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  });
  
  // Add NGOs
  ngos.forEach(ngo => {
    dynamicEntries.push({
      loc: `/ngos/${ngo.id}`,
      lastmod: ngo.updatedAt?.toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6,
    });
  });
  
  return dynamicEntries;
};

// Generate complete sitemap
export const generateCompleteSitemap = async (
  projects: Array<{ id: string; updatedAt?: Date }>,
  events: Array<{ id: string; updatedAt?: Date }>,
  ngos: Array<{ id: string; updatedAt?: Date }>
): Promise<string> => {
  const dynamicEntries = await generateDynamicSitemap(projects, events, ngos);
  const allEntries = [...STATIC_PAGES, ...dynamicEntries];
  return generateSitemapXML(allEntries);
};

// Save sitemap to file (for build-time generation)
export const saveSitemap = async (
  sitemapXML: string,
  filePath: string = '/public/sitemap.xml'
): Promise<void> => {
  // In a real implementation, this would write to the file system
  // For now, we'll just log it
  console.log('Sitemap generated:', sitemapXML.substring(0, 200) + '...');
};

// Generate robots.txt content
export const generateRobotsTxt = (sitemapUrl?: string): string => {
  let content = '# Robots.txt for Wasilah\n\n';
  content += 'User-agent: *\n';
  content += 'Allow: /\n';
  content += 'Disallow: /admin/\n';
  content += 'Disallow: /api/\n';
  content += 'Disallow: /dashboard/\n';
  content += 'Disallow: /profile/edit\n';
  content += '\n';
  content += '# Crawl-delay (in seconds)\n';
  content += 'Crawl-delay: 1\n';
  content += '\n';
  content += '# Sitemap location\n';
  content += `Sitemap: ${sitemapUrl || BASE_URL + '/sitemap.xml'}\n`;
  
  return content;
};

// Ping search engines about sitemap update
export const pingSearchEngines = async (sitemapUrl: string): Promise<void> => {
  const searchEngines = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];
  
  try {
    await Promise.all(
      searchEngines.map(url =>
        fetch(url).catch(err => console.error('Failed to ping search engine:', err))
      )
    );
  } catch (error) {
    console.error('Error pinging search engines:', error);
  }
};

// Get sitemap index (for large sites with multiple sitemaps)
export const generateSitemapIndex = (sitemapUrls: string[]): string => {
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const sitemaps = sitemapUrls.map(url => {
    return `  <sitemap>\n` +
      `    <loc>${url}</loc>\n` +
      `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n` +
      `  </sitemap>\n`;
  }).join('');
  
  const footer = '</sitemapindex>';
  
  return header + sitemaps + footer;
};
