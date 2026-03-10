import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bg-dark text-text-on-dark">
      {/* Warm divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-brown-light to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl font-bold text-cream mb-3">
              Ko&apos;hna Chig&apos;atoy
            </h3>
            <p className="text-brown-light text-sm leading-relaxed">
              An&apos;anaviy o&apos;zbek oshxonasi. Oilaviy muhit, mazali taomlar.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-body text-sm font-semibold text-tan uppercase tracking-wider mb-3">
              Sahifalar
            </h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-brown-light hover:text-cream transition-colors text-sm">
                Bosh sahifa
              </Link>
              <Link href="/menu" className="text-brown-light hover:text-cream transition-colors text-sm">
                Menyu
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-sm font-semibold text-tan uppercase tracking-wider mb-3">
              Aloqa
            </h4>
            <div className="flex flex-col gap-2 text-sm text-brown-light">
              <p>Toshkent shahri</p>
              <p>+998 XX XXX XX XX</p>
              <p>Ish vaqti: 10:00 — 23:00</p>
              <a
                href="https://t.me/kohnachigatoy_bot"
                className="inline-flex items-center gap-1.5 text-tan hover:text-cream transition-colors mt-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.293c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.93z" />
                </svg>
                Telegram bot
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brown-light/20 text-center text-brown-light text-xs">
          &copy; {new Date().getFullYear()} Ko&apos;hna Chig&apos;atoy. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
