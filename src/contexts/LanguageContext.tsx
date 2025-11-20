/**
 * Language Context for Global Language State Management
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Language } from '../i18n/config';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get saved language from localStorage or default to English
    const saved = localStorage.getItem('language');
    return (saved === 'ur' || saved === 'en' ? saved : 'en') as Language;
  });

  useEffect(() => {
    // Set HTML lang and dir attributes on mount and language change
    const dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
    
    // Also set on body for better CSS support
    document.body.setAttribute('dir', dir);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
