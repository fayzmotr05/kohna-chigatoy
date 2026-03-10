export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createServerClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

async function getFeaturedItems(): Promise<MenuItem[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(6);
    return (data as MenuItem[]) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedItems();

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-bg-dark overflow-hidden">
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/80 via-bg-dark/60 to-bg-dark/90 z-10" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04] z-10" style={{
          backgroundImage: 'repeating-conic-gradient(var(--color-brown-light) 0% 25%, transparent 0% 50%)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream mb-4 leading-tight">
            Ko&apos;hna Chig&apos;atoy
          </h1>
          <p className="font-display text-xl sm:text-2xl text-brown-light mb-2 italic">
            Oilaviy Restoran
          </p>
          <p className="text-tan/80 text-base sm:text-lg mb-10 max-w-lg mx-auto">
            An&apos;anaviy o&apos;zbek oshxonasi. Eng mazali palov, kabob va milliy taomlar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-brown-deep text-cream px-8 py-3.5 rounded font-semibold text-base hover:bg-brown hover:shadow-lg transition-all duration-200"
            >
              Menyuni ko&apos;rish
            </Link>
            <a
              href="https://t.me/kohnachigatoy_bot"
              className="border border-brown-light text-brown-light px-8 py-3.5 rounded font-semibold text-base hover:border-tan hover:text-tan transition-all duration-200"
            >
              Telegram bot
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative bg-cream py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-conic-gradient(var(--color-brown-light) 0% 25%, transparent 0% 50%)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          {/* Heading accent */}
          <div className="flex justify-center mb-6">
            <div className="h-0.5 w-12 bg-tan" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep mb-6">
            Biz haqimizda
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed mb-4">
            Ko&apos;hna Chig&apos;atoy — Toshkent shahridagi an&apos;anaviy oilaviy restoran.
            Bizning taomlarimiz avloddan avlodga o&apos;tib kelgan retseptlar asosida tayyorlanadi.
          </p>
          <p className="text-text-secondary text-lg leading-relaxed">
            Har bir taom — bu o&apos;zbek oshxonasining boy merosiga hurmat va sevgi bilan
            tayyorlangan san&apos;at asari.
          </p>
        </div>
      </section>

      {/* Featured Dishes */}
      {featured.length > 0 && (
        <section className="bg-sand-light py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="h-0.5 w-12 bg-tan" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep mb-3">
                Tavsiya etamiz
              </h2>
              <p className="text-text-secondary">Eng mashhur va sevimli taomlarimiz</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((item) => (
                <div
                  key={item.id}
                  className="bg-white-warm border border-sand rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative h-48 bg-sand">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-brown-light">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 3c-1.5 0-2.5.5-3.5 1.5S7 6.5 7 8c0 2 1 3 2 4l1 1H9c-2 0-4 1-5 3v1h16v-1c-1-2-3-3-5-3h-1l1-1c1-1 2-2 2-4 0-1.5-.5-2.5-1.5-3.5S13.5 3 12 3z" />
                        </svg>
                      </div>
                    )}
                    {/* Star badge */}
                    <div className="absolute top-3 left-3 bg-tan/90 text-brown-deep px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Mashhur
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                      {item.categories?.name}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-brown-deep mb-1">
                      {item.name}
                    </h3>
                    <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    <p className="font-display text-lg font-bold text-brown-deep">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/menu"
                className="inline-block bg-brown-deep text-cream px-8 py-3 rounded font-semibold hover:bg-brown transition-colors"
              >
                To&apos;liq menyu
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Location */}
      <section id="location" className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="h-0.5 w-12 bg-tan" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-deep">
              Bizning manzil
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-sand flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-brown-deep mb-1">Manzil</h4>
                  <p className="text-text-secondary">Toshkent shahri, Chig&apos;atoy ko&apos;chasi</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-sand flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-brown-deep mb-1">Ish vaqti</h4>
                  <p className="text-text-secondary">Har kuni: 10:00 — 23:00</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-sand flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-brown-deep mb-1">Telefon</h4>
                  <p className="text-text-secondary">+998 XX XXX XX XX</p>
                </div>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="h-72 md:h-80 bg-sand rounded-lg flex items-center justify-center border border-sand">
              <div className="text-center text-text-secondary">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm">Google Maps</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
