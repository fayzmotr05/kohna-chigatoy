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

  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Re-fetch current prices from DB (prevents stale cart / price manipulation)
  const itemIds = items.map((i: { id: string }) => i.id);
  const { data: dbItems } = await supabase
    .from('menu_items')
    .select('id, name, price, is_available')
    .in('id', itemIds);

  if (!dbItems) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }

  // Validate all items are available
  const unavailable = dbItems.filter((i) => !i.is_available);
  if (unavailable.length > 0) {
    return NextResponse.json({
      error: `Unavailable: ${unavailable.map((i) => i.name).join(', ')}`,
    }, { status: 400 });
  }

  // Build order items with DB prices
  const dbItemMap = new Map(dbItems.map((i) => [i.id, i]));
  const orderItems = items
    .map((i: { id: string; quantity: number }) => {
      const dbItem = dbItemMap.get(i.id);
      if (!dbItem) return null;
      return {
        id: dbItem.id,
        name: dbItem.name,
        price: Number(dbItem.price),
        qty: i.quantity,
      };
    })
    .filter(Boolean);

  if (orderItems.length === 0) {
    return NextResponse.json({ error: 'No valid items' }, { status: 400 });
  }

  const total = orderItems.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0,
  );

  // Insert order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_name: tgUser.name,
      customer_phone: tgUser.phone,
      telegram_chat_id: result.user.id,
      items: orderItems,
      total,
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Order insert error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  // Notify admin via Telegram Bot API (with confirm/cancel buttons)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (adminChatId && botToken) {
    const itemLines = orderItems
      .map((i: any) => `• ${i.name} x${i.qty} — ${formatTgPrice(i.price * i.qty)}`)
      .join('\n');

    const text =
      `🆕 Yangi buyurtma #${order.id.slice(0, 8)}\n\n` +
      `👤 ${tgUser.name}\n` +
      `📞 ${tgUser.phone}\n` +
      `📱 Mini App orqali\n\n` +
      `${itemLines}\n\n` +
      `💰 Jami: ${formatTgPrice(total)} UZS`;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Tasdiqlash', callback_data: `aconfirm_${order.id}` },
                { text: '❌ Bekor qilish', callback_data: `acancel_${order.id}` },
              ],
            ],
          },
        }),
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  }

  return NextResponse.json({ success: true, orderId: order.id });
}

function formatTgPrice(n: number): string {
  return Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
}
