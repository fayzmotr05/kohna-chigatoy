import { Bot, InlineKeyboard } from 'grammy';
import { supabase } from '../supabase';
import { isAdmin } from '../middleware/auth';

interface AdminSession {
  action: string;
  step: string;
  data: Record<string, any>;
}

const sessions = new Map<number, AdminSession>();

function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

export function registerAdminHandlers(bot: Bot) {
  // ─── /add — Add menu item ───
  bot.command('add', async (ctx) => {
    if (!isAdmin(ctx)) return;
    sessions.set(ctx.chat.id, { action: 'add', step: 'name', data: {} });
    await ctx.reply('📝 *Yangi taom qo\'shish*\n\nTaom nomini yozing:', {
      parse_mode: 'Markdown',
    });
  });

  // ─── /edit — Edit menu item ───
  bot.command('edit', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) return ctx.reply('Kategoriya yo\'q.');

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name}`, `aecat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });

    sessions.set(ctx.chat.id, { action: 'edit', step: 'pick_cat', data: {} });
    await ctx.reply('✏️ Qaysi kategoriyadan tahrirlaysiz?', { reply_markup: keyboard });
  });

  // Edit — pick category → show items
  bot.callbackQuery(/^aecat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const categoryId = ctx.match![1];

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .eq('category_id', categoryId)
      .order('name');

    if (!items?.length) return ctx.reply('Bu kategoriyada taom yo\'q.');

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      keyboard.text(`${item.name} (${formatPrice(item.price)})`, `aeitem_${item.id}`).row();
    });

    await ctx.editMessageText('Taomni tanlang:', { reply_markup: keyboard });
  });

  // Edit — pick item → show fields
  bot.callbackQuery(/^aeitem_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];
    sessions.set(ctx.chat!.id, { action: 'edit', step: 'pick_field', data: { itemId } });

    const keyboard = new InlineKeyboard()
      .text('Nom', `aefield_name`).text('Tavsif', `aefield_description`).row()
      .text('Narx', `aefield_price`).text('Kategoriya', `aefield_category`).row()
      .text('Tavsiya', `aefield_featured`).text('Rasm', `aefield_image`).row()
      .text('3D model', `aefield_model`);

    await ctx.editMessageText('Nimani o\'zgartirmoqchisiz?', { reply_markup: keyboard });
  });

  // Edit — pick field
  bot.callbackQuery(/^aefield_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const field = ctx.match![1];
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;

    session.data.field = field;

    if (field === 'featured') {
      const keyboard = new InlineKeyboard()
        .text('Ha ⭐', 'aesetfeat_true')
        .text('Yo\'q', 'aesetfeat_false');
      await ctx.reply('Tavsiya etiladimi?', { reply_markup: keyboard });
      return;
    }

    if (field === 'image') {
      session.step = 'edit_image';
      await ctx.reply('📷 Yangi rasmni yuboring:');
      return;
    }

    if (field === 'model') {
      session.step = 'edit_model';
      await ctx.reply('🔮 3D faylni yuboring (.glb yoki .usdz):');
      return;
    }

    if (field === 'category') {
      const { data: cats } = await supabase.from('categories').select('*').order('display_order');
      const keyboard = new InlineKeyboard();
      cats?.forEach((c, i) => {
        keyboard.text(`${c.icon || ''} ${c.name}`, `aesetcat_${c.id}`);
        if (i % 2 === 1) keyboard.row();
      });
      await ctx.reply('Yangi kategoriyani tanlang:', { reply_markup: keyboard });
      return;
    }

    session.step = 'edit_value';
    const labels: Record<string, string> = {
      name: 'Yangi nomni yozing',
      description: 'Yangi tavsifni yozing',
      price: 'Yangi narxni yozing (faqat raqam)',
    };
    await ctx.reply(`${labels[field] || 'Yangi qiymatni yozing'}:`);
  });

  // Set featured
  bot.callbackQuery(/^aesetfeat_(true|false)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    const val = ctx.match![1] === 'true';
    await supabase.from('menu_items').update({ is_featured: val }).eq('id', session.data.itemId);
    sessions.delete(ctx.chat!.id);
    await ctx.reply(`✅ ${val ? 'Tavsiya qo\'shildi ⭐' : 'Tavsiya olib tashlandi'}`);
  });

  // Set category
  bot.callbackQuery(/^aesetcat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    await supabase.from('menu_items').update({ category_id: ctx.match![1] }).eq('id', session.data.itemId);
    sessions.delete(ctx.chat!.id);
    await ctx.reply('✅ Kategoriya yangilandi');
  });

  // ─── /delete — Soft delete menu item ───
  bot.command('delete', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!categories?.length) return ctx.reply('Kategoriya yo\'q.');

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, i) => {
      keyboard.text(`${cat.icon || ''} ${cat.name}`, `adcat_${cat.id}`);
      if (i % 2 === 1) keyboard.row();
    });

    await ctx.reply('🗑 Qaysi kategoriyadan o\'chirasiz?', { reply_markup: keyboard });
  });

  bot.callbackQuery(/^adcat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();

    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('category_id', ctx.match![1])
      .eq('is_available', true);

    if (!items?.length) return ctx.reply('Bu kategoriyada taom yo\'q.');

    const keyboard = new InlineKeyboard();
    items.forEach((item) => {
      keyboard.text(item.name, `aditem_${item.id}`).row();
    });

    await ctx.editMessageText('O\'chirish uchun taomni tanlang:', { reply_markup: keyboard });
  });

  bot.callbackQuery(/^aditem_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const itemId = ctx.match![1];

    const { data: item } = await supabase
      .from('menu_items')
      .select('name')
      .eq('id', itemId)
      .single();

    const keyboard = new InlineKeyboard()
      .text('Ha, o\'chirish', `adconfirm_${itemId}`)
      .text('Yo\'q', 'adcancel');

    await ctx.editMessageText(
      `"${item?.name}" ni o'chirmoqchimisiz?`,
      { reply_markup: keyboard },
    );
  });

  bot.callbackQuery(/^adconfirm_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', ctx.match![1]);
    await ctx.editMessageText('✅ O\'chirildi (menyudan yashirildi)');
  });

  bot.callbackQuery('adcancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Bekor qilindi.');
  });

  // ─── /addcat — Add category ───
  bot.command('addcat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    sessions.set(ctx.chat.id, { action: 'addcat', step: 'name', data: {} });
    await ctx.reply('📁 Yangi kategoriya nomi:');
  });

  // ─── /editcat — Edit category ───
  bot.command('editcat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const { data: cats } = await supabase.from('categories').select('*').order('display_order');
    if (!cats?.length) return ctx.reply('Kategoriya yo\'q.');

    const keyboard = new InlineKeyboard();
    cats.forEach((c) => {
      keyboard.text(`${c.icon || ''} ${c.name}`, `eccat_${c.id}`).row();
    });

    sessions.set(ctx.chat.id, { action: 'editcat', step: 'pick', data: {} });
    await ctx.reply('Qaysi kategoriyani tahrirlaysiz?', { reply_markup: keyboard });
  });

  bot.callbackQuery(/^eccat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.catId = ctx.match![1];
    session.step = 'editcat_name';
    await ctx.reply('Yangi nom yozing (yoki /skip):');
  });

  // ─── /deletecat — Delete category ───
  bot.command('deletecat', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const { data: cats } = await supabase.from('categories').select('*').order('display_order');
    if (!cats?.length) return ctx.reply('Kategoriya yo\'q.');

    const keyboard = new InlineKeyboard();
    cats.forEach((c) => {
      keyboard.text(`${c.icon || ''} ${c.name}`, `dccat_${c.id}`).row();
    });
    await ctx.reply('Qaysi kategoriyani o\'chirasiz?', { reply_markup: keyboard });
  });

  bot.callbackQuery(/^dccat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const catId = ctx.match![1];

    // Check if category has items
    const { count } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', catId)
      .eq('is_available', true);

    if (count && count > 0) {
      return ctx.reply(`❌ Bu kategoriyada ${count} ta taom bor. Avval taomlarni o'chiring.`);
    }

    await supabase.from('categories').delete().eq('id', catId);
    await ctx.editMessageText('✅ Kategoriya o\'chirildi');
  });

  // ─── /stats — Quick stats ───
  bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx)) return;

    const today = new Date().toISOString().split('T')[0];

    const [ordersRes, bookingsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('status, total')
        .gte('created_at', `${today}T00:00:00`),
      supabase
        .from('bookings')
        .select('id')
        .eq('date', today),
    ]);

    const orders = ordersRes.data || [];
    const totalOrders = orders.length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0);
    const bookingsCount = bookingsRes.data?.length || 0;

    await ctx.reply(
      `📊 *Bugungi statistika*\n\n` +
      `📦 Buyurtmalar: ${totalOrders}\n` +
      `💰 Daromad: ${formatPrice(revenue)} UZS\n` +
      `📅 Bandlar: ${bookingsCount}`,
      { parse_mode: 'Markdown' },
    );
  });

  // ─── /orders — Recent orders ───
  bot.command('orders', async (ctx) => {
    if (!isAdmin(ctx)) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!orders?.length) return ctx.reply('Buyurtmalar yo\'q.');

    const lines = orders.map((o) => {
      const items = (o.items as any[]).map((i: any) => `${i.name} x${i.qty}`).join(', ');
      const statusEmoji: Record<string, string> = {
        new: '🆕', confirmed: '✅', preparing: '🍳', done: '✅', cancelled: '❌',
      };
      return `${statusEmoji[o.status] || ''} ${o.customer_name} — ${formatPrice(o.total)} — ${items}`;
    });

    await ctx.reply(`📦 *So'nggi buyurtmalar:*\n\n${lines.join('\n')}`, {
      parse_mode: 'Markdown',
    });
  });

  // ─── /bookings — Today's bookings ───
  bot.command('bookings', async (ctx) => {
    if (!isAdmin(ctx)) return;

    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('time');

    if (!bookings?.length) return ctx.reply('Bugungi bandlar yo\'q.');

    const lines = bookings.map((b) => {
      const statusEmoji: Record<string, string> = {
        pending: '⏳', confirmed: '✅', cancelled: '❌',
      };
      return `${statusEmoji[b.status] || ''} ${b.date} ${b.time} — ${b.customer_name} (${b.party_size} kishi)`;
    });

    await ctx.reply(`📅 *Bandlar:*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  });

  // ─── Handle text messages for admin flows ───
  bot.on('message:text', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const text = ctx.message.text.trim();

    // Add menu item flow
    if (session.action === 'add') {
      if (session.step === 'name') {
        session.data.name = text;
        session.step = 'description';
        await ctx.reply('Tavsifini yozing:');
        return;
      }
      if (session.step === 'description') {
        session.data.description = text;
        session.step = 'price';
        await ctx.reply('Narxini yozing (UZS, faqat raqam):');
        return;
      }
      if (session.step === 'price') {
        session.data.price = parseInt(text.replace(/\s/g, '')) || 0;
        session.step = 'category';

        const { data: cats } = await supabase.from('categories').select('*').order('display_order');
        const keyboard = new InlineKeyboard();
        cats?.forEach((c, i) => {
          keyboard.text(`${c.icon || ''} ${c.name}`, `aacat_${c.id}`);
          if (i % 2 === 1) keyboard.row();
        });
        await ctx.reply('Kategoriyani tanlang:', { reply_markup: keyboard });
        return;
      }
      if (session.step === 'photo') {
        if (text === '/skip') {
          session.step = 'model';
          await ctx.reply('🔮 3D faylni yuboring (.glb yoki .usdz) yoki /skip:');
        }
        return;
      }
      if (session.step === 'model') {
        if (text === '/skip') {
          session.step = 'featured';
          const kb = new InlineKeyboard()
            .text('Ha ⭐', 'aafeat_true')
            .text('Yo\'q', 'aafeat_false');
          await ctx.reply('Tavsiya etiladimi?', { reply_markup: kb });
        }
        return;
      }
    }

    // Edit value flow
    if (session.action === 'edit' && session.step === 'edit_value') {
      const field = session.data.field;
      const update: Record<string, any> = {};
      if (field === 'price') {
        update[field] = parseInt(text.replace(/\s/g, '')) || 0;
      } else {
        update[field] = text;
      }
      await supabase.from('menu_items').update(update).eq('id', session.data.itemId);
      sessions.delete(ctx.chat.id);
      await ctx.reply('✅ Yangilandi!');
      return;
    }

    // Add category flow
    if (session.action === 'addcat') {
      if (session.step === 'name') {
        session.data.name = text;
        session.step = 'icon';
        await ctx.reply('Emoji ikonka yuboring (masalan: 🍚):');
        return;
      }
      if (session.step === 'icon') {
        await supabase.from('categories').insert({
          name: session.data.name,
          icon: text,
        });
        sessions.delete(ctx.chat.id);
        await ctx.reply(`✅ "${session.data.name}" kategoriyasi qo'shildi!`);
        return;
      }
    }

    // Edit category flow
    if (session.action === 'editcat' && session.step === 'editcat_name') {
      if (text !== '/skip') {
        await supabase.from('categories').update({ name: text }).eq('id', session.data.catId);
      }
      session.step = 'editcat_icon';
      await ctx.reply('Yangi emoji yozing (yoki /skip):');
      return;
    }
    if (session.action === 'editcat' && session.step === 'editcat_icon') {
      if (text !== '/skip') {
        await supabase.from('categories').update({ icon: text }).eq('id', session.data.catId);
      }
      sessions.delete(ctx.chat.id);
      await ctx.reply('✅ Kategoriya yangilandi!');
      return;
    }

    return next();
  });

  // Handle photo for add item and edit image
  bot.on('message:photo', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const isAddPhoto = session.action === 'add' && session.step === 'photo';
    const isEditImage = session.action === 'edit' && session.step === 'edit_image';
    if (!isAddPhoto && !isEditImage) return next();

    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id;

    const file = await ctx.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `images/${Date.now()}.jpg`;

    await supabase.storage.from('media').upload(fileName, buffer, {
      contentType: 'image/jpeg',
    });

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    if (isEditImage) {
      await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', session.data.itemId);
      sessions.delete(ctx.chat.id);
      await ctx.reply('✅ Rasm yangilandi!');
      return;
    }

    // Add flow — save URL and move to 3D model step
    session.data.imageUrl = publicUrl;
    session.step = 'model';
    await ctx.reply('🔮 3D faylni yuboring (.glb yoki .usdz) yoki /skip:');
  });

  // Handle document (3D files) for add/edit flows
  bot.on('message:document', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const session = sessions.get(ctx.chat.id);
    if (!session) return next();

    const doc = ctx.message.document;
    const fileName = doc.file_name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();

    // Handle 3D model upload (add flow or edit flow)
    if (
      (session.action === 'add' && session.step === 'model') ||
      (session.action === 'edit' && session.step === 'edit_model')
    ) {
      if (ext !== 'glb' && ext !== 'usdz') {
        await ctx.reply('❌ Faqat .glb yoki .usdz fayllar qabul qilinadi. Qayta yuboring:');
        return;
      }

      await ctx.reply('⏳ Fayl yuklanmoqda...');

      const file = await ctx.api.getFile(doc.file_id);
      const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());

      const storagePath = `models/${ext}/${Date.now()}.${ext}`;
      const contentType = ext === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, buffer, { contentType });

      if (uploadError) {
        console.error('3D upload error:', uploadError);
        await ctx.reply('❌ Fayl yuklashda xatolik. Qayta urinib ko\'ring.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      if (session.action === 'edit') {
        // Update existing item
        const update: Record<string, any> = { model_status: 'ready' };
        if (ext === 'glb') update.model_glb_url = publicUrl;
        if (ext === 'usdz') update.model_usdz_url = publicUrl;
        await supabase.from('menu_items').update(update).eq('id', session.data.itemId);
        sessions.delete(ctx.chat.id);
        await ctx.reply(`✅ 3D model (.${ext}) yangilandi!`);
        return;
      }

      // Add flow — save URL and move to featured step
      if (ext === 'glb') session.data.modelGlbUrl = publicUrl;
      if (ext === 'usdz') session.data.modelUsdzUrl = publicUrl;

      // Ask if they want to send another format
      const kb = new InlineKeyboard()
        .text(`Tayyor, davom etish →`, 'aamodel_done');
      await ctx.reply(
        `✅ .${ext} yuklandi!\n\nBoshqa formatni ham yuborishingiz mumkin (.${ext === 'glb' ? 'usdz' : 'glb'}) yoki davom eting:`,
        { reply_markup: kb },
      );
      return;
    }

    return next();
  });

  // Model done → go to featured
  bot.callbackQuery('aamodel_done', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.step = 'featured';
    const kb = new InlineKeyboard()
      .text('Ha ⭐', 'aafeat_true')
      .text('Yo\'q', 'aafeat_false');
    await ctx.reply('Tavsiya etiladimi?', { reply_markup: kb });
  });


  // Add item — pick category callback
  bot.callbackQuery(/^aacat_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;
    session.data.categoryId = ctx.match![1];
    session.step = 'photo';
    await ctx.reply('📷 Taom rasmini yuboring (yoki /skip):');
  });

  // Add item — featured callback
  bot.callbackQuery(/^aafeat_(true|false)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const session = sessions.get(ctx.chat!.id);
    if (!session) return;

    const isFeatured = ctx.match![1] === 'true';

    // Insert into DB
    const hasModel = session.data.modelGlbUrl || session.data.modelUsdzUrl;
    const { error } = await supabase.from('menu_items').insert({
      name: session.data.name,
      description: session.data.description || '',
      price: session.data.price,
      category_id: session.data.categoryId,
      image_url: session.data.imageUrl || null,
      model_glb_url: session.data.modelGlbUrl || null,
      model_usdz_url: session.data.modelUsdzUrl || null,
      model_status: hasModel ? 'ready' : 'none',
      is_featured: isFeatured,
    });

    sessions.delete(ctx.chat!.id);

    if (error) {
      console.error('Insert error:', error);
      return ctx.reply('❌ Xatolik yuz berdi.');
    }

    await ctx.reply(
      `✅ *${session.data.name}* menyuga qo'shildi!\n💰 ${formatPrice(session.data.price)} UZS`,
      { parse_mode: 'Markdown' },
    );
  });
}
