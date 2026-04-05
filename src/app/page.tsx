export const dynamic = 'force-dynamic';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import FeaturedSection from '@/components/FeaturedSection';
import LocationSection from '@/components/LocationSection';
import { createServerClient } from '@/lib/supabase';
import type { MenuItem } from '@/lib/types';

async function getFeaturedItems(): Promise<MenuItem[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name_uz, name_ru, name_en)')
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(6);
    if (error) throw error;
    return (data as MenuItem[]) || [];
  } catch (e) {
    console.error('Failed to fetch featured items:', e);
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedItems();

  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedSection items={featured} />
      <LocationSection />
      <Footer />
    </>
  );
}
