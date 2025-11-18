/**
 * Content Management System Type Definitions
 * Complete types for CMS, content versioning, and media library
 */

export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived' | 'deleted';

export type ContentType = 'page' | 'blog' | 'project' | 'event' | 'email' | 'custom';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // HTML content
  contentJSON?: any; // TipTap JSON format
  authorId: string;
  authorName: string;
  status: ContentStatus;
  tags: string[];
  categories: string[];
  metadata: {
    views: number;
    likes: number;
    shares: number;
    editCount: number;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  publishedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  content: string;
  contentJSON?: any;
  title: string;
  excerpt?: string;
  authorId: string;
  authorName: string;
  changeMessage?: string;
  createdAt: Date;
  characterCount: number;
  wordCount: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  structure: any; // TipTap JSON structure
  category: string;
  tags: string[];
  authorId: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  cloudinaryId: string;
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
  type: 'upload' | 'private' | 'authenticated';
  filename: string;
  originalFilename: string;
  bytes: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  folder?: string;
  tags: string[];
  uploaderId: string;
  uploaderName: string;
  alt?: string;
  caption?: string;
  metadata: Record<string, any>;
  usageCount: number;
  usedIn: string[]; // Array of content IDs using this media
  createdAt: Date;
  updatedAt: Date;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  public?: boolean;
  transformation?: CloudinaryTransformation;
  overwrite?: boolean;
}

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'limit' | 'pad' | 'thumb';
  quality?: number | 'auto';
  fetch_format?: 'auto' | 'webp' | 'jpg' | 'png';
  effect?: string;
  gravity?: string;
}

export interface ContentAnalytics {
  contentId: string;
  views: number;
  uniqueViews: number;
  averageTimeSpent: number;
  bounceRate: number;
  shares: number;
  comments: number;
  likes: number;
  conversions: number;
  viewsByDate: Record<string, number>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export interface BulkOperation {
  action: 'publish' | 'unpublish' | 'archive' | 'delete' | 'tag' | 'untag' | 'schedule';
  contentIds: string[];
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

export interface ContentFilter {
  status?: ContentStatus[];
  type?: ContentType[];
  authorId?: string;
  tags?: string[];
  categories?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ContentSort {
  field: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'views';
  order: 'asc' | 'desc';
}
