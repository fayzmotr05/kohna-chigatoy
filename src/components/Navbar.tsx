'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ease-out ${
        scrolled ? 'bg-bg-dark-soft shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-display text-xl font-bold text-text-on-dark">
            Ko&apos;hna Chig&apos;atoy
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-text-on-dark hover:text-tan transition-colors text-sm font-medium">
              Bosh sahifa
            </Link>
            <Link href="/menu" className="text-text-on-dark hover:text-tan transition-colors text-sm font-medium">
              Menyu
            </Link>
            <a href="#about" className="text-text-on-dark hover:text-tan transition-colors text-sm font-medium">
              Biz haqimizda
            </a>
            <a href="#location" className="text-text-on-dark hover:text-tan transition-colors text-sm font-medium">
              Manzil
            </a>
            <Link
              href="/menu"
              className="bg-brown-deep text-cream px-5 py-2 rounded text-sm font-semibold hover:bg-brown transition-colors"
            >
              Band qilish
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-on-dark"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-dark-soft border-t border-brown-light/20 px-4 pb-4">
          <Link href="/" className="block py-3 text-text-on-dark hover:text-tan" onClick={() => setMobileOpen(false)}>
            Bosh sahifa
          </Link>
          <Link href="/menu" className="block py-3 text-text-on-dark hover:text-tan" onClick={() => setMobileOpen(false)}>
            Menyu
          </Link>
          <a href="#about" className="block py-3 text-text-on-dark hover:text-tan" onClick={() => setMobileOpen(false)}>
            Biz haqimizda
          </a>
          <a href="#location" className="block py-3 text-text-on-dark hover:text-tan" onClick={() => setMobileOpen(false)}>
            Manzil
          </a>
          <Link
            href="/menu"
            className="mt-2 block text-center bg-brown-deep text-cream px-5 py-2.5 rounded font-semibold"
            onClick={() => setMobileOpen(false)}
          >
            Band qilish
          </Link>
        </div>
      )}
    </nav>
  );
}
