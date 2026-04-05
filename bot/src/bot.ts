import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from './supabase';
import { registerMenuHandlers } from './handlers/menu';
import { registerOrderHandlers } from './handlers/order';
import { registerBookingHandlers, getBookingSession, startBookingForUser } from './handlers/booking';
import { registerAdminHandlers } from './handlers/admin';
import {
  getRegSession,
  handleContact,
  handleNameConfirm,
  handleNameText,
} from './helpers/registration';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err.message);
  });

  // ─── Registration: contact shared ───
  bot.on('message:contact', async (ctx) => {
    const result = await handleContact(ctx);
    if (result) {
      await continueAfterRegistration(ctx, result);
    }
  });

  // ─── Registration: confirm suggested name ───
  bot.callbackQuery('reg_name_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const result = await handleNameConfirm(ctx);
    if (result) {
      await continueAfterRegistration(ctx, result);
    }
  });

  // ─── Registration: user wants to type custom name ───
  bot.callbackQuery('reg_name_custom', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('👤 Ismingizni yozing:');
  });

  // Register all handlers
  registerMenuHandlers(bot);
  registerOrderHandlers(bot);
  registerBookingHandlers(bot);
  registerAdminHandlers(bot);

  // ─── Text handler: registration name + booking date ───
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.trim();

    // Skip commands
    if (text.startsWith('/')) return;

    // Registration: custom name input
    const regSession = getRegSession(chatId);
    if (regSession && regSession.step === 'name') {
      const result = await handleNameText(ctx, text);
      if (result) {
        await continueAfterRegistration(ctx, result);
      }
      return;
    }

    // Booking: date input
    const bookingSession = getBookingSession(chatId);
    if (bookingSession && bookingSession.step === 'date') {
      const parts = text.split(/[./\-]/);
      const now = new Date();
      let dateStr: string;

      if (parts.length === 2) {
        const [d, m] = parts;
        dateStr = `${now.getFullYear()}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        dateStr = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
        await ctx.reply('❌ Noto\'g\'ri format. Masalan: 25.03 yoki 25.03.2026');
        return;
      }

      const bookDate = new Date(dateStr);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (bookDate < today) {
        await ctx.reply('❌ O\'tgan sana. Bugungi yoki kelajak sanani kiriting:');
        return;
      }

      bookingSession.date = dateStr;
      bookingSession.step = 'time';

      const times = [
        '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00',
        '21:00', '22:00',
      ];
      const kb = new InlineKeyboard();
      times.forEach((t, i) => {
        kb.text(t, `btime_${t}`);
        if ((i + 1) % 3 === 0) kb.row();
      });
      if (times.length % 3 !== 0) kb.row();
      kb.text('❌ Bekor qilish', 'booking_cancel');

      await ctx.reply(
        '📅 *Band qilish* (2/3)\n\n🕐 Vaqtni tanlang:',
        { parse_mode: 'Markdown', reply_markup: kb },
      );
      return;
    }
  });

  return bot;
}

// ─── Continue to the original action after registration ───
async function continueAfterRegistration(ctx: any, afterAction: string) {
  if (afterAction === 'order') {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home_new');
      await ctx.reply('Menyu bo\'sh.', { reply_markup: kb });
      return;
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat: any, i: number) => {
      keyboard.text(`${cat.icon || ''} ${cat.name_uz}`, `ocat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (categories.length % 2 === 1) keyboard.row();
    keyboard.text('🏠 Bosh menyu', 'go_home_new');

    await ctx.reply('🛒 *Buyurtma*\n\nKategoriyani tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } else if (afterAction === 'booking') {
    await startBookingForUser(ctx);
  }
}
