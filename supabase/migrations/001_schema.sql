-- Ko'hna Chig'atoy — Full Database Schema
-- Run this in Supabase SQL Editor or via `supabase db push`

-- gen_random_uuid() is built into PostgreSQL 13+, no extension needed

-- ============================================================
-- Categories
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Menu items
-- ============================================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  model_usdz_url TEXT,
  model_glb_url TEXT,
  model_status TEXT NOT NULL DEFAULT 'none'
    CHECK (model_status IN ('none','processing','ready','failed')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  telegram_chat_id BIGINT,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','confirmed','preparing','done','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Bookings
-- ============================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  telegram_chat_id BIGINT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes (only what we actually query)
-- ============================================================
CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_menu_available ON menu_items(is_available);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_bookings_date ON bookings(date);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_menu_items BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orders BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_bookings BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public reads menu
CREATE POLICY "anyone reads categories" ON categories FOR SELECT USING (true);
CREATE POLICY "anyone reads available items" ON menu_items FOR SELECT USING (is_available = true);

-- All writes go through service_role (bot + API routes), which bypasses RLS.
-- These open policies are fallbacks for any anon-key writes (e.g., order/booking inserts).
CREATE POLICY "insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "read bookings" ON bookings FOR SELECT USING (true);

-- ============================================================
-- Storage — single media bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "public reads media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "anyone uploads media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "anyone deletes media" ON storage.objects
  FOR DELETE USING (bucket_id = 'media');
