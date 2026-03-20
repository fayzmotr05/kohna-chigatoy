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
    console.error('Registration validation failed:', result.error, 'initData length:', initData.length, 'token set:', !!process.env.TELEGRAM_BOT_TOKEN);
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const body = await request.json();
  const { phone, name } = body;

  if (!phone || !name) {
    return NextResponse.json({ error: 'Phone and name are required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert — if already registered, return existing user
  const { data: user, error } = await supabase
    .from('telegram_users')
    .upsert(
      {
        telegram_id: result.user.id,
        phone,
        name,
        language_code: result.user.language_code || null,
      },
      { onConflict: 'telegram_id' },
    )
    .select('name, phone')
    .single();

  if (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, user });
}
