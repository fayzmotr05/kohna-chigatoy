import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';
import { getRegisteredUser, startRegistration } from '../helpers/registration';

interface BookingSession {
  step: 'date' | 'time' | 'size' | 'confirm';
  date?: string;
  time?: string;
  partySize?: string;
}

const bookingSessions = new Map<number, BookingSession>();

export function getBookingSession(chatId: number): BookingSession | undefined {
  return bookingSessions.get(chatId);
}

export function clearBookingSession(chatId: number): void {
  bookingSessions.delete(chatId);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function registerBookingHandlers(bot: Bot) {
  const siteUrl = () => process.env.SITE_URL || 'https://kohnachigatoy.uz';

  // ─── Start booking — choose bot or Mini App ───
  bot.callbackQuery('booking_start', async (ctx) => {
    await ctx.answerCallbackQuery();

    const keyboard = new InlineKeyboard()
      .text('🤖 Bot orqali band qilish', 'booking_check_reg')
      .row()
      .webApp('📱 Mini App orqali', `${siteUrl()}/menu?action=book`)
      .row()
      .text('🏠 Bosh menyu', 'go_home');

    await ctx.editMessageText(
      '📅 *Stol band qilish*\n\nQanday band qilmoqchisiz?',
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ─── Check registration before booking ───
  bot.callbackQuery('booking_check_reg', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = await getRegisteredUser(ctx.from!.id);

    if (!user) {
      await startRegistration(ctx, 'booking');
      return;
    }

    await startBookingFlow(ctx);
  });

  // ─── Start booking flow (after registration) ───
  async function startBookingFlow(ctx: any) {
    const chatId = ctx.chat!.id;
    bookingSessions.set(chatId, { step: 'date' });

    const cancelKb = new InlineKeyboard()
      .text('❌ Bekor qilish', 'booking_cancel')
      .row()
      .text('🏠 Bosh menyu', 'go_home');

    try {
      await ctx.editMessageText(
        '📅 *Band qilish* (1/3)\n\n' +
        '📆 Sanani yozing (masalan: 25.03 yoki 25.03.2026):',
        { parse_mode: 'Markdown', reply_markup: cancelKb },
      );
    } catch {
      await ctx.reply(
        '📅 *Band qilish* (1/3)\n\n' +
        '📆 Sanani yozing (masalan: 25.03 yoki 25.03.2026):',
        { parse_mode: 'Markdown', reply_markup: cancelKb },
      );
    }
  }

  // ─── Handle date text input ───
  // (wired from bot.ts text handler)

  // ─── Time selection buttons ───
  function timeKeyboard(): InlineKeyboard {
    const kb = new InlineKeyboard();
    const times = [
      '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00',
      '21:00', '22:00',
    ];
    times.forEach((t, i) => {
      kb.text(t, `btime_${t}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    if (times.length % 3 !== 0) kb.row();
    kb.text('❌ Bekor qilish', 'booking_cancel');
    return kb;
  }

  // ─── Party size buttons ───
  function partySizeKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
      .text('1-2 kishi', 'bsize_1-2')
      .text('3-4 kishi', 'bsize_3-4')
      .row()
      .text('5-6 kishi', 'bsize_5-6')
      .text('7+ kishi', 'bsize_7+')
      .row()
      .text('❌ Bekor qilish', 'booking_cancel');
  }

  // ─── Time selected ───
  bot.callbackQuery(/^btime_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const session = bookingSessions.get(chatId);
    if (!session || session.step !== 'time') return;

    session.time = ctx.match![1];
    session.step = 'size';

    await ctx.editMessageText(
      '📅 *Band qilish* (3/3)\n\n👥 Nechta kishi uchun?',
      { parse_mode: 'Markdown', reply_markup: partySizeKeyboard() },
    );
  });

  // ─── Party size selected ───
  bot.callbackQuery(/^bsize_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const session = bookingSessions.get(chatId);
    if (!session || session.step !== 'size') return;

    session.partySize = ctx.match![1];
    session.step = 'confirm';

    const user = await getRegisteredUser(ctx.from!.id);
    if (!user) return;

    const keyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash', 'booking_confirm')
      .text('❌ Bekor qilish', 'booking_cancel');

    await ctx.editMessageText(
      `📅 *Band qilish ma'lumotlari:*\n\n` +
      `👤 ${user.name}\n📞 ${user.phone}\n\n` +
      `📆 Sana: ${formatDate(session.date!)}\n` +
      `🕐 Vaqt: ${session.time}\n` +
      `👥 Kishilar: ${session.partySize}\n\n` +
      `Tasdiqlaysizmi?`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ─── Confirm booking ───
  bot.callbackQuery('booking_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const session = bookingSessions.get(chatId);
    if (!session) return;

    const user = await getRegisteredUser(ctx.from!.id);
    if (!user) return;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: user.name,
        customer_phone: user.phone,
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
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
      return ctx.reply('❌ Xatolik yuz berdi.', { reply_markup: kb });
    }

    // Notify admin group
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      const adminKeyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', `bconfirm_${booking.id}`)
        .text('❌ Bekor qilish', `bcancel_${booking.id}`);

      await ctx.api.sendMessage(
        adminChatId,
        `📅 *Yangi band*\n\n` +
        `👤 ${user.name} | 📞 ${user.phone}\n` +
        `📆 ${formatDate(session.date!)} | 🕐 ${session.time}\n` +
        `👥 ${session.partySize} kishi`,
        { parse_mode: 'Markdown', reply_markup: adminKeyboard },
      );
    }

    bookingSessions.delete(chatId);

    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home_new');
    await ctx.editMessageText(
      `✅ *Band qilish qabul qilindi!*\n\n` +
      `Tez orada tasdiqlaymiz.\nRahmat! 🙏`,
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ─── Cancel booking ───
  bot.callbackQuery('booking_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    bookingSessions.delete(ctx.chat!.id);
    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
    await ctx.editMessageText('❌ Band qilish bekor qilindi.', { reply_markup: kb });
  });

  // ─── Admin confirm booking → notify customer ───
  bot.callbackQuery(/^bconfirm_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Tasdiqlandi!');
    const bookingId = ctx.match![1];

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);

    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n✅ TASDIQLANDI', {
      parse_mode: 'Markdown',
    });

    // Notify customer
    if (booking.telegram_chat_id) {
      await ctx.api.sendMessage(
        booking.telegram_chat_id,
        `✅ *Band qilish tasdiqlandi!*\n\n` +
        `📆 ${formatDate(booking.date)} | 🕐 ${booking.time}\n` +
        `👥 ${booking.party_size} kishi\n\n` +
        `Sizni kutamiz! 🍽`,
        { parse_mode: 'Markdown' },
      ).catch(() => {});
    }
  });

  // ─── Admin cancel booking → notify customer ───
  bot.callbackQuery(/^bcancel_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Bekor qilindi!');
    const bookingId = ctx.match![1];

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);

    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n❌ BEKOR QILINDI', {
      parse_mode: 'Markdown',
    });

    // Notify customer
    if (booking.telegram_chat_id) {
      await ctx.api.sendMessage(
        booking.telegram_chat_id,
        `❌ *Band qilish bekor qilindi.*\n\n` +
        `Savollar bo'lsa, biz bilan bog'laning:\n📞 +998 99 222 09 09`,
        { parse_mode: 'Markdown' },
      ).catch(() => {});
    }
  });

}

/** Start booking flow for a registered user — called after registration completes */
export async function startBookingForUser(ctx: any) {
  const chatId = ctx.chat!.id;
  bookingSessions.set(chatId, { step: 'date' });

  const { InlineKeyboard } = await import('grammy');
  const cancelKb = new InlineKeyboard()
    .text('❌ Bekor qilish', 'booking_cancel')
    .row()
    .text('🏠 Bosh menyu', 'go_home_new');

  await ctx.reply(
    '📅 *Band qilish* (1/3)\n\n' +
    '📆 Sanani yozing (masalan: 25.03 yoki 25.03.2026):',
    { parse_mode: 'Markdown', reply_markup: cancelKb },
  );
}
