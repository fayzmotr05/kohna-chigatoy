# Ko'hna Chig'atoy — Full Feature Review

Last verified: 2026-05-03

## CONNECTIONS STATUS

| Connection | Status | Notes |
|------------|--------|-------|
| **Supabase** | ✅ UP | `kvmlolmwypsmirlxqvtn.supabase.co` — verified queries return data |
| **Telegram Bot API** | ✅ UP | Bot `@Kohnachigatoybot` (id: 8629175365) — `getMe` returns 200 |
| **Vercel (Frontend)** | ✅ UP | `kohnachigatoy.uz` returns 200 |
| **Railway (Bot)** | ✅ UP | `telegram-bot` service deployed and running |
| **GitHub** | ✅ Connected | `fayzmotr05/kohna-chigatoy` — pushes trigger Vercel auto-deploy |
| **Vercel ↔ GitHub auto-deploy** | ⚠️ Manual | Auto-deploy is configured but I had to manually push from CLI |
| **Railway ↔ GitHub auto-deploy** | ⚠️ Verify | Need to confirm if Railway watches GitHub or only manual `railway up` |

---

## FEATURES — STATUS PER FEATURE

### 1. PUBLIC WEBSITE (kohnachigatoy.uz)

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page (hero, about, featured, location) | ✅ Working | Server-renders featured items from Supabase |
| Menu page (grid view) | ✅ Working | Shows all categories with multilingual names |
| Menu page (list view) | ✅ Working | |
| Search | ✅ Working | Searches across uz/ru/en names + descriptions |
| Sticky category tabs | ✅ Working | Scroll-spy highlights active category |
| Language switcher (Uzbek/Russian/English) | ✅ Working | Full UI + menu items translate now |
| **"Band qilish" (Book) button** | ✅ Fixed (just now) | Opens `t.me/Kohnachigatoybot?start=book` deep link |

### 2. AR / 3D VIEWER

| Platform | Format Required | Status |
|----------|----------------|--------|
| **iOS** | `model_usdz_url` (preferred) or `model_glb_url` | ✅ Works when USDZ exists |
| **Android** | `model_glb_url` (REQUIRED) | ✅ Now correctly hidden when no GLB |
| **Desktop** | `model_glb_url` | ✅ Opens GLB in new window |

**Current data state:**
- 16 menu items total
- 14 items: NO 3D model at all
- 2 items have USDZ but **NO GLB** → Android can't see AR for these
- 0 items have GLB

**Just fixed:** Android no longer shows broken AR button when only USDZ exists.

### 3. TELEGRAM MINI APP (inside `/menu` opened from Telegram)

| Feature | Status | Notes |
|---------|--------|-------|
| Telegram WebApp detection | ✅ Working | `useTelegram()` hook |
| InitData validation (HMAC-SHA256) | ✅ Fixed earlier | Was the "Invalid hash" bug |
| Registration gate (phone + name) | ✅ Working | |
| Add to cart (+button on menu cards) | ✅ Working | |
| Cart (localStorage persistence) | ✅ Working | Capped at 99 per item |
| MainButton showing cart total | ✅ Working | |
| Floating cart button (mobile fallback) | ✅ Working | |
| Checkout flow → API → admin notify | ✅ Working | |
| Booking form (date/time/party size) | ✅ Working | Tomorrow+ only, 10:00-22:00 |
| Booking → API → admin notify | ✅ Working | |
| Deep link `?action=book` | ✅ Working | Opens booking form on Mini App load |
| AR onboarding modal (first time) | ✅ Working | |

### 4. TELEGRAM BOT (chat commands)

| Feature | Status | Notes |
|---------|--------|-------|
| `/start` (main menu) | ✅ Working | |
| `/start book` (deep link from website) | ✅ NEW | Just added — opens booking Mini App |
| `/menu` (categories → items) | ✅ Working | Shows multilingual names (uz) |
| `/help` | ✅ Working | |
| `/cancel` | ✅ Working | |
| Browse menu via inline buttons | ✅ Working | |
| Item detail (photo + description + AR link) | ✅ Working | |
| Order via bot (in-chat) | ✅ Working | Sessions in memory |
| Booking via bot (in-chat) | ✅ Working | Date → time → party size |
| Restaurant info button | ✅ Working | |

### 5. ADMIN COMMANDS (bot)

| Feature | Status | Notes |
|---------|--------|-------|
| `/admin` panel | ✅ Working | Inline keyboard menu |
| **Add menu item** (multilingual prompts) | ✅ NEW | 11 steps: uz/ru/en names + descriptions, price, category, photo, model, featured |
| **Edit menu item** (name/desc/price/category/photo/model/featured) | ✅ Working | name/description map to `_uz` columns |
| Delete menu item (soft delete: `is_available=false`) | ✅ Working | |
| Add category (uz only) | ⚠️ Partial | Bot only asks Uzbek; needs ru/en too |
| Edit category | ⚠️ Partial | Same as above |
| Delete category | ✅ Working | Only if no items |
| Orders list `/orders` | ✅ Working | |
| Bookings list `/bookings` | ✅ Working | |
| Confirm/cancel order (inline buttons) | ✅ Working | |
| Confirm/cancel booking (inline buttons) | ✅ Working | |
| Stats `/stats` | ✅ Working | Today's orders + revenue |

### 6. 3D MODEL UPLOAD (admin)

| Feature | Status | Notes |
|---------|--------|-------|
| Accept `.glb` file | ✅ Working | Uploads to `media/models/glb/` |
| Accept `.usdz` file | ✅ Working | Uploads to `media/models/usdz/` |
| GLB optimization (gltf-transform) | ✅ Working | Only when >15MB |
| **USDZ → GLB auto-conversion** | ❌ **BROKEN** | trimesh can't parse USDZ. See below. |
| Bot warning when only USDZ uploaded | ✅ NEW | Tells admin "Android won't work" |
| Admin can upload both formats | ✅ Working | One after another |

**USDZ→GLB conversion problem:**
- The `trimesh` Python library used in the conversion script does NOT support USDZ format
- USDZ is Apple's proprietary format wrapping USD (Universal Scene Description)
- trimesh only handles `.obj`, `.stl`, `.ply` — USD parsing isn't supported
- **All 2 USDZ uploads to date have failed conversion**

**Workarounds:**
1. **Recommended:** Convert USDZ→GLB locally before uploading
   - macOS: Use Apple's free [Reality Converter](https://developer.apple.com/augmented-reality/tools/) app
   - Online: Tools like `cloudconvert.com` or `aspose.app/3d`
2. **Or:** Upload `.glb` only (works on both iOS and Android via model-viewer/Scene Viewer)
3. **Or:** Upload BOTH `.glb` and `.usdz` separately

**Real fix for conversion (future work):**
- Replace trimesh with Apple's `usdpython` (macOS-only, won't work on Railway)
- Or use Pixar's `usd-core` Python library (huge dependency, ~200MB)
- Or use a paid conversion API (CloudConvert, etc.)

### 7. INTERNATIONALIZATION

| Aspect | Status |
|--------|--------|
| UI labels (uz/ru/en) | ✅ Working — translation files complete |
| Category names | ✅ Working — multilingual columns |
| Menu item names | ✅ Working — multilingual columns |
| Menu item descriptions | ✅ Working — multilingual columns |
| Auto-detect from Telegram language_code | ✅ Working |
| Cookie + localStorage persistence | ✅ Working |
| Bot interface | ⚠️ Uzbek only (intentional — admins are Uzbek) |

### 8. API ENDPOINTS

| Endpoint | Status | Validation |
|----------|--------|------------|
| `POST /api/telegram/register` | ✅ Working | initData HMAC + body try-catch |
| `GET /api/telegram/check-registration` | ✅ Working | initData HMAC |
| `POST /api/telegram/order` | ✅ Working | initData HMAC + registration check + price re-fetch |
| `POST /api/telegram/booking` | ✅ Working | initData HMAC + registration check + date/time/size |

---

## KNOWN BROKEN FLOWS

### 1. USDZ→GLB conversion
**Symptom:** Admin uploads `.usdz`, Android users can't see AR
**Root cause:** trimesh library can't parse USDZ
**Fix:** Admin must upload `.glb` separately (or convert locally before upload)

### 2. Category bot CRUD doesn't ask for Russian/English
**Symptom:** When admin adds new category via bot, only Uzbek name is captured
**Impact:** Russian/English users see Uzbek category names (fallback works fine)
**Fix:** Update bot to ask for ru/en translations like menu items do

---

## KNOWN GOOD FLOWS

### Customer journey: Order via Mini App
1. ✅ User opens bot → taps "Menyu" → Mini App opens
2. ✅ Browses menu (multilingual) → adds items to cart
3. ✅ Taps cart → checkout sheet appears
4. ✅ If not registered → registration gate (phone + name)
5. ✅ Confirms order → API validates → saves to DB → notifies admin
6. ✅ Admin gets Telegram message with confirm/cancel buttons

### Customer journey: Booking via Mini App
1. ✅ User opens bot → taps "Band qilish" → Mini App opens with `?action=book`
2. ✅ Booking form pops up
3. ✅ If not registered → registration gate first
4. ✅ Picks date/time/party size → confirms → API saves booking → notifies admin

### Admin journey: Add menu item
1. ✅ `/admin` → "Taom qo'shish"
2. ✅ Walks through 11 steps (uz/ru/en names + descriptions, etc.)
3. ✅ Skip buttons for ru/en (uses Uzbek as fallback)
4. ✅ Photo upload → uploaded to Supabase storage
5. ✅ 3D model upload → optimized → saved
6. ✅ Featured Y/N → saved to DB

---

## DATA STATE CHECK (snapshot 2026-05-03)

```
Categories: 5
Menu items: 16
- With image: 2
- Without image: 14
- With 3D model (any format): 2
- With USDZ + GLB (full AR support): 0
- With USDZ only (Android broken): 2  ← needs admin action
- With GLB only (works everywhere): 0
```

**To fix the 2 broken items:**
Admin should re-upload `.glb` versions for "Haah" and "balik" via bot's edit flow.
