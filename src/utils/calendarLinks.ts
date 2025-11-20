/**
 * Calendar Link Utilities
 * Generate "Add to Calendar" links for various calendar services
 */

import type { CalendarEvent, CalendarType } from '../types/integrations';

/**
 * Format date for calendar links (YYYYMMDDTHHMMSSZ)
 */
const formatCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Format date for Outlook/Yahoo (YYYY-MM-DDTHH:MM:SSZ)
 */
const formatOutlookDate = (date: Date): string => {
  return date.toISOString().split('.')[0] + 'Z';
};

/**
 * Generate Google Calendar link
 */
export const getGoogleCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatCalendarDate(event.startTime)}/${formatCalendarDate(event.endTime)}`,
    details: event.description,
    location: event.location,
    ctz: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar link
 */
export const getOutlookCalendarLink = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: formatOutlookDate(event.startTime),
    enddt: formatOutlookDate(event.endTime)
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar link
 */
export const getYahooCalendarLink = (event: CalendarEvent): string => {
  const duration = Math.floor((event.endTime.getTime() - event.startTime.getTime()) / 1000 / 60); // minutes
  
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatCalendarDate(event.startTime),
    dur: duration.toString(),
    desc: event.description,
    in_loc: event.location
  });
  
  return `https://calendar.yahoo.com/?${params.toString()}`;
};

/**
 * Generate ICS file content (download)
 */
export const generateICSFile = (event: CalendarEvent): string => {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wasilah//Event Calendar//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatCalendarDate(event.startTime)}`,
    `DTEND:${formatCalendarDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

/**
 * Download ICS file
 */
export const downloadICSFile = (event: CalendarEvent): void => {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get calendar link for any service
 */
export const getCalendarLink = (type: CalendarType, event: CalendarEvent): string => {
  switch (type) {
    case 'google':
      return getGoogleCalendarLink(event);
    case 'outlook':
      return getOutlookCalendarLink(event);
    case 'yahoo':
      return getYahooCalendarLink(event);
    default:
      return '';
  }
};

/**
 * Open calendar link in new window
 */
export const openCalendarLink = (type: CalendarType, event: CalendarEvent): void => {
  if (type === 'ics') {
    downloadICSFile(event);
  } else {
    const link = getCalendarLink(type, event);
    window.open(link, '_blank');
  }
};
