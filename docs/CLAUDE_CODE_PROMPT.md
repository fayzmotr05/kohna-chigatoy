# CLAUDE CODE — Ko'hna Chig'atoy Build Instructions

You are building the complete digital platform for Ko'hna Chig'atoy, an Uzbek family restaurant in Tashkent. Read ALL reference docs before starting any work.

## Reference Documents (read these first)
- `docs/PRD.md` — What to build (features, requirements, database schema)
- `docs/ARCHITECTURE.md` — How to build it (project structure, tech decisions, SQL, bot flows, admin panel specs, data flow)
- `docs/DESIGN_SYSTEM.md` — Visual design (colors, fonts, components, layouts, do's and don'ts)

## System Overview

Three deployable parts, one Supabase backend:
1. **Next.js app** (Vercel) — public website (landing + menu with AR) + admin panel (dashboard, orders, bookings, menu view)
2. **Telegram bot** (standalone Node.js) — customer menu/ordering/booking + admin CRUD commands
3. **Supabase** — PostgreSQL, Auth, Storage (already provisioned by client)

## Tech Stack
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Supabase JS client (`@supabase/supabase-js`)
- `<model-viewer>` for AR (loaded via script tag, not npm)
- grammY for Telegram bot
- recharts for admin dashboard charts
- sharp + @gltf-transform/functions for 3D model optimization

## Design Palette (from DESIGN_SYSTEM.md)
```
--brown-deep: #6D3520    (headings, nav, primary)
--brown: #8B4A2B         (links, secondary)
--brown-light: #C49A7E   (accents)
--tan: #D4B896           (buttons, highlights, active states)
--sand: #E8D5C0          (borders, card backgrounds)
--cream: #FAF6F0         (page background)
--text-primary: #3D2117  (body text — warm, NOT pure black)
--bg-dark: #2A1810       (footer, hero, dark sections)
```
Fonts: Playfair Display (headings, prices) + Source Sans 3 (body). Never use generic fonts.

## Build Phases — Execute in Order

### Phase 1: Project Setup
```bash
npx create-next-app@latest kohna-chigatoy --typescript --tailwind --app --src-dir
cd kohna-chigatoy
npm install @supabase/supabase-js
```
- Configure `tailwind.config.js` with the design system colors
- Set up `.env.local.example` with all required env vars (see PRD section 8)
- Create `src/lib/supabase.ts` — browser client + server client in one file
- Create `src/lib/types.ts` — TypeScript types matching the DB schema
- Create `src/lib/utils.ts` — price formatter (UZS with spaces), date formatter
- Create `src/middleware.ts` — protect /admin routes, redirect to /admin/login

### Phase 2: Database Migration
Create `supabase/migrations/001_schema.sql` with the FULL SQL from ARCHITECTURE.md section 4:
- 4 tables: categories, menu_items, orders, bookings
- Indexes on category, status, date
- updated_at triggers
- RLS policies (public reads menu, admin writes all)
- Storage bucket: single `media` bucket (public read)
- Create `supabase/seed.sql` with 6 sample categories and 15-20 sample menu items for development

### Phase 3: Telegram Bot Base
```bash
mkdir bot && cd bot
npm init -y
npm install grammy @supabase/supabase-js dotenv
npm install -D typescript @types/node ts-node
```
Set up:
- `bot/src/index.ts` — entry point, loads env, starts bot
- `bot/src/bot.ts` — grammY bot instance, register all handlers
- `bot/src/supabase.ts` — Supabase client with service_role key
- `bot/src/middleware/auth.ts` — isAdmin check using TELEGRAM_ADMIN_USER_IDS env var
- `bot/src/handlers/` folder — empty handler files for next phases

### Phase 4: Bot Menu CRUD (Admin)
Build admin commands in `bot/src/handlers/admin.ts`:
- `/add` — step-by-step: ask name → description → price → show category buttons → ask photo → ask featured yes/no → INSERT into Supabase + upload image to storage
- `/edit` — show categories → items → pick field to edit → update in Supabase
- `/delete` — pick item → confirm → soft delete (is_available = false)
- `/addcat` — name + icon → INSERT category
- `/editcat`, `/deletecat` — similar flows
- `/stats` — query today's orders count, revenue, bookings
- All admin commands must check isAdmin middleware first

### Phase 5: Bot Customer Features
Build in `bot/src/handlers/`:
- `menu.ts` — `/start` shows main menu keyboard → browse by category → item detail with photo
- `order.ts` — category → pick items + qty → cart (Map<chatId, items>) → checkout → ask name, phone → confirm → INSERT order → notify admin group
- `booking.ts` — ask date → time → party size → name, phone → confirm → INSERT booking → notify admin group
- Admin notification format: see ARCHITECTURE.md section 6

### Phase 6: Public Website — Landing Page
Build `src/app/page.tsx` following DESIGN_SYSTEM.md layouts:
- Nav: transparent → solid brown-deep on scroll, logo left, menu links + "Band qilish" button right
- Hero: full viewport, dark gradient overlay, restaurant name (Playfair Display), tagline, 2 CTA buttons
- About: cream bg, centered text, subtle geometric pattern at low opacity
- Featured dishes: sand-light bg, fetch from Supabase (is_featured = true), grid cards
- Location: address, hours, phone, Google Maps embed placeholder
- Footer: bg-dark, logo, links, contact, Telegram bot link
- Responsive: mobile hamburger menu, stacked sections

### Phase 7: Public Website — Menu Page
Build `src/app/menu/page.tsx` — this is the most important page:
- Fetch all available menu items from Supabase with categories
- **Dual view mode**: Grid (default) and List, toggle button in header
- **Sticky category bar**: horizontal scroll, highlights active section on scroll, tap to smooth-scroll
- **Grid view**: featured hero card (full-width, image left / details right) per category + regular grid cards below
- **List view**: classic restaurant menu — name, description, dotted line, price. Clean and scannable.
- **Every card with hasAR shows "AR ko'rish" button** directly on the card image (grid) or inline (list)
- **Search**: filters across name + description, instant
- **AR onboarding**: first AR button tap → 3-step tutorial modal (see ARCHITECTURE.md section 11). Store flag in localStorage. "AR nima?" button in header.
- **AR viewer modal**: `<model-viewer>` component loading GLB (src) + USDZ (ios-src). Loading spinner. Fullscreen on mobile.
- Use proper SVG icons throughout — NO emojis anywhere in the UI
- Badges: "Mashhur" with star SVG, "AR" with 3D cube SVG

### Phase 8: Admin Auth + Layout
- `src/app/admin/login/page.tsx` — email/password form, Supabase signInWithPassword
- `src/app/admin/layout.tsx` — session check, redirect if not auth'd, sidebar nav (Dashboard, Menyu, Buyurtmalar, Bandlar), cream background content area
- Sidebar: bg-dark-soft, logo at top, tan active link indicator

### Phase 9: Admin Dashboard
Build `src/app/admin/page.tsx`:
- 3 stat cards: today's orders, today's revenue, today's bookings
- Line chart: orders per day (last 7 days) — use recharts
- Bar chart: top 10 ordered items (last 30 days, parsed from orders.items JSONB)
- Recent orders table (last 10)
- All data from Supabase queries (see ARCHITECTURE.md section 7)
- Use the brown/tan/cream palette for charts

### Phase 10: Admin Orders + Bookings
- `src/app/admin/orders/page.tsx` — table with expandable rows, status filter, date filter, status action buttons (new→confirmed→preparing→done, cancel from any)
- `src/app/admin/bookings/page.tsx` — similar but simpler: pending→confirmed, cancel
- Each status change: instant Supabase update

### Phase 11: Admin Menu View
- `src/app/admin/menu/page.tsx` — table of all items (including unavailable)
- Search + category filter
- Toggle switch for is_available (instant update)
- 3D model column: shows status (none/processing/ready/failed)
- Upload USDZ button → calls POST /api/process-model → shows progress
- NO create/edit forms (that's the bot's job)

### Phase 12: 3D Model API Route
- `src/app/api/process-model/route.ts`
- Accepts USDZ upload, validates size + type
- Sets menu_item model_status = 'processing'
- Light optimization: textureResize(2048) + JPEG q90 + dedup + prune using @gltf-transform/functions
- NO mesh changes — quality first
- Saves optimized GLB + USDZ + original to Supabase Storage
- Updates menu_item with URLs + model_status = 'ready'
- On error: model_status = 'failed'

### Phase 13: Polish
- Loading states for all data fetches (skeleton loaders, not spinners)
- Error boundaries with friendly messages
- Responsive testing: mobile, tablet, desktop
- SEO: meta tags, Open Graph, structured data for restaurant
- Performance: lazy load images (Next.js Image), lazy load model-viewer script
- Smooth animations: nav scroll transition, card hovers, modal open/close (200ms, ease-out)
- Verify AR works: test model-viewer with a sample GLB/USDZ

## Important Rules

1. **Follow the design system strictly** — colors, fonts, spacing from DESIGN_SYSTEM.md. No pure black, no pure white, no generic fonts.
2. **No emojis in the web UI** — use SVG icons everywhere. Emojis are OK in the Telegram bot (that's native Telegram style).
3. **TypeScript but practical** — don't over-type. `any` is fine for quick iterations.
4. **Server Components by default** — `'use client'` only when you need interactivity.
5. **Tailwind directly on elements** — no separate CSS files, no component library unless shadcn/ui genuinely helps.
6. **Prices in UZS** — stored as numeric(10,2), displayed with space separator (e.g., "55 000 UZS").
7. **camelCase in TypeScript, snake_case in database** — be consistent.
8. **Bot is standalone** — separate package.json in `/bot`, separate deployment. Does NOT run inside Next.js.
9. **Test each phase** before moving to the next. Ensure Supabase queries work, pages render, bot responds.
10. **Commit after each phase** with a clear message like "Phase 3: Telegram bot base setup".

## Env Vars the Client Will Provide
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ADMIN_CHAT_ID=-100123456789
TELEGRAM_ADMIN_USER_IDS=123456789,987654321
NEXT_PUBLIC_SITE_URL=https://kohnachigatoy.uz
```

## Start Building
Begin with Phase 1. After each phase, confirm it works, then proceed to the next. If you encounter a blocker, note it and continue with the next phase that doesn't depend on it.
