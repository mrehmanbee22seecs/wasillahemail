/**
 * i18n Configuration for Wasilah Platform
 * Supports English (LTR) and Urdu (RTL)
 */

import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import en from './locales/en.json';
import ur from './locales/ur.json';

export type Language = 'en' | 'ur';
export type TranslationKey = string;

export const languages = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' as const },
  ur: { name: 'Urdu', nativeName: 'اردو', dir: 'rtl' as const },
};

export const translations = {
  en,
  ur,
};

/**
 * Get translation for a key with fallback support
 */
export function getTranslation(
  lang: Language,
  key: string,
  fallback?: string
): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      break;
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  // Fallback to English if not found in current language
  if (lang !== 'en') {
    let englishValue: any = translations.en;
    for (const k of keys) {
      if (englishValue && typeof englishValue === 'object') {
        englishValue = englishValue[k];
      } else {
        break;
      }
    }
    if (typeof englishValue === 'string') {
      return englishValue;
    }
  }
  
  return fallback || key;
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  
  const { language, setLanguage } = context;
  const dir = languages[language].dir;
  const isRTL = dir === 'rtl';
  
  const t = (key: string, fallback?: string) => {
    return getTranslation(language, key, fallback);
  };
  
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  };
  
  return {
    t,
    language,
    changeLanguage,
    dir,
    isRTL,
  };
}

/**
 * Format date according to language
 */
export function formatDate(date: Date, lang: Language): string {
  const locale = lang === 'ur' ? 'ur-PK' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format number according to language
 */
export function formatNumber(num: number, lang: Language): string {
  const locale = lang === 'ur' ? 'ur-PK' : 'en-US';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format currency (PKR) according to language
 */
export function formatCurrency(amount: number, lang: Language): string {
  const locale = lang === 'ur' ? 'ur-PK' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'PKR',
  }).format(amount);
}
