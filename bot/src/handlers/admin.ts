import { Bot, InlineKeyboard } from 'grammy';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { supabase } from '../supabase';
import { isAdmin } from '../middleware/auth';

interface AdminSession {
  action: string;
  step: string;
  data: Record<string, any>;
}

const sessions = new Map<number, AdminSession>();

function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

/** Build the admin panel keyboard */
function adminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('➕ Taom qo\'shish', 'a_add')
    .text('✏️ Taom tahrirlash', 'a_edit')
    .row()
    .text('🗑 Taom o\'chirish', 'a_delete')
    .text('📊 Statistika', 'a_stats')
    .row()
    .text('📦 Buyurtmalar', 'a_orders')
    .text('📅 Bandlar', 'a_bookings')
    .row()
    .text('📁 Kategoriya ➕', 'a_addcat')
    .text('📁 Kategoriya ✏️', 'a_editcat')
    .row()
    .text('📁 Kategoriya 🗑', 'a_deletecat')
    .text('🏠 Bosh menyu', 'go_home');
}

export function registerAdminHandlers(bot: Bot) {
  // ─── /admin — Admin panel ───
  bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx)) return;
    sessions.delete(ctx.chat.id);
    await ctx.reply('⚙️ *Admin Panel*\n\nKerakli amalni tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: adminPanelKeyboard(),
    });
  });

  // ─── Admin panel callback (from buttons) ───
  bot.callbackQuery('admin_panel', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️ Admin emas');
    await ctx.answerCallbackQuery();
    sessions.delete(ctx.chat!.id);
    try {
      await ctx.editMessageText('⚙️ *Admin Panel*\n\nKerakli amalni tanlang:', {
        parse_mode: 'Markdown',
        reply_markup: adminPanelKeyboard(),
      });
    } catch {
      // Can't edit (e.g. photo message) — send new
      await ctx.reply('⚙️ *Admin Panel*\n\nKerakli amalni tanlang:', {
        parse_mode: 'Markdown',
        reply_markup: adminPanelKeyboard(),
      });
    }
  });

  // ─── /cancel — clear admin session ───
  bot.command('cancel', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const had = sessions.has(ctx.chat.id);
    sessions.delete(ctx.chat.id);
    if (had) {
      await ctx.reply('❌ Bekor qilindi.', { reply_markup: adminPanelKeyboard() });
    }
    // Let other handlers also process /cancel
  });

  // ═══════════════════════════════════════════
  // ADD MENU ITEM
  // ═══════════════════════════════════════════
  bot.callbackQuery('a_add', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    sessions.set(ctx.chat!.id, { action: 'add', step: 'name_uz', data: {} });
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      '📝 *Yangi taom* (1/11)\n\n🇺🇿 Taom nomini yozing (o\'zbekcha):',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // Also support /add command
  bot.command('add', async (ctx) => {
    if (!isAdmin(ctx)) return;
    sessions.set(ctx.chat.id, { action: 'add', step: 'name_uz', data: {} });
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.reply('📝 *Yangi taom* (1/11)\n\n🇺🇿 Taom nomini yozing (o\'zbekcha):', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // Skip translation callbacks
  bot.callbackQuery('aa_skip_name_ru', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.nameRu = null;
    session.step = 'name_en';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'aa_skip_name_en')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      `📝 *Yangi taom* (3/11)\n\n🇬🇧 English name:\n\n_O'tkazilsa "${session.data.name}" ishlatiladi_`,
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  bot.callbackQuery('aa_skip_name_en', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.nameEn = null;
    session.step = 'desc_uz';
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      '📝 *Yangi taom* (4/11)\n\n🇺🇿 Tavsifini yozing (o\'zbekcha):',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  bot.callbackQuery('aa_skip_desc_ru', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.descRu = null;
    session.step = 'desc_en';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'aa_skip_desc_en')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      `📝 *Yangi taom* (6/11)\n\n🇬🇧 English description:\n\n_O'tkazilsa o'zbekcha ishlatiladi_`,
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  bot.callbackQuery('aa_skip_desc_en', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.descEn = null;
    session.step = 'price';
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      '📝 *Yangi taom* (7/11)\n\n💰 Narxini yozing (UZS, faqat raqam):',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // Add item — pick category callback
  bot.callbackQuery(/^aacat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.categoryId = ctx.match![1];
    session.step = 'photo';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'aa_skip_photo')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      '📝 *Yangi taom* (9/11)\n\n📷 Taom rasmini yuboring yoki o\'tkazing:',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  bot.callbackQuery('aa_skip_photo', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.step = 'model';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'aa_skip_model')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(
      '📝 *Yangi taom* (10/11)\n\n🔮 3D fayl yuboring (.glb / .usdz) yoki o\'tkazing:',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  bot.callbackQuery('aa_skip_model', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.step = 'featured';
    const kb = new InlineKeyboard()
      .text('Ha ⭐', 'aafeat_true')
      .text('Yo\'q', 'aafeat_false');
    await ctx.editMessageText(
      '📝 *Yangi taom* (11/11)\n\n⭐ Tavsiya etiladimi?',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // Model done → go to featured
  bot.callbackQuery('aamodel_done', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.step = 'featured';
    const kb = new InlineKeyboard()
      .text('Ha ⭐', 'aafeat_true')
      .text('Yo\'q', 'aafeat_false');
    await ctx.reply('📝 *Yangi taom* (11/11)\n\n⭐ Tavsiya etiladimi?', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // Add item — featured callback → INSERT
  bot.callbackQuery(/^aafeat_(true|false)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;

    const isFeatured = ctx.match![1] === 'true';
    const hasModel = session.data.modelGlbUrl || session.data.modelUsdzUrl;

    const { error } = await supabase.from('menu_items').insert({
      name_uz: session.data.name,
      name_ru: session.data.nameRu || null,
      name_en: session.data.nameEn || null,
      description_uz: session.data.description || '',
      description_ru: session.data.descRu || null,
      description_en: session.data.descEn || null,
      price: session.data.price,
      category_id: session.data.categoryId,
      image_url: session.data.imageUrl || null,
      model_glb_url: session.data.modelGlbUrl || null,
      model_usdz_url: session.data.modelUsdzUrl || null,
      model_status: hasModel ? 'ready' : 'none',
      is_featured: isFeatured,
    });

    sessions.delete(ctx.chat!.id);

    if (error) {
      console.error('Insert error:', error);
      await ctx.reply('❌ Xatolik yuz berdi.', { reply_markup: adminPanelKeyboard() });
      return;
    }

    const kb = new InlineKeyboard()
      .text('➕ Yana qo\'shish', 'a_add')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.reply(
      `✅ *${session.data.name}* menyuga qo'shildi!\n💰 ${formatPrice(session.data.price)} UZS`,
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ═══════════════════════════════════════════
  // EDIT MENU ITEM
  // ═══════════════════════════════════════════
  bot.callbackQuery('a_edit', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showEditCategories(ctx);
  });

  bot.command('edit', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showEditCategories(ctx, true);
  });

  async function showEditCategories(ctx: any, isNewMsg = false) {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      const kb = new InlineKeyboard().text('⬅️ Admin panel', 'admin_panel');
      const text = 'Kategoriya yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat: any, i: number) => {
      keyboard.text(`${cat.name_uz}`, `aecat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (categories.length % 2 === 1) keyboard.row();
    keyboard.text('⬅️ Admin panel', 'admin_panel');

    sessions.set(ctx.chat!.id, { action: 'edit', step: 'pick_cat', data: {} });
    const text = '✏️ *Tahrirlash*\n\nQaysi kategoriyadan?';
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  // Edit — pick category → show items
  bot.callbackQuery(/^aecat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const categoryId = ctx.match![1];

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name_uz, price')
      .eq('category_id', categoryId)
      .order('name_uz');

    if (!items?.length) {
      const kb = new InlineKeyboard()
        .text('⬅️ Orqaga', 'a_edit')
        .text('⬅️ Admin panel', 'admin_panel');
      return ctx.editMessageText('Bu kategoriyada taom yo\'q.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    items.forEach((item: any) => {
      keyboard.text(`${item.name_uz} (${formatPrice(item.price)})`, `aeitem_${item.id}`).row();
    });
    keyboard.text('⬅️ Orqaga', 'a_edit').text('⬅️ Admin panel', 'admin_panel');

    await ctx.editMessageText('✏️ Taomni tanlang:', { reply_markup: keyboard });
  });

  // Edit — pick item → show fields
  bot.callbackQuery(/^aeitem_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];
    sessions.set(ctx.chat!.id, { action: 'edit', step: 'pick_field', data: { itemId } });

    const keyboard = new InlineKeyboard()
      .text('📝 Nom', 'aefield_name').text('📄 Tavsif', 'aefield_description').row()
      .text('💰 Narx', 'aefield_price').text('📁 Kategoriya', 'aefield_category').row()
      .text('⭐ Tavsiya', 'aefield_featured').text('📷 Rasm', 'aefield_image').row()
      .text('🔮 3D model', 'aefield_model').row()
      .text('⬅️ Orqaga', 'a_edit').text('⬅️ Admin panel', 'admin_panel');

    await ctx.editMessageText('✏️ Nimani o\'zgartirmoqchisiz?', { reply_markup: keyboard });
  });

  // Edit — pick field
  bot.callbackQuery(/^aefield_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const field = ctx.match![1];
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;

    session.data.field = field;

    if (field === 'featured') {
      const keyboard = new InlineKeyboard()
        .text('Ha ⭐', 'aesetfeat_true')
        .text('Yo\'q', 'aesetfeat_false')
        .row()
        .text('⬅️ Orqaga', `aeitem_${session.data.itemId}`);
      await ctx.editMessageText('⭐ Tavsiya etiladimi?', { reply_markup: keyboard });
      return;
    }

    if (field === 'image') {
      session.step = 'edit_image';
      const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
      await ctx.editMessageText('📷 Yangi rasmni yuboring:', { reply_markup: kb });
      return;
    }

    if (field === 'model') {
      session.step = 'edit_model';
      const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
      await ctx.editMessageText('🔮 3D faylni yuboring (.glb yoki .usdz):', { reply_markup: kb });
      return;
    }

    if (field === 'category') {
      const { data: cats } = await supabase.from('categories').select('*').order('display_order');
      const keyboard = new InlineKeyboard();
      cats?.forEach((c: any, i: number) => {
        keyboard.text(`${c.name_uz}`, `aesetcat_${c.id}`);
        if (i % 2 === 1) keyboard.row();
      });
      if ((cats?.length || 0) % 2 === 1) keyboard.row();
      keyboard.text('⬅️ Orqaga', `aeitem_${session.data.itemId}`);
      await ctx.editMessageText('📁 Yangi kategoriyani tanlang:', { reply_markup: keyboard });
      return;
    }

    session.step = 'edit_value';
    const labels: Record<string, string> = {
      name: '📝 Yangi nomni yozing',
      description: '📄 Yangi tavsifni yozing',
      price: '💰 Yangi narxni yozing (faqat raqam)',
    };
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText(`${labels[field] || 'Yangi qiymatni yozing'}:`, { reply_markup: kb });
  });

  // Set featured
  bot.callbackQuery(/^aesetfeat_(true|false)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    const val = ctx.match![1] === 'true';
    await supabase.from('menu_items').update({ is_featured: val }).eq('id', session.data.itemId);
    sessions.delete(ctx.chat!.id);
    const kb = new InlineKeyboard()
      .text('✏️ Yana tahrirlash', 'a_edit')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.editMessageText(
      `✅ ${val ? 'Tavsiya qo\'shildi ⭐' : 'Tavsiya olib tashlandi'}`,
      { reply_markup: kb },
    );
  });

  // Set category
  bot.callbackQuery(/^aesetcat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    await supabase.from('menu_items').update({ category_id: ctx.match![1] }).eq('id', session.data.itemId);
    sessions.delete(ctx.chat!.id);
    const kb = new InlineKeyboard()
      .text('✏️ Yana tahrirlash', 'a_edit')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.editMessageText('✅ Kategoriya yangilandi', { reply_markup: kb });
  });

  // ═══════════════════════════════════════════
  // DELETE MENU ITEM
  // ═══════════════════════════════════════════
  bot.callbackQuery('a_delete', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showDeleteCategories(ctx);
  });

  bot.command('delete', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showDeleteCategories(ctx, true);
  });

  async function showDeleteCategories(ctx: any, isNewMsg = false) {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      const kb = new InlineKeyboard().text('⬅️ Admin panel', 'admin_panel');
      const text = 'Kategoriya yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat: any, i: number) => {
      keyboard.text(`${cat.name_uz}`, `adcat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (categories.length % 2 === 1) keyboard.row();
    keyboard.text('⬅️ Admin panel', 'admin_panel');

    const text = '🗑 *O\'chirish*\n\nQaysi kategoriyadan?';
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  bot.callbackQuery(/^adcat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name_uz')
      .eq('category_id', ctx.match![1])
      .eq('is_available', true);

    if (!items?.length) {
      const kb = new InlineKeyboard()
        .text('⬅️ Orqaga', 'a_delete')
        .text('⬅️ Admin panel', 'admin_panel');
      return ctx.editMessageText('Bu kategoriyada taom yo\'q.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    items.forEach((item: any) => {
      keyboard.text(item.name_uz, `aditem_${item.id}`).row();
    });
    keyboard.text('⬅️ Orqaga', 'a_delete').text('⬅️ Admin panel', 'admin_panel');

    await ctx.editMessageText('🗑 O\'chirish uchun taomni tanlang:', { reply_markup: keyboard });
  });

  bot.callbackQuery(/^aditem_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];

    const { data: item } = await supabase
      .from('menu_items')
      .select('name_uz')
      .eq('id', itemId)
      .single();

    const keyboard = new InlineKeyboard()
      .text('✅ Ha, o\'chirish', `adconfirm_${itemId}`)
      .text('❌ Yo\'q', 'a_delete');

    await ctx.editMessageText(
      `⚠️ "${item?.name_uz}" ni o'chirmoqchimisiz?\n\n_Menyu ro'yxatidan yashiriladi_`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  bot.callbackQuery(/^adconfirm_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', ctx.match![1]);
    const kb = new InlineKeyboard()
      .text('🗑 Yana o\'chirish', 'a_delete')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.editMessageText('✅ O\'chirildi (menyudan yashirildi)', { reply_markup: kb });
  });

  // ═══════════════════════════════════════════
  // CATEGORIES CRUD
  // ═══════════════════════════════════════════

  // Add category
  bot.callbackQuery('a_addcat', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    sessions.set(ctx.chat!.id, { action: 'addcat', step: 'name', data: {} });
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText('📁 *Yangi kategoriya*\n\nNomini yozing:', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  bot.command('addcat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    sessions.set(ctx.chat.id, { action: 'addcat', step: 'name', data: {} });
    const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
    await ctx.reply('📁 *Yangi kategoriya*\n\nNomini yozing:', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // Edit category
  bot.callbackQuery('a_editcat', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showEditCatList(ctx);
  });

  bot.command('editcat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showEditCatList(ctx, true);
  });

  async function showEditCatList(ctx: any, isNewMsg = false) {
    const { data: cats } = await supabase.from('categories').select('*').order('display_order');
    if (!cats?.length) {
      const kb = new InlineKeyboard().text('⬅️ Admin panel', 'admin_panel');
      const text = 'Kategoriya yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    cats.forEach((c: any) => {
      keyboard.text(`${c.name_uz}`, `eccat_${c.id}`).row();
    });
    keyboard.text('⬅️ Admin panel', 'admin_panel');

    sessions.set(ctx.chat!.id, { action: 'editcat', step: 'pick', data: {} });
    const text = '✏️ *Kategoriya tahrirlash*\n\nQaysi birini?';
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  bot.callbackQuery(/^eccat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.catId = ctx.match![1];
    session.step = 'editcat_name';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'ec_skip_name')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.editMessageText('✏️ Yangi nom yozing yoki o\'tkazing:', { reply_markup: kb });
  });

  bot.callbackQuery('ec_skip_name', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    sessions.delete(ctx.chat!.id);
    const kb = new InlineKeyboard()
      .text('📁 Yana tahrirlash', 'a_editcat')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.editMessageText('✅ Hech narsa o\'zgarmadi.', { reply_markup: kb });
  });

  // Delete category
  bot.callbackQuery('a_deletecat', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showDeleteCatList(ctx);
  });

  bot.command('deletecat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showDeleteCatList(ctx, true);
  });

  async function showDeleteCatList(ctx: any, isNewMsg = false) {
    const { data: cats } = await supabase.from('categories').select('*').order('display_order');
    if (!cats?.length) {
      const kb = new InlineKeyboard().text('⬅️ Admin panel', 'admin_panel');
      const text = 'Kategoriya yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    cats.forEach((c: any) => {
      keyboard.text(`${c.name_uz}`, `dccat_${c.id}`).row();
    });
    keyboard.text('⬅️ Admin panel', 'admin_panel');

    const text = '🗑 *Kategoriya o\'chirish*\n\nQaysi birini?';
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  bot.callbackQuery(/^dccat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const catId = ctx.match![1];

    const { count } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', catId)
      .eq('is_available', true);

    if (count && count > 0) {
      const kb = new InlineKeyboard()
        .text('⬅️ Orqaga', 'a_deletecat')
        .text('⬅️ Admin panel', 'admin_panel');
      return ctx.editMessageText(
        `❌ Bu kategoriyada ${count} ta taom bor.\nAvval taomlarni o'chiring.`,
        { reply_markup: kb },
      );
    }

    await supabase.from('categories').delete().eq('id', catId);
    const kb = new InlineKeyboard()
      .text('🗑 Yana o\'chirish', 'a_deletecat')
      .text('⬅️ Admin panel', 'admin_panel');
    await ctx.editMessageText('✅ Kategoriya o\'chirildi', { reply_markup: kb });
  });

  // ═══════════════════════════════════════════
  // STATS / ORDERS / BOOKINGS
  // ═══════════════════════════════════════════

  bot.callbackQuery('a_stats', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showStats(ctx);
  });

  bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showStats(ctx, true);
  });

  async function showStats(ctx: any, isNewMsg = false) {
    const today = new Date().toISOString().split('T')[0];

    const [ordersRes, bookingsRes] = await Promise.all([
      supabase.from('orders').select('status, total').gte('created_at', `${today}T00:00:00`),
      supabase.from('bookings').select('id').eq('date', today),
    ]);

    const orders = ordersRes.data || [];
    const totalOrders = orders.length;
    const revenue = orders
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);
    const bookingsCount = bookingsRes.data?.length || 0;

    const kb = new InlineKeyboard()
      .text('📦 Buyurtmalar', 'a_orders')
      .text('📅 Bandlar', 'a_bookings')
      .row()
      .text('🔄 Yangilash', 'a_stats')
      .text('⬅️ Admin panel', 'admin_panel');

    const text =
      `📊 *Bugungi statistika*\n\n` +
      `📦 Buyurtmalar: ${totalOrders}\n` +
      `💰 Daromad: ${formatPrice(revenue)} UZS\n` +
      `📅 Bandlar: ${bookingsCount}`;

    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: kb });
  }

  bot.callbackQuery('a_orders', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showOrders(ctx);
  });

  bot.command('orders', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showOrders(ctx, true);
  });

  async function showOrders(ctx: any, isNewMsg = false) {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const kb = new InlineKeyboard()
      .text('🔄 Yangilash', 'a_orders')
      .text('⬅️ Admin panel', 'admin_panel');

    if (!orders?.length) {
      const text = '📦 Buyurtmalar yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const lines = orders.map((o: any) => {
      const items = (o.items as any[]).map((i: any) => `${i.name} x${i.qty}`).join(', ');
      const statusEmoji: Record<string, string> = {
        new: '🆕', confirmed: '✅', preparing: '🍳', done: '✅', cancelled: '❌',
      };
      return `${statusEmoji[o.status] || ''} ${o.customer_name} — ${formatPrice(o.total)} — ${items}`;
    });

    const text = `📦 *So'nggi buyurtmalar:*\n\n${lines.join('\n')}`;
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: kb });
  }

  bot.callbackQuery('a_bookings', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery('⛔️');
    await ctx.answerCallbackQuery();
    await showBookings(ctx);
  });

  bot.command('bookings', async (ctx) => {
    if (!isAdmin(ctx)) return;
    await showBookings(ctx, true);
  });

  async function showBookings(ctx: any, isNewMsg = false) {
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('time');

    const kb = new InlineKeyboard()
      .text('🔄 Yangilash', 'a_bookings')
      .text('⬅️ Admin panel', 'admin_panel');

    if (!bookings?.length) {
      const text = '📅 Kelgusi bandlar yo\'q.';
      return isNewMsg
        ? ctx.reply(text, { reply_markup: kb })
        : ctx.editMessageText(text, { reply_markup: kb });
    }

    const lines = bookings.map((b: any) => {
      const statusEmoji: Record<string, string> = {
        pending: '⏳', confirmed: '✅', cancelled: '❌',
      };
      return `${statusEmoji[b.status] || ''} ${b.date} ${b.time} — ${b.customer_name} (${b.party_size} kishi)`;
    });

    const text = `📅 *Bandlar:*\n\n${lines.join('\n')}`;
    return isNewMsg
      ? ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb })
      : ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: kb });
  }

  // ═══════════════════════════════════════════
  // TEXT MESSAGE HANDLER (add/edit flows)
  // ═══════════════════════════════════════════
  bot.on('message:text', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const text = ctx.message.text.trim();

    // Cancel via /cancel
    if (text === '/cancel') {
      sessions.delete(ctx.chat.id);
      await ctx.reply('❌ Bekor qilindi.', { reply_markup: adminPanelKeyboard() });
      return;
    }

    // ─── Add menu item flow ───
    if (session.action === 'add') {
      if (session.step === 'name_uz') {
        session.data.name = text;
        session.step = 'name_ru';
        const kb = new InlineKeyboard()
          .text('⏩ O\'tkazish', 'aa_skip_name_ru')
          .text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply(
          `📝 *Yangi taom* (2/11)\n\n🇷🇺 Ruscha nomini yozing:\n\n_O'tkazilsa "${text}" ishlatiladi_`,
          { parse_mode: 'Markdown', reply_markup: kb },
        );
        return;
      }
      if (session.step === 'name_ru') {
        session.data.nameRu = text;
        session.step = 'name_en';
        const kb = new InlineKeyboard()
          .text('⏩ O\'tkazish', 'aa_skip_name_en')
          .text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply(
          `📝 *Yangi taom* (3/11)\n\n🇬🇧 English name:\n\n_O'tkazilsa "${session.data.name}" ishlatiladi_`,
          { parse_mode: 'Markdown', reply_markup: kb },
        );
        return;
      }
      if (session.step === 'name_en') {
        session.data.nameEn = text;
        session.step = 'desc_uz';
        const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply('📝 *Yangi taom* (4/11)\n\n🇺🇿 Tavsifini yozing (o\'zbekcha):', {
          parse_mode: 'Markdown',
          reply_markup: kb,
        });
        return;
      }
      if (session.step === 'desc_uz') {
        session.data.description = text;
        session.step = 'desc_ru';
        const kb = new InlineKeyboard()
          .text('⏩ O\'tkazish', 'aa_skip_desc_ru')
          .text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply(
          `📝 *Yangi taom* (5/11)\n\n🇷🇺 Ruscha tavsif:\n\n_O'tkazilsa o'zbekcha ishlatiladi_`,
          { parse_mode: 'Markdown', reply_markup: kb },
        );
        return;
      }
      if (session.step === 'desc_ru') {
        session.data.descRu = text;
        session.step = 'desc_en';
        const kb = new InlineKeyboard()
          .text('⏩ O\'tkazish', 'aa_skip_desc_en')
          .text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply(
          `📝 *Yangi taom* (6/11)\n\n🇬🇧 English description:\n\n_O'tkazilsa o'zbekcha ishlatiladi_`,
          { parse_mode: 'Markdown', reply_markup: kb },
        );
        return;
      }
      if (session.step === 'desc_en') {
        session.data.descEn = text;
        session.step = 'price';
        const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply('📝 *Yangi taom* (7/11)\n\n💰 Narxini yozing (UZS, faqat raqam):', {
          parse_mode: 'Markdown',
          reply_markup: kb,
        });
        return;
      }
      if (session.step === 'price') {
        const price = parseInt(text.replace(/\s/g, ''));
        if (!price || price <= 0) {
          await ctx.reply('❌ Noto\'g\'ri narx. Faqat raqam yozing (masalan: 45000):');
          return;
        }
        session.data.price = price;
        session.step = 'category';

        const { data: cats } = await supabase.from('categories').select('*').order('display_order');
        const keyboard = new InlineKeyboard();
        cats?.forEach((c: any, i: number) => {
          keyboard.text(`${c.name_uz}`, `aacat_${c.id}`);
          if (i % 2 === 1) keyboard.row();
        });
        if ((cats?.length || 0) % 2 === 1) keyboard.row();
        keyboard.text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply('📝 *Yangi taom* (8/11)\n\n📁 Kategoriyani tanlang:', {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        return;
      }
    }

    // ─── Edit value flow ───
    if (session.action === 'edit' && session.step === 'edit_value') {
      const field = session.data.field;
      const update: Record<string, any> = {};
      if (field === 'price') {
        const price = parseInt(text.replace(/\s/g, ''));
        if (!price || price <= 0) {
          await ctx.reply('❌ Noto\'g\'ri narx. Faqat raqam yozing:');
          return;
        }
        update[field] = price;
      } else {
        // Map field names to DB column names (multilingual: _uz suffix)
        const columnMap: Record<string, string> = { name: 'name_uz', description: 'description_uz' };
        const col = columnMap[field] || field;
        update[col] = text;
      }
      await supabase.from('menu_items').update(update).eq('id', session.data.itemId);
      sessions.delete(ctx.chat.id);
      const kb = new InlineKeyboard()
        .text('✏️ Yana tahrirlash', 'a_edit')
        .text('⬅️ Admin panel', 'admin_panel');
      await ctx.reply('✅ Yangilandi!', { reply_markup: kb });
      return;
    }

    // ─── Add category flow ───
    if (session.action === 'addcat' && session.step === 'name') {
      await supabase.from('categories').insert({ name_uz: text });
      sessions.delete(ctx.chat.id);
      const kb = new InlineKeyboard()
        .text('📁 Yana qo\'shish', 'a_addcat')
        .text('⬅️ Admin panel', 'admin_panel');
      await ctx.reply(`✅ "${text}" kategoriyasi qo'shildi!`, { reply_markup: kb });
      return;
    }

    // ─── Edit category flow ───
    if (session.action === 'editcat' && session.step === 'editcat_name') {
      await supabase.from('categories').update({ name_uz: text }).eq('id', session.data.catId);
      sessions.delete(ctx.chat.id);
      const kb = new InlineKeyboard()
        .text('📁 Yana tahrirlash', 'a_editcat')
        .text('⬅️ Admin panel', 'admin_panel');
      await ctx.reply('✅ Kategoriya yangilandi!', { reply_markup: kb });
      return;
    }

    return next();
  });

  // ─── Photo handler (add item / edit image) ───
  bot.on('message:photo', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const isAddPhoto = session.action === 'add' && session.step === 'photo';
    const isEditImage = session.action === 'edit' && session.step === 'edit_image';
    if (!isAddPhoto && !isEditImage) return next();

    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id;

    const file = await ctx.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `images/${Date.now()}.jpg`;

    await supabase.storage.from('media').upload(fileName, buffer, {
      contentType: 'image/jpeg',
    });

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    if (isEditImage) {
      await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', session.data.itemId);
      sessions.delete(ctx.chat.id);
      const kb = new InlineKeyboard()
        .text('✏️ Yana tahrirlash', 'a_edit')
        .text('⬅️ Admin panel', 'admin_panel');
      await ctx.reply('✅ Rasm yangilandi!', { reply_markup: kb });
      return;
    }

    // Add flow — save URL and move to 3D model step
    session.data.imageUrl = publicUrl;
    session.step = 'model';
    const kb = new InlineKeyboard()
      .text('⏩ O\'tkazish', 'aa_skip_model')
      .text('❌ Bekor qilish', 'admin_panel');
    await ctx.reply('📝 *Yangi taom* (10/11)\n\n🔮 3D fayl yuboring (.glb / .usdz) yoki o\'tkazing:', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // ─── Document handler (3D files) ───
  bot.on('message:document', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const doc = ctx.message.document;
    const fileName = doc.file_name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (
      (session.action === 'add' && session.step === 'model') ||
      (session.action === 'edit' && session.step === 'edit_model')
    ) {
      if (ext !== 'glb' && ext !== 'usdz') {
        const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply('❌ Faqat .glb yoki .usdz fayllar qabul qilinadi. Qayta yuboring:', { reply_markup: kb });
        return;
      }

      await ctx.reply('⏳ Fayl yuklanmoqda...');

      const file = await ctx.api.getFile(doc.file_id);
      const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());

      const ts = Date.now();

      // Upload the original file
      const storagePath = `models/${ext}/${ts}.${ext}`;
      const contentType = ext === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, buffer, { contentType });

      if (uploadError) {
        console.error('3D upload error:', uploadError);
        const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
        await ctx.reply('❌ Fayl yuklashda xatolik. Qayta urinib ko\'ring.', { reply_markup: kb });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      // Auto-convert USDZ → GLB
      let convertedGlbUrl: string | null = null;
      if (ext === 'usdz') {
        try {
          await ctx.reply('🔄 USDZ → GLB konvertatsiya qilinmoqda...');
          const tmpDir = tmpdir();
          const inputPath = join(tmpDir, `${ts}.usdz`);
          const outputPath = join(tmpDir, `${ts}.glb`);
          writeFileSync(inputPath, buffer);

          // Run Blender headless to convert USDZ → GLB
          const scriptPath = join(__dirname, '..', '..', 'scripts', 'convert_usdz.py');
          const result = execSync(
            `blender --background --python "${scriptPath}" -- "${inputPath}" "${outputPath}"`,
            {
              timeout: 180000,
              stdio: ['pipe', 'pipe', 'pipe'],
            },
          );
          console.log('Conversion output:', result.toString().slice(-500));

          let glbBuffer = readFileSync(outputPath);

          // Optimize GLB if > 15MB using gltf-transform
          if (glbBuffer.length > 15 * 1024 * 1024) {
            try {
              const optimizedPath = join(tmpDir, `${ts}_opt.glb`);
              execSync(
                `gltf-transform optimize "${outputPath}" "${optimizedPath}" --compress meshopt --texture-compress webp`,
                { timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] },
              );
              glbBuffer = readFileSync(optimizedPath);
              try { unlinkSync(optimizedPath); } catch {}
            } catch {
              // Optimization failed — use unoptimized GLB
            }
          }

          const glbStoragePath = `models/glb/${ts}_converted.glb`;
          const { error: glbError } = await supabase.storage
            .from('media')
            .upload(glbStoragePath, glbBuffer, { contentType: 'model/gltf-binary' });

          if (!glbError) {
            const { data: { publicUrl: glbPublicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(glbStoragePath);
            convertedGlbUrl = glbPublicUrl;
          }

          // Cleanup temp files
          try { unlinkSync(inputPath); } catch {}
          try { unlinkSync(outputPath); } catch {}
        } catch (err: any) {
          const stderr = (err?.stderr?.toString?.() || err?.message || String(err)).slice(-500);
          console.error('USDZ→GLB conversion failed:', stderr);
          await ctx.reply(
            '⚠️ Avtomatik konvertatsiya ishlamadi.\n' +
            'Iltimos, .glb faylni alohida yuboring (Android uchun kerak).\n\n' +
            `_${stderr.slice(0, 200)}_`,
            { parse_mode: 'Markdown' },
          );
        }
      }

      // Optimize GLB if uploaded directly and > 15MB
      if (ext === 'glb' && buffer.length > 15 * 1024 * 1024) {
        try {
          await ctx.reply('🔄 GLB optimizatsiya qilinmoqda...');
          const tmpDir = tmpdir();
          const inputPath = join(tmpDir, `${ts}.glb`);
          const optimizedPath = join(tmpDir, `${ts}_opt.glb`);
          writeFileSync(inputPath, buffer);

          execSync(
            `gltf-transform optimize "${inputPath}" "${optimizedPath}" --compress meshopt --texture-compress webp`,
            { timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] },
          );

          const optBuffer = readFileSync(optimizedPath);

          // Re-upload optimized version
          await supabase.storage.from('media').remove([storagePath]);
          await supabase.storage.from('media').upload(storagePath, optBuffer, { contentType: 'model/gltf-binary' });

          try { unlinkSync(inputPath); } catch {}
          try { unlinkSync(optimizedPath); } catch {}

          const sizeMB = (optBuffer.length / (1024 * 1024)).toFixed(1);
          const origMB = (buffer.length / (1024 * 1024)).toFixed(1);
          await ctx.reply(`✅ Optimizatsiya: ${origMB}MB → ${sizeMB}MB`);
        } catch (err) {
          console.error('GLB optimization failed:', err);
          // Keep original file
        }
      }

      if (session.action === 'edit') {
        const update: Record<string, any> = { model_status: 'ready' };
        if (ext === 'glb') update.model_glb_url = publicUrl;
        if (ext === 'usdz') {
          update.model_usdz_url = publicUrl;
          if (convertedGlbUrl) update.model_glb_url = convertedGlbUrl;
        }
        await supabase.from('menu_items').update(update).eq('id', session.data.itemId);
        sessions.delete(ctx.chat.id);
        const kb = new InlineKeyboard()
          .text('✏️ Yana tahrirlash', 'a_edit')
          .text('⬅️ Admin panel', 'admin_panel');
        const extra = convertedGlbUrl ? '\n🔄 GLB avtomatik yaratildi!' : '';
        await ctx.reply(`✅ 3D model (.${ext}) yangilandi!${extra}`, { reply_markup: kb });
        return;
      }

      // Add flow
      if (ext === 'glb') session.data.modelGlbUrl = publicUrl;
      if (ext === 'usdz') {
        session.data.modelUsdzUrl = publicUrl;
        if (convertedGlbUrl) session.data.modelGlbUrl = convertedGlbUrl;
      }

      const hasGlb = !!session.data.modelGlbUrl;
      const hasUsdz = !!session.data.modelUsdzUrl;
      const kb = new InlineKeyboard()
        .text('Tayyor, davom etish →', 'aamodel_done');
      const extra = convertedGlbUrl ? '\n🔄 GLB avtomatik yaratildi!' : '';
      // Warn about platform compatibility
      let warning = '';
      if (!hasGlb) warning += '\n⚠️ *Android telefonlarda AR ishlamaydi* (.glb kerak).';
      if (!hasUsdz) warning += '\n💡 iOS-da yaxshiroq AR uchun .usdz ham yuborishingiz mumkin.';
      await ctx.reply(
        `✅ .${ext} yuklandi!${extra}${warning}\n\nBoshqa formatni ham yuborishingiz mumkin yoki davom eting:`,
        { parse_mode: 'Markdown', reply_markup: kb },
      );
      return;
    }

    return next();
  });
}
