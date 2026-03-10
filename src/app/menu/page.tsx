export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import type { Category, MenuItem } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MenuPageClient from './MenuPageClient';

async function getMenuData() {
  try {
    const supabase = createServerClient();
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('is_available', true)
        .order('name'),
    ]);
    return {
      categories: (categoriesRes.data as Category[]) || [],
      items: (itemsRes.data as MenuItem[]) || [],
    };
  } catch {
    return { categories: [], items: [] };
  }
}

export const metadata = {
  title: "Menyu — Ko'hna Chig'atoy",
  description: "Ko'hna Chig'atoy menyusi. Palov, kabob, somsa va boshqa an'anaviy o'zbek taomlar.",
};

export default async function MenuPage() {
  const { categories, items } = await getMenuData();

  return (
    <>
      <Navbar />
      <MenuPageClient categories={categories} items={items} />
      <Footer />
    </>
  );
}
