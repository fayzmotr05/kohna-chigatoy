# Telegram-Only Admin — Brainstorm

**Date:** 2026-03-17
**Status:** Ready for planning

## What We're Building

Remove the web admin panel entirely. All admin operations happen through the Telegram bot. The bot already has most of this built (`/add`, `/edit`, `/delete`, `/addcat`, `/editcat`, `/deletecat`, `/stats`, `/orders`, `/bookings`, order/booking confirm/cancel). The main changes are:

1. **Remove** web admin panel (`/admin/*` pages), auth middleware, Supabase Auth dependency
2. **Add** 3D model upload via bot (send .glb/.usdz file in chat during add/edit flow)
3. **Ensure** all admin operations the web panel had are covered by the bot

### What the Bot Already Does (no changes needed)
- `/add` — create menu item: name → description → price → category → photo → featured
- `/edit` — edit any field of any item
- `/delete` — soft delete (toggle availability)
- `/addcat`, `/editcat`, `/deletecat` — full category CRUD
- `/stats` — today's orders, revenue, bookings
- `/orders` — view recent orders
- `/bookings` — view upcoming bookings
- Order confirm/cancel via inline buttons (`aconfirm_`, `acancel_`)
- Booking confirm/cancel via inline buttons (`bconfirm_`, `bcancel_`)
- Photo upload during `/add` flow
- Admin auth via `TELEGRAM_ADMIN_USER_IDS` env var

### What Needs Adding
- 3D model (.glb/.usdz) upload during `/add` and `/edit` flows
- Bot asks "Send 3D file (or skip)" after photo step

### What Gets Removed
- `src/app/admin/` — all 5 pages (dashboard, menu, orders, bookings, login)
- `src/app/admin/layout.tsx` — sidebar navigation
- `src/middleware.ts` — auth protection (or simplify to remove admin routes)
- `src/app/api/process-model/route.ts` — web-based model upload (replaced by bot)
- Supabase Auth dependency — no more `auth.role() = 'authenticated'` RLS policies
- `src/app/admin/login/page.tsx` — login page

## Key Decisions

1. **3D files sent as documents in chat** — same pattern as photo upload, bot downloads and uploads to Supabase storage
2. **No web admin at all** — Supabase dashboard available as fallback for bulk operations
3. **Auth simplified** — only `TELEGRAM_ADMIN_USER_IDS` check, no Supabase Auth
4. **RLS policies updated** — remove `auth.role() = 'authenticated'`, keep service_role access
5. **Dashboard stats** — `/stats` command covers the basics; Supabase dashboard for deep analytics

## Open Questions

None — scope is clear.
