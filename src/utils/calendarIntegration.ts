/**
 * Google Calendar Integration Utilities
 * Generate "Add to Calendar" links (no OAuth required, zero-cost)
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHmmSSZ)
 */
const formatGoogleCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate Google Calendar link
 */
export const generateGoogleCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.startDate)}/${formatGoogleCalendarDate(event.endDate)}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
    ...(event.timezone && { ctz: event.timezone }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate iCal file content (.ics format)
 * Compatible with Apple Calendar, Outlook, and other calendar apps
 */
export const generateICalFile = (event: CalendarEvent): string => {
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeiCalText = (text: string): string => {
    return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  };

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wasilah//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@wasilah.com`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(event.startDate)}`,
    `DTEND:${formatICalDate(event.endDate)}`,
    `SUMMARY:${escapeiCalText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeiCalText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeiCalText(event.location)}`] : []),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icalContent;
};

/**
 * Download iCal file
 */
export const downloadICalFile = (event: CalendarEvent, filename?: string): void => {
  const icalContent = generateICalFile(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Generate Outlook.com calendar link
 */
export const generateOutlookCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    ...(event.description && { body: event.description }),
    ...(event.location && { location: event.location }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar link
 */
export const generateYahooCalendarLink = (event: CalendarEvent): string => {
  const formatYahooDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0];
  };

  const duration = Math.floor((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60)); // minutes

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatYahooDate(event.startDate),
    dur: duration.toString().padStart(4, '0'),
    ...(event.description && { desc: event.description }),
    ...(event.location && { in_loc: event.location }),
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};

/**
 * Open add to calendar dialog (shows multiple options)
 */
export const openAddToCalendar = (event: CalendarEvent, provider?: 'google' | 'outlook' | 'yahoo' | 'ical'): void => {
  let url: string;

  switch (provider) {
    case 'google':
      url = generateGoogleCalendarLink(event);
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
    case 'outlook':
      url = generateOutlookCalendarLink(event);
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
    case 'yahoo':
      url = generateYahooCalendarLink(event);
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
    case 'ical':
      downloadICalFile(event);
      break;
    default:
      // Default to Google Calendar (most popular)
      url = generateGoogleCalendarLink(event);
      window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Track calendar add event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_calendar', {
      event_title: event.title,
      calendar_provider: provider || 'google',
    });
  }
};

/**
 * Get calendar reminder suggestions based on event date
 */
export const getCalendarReminders = (eventDate: Date): number[] => {
  const now = new Date();
  const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilEvent <= 1) {
    // Event is tomorrow or today: remind 1 hour before
    return [60];
  } else if (daysUntilEvent <= 7) {
    // Event within a week: remind 1 day before and 1 hour before
    return [1440, 60];
  } else {
    // Event far in future: remind 1 week before, 1 day before, and 1 hour before
    return [10080, 1440, 60];
  }
};
