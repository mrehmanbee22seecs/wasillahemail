/**
 * Add to Calendar Component
 * Calendar integration buttons for events
 */

import React, { useState } from 'react';
import type { CalendarEvent, CalendarType } from '../types/integrations';
import { openCalendarLink } from '../utils/calendarLinks';

interface AddToCalendarProps {
  event: CalendarEvent;
  variant?: 'button' | 'dropdown' | 'inline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const AddToCalendar: React.FC<AddToCalendarProps> = ({
  event,
  variant = 'dropdown',
  size = 'medium',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const calendars: Array<{ type: CalendarType; label: string; icon: string }> = [
    { type: 'google', label: 'Google Calendar', icon: '📅' },
    { type: 'outlook', label: 'Outlook Calendar', icon: '📆' },
    { type: 'yahoo', label: 'Yahoo Calendar', icon: '📋' },
    { type: 'ics', label: 'Download ICS', icon: '💾' }
  ];

  const handleCalendarClick = (type: CalendarType) => {
    openCalendarLink(type, event);
    setIsOpen(false);
  };

  // Button Variant (single Google Calendar button)
  if (variant === 'button') {
    return (
      <button
        onClick={() => handleCalendarClick('google')}
        className={`${sizeClasses[size]} flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors ${className}`}
      >
        <span>📅</span>
        <span>Add to Calendar</span>
      </button>
    );
  }

  // Inline Variant (all options visible)
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Add to Calendar
        </div>
        <div className="flex flex-wrap gap-2">
          {calendars.map((calendar) => (
            <button
              key={calendar.type}
              onClick={() => handleCalendarClick(calendar.type)}
              className={`${sizeClasses[size]} flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-300 transition-colors`}
            >
              <span>{calendar.icon}</span>
              <span className="text-sm font-medium">{calendar.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown Variant (default)
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors`}
      >
        <span>📅</span>
        <span>Add to Calendar</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {calendars.map((calendar) => (
                <button
                  key={calendar.type}
                  onClick={() => handleCalendarClick(calendar.type)}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span className="text-xl">{calendar.icon}</span>
                  <span className="text-sm font-medium">{calendar.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCalendar;
