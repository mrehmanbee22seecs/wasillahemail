/**
 * Language Switcher Component
 * Allows users to toggle between English and Urdu
 */

import React from 'react';
import { useTranslation } from '../i18n/config';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-600/10 hover:bg-navy-600/20 transition-colors duration-200 border border-navy-600/20"
      title={t('common.switchLanguage')}
      aria-label={t('common.switchLanguage')}
    >
      <Globe className="w-4 h-4 text-navy-600 dark:text-navy-400" />
      <span className="text-sm font-medium text-navy-600 dark:text-navy-400">
        {language === 'en' ? 'EN' : 'اردو'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
