'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Category, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import MenuCard from '@/components/MenuCard';
import ARViewer from '@/components/ARViewer';
import AROnboarding from '@/components/AROnboarding';
import Image from 'next/image';

interface Props {
  categories: Category[];
  items: MenuItem[];
}

export default function MenuPageClient({ categories, items }: Props) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [arItem, setArItem] = useState<MenuItem | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter items by search
  const filtered = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  // Group items by category
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: filtered.filter((i) => i.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  // Scroll spy — track which category is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute('data-category-id'));
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  // Scroll to category
  const scrollToCategory = (catId: string) => {
    const el = sectionRefs.current.get(catId);
    if (el) {
      const offset = 140; // nav + category bar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // AR handler
  const handleAR = useCallback((item: MenuItem) => {
    const seen = localStorage.getItem('ar_onboarding_seen');
    if (!seen) {
      setArItem(item);
      setShowOnboarding(true);
    } else {
      setArItem(item);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('ar_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleShowOnboardingManual = () => {
    setArItem(null);
    setShowOnboarding(true);
  };

  return (
    <>
      {/* Header */}
      <section className="bg-brown-deep pt-20 pb-8 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
              Menyu
            </h1>
            <div className="flex items-center gap-2">
              {/* AR info button */}
              <button
                onClick={handleShowOnboardingManual}
                className="text-brown-light hover:text-tan transition-colors text-sm flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                AR nima?
              </button>

              {/* View toggle */}
              <div className="flex bg-bg-dark rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-brown text-cream' : 'text-brown-light hover:text-cream'}`}
                  aria-label="Grid ko'rinish"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brown text-cream' : 'text-brown-light hover:text-cream'}`}
                  aria-label="List ko'rinish"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="2" rx="1" />
                    <rect x="3" y="11" width="18" height="2" rx="1" />
                    <rect x="3" y="18" width="18" height="2" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Taom qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded bg-bg-dark text-cream placeholder:text-brown-light/50 border border-brown/30 focus:border-tan focus:outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* Sticky category bar */}
      <div className="sticky top-16 z-30 bg-cream border-b border-sand shadow-sm">
        <div className="mx-auto max-w-7xl px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded text-sm font-medium transition-colors shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-tan text-brown-deep'
                    : 'text-text-secondary hover:text-brown-deep hover:bg-sand-light'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu content */}
      <section className="bg-cream py-8 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {grouped.length === 0 && (
            <div className="text-center py-20 text-text-secondary">
              <p className="text-lg">Hech narsa topilmadi</p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-2 text-brown underline text-sm"
                >
                  Qidiruvni tozalash
                </button>
              )}
            </div>
          )}

          {grouped.map(({ category, items: catItems }) => {
            const featured = catItems.find((i) => i.is_featured);
            const rest = featured
              ? catItems.filter((i) => i.id !== featured.id)
              : catItems;

            return (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(category.id, el);
                }}
                data-category-id={category.id}
                className="mb-12"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="font-display text-2xl font-bold text-brown-deep">
                    {category.name}
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-brown-light/30 to-transparent" />
                </div>

                {viewMode === 'grid' ? (
                  <>
                    {/* Featured hero card */}
                    {featured && (
                      <div className="mb-6 bg-white-warm border border-sand rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="relative h-56 md:h-auto bg-sand">
                            {featured.image_url ? (
                              <Image
                                src={featured.image_url}
                                alt={featured.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-brown-light/50">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                  <path d="M12 3c-1.5 0-2.5.5-3.5 1.5S7 6.5 7 8c0 2 1 3 2 4l1 1H9c-2 0-4 1-5 3v1h16v-1c-1-2-3-3-5-3h-1l1-1c1-1 2-2 2-4 0-1.5-.5-2.5-1.5-3.5S13.5 3 12 3z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="bg-tan/90 text-brown-deep px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                Mashhur
                              </span>
                              {featured.model_status === 'ready' && (
                                <span className="bg-brown-deep/90 text-tan px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                  </svg>
                                  AR
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-6 flex flex-col justify-center">
                            <h3 className="font-display text-2xl font-bold text-brown-deep mb-2">
                              {featured.name}
                            </h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                              {featured.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="font-display text-2xl font-bold text-brown-deep">
                                {formatPrice(featured.price)}
                              </p>
                              {featured.model_status === 'ready' && featured.model_glb_url && (
                                <button
                                  onClick={() => handleAR(featured)}
                                  className="bg-brown-deep text-tan px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 hover:bg-brown transition-colors"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                  </svg>
                                  AR ko&apos;rish
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {rest.map((item) => (
                        <MenuCard key={item.id} item={item} onAR={handleAR} />
                      ))}
                    </div>
                  </>
                ) : (
                  /* List view */
                  <div className="bg-white-warm border border-sand rounded-lg divide-y divide-sand">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-sand-light/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-brown-deep truncate">
                              {item.name}
                            </h3>
                            {item.is_featured && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-tan)" className="shrink-0">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-text-secondary text-sm truncate">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.model_status === 'ready' && item.model_glb_url && (
                            <button
                              onClick={() => handleAR(item)}
                              className="text-brown-deep text-xs font-semibold flex items-center gap-1 hover:text-brown transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                              AR
                            </button>
                          )}
                          <span className="font-display font-bold text-brown-deep whitespace-nowrap">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* AR Onboarding modal */}
      {showOnboarding && (
        <AROnboarding
          onComplete={() => {
            handleOnboardingComplete();
            // If there's a pending item, open its AR
          }}
          onSkip={() => {
            handleOnboardingComplete();
          }}
        />
      )}

      {/* AR Viewer modal */}
      {arItem && !showOnboarding && arItem.model_glb_url && (
        <ARViewer
          glbUrl={arItem.model_glb_url}
          usdzUrl={arItem.model_usdz_url}
          itemName={arItem.name}
          onClose={() => setArItem(null)}
        />
      )}
    </>
  );
}
