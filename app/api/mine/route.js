import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase.js';
import { userFrom } from '../../../lib/auth.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await userFrom(request);
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });

  const { data: links, error } = await supabase
    .from('links')
    .select('id,code,url,active,expires_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Linkler alınamadı.' }, { status: 500 });

  const counts = {};
  if (links.length) {
    const { data: clicks } = await supabase
      .from('clicks')
      .select('link_id')
      .in('link_id', links.map((l) => l.id))
      .limit(20000);
    (clicks || []).forEach((c) => { counts[c.link_id] = (counts[c.link_id] || 0) + 1; });
  }

  return NextResponse.json({
    links: links.map(({ id, ...l }) => ({ ...l, clicks: counts[id] || 0 })),
  });
}

export async function POST(request) {
  const user = await userFrom(request);
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const action = String(body.action || '');
  const code = String(body.code || '').toLowerCase();
  if (!['toggle', 'delete', 'stats'].includes(action) || !/^[a-z0-9_-]{3,30}$/.test(code)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const { data: link } = await supabase
    .from('links')
    .select('id,active')
    .eq('code', code)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: 'Link bulunamadı.' }, { status: 404 });

  if (action === 'stats') {
    const key = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const { error } = await supabase.from('links').update({ manage_hash: hash }).eq('id', link.id);
    if (error) return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
    return NextResponse.json({ manage: `${new URL(request.url).origin}/yonet/${key}` });
  }

  const q = supabase.from('links');
  const { error } =
    action === 'delete'
      ? await q.delete().eq('id', link.id)
      : await q.update({ active: !link.active }).eq('id', link.id);
  if (error) return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
