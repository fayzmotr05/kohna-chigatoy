import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';

interface BookingSession {
  step: 'date' | 'time' | 'size' | 'name' | 'phone' | 'confirm';
  date?: string;
  time?: string;
  partySize?: number;
  customerName?: string;
  customerPhone?: string;
}

const sessions = new Map<number, BookingSession>();

export function registerBookingHandlers(bot: Bot) {
  // Start booking
  bot.callbackQuery('booking_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    sessions.set(chatId, { step: 'date' });
    await ctx.reply(
      '📅 *Stol band qilish*\n\nSanani kiriting (masalan: 15.03.2026):',
      { parse_mode: 'Markdown' },
    );
  });

  // Handle text for booking flow
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = sessions.get(chatId);
    if (!session) return next();

    const text = ctx.message.text.trim();

    if (session.step === 'date') {
      // Parse date dd.mm.yyyy
      const parts = text.split(/[./\-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        session.date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
        session.date = text;
      }
      session.step = 'time';
      await ctx.reply('🕐 Vaqtni kiriting (masalan: 19:00):');
      return;
    }

    if (session.step === 'time') {
      session.time = text;
      session.step = 'size';
      await ctx.reply('👥 Nechta kishi uchun?');
      return;
    }

    if (session.step === 'size') {
      session.partySize = parseInt(text) || 1;
      session.step = 'name';
      await ctx.reply('👤 Ismingizni yozing:');
      return;
    }

    if (session.step === 'name') {
      session.customerName = text;
      session.step = 'phone';
      await ctx.reply('📞 Telefon raqamingizni yozing:');
      return;
    }

    if (session.step === 'phone') {
      session.customerPhone = text;
      session.step = 'confirm';

      const keyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', 'booking_confirm')
        .text('❌ Bekor qilish', 'booking_cancel');

      await ctx.reply(
        `📅 *Band qilish ma'lumotlari:*\n\n` +
        `📅 Sana: ${session.date}\n` +
        `🕐 Vaqt: ${session.time}\n` +
        `👥 Kishilar: ${session.partySize}\n` +
        `👤 Ism: ${session.customerName}\n` +
        `📞 Tel: ${session.customerPhone}\n\n` +
        `Tasdiqlaysizmi?`,
        { parse_mode: 'Markdown', reply_markup: keyboard },
      );
      return;
    }

    return next();
  });

  // Confirm booking
  bot.callbackQuery('booking_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const session = sessions.get(chatId);
    if (!session) return;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: session.customerName!,
        customer_phone: session.customerPhone!,
        telegram_chat_id: chatId,
        date: session.date!,
        time: session.time!,
        party_size: session.partySize!,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Booking insert error:', error);
      return ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }

    // Notify admin
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      const adminKeyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', `bconfirm_${booking.id}`)
        .text('❌ Bekor qilish', `bcancel_${booking.id}`);

      await ctx.api.sendMessage(
        adminChatId,
        `📅 *Yangi band*\n\n` +
        `👤 ${session.customerName} | 📞 ${session.customerPhone}\n` +
        `📅 ${session.date} | 🕐 ${session.time}\n` +
        `👥 ${session.partySize} kishi`,
        { parse_mode: 'Markdown', reply_markup: adminKeyboard },
      );
    }

    sessions.delete(chatId);

    await ctx.editMessageText(
      `✅ *Band qilish qabul qilindi!*\n\n` +
      `Tez orada tasdiqlaymiz.\nRahmat! 🙏`,
      { parse_mode: 'Markdown' },
    );
  });

  // Cancel booking
  bot.callbackQuery('booking_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    sessions.delete(ctx.chat!.id);
    await ctx.editMessageText('❌ Band qilish bekor qilindi.');
  });

  // Admin confirm/cancel booking
  bot.callbackQuery(/^bconfirm_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Tasdiqlandi!');
    const bookingId = ctx.match![1];
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n✅ TASDIQLANDI', {
      parse_mode: 'Markdown',
    });
  });

  bot.callbackQuery(/^bcancel_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Bekor qilindi!');
    const bookingId = ctx.match![1];
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n❌ BEKOR QILINDI', {
      parse_mode: 'Markdown',
    });
  });
}
