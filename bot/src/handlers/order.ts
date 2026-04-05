import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';
import { getRegisteredUser, startRegistration } from '../helpers/registration';

interface CartSession {
  items: { id: string; name: string; price: number; qty: number }[];
  step: 'browsing' | 'confirm';
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

function cartKeyboard(cart: CartSession): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  cart.items.forEach((item) => {
    keyboard
      .text(`❌ ${item.name}`, `orem_${item.id}`)
      .text(`➖`, `odec_${item.id}`)
      .text(`${item.qty}`, `noop`)
      .text(`➕`, `oinc_${item.id}`)
      .row();
  });
  keyboard
    .text('➕ Yana qo\'shish', 'order_categories')
    .text('✅ Buyurtma berish', 'checkout')
    .row()
    .text('🏠 Bosh menyu', 'go_home');
  return keyboard;
}

export function registerOrderHandlers(bot: Bot) {
  const siteUrl = () => process.env.SITE_URL || 'https://kohnachigatoy.uz';

  // ─── Start order — choose bot or Mini App ───
  bot.callbackQuery('order_start', async (ctx) => {
    await ctx.answerCallbackQuery();

    const keyboard = new InlineKeyboard()
      .text('🤖 Bot orqali buyurtma', 'order_check_reg')
      .row()
      .webApp('📱 Mini App orqali', `${siteUrl()}/menu`)
      .row()
      .text('🏠 Bosh menyu', 'go_home');

    await ctx.editMessageText(
      '🛒 *Buyurtma berish*\n\nQanday buyurtma bermoqchisiz?',
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ─── Check registration before ordering ───
  bot.callbackQuery('order_check_reg', async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = await getRegisteredUser(ctx.from!.id);

    if (!user) {
      await startRegistration(ctx, 'order');
      return;
    }

    // Registered — show categories
    await showOrderCategories(ctx);
  });

  // ─── Order categories ───
  bot.callbackQuery('order_categories', async (ctx) => {
    await ctx.answerCallbackQuery();
    await showOrderCategories(ctx);
  });

  async function showOrderCategories(ctx: any) {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) {
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
      return ctx.reply('Menyu bo\'sh.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat: any, i: number) => {
      keyboard.text(`${cat.icon || ''} ${cat.name_uz}`, `ocat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (categories.length % 2 === 1) keyboard.row();

    const chatId = ctx.chat!.id;
    const cart = getCart(chatId);
    if (cart.items.length) {
      keyboard.text(`🛒 Savat (${cart.items.length})`, 'cart_view').row();
    }
    keyboard.text('🏠 Bosh menyu', 'go_home');

    try {
      await ctx.editMessageText('🛒 *Buyurtma*\n\nKategoriyani tanlang:', {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch {
      await ctx.reply('🛒 *Buyurtma*\n\nKategoriyani tanlang:', {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  // ─── Order category → show items ───
  bot.callbackQuery(/^ocat_(.+)$/, async (ctx) => {
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
        .text('⬅️ Orqaga', 'order_categories')
        .text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('Bu kategoriyada taom yo\'q.', { reply_markup: kb });
    }

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      keyboard
        .text(`${item.name_uz} (${formatPrice(item.price)})`, `oadd_${item.id}`)
        .row();
    });
    keyboard.text('⬅️ Orqaga', 'order_categories');
    const cart = getCart(ctx.chat!.id);
    if (cart.items.length) {
      keyboard.text(`🛒 Savat (${cart.items.length})`, 'cart_view');
    }

    await ctx.editMessageText('🍽 Taomni tanlang:', { reply_markup: keyboard });
  });

  // ─── Add item to cart ───
  bot.callbackQuery(/^oadd_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('✅ Qo\'shildi!');
    const itemId = ctx.match![1];
    const chatId = ctx.chat!.id;
    const cart = getCart(chatId);

    const existing = cart.items.find((i) => i.id === itemId);
    if (existing) {
      existing.qty++;
    } else {
      const { data: item } = await supabase
        .from('menu_items')
        .select('id, name_uz, price')
        .eq('id', itemId)
        .single();
      if (!item) return;
      cart.items.push({ id: item.id, name: item.name_uz, price: item.price, qty: 1 });
    }

    const keyboard = new InlineKeyboard()
      .text('➕ Yana qo\'shish', 'order_categories')
      .text('🛒 Savatni ko\'rish', 'cart_view')
      .row()
      .text('🏠 Bosh menyu', 'go_home');

    await ctx.editMessageText(
      `✅ Qo'shildi!\n\n${cartText(cart)}`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ─── View cart ───
  bot.callbackQuery('cart_view', async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);

    if (!cart.items.length) {
      const kb = new InlineKeyboard()
        .text('📋 Menyu', 'order_categories')
        .text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('🛒 Savat bo\'sh. Avval taom tanlang.', { reply_markup: kb });
    }

    await ctx.editMessageText(`🛒 *Savat:*\n\n${cartText(cart)}`, {
      parse_mode: 'Markdown',
      reply_markup: cartKeyboard(cart),
    });
  });

  // ─── Cart controls (increment, decrement, remove) ───
  bot.callbackQuery(/^oinc_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    const item = cart.items.find((i) => i.id === ctx.match![1]);
    if (item) item.qty++;
    await ctx.editMessageText(`🛒 *Savat:*\n\n${cartText(cart)}`, {
      parse_mode: 'Markdown', reply_markup: cartKeyboard(cart),
    });
  });

  bot.callbackQuery(/^odec_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    const idx = cart.items.findIndex((i) => i.id === ctx.match![1]);
    if (idx >= 0) {
      cart.items[idx].qty--;
      if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);
    }
    if (!cart.items.length) {
      const kb = new InlineKeyboard()
        .text('📋 Menyu', 'order_categories')
        .text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('🛒 Savat bo\'sh.', { reply_markup: kb });
    }
    await ctx.editMessageText(`🛒 *Savat:*\n\n${cartText(cart)}`, {
      parse_mode: 'Markdown', reply_markup: cartKeyboard(cart),
    });
  });

  bot.callbackQuery(/^orem_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    cart.items = cart.items.filter((i) => i.id !== ctx.match![1]);
    if (!cart.items.length) {
      const kb = new InlineKeyboard()
        .text('📋 Menyu', 'order_categories')
        .text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('🛒 Savat bo\'sh.', { reply_markup: kb });
    }
    await ctx.editMessageText(`🛒 *Savat:*\n\n${cartText(cart)}`, {
      parse_mode: 'Markdown', reply_markup: cartKeyboard(cart),
    });
  });

  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  // ─── Checkout — auto-fill from registration ───
  bot.callbackQuery('checkout', async (ctx) => {
    await ctx.answerCallbackQuery();
    const cart = getCart(ctx.chat!.id);
    if (!cart.items.length) {
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
      return ctx.editMessageText('Savat bo\'sh.', { reply_markup: kb });
    }

    const user = await getRegisteredUser(ctx.from!.id);
    if (!user) {
      await startRegistration(ctx, 'order');
      return;
    }

    cart.step = 'confirm';
    const keyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash', 'order_confirm')
      .text('❌ Bekor qilish', 'order_cancel');

    await ctx.editMessageText(
      `📦 *Buyurtmangiz:*\n\n` +
      `👤 ${user.name}\n📞 ${user.phone}\n\n` +
      `${cartText(cart)}\n\n` +
      `Tasdiqlaysizmi?`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ─── Confirm order ───
  bot.callbackQuery('order_confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const cart = carts.get(chatId);
    if (!cart || !cart.items.length) return;

    const user = await getRegisteredUser(ctx.from!.id);
    if (!user) return;

    const total = cartTotal(cart);
    const orderItems = cart.items.map((i) => ({
      id: i.id, name: i.name, price: i.price, qty: i.qty,
    }));

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: user.name,
        customer_phone: user.phone,
        telegram_chat_id: chatId,
        items: orderItems,
        total,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Order insert error:', error);
      const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
      return ctx.reply('❌ Xatolik yuz berdi.', { reply_markup: kb });
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
        `👤 ${user.name} | 📞 ${user.phone}\n\n` +
        `${itemLines}\n\n` +
        `💰 *${formatPrice(total)} UZS*`,
        { parse_mode: 'Markdown', reply_markup: adminKeyboard },
      );
    }

    carts.delete(chatId);

    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home_new');
    await ctx.editMessageText(
      `✅ *Buyurtma qabul qilindi!*\n\n` +
      `Tez orada tasdiqlaymiz.\nRahmat! 🙏`,
      { parse_mode: 'Markdown', reply_markup: kb },
    );
  });

  // ─── Cancel order ───
  bot.callbackQuery('order_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    carts.delete(ctx.chat!.id);
    const kb = new InlineKeyboard().text('🏠 Bosh menyu', 'go_home');
    await ctx.editMessageText('❌ Buyurtma bekor qilindi.', { reply_markup: kb });
  });

  // ─── Admin confirm order → notify customer ───
  bot.callbackQuery(/^aconfirm_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Tasdiqlandi!');
    const orderId = ctx.match![1];

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) return;

    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);

    // Update admin message
    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n✅ TASDIQLANDI', {
      parse_mode: 'Markdown',
    });

    // Notify customer
    if (order.telegram_chat_id) {
      const items = (order.items as any[])
        .map((i: any) => `• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`)
        .join('\n');

      await ctx.api.sendMessage(
        order.telegram_chat_id,
        `✅ *Buyurtmangiz tasdiqlandi!*\n\n` +
        `${items}\n\n` +
        `💰 Jami: *${formatPrice(order.total)} UZS*\n\n` +
        `Tez orada tayyorlanadi! 🍽`,
        { parse_mode: 'Markdown' },
      ).catch(() => {});
    }
  });

  // ─── Admin cancel order → notify customer ───
  bot.callbackQuery(/^acancel_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery('Bekor qilindi!');
    const orderId = ctx.match![1];

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) return;

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);

    await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n❌ BEKOR QILINDI', {
      parse_mode: 'Markdown',
    });

    // Notify customer
    if (order.telegram_chat_id) {
      await ctx.api.sendMessage(
        order.telegram_chat_id,
        `❌ *Buyurtmangiz bekor qilindi.*\n\n` +
        `Savollar bo'lsa, biz bilan bog'laning:\n📞 +998 99 222 09 09`,
        { parse_mode: 'Markdown' },
      ).catch(() => {});
    }
  });
}
