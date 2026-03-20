'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import PlaceholderImage from './PlaceholderImage';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

interface FeaturedSectionProps {
  items: MenuItem[];
}

export default function FeaturedSection({ items }: FeaturedSectionProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <section className="bg-sand-light py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-14">
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-4 rounded-t-full bg-tan/50" />
            ))}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep mb-3">
            {t.featured.title}
          </h2>
          <p className="text-text-secondary">{t.featured.subtitle}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 80}>
              <div className="bg-white-warm border border-sand/60 rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(61,33,23,0.08)] transition-all duration-200 group">
                <div className="relative h-52">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <PlaceholderImage categoryName={item.categories?.name} />
                  )}
                  {/* Bottom gradient for depth */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
                  {/* Star badge */}
                  <div className="absolute top-3 left-3 bg-white-warm/90 backdrop-blur-sm text-brown-deep px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <Star size={11} fill="currentColor" />
                    {t.featured.popular}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1 font-medium">
                    {item.categories?.name}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-brown-deep mb-1.5">
                    {item.name}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-2 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="font-display text-xl font-bold text-brown-deep">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center mt-12">
          <Link
            href="/menu"
            className="inline-block bg-brown-deep text-cream px-8 py-3 rounded font-semibold hover:bg-brown hover:shadow-[0_4px_20px_rgba(109,53,32,0.3)] transition-all duration-200"
          >
            {t.featured.fullMenu}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
