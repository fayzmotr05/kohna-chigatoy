'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { locales, localeNames } from '@/i18n/config';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-text-on-dark/80 hover:text-tan transition-colors text-sm font-medium"
        aria-label="Change language"
      >
        <Globe size={15} />
        {locale.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-bg-dark-soft border border-brown/20 rounded shadow-lg py-1 min-w-[140px] z-50">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                l === locale
                  ? 'text-tan font-semibold bg-brown/10'
                  : 'text-brown-light/80 hover:text-cream hover:bg-brown/10'
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
