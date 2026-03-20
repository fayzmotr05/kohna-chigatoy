import { Context, InlineKeyboard, Keyboard } from 'grammy';
import { supabase } from '../supabase';

interface RegSession {
  step: 'contact' | 'name';
  phone?: string;
  afterAction: 'order' | 'booking';
}

const regSessions = new Map<number, RegSession>();

export function getRegSession(chatId: number): RegSession | undefined {
  return regSessions.get(chatId);
}

export function clearRegSession(chatId: number): void {
  regSessions.delete(chatId);
}

/** Check if user is registered. Returns user data or null. */
export async function getRegisteredUser(telegramId: number) {
  const { data } = await supabase
    .from('telegram_users')
    .select('name, phone')
    .eq('telegram_id', telegramId)
    .single();
  return data;
}

/** Start registration flow. afterAction = what to do after registration completes. */
export async function startRegistration(ctx: Context, afterAction: 'order' | 'booking') {
  const chatId = ctx.chat!.id;
  regSessions.set(chatId, { step: 'contact', afterAction });

  const contactKeyboard = new Keyboard()
    .requestContact('📱 Kontaktni ulashish')
    .resized()
    .oneTime();

  await ctx.reply(
    '📝 *Ro\'yxatdan o\'tish*\n\n' +
    'Buyurtma berish uchun telefon raqamingizni ulashing.\n' +
    'Pastdagi tugmani bosing:',
    { parse_mode: 'Markdown', reply_markup: contactKeyboard },
  );
}

/** Handle shared contact message. Returns afterAction if registration is complete. */
export async function handleContact(ctx: Context): Promise<string | null> {
  const chatId = ctx.chat!.id;
  const session = regSessions.get(chatId);
  if (!session || session.step !== 'contact') return null;

  const contact = ctx.message?.contact;
  if (!contact) return null;

  session.phone = contact.phone_number;
  session.step = 'name';

  // Pre-fill name from Telegram profile
  const firstName = ctx.from?.first_name || '';
  const lastName = ctx.from?.last_name || '';
  const suggestedName = `${firstName} ${lastName}`.trim();

  if (suggestedName) {
    const kb = new InlineKeyboard()
      .text(`✅ ${suggestedName}`, `reg_name_confirm`)
      .row()
      .text('✏️ Boshqa ism yozish', 'reg_name_custom');
    await ctx.reply(
      `👤 Ismingiz: *${suggestedName}*\n\nTo'g'rimi?`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
        // Remove the contact keyboard
      },
    );
    // Store suggested name for confirm button
    session.phone = contact.phone_number;
    (session as any).suggestedName = suggestedName;
  } else {
    await ctx.reply('👤 Ismingizni yozing:', {
      reply_markup: { remove_keyboard: true },
    });
  }

  return null;
}

/** Handle name confirmation button */
export async function handleNameConfirm(ctx: Context): Promise<string | null> {
  const chatId = ctx.chat!.id;
  const session = regSessions.get(chatId);
  if (!session) return null;

  const name = (session as any).suggestedName;
  return await completeRegistration(ctx, chatId, session, name);
}

/** Handle custom name text input */
export async function handleNameText(ctx: Context, text: string): Promise<string | null> {
  const chatId = ctx.chat!.id;
  const session = regSessions.get(chatId);
  if (!session || session.step !== 'name') return null;

  return await completeRegistration(ctx, chatId, session, text);
}

async function completeRegistration(
  ctx: Context,
  chatId: number,
  session: RegSession,
  name: string,
): Promise<string> {
  const telegramId = ctx.from!.id;

  await supabase.from('telegram_users').upsert({
    telegram_id: telegramId,
    phone: session.phone!,
    name,
    language_code: ctx.from?.language_code || null,
  }, { onConflict: 'telegram_id' });

  const afterAction = session.afterAction;
  regSessions.delete(chatId);

  await ctx.reply(
    `✅ *Ro'yxatdan o'tdingiz!*\n\n👤 ${name}\n📞 ${session.phone}`,
    { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } },
  );

  return afterAction;
}
