/**
 * Integration Types
 * Type definitions for social sharing and calendar integrations
 */

export type SocialPlatform = 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email';

export type CalendarType = 'google' | 'outlook' | 'yahoo' | 'ics';

export interface ShareableContent {
  title: string;
  description: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;
}

export interface ShareMetrics {
  contentId: string;
  contentType: 'project' | 'event' | 'ngo';
  platform: SocialPlatform;
  timestamp: Date;
  userId?: string;
}

export interface CalendarLinkOptions {
  type: CalendarType;
  event: CalendarEvent;
}
