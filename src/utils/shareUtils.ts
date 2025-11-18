/**
 * Share Utilities
 * Client-side sharing functions for social media, email, and calendar
 * Zero cost - no server-side integration needed
 */

// Social Media Share URLs
export const shareUrls = {
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (url: string, text?: string) => 
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || '')}`,
  linkedin: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  whatsapp: (url: string, text?: string) => 
    `https://web.whatsapp.com/send?text=${encodeURIComponent(`${text || ''} ${url}`)}`,
  email: (subject: string, body: string, url: string) => 
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${body}\n\n${url}`)}`,
};

// Share via native Web Share API (mobile/PWA)
export const shareNative = async (data: { title: string; text?: string; url: string }) => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// Generate Google Calendar link
export const generateGoogleCalendarLink = (event: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}): string => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate ICS file for calendar (universal format)
export const generateICSFile = (event: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}): string => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
};

// Download ICS file
export const downloadICS = (event: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}, filename: string = 'event.ics') => {
  const icsData = generateICSFile(event);
  const link = document.createElement('a');
  link.href = icsData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Track share events (for analytics)
export const trackShare = (platform: string, contentType: string, contentId: string) => {
  // Integration with Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share', {
      method: platform,
      content_type: contentType,
      content_id: contentId,
    });
  }
};
