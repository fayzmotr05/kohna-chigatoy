# Telegram Mini App — Brainstorm

**Date:** 2026-03-17
**Status:** Ready for planning

## What We're Building

Adapt the existing Ko'hna Chig'atoy Next.js website to also work as a **Telegram Mini App**. Not a separate app — the same codebase serves both browser users and Telegram users.

### Feature Split

| Feature | Browser | Telegram Mini App |
|---------|---------|-------------------|
| Menu browsing | Yes | Yes |
| AR viewer | Yes | Yes (Quick Look / Scene Viewer) |
| Search & filter | Yes | Yes |
| Multi-language (UZ/RU/EN) | Yes | Yes |
| Booking | No (link to Telegram) | Yes (after registration) |
| Ordering (visual cart) | No | Yes (after registration) |
| Registration | N/A | One-time: share contact + enter name |

### Key Concept: Registration Gate

- **Menu/AR/Search** = open to everyone, no login
- **Booking/Ordering** = requires one-time Telegram registration
- Registration flow: user taps "Book" or "Order" → prompted to share contact (Telegram's native contact sharing gives verified phone) → enter name → saved to DB → never asked again
- This is NOT a traditional login — it's a one-time identity verification via Telegram

### Ordering Flow (Mini App only)

1. User browses menu (same UI as website)
2. Taps "+" on items → items added to visual cart
3. Floating cart button shows item count + total
4. Tap cart → checkout summary (items, quantities, total)
5. If not registered → registration gate → then checkout
6. Confirm → order saved to Supabase → admin notified via Telegram group message
7. User sees confirmation screen

### Booking Flow (Mini App only)

1. User taps "Book a Table" (in nav or dedicated section)
2. If not registered → registration gate first
3. Pick date → time → party size → optional notes
4. Confirm → booking saved to Supabase → admin notified
5. User sees confirmation

## Why This Approach

**Same codebase, not a separate app:**
- Telegram Mini Apps are WebViews that open a URL
- Our Next.js site already works on mobile
- We detect `window.Telegram.WebApp` to know we're inside Telegram
- Conditionally show/hide features based on context (e.g., show cart only in Telegram)
- One deployment, one codebase, zero duplication

**Contact sharing for registration:**
- Telegram's `requestContact()` gives a verified phone number
- More trustworthy than a form — the phone is linked to the Telegram account
- One-time process, stored in Supabase linked to `telegram_user_id`
- Much simpler than building email/password auth

**Visual cart over bot text flow:**
- Users see images, prices, quantities visually
- Much better UX than "reply with a number" in chat
- Admin notification stays the same (Telegram group message)

## Key Decisions

1. **Single codebase** — same Next.js app, detect Telegram context at runtime
2. **Registration = contact share + name** — only required for booking/ordering, not for browsing
3. **Visual cart UI** — full cart experience inside Mini App, replaces bot text ordering
4. **Admin notified via Telegram** — same admin group chat, formatted message with order/booking details
5. **AR works in Mini App** — `<model-viewer>` with Quick Look / Scene Viewer works inside Telegram's WebView
6. **No payment integration (yet)** — cash/card on arrival, or Payme/Click can be added later

## Open Questions

1. **Delivery vs dine-in distinction** — should the order flow ask "delivery or pickup"? (Restaurant supports both)
2. **Order status updates** — should the customer get a message in their bot chat when order status changes? (e.g., "Your order is being prepared")
3. **Repeat orders** — show order history so users can re-order?
4. **Mini App entry point** — bot menu button? Inline button in /start? Both?

## Technical Notes (for planning phase)

- Telegram WebApp SDK: `window.Telegram.WebApp` provides user data, theme, haptic feedback, contact request
- `initDataUnsafe.user` gives telegram_id, first_name — useful for pre-filling
- `WebApp.requestContact()` for phone verification
- Need a `/api/telegram/` route to validate `initData` server-side (HMAC with bot token)
- Cart state: React context + localStorage (persists across Mini App reopens)
- New DB table: `telegram_users` (telegram_id, phone, name, registered_at)
- Conditional rendering: `useTelegramContext()` hook that returns `{ isTelegram, user, isRegistered }`
