'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, UtensilsCrossed, Info, MapPin, CalendarCheck } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useTelegram } from '@/telegram/TelegramProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { isTelegram } = useTelegram();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Minimal Telegram header — restaurant name + language switcher only
  if (isTelegram) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark-soft/95 backdrop-blur-sm shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-12 items-center justify-between">
            <span className="font-display text-lg font-bold text-text-on-dark">
              Ko&apos;hna Chig&apos;atoy
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        scrolled || mobileOpen
          ? 'bg-bg-dark-soft/95 backdrop-blur-sm shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Arch trio motif */}
            <div className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-3 rounded-t-full bg-tan/70 group-hover:bg-tan transition-colors duration-200"
                />
              ))}
            </div>
            <span className="font-display text-xl font-bold text-text-on-dark">
              Ko&apos;hna Chig&apos;atoy
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-text-on-dark/80 hover:text-tan transition-colors text-sm font-medium">
              {t.nav.home}
            </Link>
            <Link href="/menu" className="text-text-on-dark/80 hover:text-tan transition-colors text-sm font-medium">
              {t.nav.menu}
            </Link>
            <Link href="/#about" className="text-text-on-dark/80 hover:text-tan transition-colors text-sm font-medium">
              {t.nav.about}
            </Link>
            <Link href="/#location" className="text-text-on-dark/80 hover:text-tan transition-colors text-sm font-medium">
              {t.nav.location}
            </Link>
            <LanguageSwitcher />
            <Link
              href="/menu"
              className="bg-brown-deep text-cream px-5 py-2 rounded text-sm font-semibold hover:bg-brown hover:shadow-[0_4px_20px_rgba(109,53,32,0.3)] transition-all duration-200"
            >
              {t.nav.booking}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-on-dark p-1"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — always rendered, animated via CSS */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-bg-dark-soft border-t border-brown-light/10 px-4 pb-5 pt-2">
          <Link href="/" className="flex items-center gap-3 py-3 text-text-on-dark/90 hover:text-tan transition-colors" onClick={() => setMobileOpen(false)}>
            <Home size={16} className="text-brown-light" />
            {t.nav.home}
          </Link>
          <Link href="/menu" className="flex items-center gap-3 py-3 text-text-on-dark/90 hover:text-tan transition-colors" onClick={() => setMobileOpen(false)}>
            <UtensilsCrossed size={16} className="text-brown-light" />
            {t.nav.menu}
          </Link>
          <Link href="/#about" className="flex items-center gap-3 py-3 text-text-on-dark/90 hover:text-tan transition-colors" onClick={() => setMobileOpen(false)}>
            <Info size={16} className="text-brown-light" />
            {t.nav.about}
          </Link>
          <Link href="/#location" className="flex items-center gap-3 py-3 text-text-on-dark/90 hover:text-tan transition-colors" onClick={() => setMobileOpen(false)}>
            <MapPin size={16} className="text-brown-light" />
            {t.nav.location}
          </Link>
          <div className="flex items-center justify-between mt-3 mb-3 px-1">
            <LanguageSwitcher />
          </div>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 bg-brown-deep text-cream px-5 py-2.5 rounded font-semibold hover:bg-brown transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <CalendarCheck size={16} />
            {t.nav.booking}
          </Link>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 bg-bg-dark/70 md:hidden -z-10"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </nav>
  );
}
