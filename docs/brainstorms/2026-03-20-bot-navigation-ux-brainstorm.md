# Bot Navigation & UX Rethink — Brainstorm

**Date:** 2026-03-20
**Status:** Ready for implementation

## What We're Building

Complete overhaul of the Telegram bot's button navigation, command structure, and UX flow. Make it feel like a professional restaurant bot where every screen has proper navigation (back, home, next action).

## Current Problems

1. **No `/admin` dashboard** — admin must memorize 9 individual commands
2. **No `setMyCommands`** — users don't see command list in Telegram's "/" menu
3. **Dead-end screens everywhere** — info, stats, item details have no back/home buttons
4. **No `/cancel`** — can't abort in-progress add/edit/booking flows
5. **No `/help`** — missing basic convention
6. **Cart +/- is broken** — reassigning `ctx.callbackQuery.data` doesn't re-trigger handlers
7. **No return navigation after admin actions** — after adding an item, nowhere to go
8. **Text-based order/booking redirects to Mini App only** — no fallback for non-Mini-App users

## What We're Fixing

### 1. BotFather Commands (`setMyCommands`)

Register two command sets:
- **Default (all users):** `/start`, `/menu`, `/help`
- **Admin (private, shown only in admin chats):** `/admin`, `/add`, `/edit`, `/delete`, `/addcat`, `/editcat`, `/deletecat`, `/stats`, `/orders`, `/bookings`

Call `bot.api.setMyCommands()` on startup.

### 2. `/start` — Main Menu (Customers)

```
🏠 Ko'hna Chig'atoy
Oilaviy restoranga xush kelibsiz!

[📋 Menyu]     [🛒 Buyurtma]
[📅 Band qilish] [ℹ️ Ma'lumot]
[📋 Menyu (text)]
```

Same as now but with a "🏠 Bosh menyu" button added to every subsequent screen.

### 3. `/admin` — Admin Dashboard (NEW)

```
⚙️ Admin Panel

📋 Menyu boshqaruvi:
[➕ Taom qo'shish]  [✏️ Taom tahrirlash]
[🗑 Taom o'chirish]

📁 Kategoriyalar:
[➕ Kategoriya]  [✏️ Tahrirlash]  [🗑 O'chirish]

📊 Ma'lumotlar:
[📊 Statistika]  [📦 Buyurtmalar]  [📅 Bandlar]
```

All buttons trigger the same flows as the commands, but button-based. After every admin action completes → "⬅️ Admin panel" button.

### 4. Navigation Rules

Every screen gets:
- **Customer screens:** "🏠 Bosh menyu" button (goes to /start menu)
- **Category/item browsing:** "⬅️ Orqaga" (back one level) + "🏠 Bosh menyu"
- **Admin screens:** "⬅️ Admin panel" button after action completes
- **In-progress flows:** `/cancel` command works at any point to abort

### 5. `/cancel` — Universal Flow Cancellation

Clears any active session (admin add/edit, order text flow, booking text flow). Returns to main menu or admin panel depending on context.

### 6. `/help` — Help Message

Shows available commands based on whether user is admin or not.

### 7. Fix Cart +/- Bug

Replace the broken `ctx.callbackQuery.data = 'cart_view'` pattern with proper re-rendering of the cart message after increment/decrement.

### 8. Info Screen — Add Back Button

After showing restaurant info, add "🏠 Bosh menyu" button.

### 9. Stats/Orders/Bookings — Add Back Button

After showing stats, add "⬅️ Admin panel" button.

## Key Decisions

1. **Button-based admin panel** — all admin actions accessible via inline buttons from `/admin`, not just typed commands
2. **Universal back navigation** — every screen has a way back
3. **`setMyCommands` on startup** — proper command menu in Telegram UI
4. **`/cancel` at any point** — abort any multi-step flow
5. **Fix cart bug** — proper re-render instead of data reassignment

## Open Questions

None — scope is clear.
