import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const key = String(body.key || '');
  const action = String(body.action || '');
  if (!/^[a-f0-9]{32}$/.test(key) || !['toggle', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const { data: link } = await supabase
    .from('links')
    .select('id,active')
    .eq('manage_hash', hash)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

  const q = supabase.from('links');
  const { error } =
    action === 'delete'
      ? await q.delete().eq('id', link.id)
      : await q.update({ active: !link.active }).eq('id', link.id);

  if (error) return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
