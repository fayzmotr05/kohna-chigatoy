export interface Category {
  id: string;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  display_order: number;
  icon: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  model_usdz_url: string | null;
  model_glb_url: string | null;
  model_status: 'none' | 'processing' | 'ready' | 'failed';
  is_featured: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  categories?: Category;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  telegram_chat_id: number | null;
  items: OrderItem[];
  total: number;
  status: 'new' | 'confirmed' | 'preparing' | 'done' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  telegram_chat_id: number | null;
  date: string;
  time: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
