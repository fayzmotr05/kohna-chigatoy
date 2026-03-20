# Bot Registration + Full Ordering/Booking — Brainstorm

**Date:** 2026-03-20
**Status:** Ready for implementation

## What We're Building

Three features that make the bot fully self-contained (no Mini App required):

### 1. Bot Registration (contact share + name)
- **Trigger:** lazy — only when user tries to order or book
- User clicks "Buyurtma" or "Band qilish" → bot checks `telegram_users`
- If not registered → "Share contact" reply keyboard button → user shares phone
- Bot asks for name → saves to `telegram_users`
- After registration, continues to the action they originally wanted

### 2. Full Bot-Based Ordering
- Browse categories (buttons) → pick items → +/- cart → checkout
- Name + phone auto-filled from registration (no re-asking)
- Cart with quantity controls, total display
- Confirm → saved to DB → admin notified

### 3. Full Bot-Based Booking
- Date input (text, e.g. 25.03)
- Time selection (button grid: 12:00-22:00)
- Party size (buttons: 1-2, 3-4, 5-6, 7+)
- Confirmation summary → saved to DB → admin notified
- Name + phone auto-filled from registration

### 4. Customer Notifications
- When admin confirms order → bot messages customer: "✅ Buyurtmangiz tasdiqlandi!" + order details
- When admin cancels order → bot messages customer: "❌ Buyurtmangiz bekor qilindi"
- Same for bookings

## Key Decisions

1. **Lazy registration** — only triggered when ordering/booking, not at /start
2. **Reply keyboard for contact share** — Telegram's native `request_contact` button
3. **Time selection via buttons** — not text input (less error-prone)
4. **Party size via buttons** — ranges like 1-2, 3-4, 5-6, 7+
5. **Auto-fill name/phone** — from registration, never ask twice
6. **Customer notifications** — bot sends message to `telegram_chat_id` on confirm/cancel

## Open Questions

None — scope is clear.
