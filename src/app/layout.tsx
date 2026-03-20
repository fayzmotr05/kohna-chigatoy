import type { Metadata } from 'next';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { TelegramProvider } from '@/telegram/TelegramProvider';
import { CartProvider } from '@/telegram/CartProvider';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-source-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Ko'hna Chig'atoy — Oilaviy Restoran",
    template: "%s | Ko'hna Chig'atoy",
  },
  description:
    "Toshkentdagi oilaviy restoran. Milliy va uyg'ur taomlar — palov, lag'mon, kabob, somsa va boshqalar.",
  keywords: [
    "Ko'hna Chig'atoy",
    "restoran",
    "Toshkent",
    "o'zbek oshxonasi",
    "uyg'ur taomlar",
    "milliy taomlar",
    "palov",
    "lag'mon",
    "kabob",
    "somsa",
    "oilaviy restoran",
    "Chig'atoy",
  ],
  openGraph: {
    title: "Ko'hna Chig'atoy — Oilaviy Restoran",
    description:
      "Toshkentdagi oilaviy restoran. Milliy va uyg'ur taomlar — palov, lag'mon, kabob, somsa va boshqalar.",
    type: 'website',
    locale: 'uz_UZ',
    siteName: "Ko'hna Chig'atoy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Restaurant structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: "Ko'hna Chig'atoy",
  description: "Toshkentdagi oilaviy restoran. Milliy va uyg'ur taomlar.",
  servesCuisine: ['Uzbek', 'Uyghur'],
  telephone: '+998992220909',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Matlubot 17',
    addressLocality: 'Toshkent',
    addressCountry: 'UZ',
  },
  openingHours: 'Mo-Su 10:00-23:00',
  priceRange: '$$',
  url: 'https://kohnachigatoy.uz',
  sameAs: [
    'https://t.me/kohnachigatoy',
    'https://www.instagram.com/kohnachigatoy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${playfair.variable} ${sourceSans.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <TelegramProvider>
          <CartProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </CartProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
