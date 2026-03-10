# Architecture — Ko'hna Chig'atoy Oilaviy Restoran
**Version:** 2.0 | **Date:** March 2026

---

## 1. System Overview

```
  Browser / Mobile            Telegram Users
       │                           │
       ▼                           ▼
  Next.js (Vercel)          grammY Bot (VPS/Railway)
       │                           │
       └───────────┬───────────────┘
                   ▼
              Supabase
        (DB + Auth + Storage)
```

That's it. Three moving parts.

---

## 2. Project Structure

```
kohna-chigatoy/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── menu/page.tsx              # Public menu
│   │   ├── admin/
│   │   │   ├── layout.tsx             # Auth guard + sidebar
│   │   │   ├── page.tsx               # Dashboard (stats + charts)
│   │   │   ├── login/page.tsx
│   │   │   ├── menu/page.tsx          # Menu list view + toggle availability + 3D upload
│   │   │   ├── orders/page.tsx        # Orders list + status management
│   │   │   └── bookings/page.tsx      # Bookings list
│   │   └── api/
│   │       └── process-model/route.ts # USDZ → GLB conversion
│   │
│   ├── components/
│   │   ├── ARViewer.tsx               # model-viewer wrapper
│   │   ├── MenuCard.tsx               # Menu item card (public)
│   │   ├── DashboardStats.tsx         # Stats cards + charts
│   │   └── StatusBadge.tsx            # Order/booking status pill
│   │
│   └── lib/
│       ├── supabase.ts                # Single file: browser + server clients
│       ├── types.ts                   # DB types
│       └── utils.ts                   # Formatters, constants
│
├── bot/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                   # Entry point
│   │   ├── bot.ts                     # Bot setup + middleware (admin check)
│   │   ├── handlers/
│   │   │   ├── menu.ts                # Customer: browse menu callbacks
│   │   │   ├── order.ts               # Customer: order flow callbacks
│   │   │   ├── booking.ts             # Customer: booking flow callbacks
│   │   │   └── admin.ts               # Admin: CRUD commands (/add, /edit, /delete, etc.)
│   │   ├── middleware/
│   │   │   └── auth.ts                # Check if user is admin (by Telegram user ID)
│   │   └── supabase.ts                # Bot's Supabase client (service_role key)
│   └── .env.example
│
├── supabase/
│   ├── migrations/
│   │   └── 001_schema.sql
│   └── seed.sql
│
├── public/images/
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.local.example
```

**~25 files total.** No hooks folder, no utils folder tree, no UI primitives library. Components are flat — if you need a button, use Tailwind classes directly or shadcn/ui.

---

## 3. Key Decisions

### Next.js
- Public pages (landing, menu): **SSR** for SEO
- Admin pages: **client-side** with `'use client'`
- One API route: `/api/process-model` for 3D conversion
- No separate backend server needed

### Supabase — One Backend, One Bucket
- **PostgreSQL** for all data
- **Auth** for admin login (email/password)
- **Storage** — single `media` bucket with folder structure:
  ```
  media/
  ├── images/{item_id}.webp
  ├── models/original/{item_id}.usdz
  ├── models/usdz/{item_id}.usdz      (optimized)
  └── models/glb/{item_id}.glb         (optimized)
  ```
- **RLS**: public read on menu + categories, authenticated write on everything

### AR with `<model-viewer>`
```html
<model-viewer
  src="model.glb"
  ios-src="model.usdz"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  loading="lazy"
/>
```
- iOS → hands off to AR Quick Look (native)
- Android → hands off to Scene Viewer (native)
- Desktop → 3D spin preview in browser
- No custom AR code needed

### Telegram Bot
- **Standalone Node.js process** — not inside Next.js
- Uses **grammY** with **callback queries** (inline buttons) — no conversations plugin needed
- Cart state held in a simple `Map<chatId, CartData>` in memory
- All DB reads/writes go through Supabase JS client with **service_role key**
- **Two modes**: customer (anyone) and admin (restricted by Telegram user ID)

### Bot ↔ Supabase Connection

```typescript
// bot/src/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Uses service_role key — bypasses RLS, full DB access
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Bot writes to Supabase:**
| Bot Action | Supabase Operation |
|------------|-------------------|
| `/add` (admin) | `supabase.from('menu_items').insert(...)` |
| `/edit` (admin) | `supabase.from('menu_items').update(...)` |
| `/delete` (admin) | `supabase.from('menu_items').update({ is_available: false })` |
| `/addcat` (admin) | `supabase.from('categories').insert(...)` |
| Browse menu (customer) | `supabase.from('menu_items').select(...)` |
| Place order (customer) | `supabase.from('orders').insert(...)` |
| Book table (customer) | `supabase.from('bookings').insert(...)` |
| Confirm order (admin) | `supabase.from('orders').update({ status: 'confirmed' })` |
| Photo upload (admin) | `supabase.storage.from('media').upload(...)` |

**Admin auth middleware:**
```typescript
// bot/src/middleware/auth.ts
const ADMIN_IDS = process.env.TELEGRAM_ADMIN_USER_IDS!
  .split(',').map(id => parseInt(id.trim()));

export function isAdmin(ctx) {
  return ADMIN_IDS.includes(ctx.from?.id);
}
```

---

## 4. Database

### Full Schema SQL

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes (only what we actually query)
CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_bookings_date ON bookings(date);

-- Auto-update updated_at
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
```

### RLS (Row Level Security)

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public reads menu
CREATE POLICY "anyone reads categories" ON categories FOR SELECT USING (true);
CREATE POLICY "anyone reads available items" ON menu_items FOR SELECT USING (is_available = true);

-- Admin does everything
CREATE POLICY "admin all categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin all menu_items" ON menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin all orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin all bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');

-- Bot inserts orders/bookings (via service_role, bypasses RLS anyway)
CREATE POLICY "insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "insert bookings" ON bookings FOR INSERT WITH CHECK (true);
```

### Storage

```sql
-- Single bucket, public read
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "public reads media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "admin uploads media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "admin deletes media" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
```

---

## 5. 3D Model Pipeline

Simple and light:

```
Admin uploads .usdz
       │
       ▼
  POST /api/process-model
       │
       ├─ Save original to media/models/original/{id}.usdz
       │
       ├─ Convert USDZ → GLB (usd2gltf)
       │
       ├─ Light optimize with gltf-transform:
       │    • textureResize(2048)   — cap oversized textures
       │    • re-encode JPEG q90    — near-lossless, big savings
       │    • dedup() + prune()     — strip junk
       │    • NO mesh changes
       │
       ├─ Save optimized GLB → media/models/glb/{id}.glb
       ├─ Save optimized USDZ → media/models/usdz/{id}.usdz
       │
       └─ Update menu_item: urls + model_status = 'ready'
```

Tools: `@gltf-transform/functions`, `sharp`, `usdz-parser`

---

## 6. Telegram Bot Design

### Two audiences, one bot

The bot checks `ctx.from.id` against `TELEGRAM_ADMIN_USER_IDS` to determine access level.
Customer commands work for everyone. Admin commands are silently ignored for non-admins.

### Customer Flows (callback-based)

```
/start → Main Menu (inline buttons)
  │
  ├── 📋 Menu
  │     └── callback: cat_{id} → items list → item_{id} → detail + photo
  │
  ├── 🛒 Order
  │     └── callback: cat_{id} → add_{id} → qty → cart summary
  │           └── checkout → ask name (text) → ask phone (text) → confirm
  │                 └── save to DB → notify admin group
  │
  ├── 📅 Book
  │     └── ask date (text) → time (text) → party size (text)
  │           └── name + phone → confirm → save to DB → notify admin
  │
  └── ℹ️ Info → address, hours, phone
```

### Admin Flows (command-based, restricted)

```
/add → Menu CRUD
  Bot: "Taom nomini yozing:"
  Admin: "Toshkent Palovi"
  Bot: "Tavsifini yozing:"
  Admin: "An'anaviy toshkent palovi, qo'y go'shti bilan"
  Bot: "Narxini yozing (UZS):"
  Admin: "55000"
  Bot: [Show category buttons]
  Admin: [Taps "Palov"]
  Bot: "Taom rasmini yuboring:"
  Admin: [Sends photo]
  Bot: "3D model (USDZ) yuboring yoki /skip:"
  Admin: /skip
  Bot: "Tavsiya etiladimi?"  [Ha] [Yo'q]
  Admin: [Ha]
  Bot: "✅ Toshkent Palovi menyuga qo'shildi! (55,000 UZS)"
  → supabase.from('menu_items').insert(...)
  → supabase.storage.from('media').upload(photo)

/edit → Pick item → Pick field → Enter new value
  Bot: [Category buttons]
  Admin: [Taps category → taps item]
  Bot: "Nimani o'zgartirmoqchisiz?"
       [Nom] [Tavsif] [Narx] [Rasm] [Kategoriya] [Tavsiya]
  Admin: [Taps "Narx"]
  Bot: "Yangi narxni yozing:"
  Admin: "60000"
  Bot: "✅ Narx yangilandi: 55,000 → 60,000 UZS"
  → supabase.from('menu_items').update(...)

/delete → Pick item → Confirm
  Bot: [Category buttons → item list]
  Admin: [Taps item]
  Bot: "Toshkent Palovini o'chirmoqchimisiz?"  [Ha] [Yo'q]
  Admin: [Ha]
  Bot: "✅ O'chirildi (menyudan yashirildi)"
  → supabase.from('menu_items').update({ is_available: false })

/addcat → Name + icon
/editcat → Pick → edit
/deletecat → Pick → confirm (blocked if items exist)

/orders → Recent orders list with status
/bookings → Today's bookings
/stats → Quick numbers (today's orders, revenue, bookings)
```

### Admin Notification Format

```
🆕 Yangi buyurtma #1234

👤 Aziz Karimov | 📞 +998 90 123 4567

• Plov Toshkent x2 — 90,000
• Somsa x4 — 40,000
• Choy x2 — 16,000

💰 146,000 UZS

[✅ Tasdiqlash]  [❌ Bekor qilish]
```

---

## 7. Admin Dashboard Queries

The dashboard needs these numbers — all simple SQL aggregates:

```sql
-- Today's orders by status
SELECT status, COUNT(*), SUM(total) FROM orders
WHERE created_at::date = CURRENT_DATE GROUP BY status;

-- Today's bookings
SELECT COUNT(*) FROM bookings WHERE date = CURRENT_DATE;

-- Orders per day (last 7 days)
SELECT created_at::date as day, COUNT(*), SUM(total) FROM orders
WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY day ORDER BY day;

-- Top ordered items (last 30 days) — parse from JSONB
SELECT item->>'name' as name, SUM((item->>'qty')::int) as total_qty
FROM orders, jsonb_array_elements(items) as item
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY name ORDER BY total_qty DESC LIMIT 10;

-- This month revenue
SELECT COUNT(*), SUM(total) FROM orders
WHERE created_at > date_trunc('month', NOW()) AND status != 'cancelled';
```

Charts rendered with **recharts** (already available in Next.js/React ecosystem). Nothing custom.

---

## 8. Deployment

```
Vercel (free tier works)          VPS / Railway
  │                                  │
  │  Next.js app                     │  Bot process
  │  - Public pages                  │  - grammY long-polling
  │  - Admin panel                   │  - or webhook mode
  │  - /api/process-model            │
  │                                  │
  └──────────┬───────────────────────┘
             ▼
         Supabase (managed)
```

### Getting Started
```bash
# 1. Setup
npx create-next-app@latest kohna-chigatoy --typescript --tailwind --app
cd kohna-chigatoy
npm install @supabase/supabase-js

# 2. Bot (separate folder)
cd bot && npm init -y && npm install grammy @supabase/supabase-js

# 3. Env
cp .env.local.example .env.local   # fill in keys

# 4. DB
npx supabase db push               # run migrations

# 5. Dev
npm run dev                         # Next.js :3000
cd bot && npx ts-node src/index.ts  # Bot
```

---

## 9. Implementation Order for Claude Code

1. **Project init** — Next.js + Tailwind + Supabase client setup
2. **DB migration** — Run the schema SQL above
3. **Telegram bot base** — grammY setup, /start, admin middleware (check user ID)
4. **Bot: menu CRUD** — /add, /edit, /delete, /addcat commands → Supabase writes
5. **Bot: customer menu** — Browse menu by category via inline buttons
6. **Bot: order flow** — Cart, checkout, save to Supabase, notify admin group
7. **Bot: booking flow** — Date/time/party, save to Supabase, notify admin
8. **Bot: admin actions** — /orders, /bookings, /stats, confirm/cancel inline buttons
9. **Public site** — Landing page → Menu page with categories + search
10. **AR** — model-viewer component + /api/process-model endpoint
11. **Admin web auth** — Login page + layout guard
12. **Admin dashboard** — Stats cards + charts (recharts)
13. **Admin web: orders + bookings** — Tables with status buttons
14. **Admin web: menu view** — Read-only list + toggle availability + 3D model upload
15. **Polish** — Responsive, loading states, error handling

### Code Rules
- TypeScript, but don't over-type — `any` is fine for quick iterations
- Server Components by default, `'use client'` only when interactive
- Tailwind directly on elements — no component library unless shadcn/ui speeds things up
- Prices in UZS as `numeric(10,2)`
- camelCase in JS, snake_case in DB

---

## 10. Complete Data Flow: Admin → Supabase → Website

### How a new dish goes from admin to customer screen

```
ADMIN (via Telegram bot)                    ADMIN (via Web Panel)
         │                                           │
    /add command                              Upload 3D model
         │                                           │
    Bot walks through:                      POST /api/process-model
    name → desc → price                             │
    → category → photo                    Optimize USDZ → GLB
    → featured? → confirm                  Upload to storage
         │                                           │
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│                                                              │
│  menu_items table ← INSERT/UPDATE                            │
│  media bucket ← image upload / 3D model upload               │
│                                                              │
│  RLS: public reads available items                           │
│  Bot uses service_role (bypasses RLS)                        │
│  Web admin uses authenticated session                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
              Immediate effect
              (no cache, no delay)
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC WEBSITE                             │
│                                                              │
│  Menu page fetches:                                          │
│  supabase.from('menu_items')                                 │
│    .select('*, categories(*)')                               │
│    .eq('is_available', true)                                 │
│                                                              │
│  New dish appears instantly on next page load / refresh      │
│  Images served from Supabase Storage CDN                     │
│  3D models loaded by <model-viewer> on AR button tap         │
└─────────────────────────────────────────────────────────────┘
```

### CRUD Responsibility Split

| Action | Where | Why |
|--------|-------|-----|
| Add menu item (name, desc, price, photo) | Telegram Bot | Quick, mobile-friendly, admin is often in restaurant |
| Edit menu item details | Telegram Bot | Same reason — quick edits on the go |
| Delete / hide item | Telegram Bot + Web | Bot: `/delete`. Web: toggle switch |
| Upload 3D model (USDZ) | Web Panel only | File too large for Telegram, needs processing pipeline |
| View order list + change status | Web Panel + Bot | Web: full table with filters. Bot: quick confirm/cancel |
| View bookings + change status | Web Panel + Bot | Same as orders |
| Dashboard analytics + charts | Web Panel only | Needs charts, tables, date ranges — not suited for Telegram |
| Category management | Telegram Bot | Simple /addcat, /editcat, /deletecat |

### Admin Web Panel — Page by Page

#### `/admin` — Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Sidebar        │  Dashboard                         │
│                 │                                    │
│  📊 Dashboard  │  ┌──────┐ ┌──────┐ ┌──────┐       │
│  🍽️ Menyu      │  │Orders│ │Revenue│ │Booking│      │
│  📦 Buyurtmalar│  │today │ │today  │ │today  │      │
│  📅 Bandlar    │  └──────┘ └──────┘ └──────┘       │
│                 │                                    │
│                 │  [Orders per day — 7 day chart]    │
│                 │                                    │
│                 │  [Top 10 items — bar chart]        │
│                 │                                    │
│                 │  Recent Orders                     │
│                 │  ┌─────────────────────────────┐   │
│                 │  │ #1234 Aziz  55,000 ● New   │   │
│                 │  │ #1233 Dima 120,000 ● Done  │   │
│                 │  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Data source — all Supabase queries:
```typescript
// Stats cards
const todayOrders = await supabase.from('orders')
  .select('status, total').gte('created_at', today);

const todayBookings = await supabase.from('bookings')
  .select('id').eq('date', today);

// Chart: orders per day
const weekOrders = await supabase.rpc('orders_per_day', { days: 7 });

// Top items (from JSONB)
const topItems = await supabase.rpc('top_ordered_items', { days: 30 });
```

#### `/admin/menu` — Menu View
```
┌─────────────────────────────────────────────────────┐
│  [Search: ________]  [Filter: All categories ▼]     │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 📷  Toshkent Palovi  │ Palov  │ 55,000 │ ● On │ │
│  │     3D: ✅ Ready      │        │        │[Toggle]│ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 📷  Lag'mon           │ Sho'rva│ 42,000 │ ● On │ │
│  │     3D: ❌ None       │        │        │[Toggle]│ │
│  │     [Upload USDZ ↑]  │        │        │       │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 📷  Tandir Kabob      │ Kabob  │ 75,000 │ ● Off│ │
│  │     3D: ⏳ Processing │        │        │[Toggle]│ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

Features:
- View all items (search + filter by category)
- Toggle `is_available` on/off (instant Supabase update)
- Upload USDZ → triggers `/api/process-model` → shows processing status
- View 3D model status: none / processing / ready / failed
- NO create/edit forms — that's done via Telegram bot

#### `/admin/orders` — Orders Management
```
┌─────────────────────────────────────────────────────┐
│  Filter: [All ▼] [Today ▼]              [↻ Refresh] │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ #1234 │ Aziz K.     │ 146,000 │ ● NEW          ││
│  │       │ +998 90 123 │ 3 items │ [Confirm][Cancel]││
│  ├──────────────────────────────────────────────────┤│
│  │ #1233 │ Dima P.     │  55,000 │ ● CONFIRMED    ││
│  │       │ +998 91 456 │ 1 item  │ [Preparing]     ││
│  ├──────────────────────────────────────────────────┤│
│  │ #1232 │ Sardor M.   │ 230,000 │ ● PREPARING    ││
│  │       │ +998 93 789 │ 5 items │ [Done]          ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Click row → expand to see full item list            │
└─────────────────────────────────────────────────────┘
```

Status flow: `new → confirmed → preparing → done` (+ cancel from any)
Each status change: `supabase.from('orders').update({ status }).eq('id', orderId)`

#### `/admin/bookings` — Bookings Management
Same pattern as orders but simpler: `pending → confirmed` (+ cancel)

### Admin Panel — Supabase Auth Flow

```typescript
// Login page
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

// Admin layout guard (runs on every /admin/* page)
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect('/admin/login');

// Middleware (server-side, catches before page renders)
// src/middleware.ts
export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    const session = await getSession(request);
    if (!session) return NextResponse.redirect('/admin/login');
  }
}
```

---

## 11. Menu Page — AR Onboarding UX

First time a customer taps an AR button, show a 3-step tutorial:

```
Step 1: "AR rejim nima?"
  → Taomni 3D ko'rinishda telefoningiz kamerasi orqali
    o'z stolingizda ko'ring — xuddi haqiqiyday!

Step 2: "Qanday ishlaydi?"
  → "AR ko'rish" tugmasini bosing. Kamera ochiladi —
    telefonni stolga qarating va taom paydo bo'ladi.

Step 3: "Aylantiring va kattalashtiring"
  → Barmog'ingiz bilan taomni aylantiring,
    kattalashtiring yoki kichiklashtiring.
```

Implementation:
- Store `ar_onboarding_seen` in localStorage
- First AR tap → show onboarding → then open AR viewer
- "AR nima?" button always visible in header to replay tutorial
- Tutorial is a simple modal with 3 steps, prev/next, skip button

