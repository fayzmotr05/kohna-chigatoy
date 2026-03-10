import type { Metadata } from 'next';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
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
    "Toshkentdagi an'anaviy o'zbek oshxonasi. Palov, kabob, somsa va boshqa milliy taomlar.",
  keywords: [
    "Ko'hna Chig'atoy",
    "restoran",
    "Toshkent",
    "o'zbek oshxonasi",
    "palov",
    "kabob",
    "somsa",
    "oilaviy restoran",
  ],
  openGraph: {
    title: "Ko'hna Chig'atoy — Oilaviy Restoran",
    description:
      "Toshkentdagi an'anaviy o'zbek oshxonasi. Palov, kabob, somsa va boshqa milliy taomlar.",
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
  description: "An'anaviy o'zbek oilaviy restoran",
  servesCuisine: 'Uzbek',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Toshkent',
    addressCountry: 'UZ',
  },
  openingHours: 'Mo-Su 10:00-23:00',
  priceRange: '$$',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${playfair.variable} ${sourceSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
