'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from './config';
import { defaultLocale } from './config';
import { uz } from './translations/uz';
import { ru } from './translations/ru';
import { en } from './translations/en';
import type { TranslationKeys } from './translations/uz';

const translations: Record<Locale, TranslationKeys> = { uz, ru, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: uz,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document !== 'undefined') {
      // 1. Check cookie (highest priority — user's explicit choice)
      const match = document.cookie.match(/locale=(uz|ru|en)/);
      if (match) return match[1] as Locale;
      // 2. Check localStorage
      const stored = localStorage.getItem('locale');
      if (stored === 'uz' || stored === 'ru' || stored === 'en') return stored;
      // 3. Auto-detect from Telegram language_code (first visit only)
      const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      if (tgLang) {
        if (tgLang.startsWith('ru')) return 'ru';
        if (tgLang.startsWith('en')) return 'en';
      }
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
