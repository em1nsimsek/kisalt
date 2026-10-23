import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase.js';

export const dynamic = 'force-dynamic';

function deviceOf(ua) {
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobil' : 'masaüstü';
}

function sourceOf(ua, referer) {
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/WhatsApp/i.test(ua)) return 'WhatsApp';
  if (/Telegram/i.test(ua)) return 'Telegram';
  if (referer) {
    try { return new URL(referer).hostname.replace(/^www\./, ''); } catch {}
  }
  return 'doğrudan';
}

export async function GET(request, { params }) {
  const { code: rawCode } = await params;
  const code = String(rawCode || '').toLowerCase();

  if (!/^[a-z0-9_-]{3,30}$/.test(code)) {
    return new NextResponse('Link bulunamadı.', { status: 404 });
  }

  const { data: link } = await supabase
    .from('links')
    .select('id,url,active,expires_at')
    .eq('code', code)
    .maybeSingle();

  if (!link || !link.active) {
    return new NextResponse('Link bulunamadı.', { status: 404 });
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return new NextResponse('Bu linkin süresi dolmuş.', { status: 410 });
  }

  const ua = request.headers.get('user-agent') || '';
  await supabase.from('clicks').insert({
    link_id: link.id,
    country: request.headers.get('x-vercel-ip-country') || null,
    device: deviceOf(ua),
    source: sourceOf(ua, request.headers.get('referer')),
  });

  const res = NextResponse.redirect(link.url, 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
