'use client';

import Link from 'next/link';
import { MapPin, Clock, Phone } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useTelegram } from '@/telegram/TelegramProvider';

export default function Footer() {
  const { t } = useTranslation();
  const { isTelegram } = useTelegram();

  // Hide footer in Telegram Mini App — redundant
  if (isTelegram) return null;

  return (
    <footer className="relative bg-bg-dark text-text-on-dark overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 pattern-geo opacity-[0.02]" />

      {/* Warm divider */}
      <div className="divider-warm" />

      <div className="relative mx-auto max-w-7xl 2xl:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            {/* Arch trio */}
            <div className="flex gap-[3px] mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-3 rounded-t-full bg-tan/40" />
              ))}
            </div>
            <h3 className="font-display text-xl font-bold text-cream mb-3">
              Ko&apos;hna Chig&apos;atoy
            </h3>
            <p className="text-brown-light/80 text-sm leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-body text-xs font-semibold text-tan uppercase tracking-[0.15em] mb-4">
              {t.footer.pages}
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/" className="text-brown-light/80 hover:text-cream transition-colors text-sm">
                {t.footer.home}
              </Link>
              <Link href="/menu" className="text-brown-light/80 hover:text-cream transition-colors text-sm">
                {t.footer.menu}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs font-semibold text-tan uppercase tracking-[0.15em] mb-4">
              {t.footer.contact}
            </h4>
            <div className="flex flex-col gap-3 text-sm text-brown-light/80">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-brown-light/50 shrink-0" />
                <span>{t.footer.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-brown-light/50 shrink-0" />
                <span>{t.footer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brown-light/50 shrink-0" />
                <span>{t.footer.hours}</span>
              </div>
              <a
                href="https://t.me/kohnachigatoy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-tan hover:text-cream transition-colors mt-1"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.293c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.93z" />
                </svg>
                {t.footer.telegramBot}
              </a>
              <a
                href="https://www.instagram.com/kohnachigatoy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-tan hover:text-cream transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                {t.footer.instagram}
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-brown-light/10">
          <div className="flex justify-center gap-[3px] mb-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-2.5 rounded-t-full bg-brown-light/20" />
            ))}
          </div>
          <p className="text-center text-brown-light/50 text-xs">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
