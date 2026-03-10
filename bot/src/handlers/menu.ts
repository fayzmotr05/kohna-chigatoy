import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';

export function registerMenuHandlers(bot: Bot) {
  // /start — show main menu
  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('📋 Menu', 'menu_main')
      .text('🛒 Buyurtma', 'order_start')
      .row()
      .text('📅 Band qilish', 'booking_start')
      .text('ℹ️ Ma\'lumot', 'info');

    await ctx.reply(
      '🏠 *Ko\'hna Chig\'atoy*\nOilaviy Restoranga xush kelibsiz!\n\nQuyidagidan tanlang:',
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // Info callback
  bot.callbackQuery('info', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      '📍 *Ko\'hna Chig\'atoy*\n\n' +
      '🕐 Ish vaqti: 10:00 — 23:00\n' +
      '📞 Telefon: +998 XX XXX XX XX\n' +
      '📍 Manzil: Toshkent shahri\n\n' +
      '🌐 Sayt: kohnachigatoy.uz',
      { parse_mode: 'Markdown' },
    );
  });

  // Menu main — show categories
  bot.callbackQuery('menu_main', async (ctx) => {
    await ctx.answerCallbackQuery();

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      return ctx.reply('Hozircha menyu bo\'sh.');
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name}`, `cat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });

    await ctx.editMessageText('📋 *Menyu*\n\nKategoriyani tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Category items
  bot.callbackQuery(/^cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const categoryId = ctx.match![1];

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('name');

    if (!items?.length) {
      return ctx.reply('Bu kategoriyada hozircha taom yo\'q.');
    }

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      const price = Math.round(item.price).toLocaleString('uz-UZ').replace(/,/g, ' ');
      keyboard.text(`${item.name} — ${price}`, `item_${item.id}`).row();
    });
    keyboard.text('⬅️ Orqaga', 'menu_main');

    await ctx.editMessageText('Taomni tanlang:', {
      reply_markup: keyboard,
    });
  });

  // Item detail
  bot.callbackQuery(/^item_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];

    const { data: item } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('id', itemId)
      .single();

    if (!item) return ctx.reply('Taom topilmadi.');

    const price = Math.round(item.price).toLocaleString('uz-UZ').replace(/,/g, ' ');
    const text =
      `*${item.name}*\n\n` +
      `${item.description}\n\n` +
      `💰 *${price} UZS*` +
      (item.is_featured ? '\n⭐ Tavsiya etiladi' : '');

    const keyboard = new InlineKeyboard()
      .text('⬅️ Orqaga', `cat_${item.category_id}`);

    if (item.model_glb_url) {
      keyboard.url('🔮 AR ko\'rish', `${process.env.SITE_URL}/menu?ar=${item.id}`);
    }

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
