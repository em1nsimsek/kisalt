import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

const RESERVED = ['api', 'yonet', 'admin', '_next', 'static', 'favicon.ico'];
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomCode(n = 6) {
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHA[crypto.randomInt(ALPHA.length)];
  return s;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  let raw = String(body.url || '').trim();
  if (!raw) return NextResponse.json({ error: 'Link boş olamaz.' }, { status: 400 });
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  if (raw.length > 2048) return NextResponse.json({ error: 'Link çok uzun.' }, { status: 400 });

  let target;
  try { target = new URL(raw); } catch {
    return NextResponse.json({ error: 'Geçerli bir link gir.' }, { status: 400 });
  }
  if (!['http:', 'https:'].includes(target.protocol) || !target.hostname.includes('.')) {
    return NextResponse.json({ error: 'Geçerli bir link gir.' }, { status: 400 });
  }
  const origin = new URL(request.url).origin;
  if (target.host === new URL(origin).host) {
    return NextResponse.json({ error: 'Kendi kısa linklerimizi tekrar kısaltamazsın.' }, { status: 400 });
  }

  const custom = String(body.code || '').trim().toLowerCase();
  if (custom) {
    if (!/^[a-z0-9_-]{3,30}$/.test(custom) || RESERVED.includes(custom)) {
      return NextResponse.json(
        { error: 'Özel kod 3-30 karakter olmalı (harf, rakam, - veya _).' },
        { status: 400 }
      );
    }
  }

  const days = [1, 7, 30].includes(Number(body.days)) ? Number(body.days) : 0;
  const expires_at = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

  const manageKey = crypto.randomBytes(16).toString('hex');
  const manage_hash = crypto.createHash('sha256').update(manageKey).digest('hex');

  for (let i = 0; i < 5; i++) {
    const code = custom || randomCode();
    const { error } = await supabase
      .from('links')
      .insert({ code, url: target.toString(), manage_hash, expires_at });

    if (!error) {
      return NextResponse.json({
        short: `${origin}/${code}`,
        manage: `${origin}/yonet/${manageKey}`,
      });
    }
    if (error.code === '23505') {
      if (custom) return NextResponse.json({ error: 'Bu kod alınmış, başka dene.' }, { status: 409 });
      continue;
    }
    return NextResponse.json({ error: 'Kayıt sırasında hata oluştu.' }, { status: 500 });
  }
  return NextResponse.json({ error: 'Kod üretilemedi, tekrar dene.' }, { status: 500 });
}
