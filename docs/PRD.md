# PRD — Ko'hna Chig'atoy Oilaviy Restoran
**Version:** 2.0 | **Date:** March 2026

---

## 1. Overview

Digital platform for "Ko'hna Chig'atoy" (Oilaviy Restoran):
- **Public website** — Landing page + menu with AR viewing
- **Admin panel** — Menu CRUD, orders/bookings management, dashboard with analytics
- **Telegram bot** — Browse menu, place orders, book tables
- **Backend** — Supabase (DB, Auth, Storage)

**Principle:** Simple, effective, no unnecessary layers.

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend + Admin | Next.js 14 (App Router), Tailwind CSS |
| AR | `<model-viewer>` web component (delegates to native iOS/Android AR) |
| 3D Processing | `gltf-transform` + `sharp` in Next.js API route |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Telegram Bot | Node.js + grammY (standalone process) |
| Deploy | Vercel (web) + Railway or VPS (bot) |

---

## 3. Public Website

### Landing Page
- Hero with restaurant name + tagline + hero image
- About section (short restaurant story)
- Featured dishes (from DB, `is_featured = true`)
- Location & hours with map
- Contact + Telegram bot link
- Footer

### Menu Page
- **Dual view mode**: Grid view (photo-forward cards) and List view (classic elegant menu)
- Grid view: each category's top dish gets a full-width featured hero card
- Sticky category bar that highlights on scroll, tap to smooth-scroll
- Each card with AR model shows "AR ko'rish" button directly on the card
- Search across name and description
- ~80-120 items across categories
- Badges: "Mashhur" (popular), "AR" on cards that have 3D models

### AR Viewer
- `<model-viewer>` opens native AR on each platform:
  - iOS → AR Quick Look (USDZ)
  - Android → Scene Viewer (GLB)
  - Desktop → 3D rotate/zoom preview (GLB)
- Lazy-loaded, shows spinner while model downloads

### AR Onboarding (first-time tutorial)
- First time a customer taps any AR button → 3-step tutorial modal:
  1. "AR rejim nima?" — explains the concept
  2. "Qanday ishlaydi?" — tap AR → camera opens → point at table
  3. "Aylantiring va kattalashtiring" — rotate, zoom, explore
- After tutorial → AR viewer opens automatically
- "AR nima?" button in header to replay tutorial anytime
- Tutorial remembered per browser (localStorage)

---

## 4. Admin Panel (Web)

The web admin panel is primarily for **dashboard analytics and monitoring**.
Menu CRUD is handled through the Telegram bot (see section 5).

### Auth
- Supabase email/password login
- All `/admin` routes behind auth guard

### Dashboard (home page)
- Today's stats: new orders, confirmed orders, bookings today
- This week / this month order totals (count + revenue in UZS)
- Recent orders list (last 10)
- Simple charts: orders per day (last 7 days), top items ordered

### Menu View (read + manage)
- Table view of all items (searchable, filterable by category)
- View details, toggle availability on/off
- 3D model upload + processing (USDZ → GLB) — easier to upload files via web than Telegram
- Note: Creating/editing menu item details (name, price, desc) is done via Telegram bot

### Orders
- Table: customer name, phone, items summary, total, status, time
- Status: **new → confirmed → preparing → done** (+ cancel from any state)
- Filter by status, date range

### Bookings
- Table: customer name, phone, date, time, party size, status
- Status: **pending → confirmed** (+ cancel from any state)
- Filter by date

---

## 5. Telegram Bot

The bot serves TWO audiences: customers AND admin. Admin commands are restricted
to authorized Telegram user IDs.

### Customer Commands

#### /start
Welcome message with 4 inline buttons:
- 📋 Menu — browse by category
- 🛒 Order — build cart, checkout
- 📅 Book — reserve a table
- ℹ️ Info — address, hours, phone

### Browse Menu
Category buttons → item list (name + price) → tap item → photo + description + price + "View in AR" website link

### Place Order
Pick category → pick items + quantity → view cart → checkout: name + phone → confirm → saved to DB → admin notified in Telegram group

### Book Table
Date → time → party size → name + phone → confirm → saved to DB → admin notified

### Admin Commands (restricted to admin Telegram IDs)

All menu CRUD is done through the bot. Admin sends commands, bot writes to Supabase.

#### Menu CRUD
- `/add` — Start adding a menu item (bot asks step by step: name → description → price → category → send photo → send 3D model optional → featured yes/no)
- `/edit` — Show categories → pick item → choose what to edit (name/price/photo/etc)
- `/delete` — Show categories → pick item → confirm delete (soft delete: sets `is_available = false`)
- `/toggle {item}` — Quick toggle item availability on/off

#### Category CRUD
- `/addcat` — Add new category (name + icon emoji)
- `/editcat` — Edit category name/order/icon
- `/deletecat` — Delete category (only if empty)

#### Order Management
- `/orders` — Show recent orders with status
- Inline buttons on order notifications: **Confirm / Cancel**
- `/orderstatus {id} {status}` — Quick status update

#### Booking Management
- `/bookings` — Show today's bookings
- Inline buttons on booking notifications: **Confirm / Cancel**

#### Quick Stats
- `/stats` — Today's order count + revenue + bookings count

### Admin Notifications
New orders/bookings sent to Telegram admin group with summary and confirm/cancel inline buttons.

---

## 6. 3D Model Pipeline

Light optimization only — quality preserved, no mesh changes.

1. Admin uploads USDZ (up to 200MB)
2. Server: convert USDZ → GLB, resize textures to max 2048px, re-encode as JPEG q90, strip unused data
3. Store optimized USDZ + GLB, keep original as backup
4. Show before/after size + 3D preview to admin

Typical: 50MB → 10-15MB, visually identical.
Per-item status: `none` / `processing` / `ready` / `failed`

---

## 7. Database

### `categories`
id (uuid PK), name, display_order (int), icon (text), created_at

### `menu_items`
id (uuid PK), category_id (FK), name, description, price (numeric), image_url, model_usdz_url, model_glb_url, model_status (text), is_featured (bool), is_available (bool), created_at, updated_at

### `orders`
id (uuid PK), customer_name, customer_phone, telegram_chat_id (bigint), items (jsonb), total (numeric), status (text: new/confirmed/preparing/done/cancelled), created_at, updated_at

### `bookings`
id (uuid PK), customer_name, customer_phone, telegram_chat_id (bigint), date, time, party_size (int), status (text: pending/confirmed/cancelled), notes, created_at, updated_at

---

## 8. Env Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=          # Group chat for notifications
TELEGRAM_ADMIN_USER_IDS=         # Comma-separated admin Telegram user IDs (for CRUD access)
NEXT_PUBLIC_SITE_URL=
```

---

## 9. Out of Scope

- Payment integration (staff confirms via phone)
- i18n framework (hardcoded Uzbek + English)
- Customer accounts on website
- Delivery tracking
- Loyalty program
