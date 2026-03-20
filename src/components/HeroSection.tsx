'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { useTranslation } from '@/i18n/LanguageContext';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-bg-dark overflow-hidden">
      {/* Vignette gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,24,16,0.4)_0%,rgba(42,24,16,0.85)_70%,rgba(42,24,16,0.95)_100%)] z-10" />
      {/* Subtle pattern */}
      <div className="absolute inset-0 pattern-geo opacity-[0.05] z-10" />

      <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
        {/* Decorative arch trio */}
        <ScrollReveal className="flex justify-center gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-6 rounded-t-full border border-brown-light/40"
            />
          ))}
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream mb-4 leading-tight tracking-tight">
            Ko&apos;hna Chig&apos;atoy
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="divider-warm max-w-[120px] mx-auto mb-4 opacity-60" />
          <p className="font-display text-xl sm:text-2xl text-brown-light mb-2 italic">
            {t.hero.subtitle}
          </p>
          <p className="text-tan/70 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            {t.hero.description}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-brown-deep text-cream px-8 py-3.5 rounded font-semibold text-base hover:bg-brown hover:shadow-[0_4px_20px_rgba(109,53,32,0.4)] transition-all duration-200"
            >
              {t.hero.viewMenu}
            </Link>
            <a
              href="https://t.me/kohnachigatoy"
              className="border border-brown-light/40 text-brown-light px-8 py-3.5 rounded font-semibold text-base hover:border-tan hover:text-tan transition-all duration-200"
            >
              {t.hero.telegram}
            </a>
          </div>
        </ScrollReveal>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown size={24} className="text-brown-light/40 animate-bounce-gentle" />
      </div>
    </section>
  );
}
