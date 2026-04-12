import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';
import { isAdmin } from '../middleware/auth';

function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

/** Build the main menu keyboard */
function mainMenuKeyboard(siteUrl: string, showAdmin: boolean): InlineKeyboard {
  const kb = new InlineKeyboard()
    .webApp('📋 Menyu', `${siteUrl}/menu`)
    .text('🛒 Buyurtma', 'order_start')
    .row()
    .webApp('📅 Band qilish', `${siteUrl}/menu?action=book`)
    .text('ℹ️ Ma\'lumot', 'info')
    .row()
    .text('📋 Menyu (text)', 'menu_main');
  if (showAdmin) {
    kb.row().text('⚙️ Admin panel', 'admin_panel');
  }
  return kb;
}

export function registerMenuHandlers(bot: Bot) {
  const siteUrl = () => process.env.SITE_URL || 'https://kohnachigatoy.uz';

  // ─── Set bot commands on startup ───
  bot.api.setMyCommands([
    { command: 'start', description: 'Bosh menyu' },
    { command: 'menu', description: 'Menyuni ko\'rish' },
    { command: 'help', description: 'Yordam' },
    { command: 'cancel', description: 'Bekor qilish' },
  ]).catch(() => {});

  // ─── /start — Main menu (with deep link support) ───
  bot.command('start', async (ctx) => {
    const param = ctx.match?.trim();

    // Deep link: t.me/bot?start=book → open Mini App booking
    if (param === 'book') {
      const kb = new InlineKeyboard()
        .webApp('📅 Band qilish', `${siteUrl()}/menu?action=book`)
        .row()
        .text('🏠 Bosh menyu', 'go_home');
      await ctx.reply('📅 *Stol band qilish*\n\nQuyidagi tugmani bosing:', {
        parse_mode: 'Markdown',
        reply_markup: kb,
      });
      return;
    }

    const kb = mainMenuKeyboard(siteUrl(), isAdmin(ctx));
    await ctx.reply(
      '🏠 *Ko\'hna Chig\'atoy*\nOilaviy restoranga xush kelibsiz!\n\nQuyidagidan tanlang:',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ─── /menu — Shortcut to text menu ───
  bot.command('menu', async (ctx) => {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      return ctx.reply('Hozircha menyu bo\'sh.');
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name_uz}`, `cat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    keyboard.row().text('🏠 Bosh menyu', 'go_home');

    await ctx.reply('📋 *Menyu*\n\nKategoriyani tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // ─── /help — Help message ───
  bot.command('help', async (ctx) => {
    const lines = [
      '❓ *Yordam*\n',
      '📋 *Menyu* — taomlar ro\'yxatini ko\'rish',
      '🛒 *Buyurtma* — Mini App orqali buyurtma berish',
      '📅 *Band qilish* — stol band qilish',
      'ℹ️ *Ma\'lumot* — restoran haqida ma\'lumot',
      '',
      'Bosh menyuga qaytish uchun /start bosing.',
    ];
    if (isAdmin(ctx)) {
      lines.push(
        '',
        '⚙️ *Admin buyruqlar:*',
        '/admin — Admin panel',
      );
    }
    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
    await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown', reply_markup: kb });
  });

  // ─── /cancel — Universal flow cancellation ───
  bot.command('cancel', async (ctx) => {
    // Emit a custom event that other handlers can listen for
    // For now, just clear context and go home
    const kb = mainMenuKeyboard(siteUrl(), isAdmin(ctx));
    await ctx.reply('❌ Bekor qilindi.\n\nQuyidagidan tanlang:', { reply_markup: kb });
  });

  // ─── "Go Home" callback — sends a new main menu message ───
  bot.callbackQuery('go_home', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = mainMenuKeyboard(siteUrl(), isAdmin(ctx));
    await ctx.editMessageText(
      '🏠 *Ko\'hna Chig\'atoy*\nOilaviy restoranga xush kelibsiz!\n\nQuyidagidan tanlang:',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // Also handle go_home_new (when we can't edit, e.g. after photo messages)
  bot.callbackQuery('go_home_new', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = mainMenuKeyboard(siteUrl(), isAdmin(ctx));
    await ctx.reply(
      '🏠 *Ko\'hna Chig\'atoy*\nOilaviy restoranga xush kelibsiz!\n\nQuyidagidan tanlang:',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ─── Info callback ───
  bot.callbackQuery('info', async (ctx) => {
    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
    await ctx.editMessageText(
      '📍 *Ko\'hna Chig\'atoy*\n\n' +
      '🕐 Ish vaqti: 10:00 — 23:00\n' +
      '📞 Telefon: +998 99 222 09 09\n' +
      '📍 Manzil: Matlubot 17, Chig\'atoy, Toshkent\n\n' +
      '🌐 Sayt: kohnachigatoy.uz\n' +
      '📸 Instagram: @kohnachigatoy',
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ─── Menu main — show categories ───
  bot.callbackQuery('menu_main', async (ctx) => {
    await ctx.answerCallbackQuery();

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('Hozircha menyu bo\'sh.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name_uz}`, `cat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    keyboard.row().text('🏠 Bosh menyu', 'go_home');

    await ctx.editMessageText('📋 *Menyu*\n\nKategoriyani tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // ─── Category items ───
  bot.callbackQuery(/^cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const categoryId = ctx.match![1];

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name_uz, price')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('name_uz');

    if (!items?.length) {
      const kb = new InlineKeyboard()
        .text('⬅️ Orqaga', 'menu_main')
        .text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('Bu kategoriyada hozircha taom yo\'q.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      const price = formatPrice(item.price);
      keyboard.text(`${item.name_uz} — ${price}`, `item_${item.id}`).row();
    });
    keyboard.text('⬅️ Orqaga', 'menu_main').text('🏠 Bosh menyu', 'go_home');

    await ctx.editMessageText('🍽 Taomni tanlang:', {
      reply_markup: keyboard,
    });
  });

  // ─── Item detail ───
  bot.callbackQuery(/^item_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];

    const { data: item } = await supabase
      .from('menu_items')
      .select('*, categories(name_uz)')
      .eq('id', itemId)
      .single();

    if (!item) {
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home_new');
      return ctx.reply('Taom topilmadi.', { reply_markup: kb });
    }

    const price = formatPrice(item.price);
    const text =
      `*${item.name_uz}*\n\n` +
      `${item.description_uz}\n\n` +
      `💰 *${price} UZS*` +
      (item.is_featured ? '\n⭐ Tavsiya etiladi' : '');

    const keyboard = new InlineKeyboard();
    if (item.model_glb_url) {
      keyboard.url('🔮 AR ko\'rish', `${siteUrl()}/menu?ar=${item.id}`).row();
    }
    keyboard
      .text('⬅️ Orqaga', `cat_${item.category_id}`)
      .text('🏠 Bosh menyu', 'go_home_new');

    if (item.image_url) {
      await ctx.replyWithPhoto(item.image_url, {
        caption: text,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  });
}
