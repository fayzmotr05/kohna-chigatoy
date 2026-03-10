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
  title: "Ko'hna Chig'atoy — Oilaviy Restoran",
  description:
    "Toshkentdagi an'anaviy o'zbek oshxonasi. Palov, kabob, somsa va boshqa milliy taomlar.",
  openGraph: {
    title: "Ko'hna Chig'atoy — Oilaviy Restoran",
    description:
      "Toshkentdagi an'anaviy o'zbek oshxonasi. Palov, kabob, somsa va boshqa milliy taomlar.",
    type: 'website',
    locale: 'uz_UZ',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
