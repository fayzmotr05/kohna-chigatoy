import { NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validateInitData';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const initData = request.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const result = validateInitData(initData);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const supabase = createServerClient();

  // Check user is registered
  const { data: tgUser } = await supabase
    .from('telegram_users')
    .select('name, phone')
    .eq('telegram_id', result.user.id)
    .single();

  if (!tgUser) {
    return NextResponse.json({ error: 'Not registered' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { date, time, party_size, notes } = body;

  // Validate date (must be tomorrow or later)
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (bookingDate < tomorrow) {
    return NextResponse.json({ error: 'Booking must be at least 1 day in advance' }, { status: 400 });
  }

  // Validate time (10:00 - 22:00)
  const [hours] = time.split(':').map(Number);
  if (hours < 10 || hours > 22) {
    return NextResponse.json({ error: 'Booking time must be between 10:00 and 22:00' }, { status: 400 });
  }

  // Validate party size
  if (!party_size || party_size < 1 || party_size > 60) {
    return NextResponse.json({ error: 'Party size must be between 1 and 60' }, { status: 400 });
  }

  // Insert booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_name: tgUser.name,
      customer_phone: tgUser.phone,
      telegram_chat_id: result.user.id,
      date,
      time,
      party_size,
      notes: notes || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Booking insert error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  // Notify admin via Telegram Bot API (with confirm/cancel buttons)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (adminChatId && botToken) {
    const text =
      `📅 Yangi band qilish #${booking.id.slice(0, 8)}\n\n` +
      `👤 ${tgUser.name}\n` +
      `📞 ${tgUser.phone}\n` +
      `📱 Mini App orqali\n\n` +
      `📅 ${date}\n` +
      `🕐 ${time}\n` +
      `👥 ${party_size} kishi\n` +
      (notes ? `📝 ${notes}\n` : '');

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Tasdiqlash', callback_data: `bconfirm_${booking.id}` },
                { text: '❌ Bekor qilish', callback_data: `bcancel_${booking.id}` },
              ],
            ],
          },
        }),
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  }

  return NextResponse.json({ success: true, bookingId: booking.id });
}
