import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';

// In-memory cart storage
interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartSession {
  items: CartItem[];
  step: 'browsing' | 'name' | 'phone' | 'confirm';
  customerName?: string;
  customerPhone?: string;
}

const carts = new Map<number, CartSession>();

function getCart(chatId: number): CartSession {
  if (!carts.has(chatId)) {
    carts.set(chatId, { items: [], step: 'browsing' });
  }
  return carts.get(chatId)!;
}

function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

function cartTotal(cart: CartSession): number {
  return cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartText(cart: CartSession): string {
  if (!cart.items.length) return '🛒 Savat bo\'sh';
  const lines = cart.items.map(
    (i) => `• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`,
  );
  lines.push('', `💰 Jami: *${formatPrice(cartTotal(cart))} UZS*`);
  return lines.join('\n');
}

export function registerOrderHandlers(bot: Bot) {
  // Start order — show categories
  bot.callbackQuery('order_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    carts.set(chatId, { items: [], step: 'browsing' });

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) return ctx.reply('Menyu hozircha bo\'sh.');

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name}`, `ocat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    keyboard.row().text('🛒 Savatni ko\'rish', 'cart_view');

    await ctx.editMessageText('🛒 *Buyurtma berish*\n\nKategoriyani tanlang:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Order category — show items
  bot.callbackQuery(/^ocat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const categoryId = ctx.match![1];

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('name');

    if (!items?.length) return ctx.reply('Bu kategoriyada taom yo\'q.');

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      keyboard
        .text(`${item.name} (${formatPrice(item.price)})`, `oadd_${item.id}`)
        .row();
    });
    keyboard.text('⬅️ Orqaga', 'order_start').text('🛒 Savat', 'cart_view');

    await ctx.editMessageText('Taomni tanlang:', { reply_markup: keyboard });
  });

  // Add item to cart
  bot.callbackQuery(/^oadd_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];
    const chatId = ctx.chat!.id;
    const cart = getCart(chatId);

    const existing = cart.items.find((i) => i.id === itemId);
    if (existing) {
      existing.qty++;
    } else {
      const { data: item } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('id', itemId)
        .single();
      if (!item) return;
      cart.items.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }

    const keyboard = new InlineKeyboard()
      .text('➕ Yana qo\'shish', 'order_start')
      .text('🛒 Savatni ko\'rish', 'cart_view');

    await ctx.editMessageText(
      `✅ Qo'shildi!\n\n${cartText(cart)}`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // View cart
  bot.callbackQuery('cart_view', async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);

    if (!cart.items.length) {
      const kb = new InlineKeyboard().text('📋 Menyu', 'order_start');
      return ctx.editMessageText('🛒 Savat bo\'sh. Avval taom tanlang.', {
        reply_markup: kb,
      });
    }

    const keyboard = new InlineKeyboard();
    cart.items.forEach((item) => {
      keyboard
        .text(`❌ ${item.name}`, `orem_${item.id}`)
        .text(`-`, `odec_${item.id}`)
        .text(`${item.qty}`, `noop`)
        .text(`+`, `oinc_${item.id}`)
        .row();
    });
    keyboard
      .text('➕ Yana qo\'shish', 'order_start')
      .text('✅ Buyurtma berish', 'checkout')
      .row();

    await ctx.editMessageText(`🛒 *Savat:*\n\n${cartText(cart)}`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Increment/decrement/remove
  bot.callbackQuery(/^oinc_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    const item = cart.items.find((i) => i.id === ctx.match![1]);
    if (item) item.qty++;
    return ctx.callbackQuery.data = 'cart_view';
  });

  bot.callbackQuery(/^odec_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    const idx = cart.items.findIndex((i) => i.id === ctx.match![1]);
    if (idx >= 0) {
      cart.items[idx].qty--;
      if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);
    }
    return ctx.callbackQuery.data = 'cart_view';
  });

  bot.callbackQuery(/^orem_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    cart.items = cart.items.filter((i) => i.id !== ctx.match![1]);
    return ctx.callbackQuery.data = 'cart_view';
  });

  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  // Checkout — ask name
  bot.callbackQuery('checkout', async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    if (!cart.items.length) return ctx.reply('Savat bo\'sh.');
    cart.step = 'name';
    await ctx.reply('👤 Ismingizni yozing:');
  });

  // Handle text messages for order flow
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const cart = carts.get(chatId);
    if (!cart || cart.step === 'browsing') return next();

    if (cart.step === 'name') {
      cart.customerName = ctx.message.text;
      cart.step = 'phone';
      await ctx.reply('📞 Telefon raqamingizni yozing:');
      return;
    }

    if (cart.step === 'phone') {
      cart.customerPhone = ctx.message.text;
      cart.step = 'confirm';

      const keyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', 'order_confirm')
        .text('❌ Bekor qilish', 'order_cancel');

      await ctx.reply(
        `📦 *Buyurtmangiz:*\n\n` +
        `👤 ${cart.customerName}\n` +
        `📞 ${cart.customerPhone}\n\n` +
        `${cartText(cart)}\n\n` +
        `Tasdiqlaysizmi?`,
        { parse_mode: 'Markdown', reply_markup: keyboard },
      );
      return;
    }

    return next();
  });

  // Confirm order
  bot.callbackQuery('order_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const cart = carts.get(chatId);
    if (!cart || !cart.items.length) return;

    const total = cartTotal(cart);
    const orderItems = cart.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
    }));

    // Save to DB
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: cart.customerName!,
        customer_phone: cart.customerPhone!,
        telegram_chat_id: chatId,
        items: orderItems,
        total,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Order insert error:', error);
      return ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }

    // Notify admin group
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      const itemLines = cart.items
        .map((i) => `• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`)
        .join('\n');

      const adminKeyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash', `aconfirm_${order.id}`)
        .text('❌ Bekor qilish', `acancel_${order.id}`);

      await ctx.api.sendMessage(
        adminChatId,
        `🆕 *Yangi buyurtma*\n\n` +
        `👤 ${cart.customerName} | 📞 ${cart.customerPhone}\n\n` +
        `${itemLines}\n\n` +
        `💰 *${formatPrice(total)} UZS*`,
        { parse_mode: 'Markdown', reply_markup: adminKeyboard },
      );
    }

    // Clear cart
    carts.delete(chatId);

    await ctx.editMessageText(
      `✅ *Buyurtma qabul qilindi!*\n\n` +
      `Tez orada siz bilan bog'lanamiz.\n` +
      `Rahmat! 🙏`,
      { parse_mode: 'Markdown' },
    );
  });

  // Cancel order
  bot.callbackQuery('order_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    carts.delete(ctx.chat!.id);
    await ctx.editMessageText('❌ Buyurtma bekor qilindi.');
  });

  // Admin confirm/cancel order
  bot.callbackQuery(/^aconfirm_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Tasdiqlandi!');
    const orderId = ctx.match![1];
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);
    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n✅ TASDIQLANDI', {
      parse_mode: 'Markdown',
    });
  });

  bot.callbackQuery(/^acancel_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Bekor qilindi!');
    const orderId = ctx.match![1];
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n❌ BEKOR QILINDI', {
      parse_mode: 'Markdown',
    });
  });
}
