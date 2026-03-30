'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Search, Grid3X3, List, Layers, Star, Box, SearchX, ShoppingBag, Plus,
} from 'lucide-react';
import type { Category, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import MenuCard from '@/components/MenuCard';
import PlaceholderImage from '@/components/PlaceholderImage';
import AROnboarding from '@/components/AROnboarding';
import { useTelegram } from '@/telegram/TelegramProvider';
import { useCart } from '@/telegram/CartProvider';
import CheckoutSheet from '@/telegram/CheckoutSheet';
import RegistrationGate from '@/telegram/RegistrationGate';
import BookingForm from '@/telegram/BookingForm';

// Category icon mapping — lucide-react, no emojis
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
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkout' | 'booking' | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { t } = useTranslation();
  const { isTelegram, isRegistered, webApp } = useTelegram();
  const { itemCount, total, addItem } = useCart();

  // Handle add-to-cart with registration gate
  const handleAddToCart = useCallback((item: MenuItem) => {
    if (!isRegistered) {
      setPendingAction('checkout');
      setShowRegistration(true);
      return;
    }
    addItem({ id: item.id, name: item.name, price: item.price });
    webApp?.HapticFeedback.impactOccurred('light');
  }, [isRegistered, addItem, webApp]);

  // After registration, complete the pending action
  const handleRegistered = useCallback(() => {
    setShowRegistration(false);
    if (pendingAction === 'checkout') {
      setShowCheckout(true);
    } else if (pendingAction === 'booking') {
      setShowBooking(true);
    }
    setPendingAction(null);
  }, [pendingAction]);

  // Handle ?action=book query param (from bot deep link)
  useEffect(() => {
    if (!isTelegram) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'book') {
      if (isRegistered) {
        setShowBooking(true);
      } else {
        setPendingAction('booking');
        setShowRegistration(true);
      }
    }
  }, [isTelegram, isRegistered]);

  // MainButton integration for cart
  useEffect(() => {
    if (!webApp || !isTelegram) return;
    if (itemCount > 0) {
      const priceText = Math.round(total).toLocaleString('uz-UZ').replace(/,/g, ' ');
      webApp.MainButton.setText(`${t.telegram.cart} (${itemCount}) — ${priceText} UZS`);
      webApp.MainButton.show();
      const handler = () => setShowCheckout(true);
      webApp.MainButton.onClick(handler);
      return () => webApp.MainButton.offClick(handler);
    } else {
      webApp.MainButton.hide();
    }
  }, [webApp, isTelegram, itemCount, total, t.telegram.cart]);

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

  // Scroll spy
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

  const scrollToCategory = (catId: string) => {
    const el = sectionRefs.current.get(catId);
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  /** Convert Supabase storage URL to our clean domain URL */
  const cleanModelUrl = useCallback((url: string): string => {
    const supabasePath = '/storage/v1/object/public/media/models/';
    const idx = url.indexOf(supabasePath);
    if (idx !== -1) {
      return `https://kohnachigatoy.uz/models/${url.substring(idx + supabasePath.length)}`;
    }
    return url;
  }, []);

  const launchNativeAR = useCallback((item: MenuItem) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    const tg = (window as any).Telegram?.WebApp;

    if (isIOS && item.model_usdz_url) {
      const url = cleanModelUrl(item.model_usdz_url) + '#allowsContentScaling=0';
      if (tg) {
        tg.openLink(url, { try_instant_view: false });
      } else {
        const a = document.createElement('a');
        a.rel = 'ar';
        a.href = url;
        const img = document.createElement('img');
        a.appendChild(img);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else if (isAndroidDevice && item.model_glb_url) {
      const glbUrl = cleanModelUrl(item.model_glb_url);
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
      if (tg) {
        tg.openLink(intentUrl, { try_instant_view: false });
      } else {
        window.location.href = intentUrl;
      }
    } else if (item.model_usdz_url) {
      const url = cleanModelUrl(item.model_usdz_url);
      if (tg) {
        tg.openLink(url, { try_instant_view: false });
      } else {
        window.open(url, '_blank');
      }
    } else if (item.model_glb_url) {
      const url = cleanModelUrl(item.model_glb_url);
      if (tg) {
        tg.openLink(url, { try_instant_view: false });
      } else {
        window.open(url, '_blank');
      }
    }
  }, [cleanModelUrl]);

  const handleAR = useCallback((item: MenuItem) => {
    const seen = localStorage.getItem('ar_onboarding_seen');
    if (!seen) {
      setArItem(item);
      setShowOnboarding(true);
      return;
    }
    launchNativeAR(item);
  }, [launchNativeAR]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('ar_onboarding_seen', 'true');
    setShowOnboarding(false);
    // After onboarding, launch AR directly
    if (arItem) {
      launchNativeAR(arItem);
      setArItem(null);
    }
  };

  const handleShowOnboardingManual = () => {
    setArItem(null);
    setShowOnboarding(true);
  };

  return (
    <>
      {/* Header */}
      <section className={`bg-bg-dark ${isTelegram ? 'pt-14 pb-6' : 'pt-20 pb-10'} px-4 relative overflow-hidden`}>
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(42,24,16,0.3)_0%,rgba(42,24,16,0.8)_100%)]" />
        <div className="absolute inset-0 pattern-geo opacity-[0.04]" />

        <div className="relative mx-auto max-w-[1800px]">
          {/* Arch motif — hidden in Telegram */}
          {!isTelegram && (
            <>
              <div className="flex justify-center gap-1 mb-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-3 h-5 rounded-t-full border border-brown-light/30" />
                ))}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-cream text-center mb-2">
                {t.menu.title}
              </h1>
              <p className="text-brown-light/60 text-center text-sm mb-8 font-medium tracking-wide">
                Ko&apos;hna Chig&apos;atoy
              </p>
            </>
          )}
          {isTelegram && (
            <h1 className="font-display text-2xl font-bold text-cream text-center mb-4">
              {t.menu.title}
            </h1>
          )}

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-6">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-light/50" />
            <input
              type="text"
              placeholder={t.menu.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-cream/10 text-cream placeholder:text-brown-light/40 border border-brown-light/20 focus:border-tan/50 focus:bg-cream/15 focus:outline-none text-sm transition-all backdrop-blur-sm"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleShowOnboardingManual}
              className="text-brown-light/60 hover:text-tan transition-colors text-xs flex items-center gap-1.5 uppercase tracking-wider font-medium"
            >
              <Layers size={14} />
              {t.menu.arWhat}
            </button>

            <div className="w-px h-4 bg-brown-light/20" />

            <div className="flex bg-cream/8 rounded-lg overflow-hidden border border-brown-light/15">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-tan/30 text-cream' : 'text-brown-light/50 hover:text-cream'}`}
                aria-label={t.menu.gridView}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-all ${viewMode === 'list' ? 'bg-tan/30 text-cream' : 'text-brown-light/50 hover:text-cream'}`}
                aria-label={t.menu.listView}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky category bar */}
      <div className={`sticky ${isTelegram ? 'top-12' : 'top-16'} z-30 bg-cream border-b border-sand/60 shadow-[0_2px_8px_rgba(61,33,23,0.04)]`}>
        <div className="mx-auto max-w-[1800px] px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded text-sm font-medium transition-all duration-200 shrink-0 flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? 'bg-tan/30 text-brown-deep shadow-sm'
                    : 'text-text-secondary hover:text-brown-deep hover:bg-sand-light/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu content */}
      <section className="bg-cream py-8 min-h-screen">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          {/* Empty state */}
          {grouped.length === 0 && (
            <div className="text-center py-24 text-text-secondary">
              <SearchX size={48} strokeWidth={1} className="mx-auto mb-4 text-brown-light/40" />
              <p className="text-lg font-medium mb-2">{t.menu.noResults}</p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-brown underline text-sm hover:text-brown-deep transition-colors"
                >
                  {t.menu.clearSearch}
                </button>
              )}
            </div>
          )}

          {grouped.map(({ category, items: catItems }) => {
            const featured = catItems.find((i) => i.is_featured);
            const rest = featured ? catItems.filter((i) => i.id !== featured.id) : catItems;

            return (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(category.id, el);
                }}
                data-category-id={category.id}
                className="mb-14"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-display text-2xl font-bold text-brown-deep">
                    {category.name}
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-brown-light/20 to-transparent" />
                </div>

                {viewMode === 'grid' ? (
                  <>
                    {/* Featured hero card */}
                    {featured && (
                      <div className="mb-6 bg-white-warm border border-sand/60 border-l-4 border-l-tan rounded-lg overflow-hidden hover:shadow-[0_8px_30px_rgba(61,33,23,0.08)] transition-all duration-200 group">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="relative h-56 md:h-auto md:min-h-[240px]">
                            {featured.image_url ? (
                              <Image
                                src={featured.image_url}
                                alt={featured.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <PlaceholderImage categoryName={featured.categories?.name} />
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="bg-white-warm/90 backdrop-blur-sm text-brown-deep px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                                <Star size={10} fill="currentColor" />
                                {t.menu.popular}
                              </span>
                              {featured.model_status === 'ready' && (
                                <span className="bg-brown-deep/90 backdrop-blur-sm text-tan px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                                  <Box size={10} />
                                  {t.menu.ar}
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
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-display text-2xl font-bold text-brown-deep">
                                {formatPrice(featured.price)}
                              </p>
                              <div className="flex items-center gap-2">
                                {featured.model_status === 'ready' && (featured.model_glb_url || featured.model_usdz_url) && (
                                  <button
                                    onClick={() => handleAR(featured)}
                                    className="bg-brown-deep text-tan px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 hover:bg-brown hover:shadow-[0_4px_20px_rgba(109,53,32,0.3)] transition-all duration-200"
                                  >
                                    <Box size={15} />
                                    {t.menu.arView}
                                  </button>
                                )}
                                {isTelegram && (
                                  <button
                                    onClick={() => handleAddToCart(featured)}
                                    className="w-10 h-10 rounded-full bg-brown-deep text-cream flex items-center justify-center hover:bg-brown transition-colors shadow-sm active:scale-95"
                                    aria-label={t.telegram.addToCart}
                                  >
                                    <Plus size={18} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {rest.map((item) => (
                        <MenuCard key={item.id} item={item} onAR={handleAR} onAddToCart={isTelegram ? handleAddToCart : undefined} />
                      ))}
                    </div>
                  </>
                ) : (
                  /* List view */
                  <div className="bg-white-warm border border-sand/60 rounded-lg divide-y divide-sand/40 overflow-hidden">
                    {catItems.map((item, i) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 px-4 py-3.5 hover:bg-sand-light/30 transition-colors ${
                          i % 2 === 1 ? 'bg-sand-light/10' : ''
                        }`}
                      >
                        {/* Mini thumbnail */}
                        <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <PlaceholderImage categoryName={item.categories?.name} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-brown-deep truncate">
                              {item.name}
                            </h3>
                            {item.is_featured && (
                              <Star size={13} fill="var(--color-tan)" className="text-tan shrink-0" />
                            )}
                          </div>
                          <p className="text-text-secondary text-sm truncate">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {item.model_status === 'ready' && (item.model_glb_url || item.model_usdz_url) && (
                            <button
                              onClick={() => handleAR(item)}
                              className="text-brown-deep text-xs font-semibold flex items-center gap-1 hover:text-brown transition-colors"
                            >
                              <Box size={13} />
                              AR
                            </button>
                          )}
                          <span className="font-display font-bold text-brown-deep whitespace-nowrap">
                            {formatPrice(item.price)}
                          </span>
                          {isTelegram && (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-7 h-7 rounded-full bg-brown-deep text-cream flex items-center justify-center hover:bg-brown transition-colors active:scale-95"
                              aria-label={t.telegram.addToCart}
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          )}
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
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      {/* AR now launches natively — no in-app viewer needed */}

      {/* Telegram-only: Floating cart button (fallback when MainButton not available) */}
      {isTelegram && itemCount > 0 && (
        <button
          onClick={() => {
            if (!isRegistered) {
              setPendingAction('checkout');
              setShowRegistration(true);
            } else {
              setShowCheckout(true);
            }
          }}
          className="fixed bottom-6 right-6 z-40 bg-brown-deep text-cream px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-brown transition-colors active:scale-95 sm:hidden"
        >
          <ShoppingBag size={18} />
          <span className="font-semibold">{itemCount}</span>
        </button>
      )}

      {/* Telegram-only: Checkout Sheet */}
      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          onNeedRegistration={() => {
            setShowCheckout(false);
            setPendingAction('checkout');
            setShowRegistration(true);
          }}
        />
      )}

      {/* Telegram-only: Registration Gate */}
      {showRegistration && (
        <RegistrationGate
          onClose={() => {
            setShowRegistration(false);
            setPendingAction(null);
          }}
          onRegistered={handleRegistered}
        />
      )}

      {/* Telegram-only: Booking Form */}
      {showBooking && (
        <BookingForm
          onClose={() => setShowBooking(false)}
          onNeedRegistration={() => {
            setShowBooking(false);
            setPendingAction('booking');
            setShowRegistration(true);
          }}
        />
      )}
    </>
  );
}
