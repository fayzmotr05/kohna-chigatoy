import { NextResponse } from 'next/server';
import { validateInitData } from '@/lib/validateInitData';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const initData = request.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const result = validateInitData(initData);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('telegram_users')
    .select('name, phone')
    .eq('telegram_id', result.user.id)
    .single();

  if (user) {
    return NextResponse.json({ registered: true, user });
  }

  return NextResponse.json({ registered: false });
}
