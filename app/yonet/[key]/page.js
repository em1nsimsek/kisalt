import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabase.js';
import Actions from './Actions.js';
import '../yonet.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yönetim — Kısalt', robots: { index: false, follow: false } };

const day = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });

function top(rows, field, n = 5) {
  const m = {};
  rows.forEach((r) => {
    const k = r[field] || 'bilinmiyor';
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function countryName(c) {
  if (c === 'bilinmiyor') return c;
  try { return new Intl.DisplayNames(['tr'], { type: 'region' }).of(c) || c; } catch { return c; }
}

function Breakdown({ title, items, total, fmt = (x) => x }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p className="empty">Henüz veri yok.</p>}
      {items.map(([name, n]) => (
        <div className="item" key={name}>
          <div><span>{fmt(name)}</span><span>{n}</span></div>
          <div className="track"><div className="fill" style={{ width: `${(n / total) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default async function Manage({ params }) {
  const { key } = await params;
  if (!/^[a-f0-9]{32}$/.test(key)) notFound();

  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const { data: link } = await supabase
    .from('links')
    .select('id,code,url,active,expires_at')
    .eq('manage_hash', hash)
    .maybeSingle();
  if (!link) notFound();

  const { data: clicks } = await supabase
    .from('clicks')
    .select('created_at,country,device,source')
    .eq('link_id', link.id)
    .order('created_at', { ascending: false })
    .limit(5000);
  const rows = clicks || [];

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const short = `${proto}://${host}/${link.code}`;
  const qr = await QRCode.toString(short, { type: 'svg', margin: 1, width: 180 });
  const qrHref = 'data:image/svg+xml;utf8,' + encodeURIComponent(qr);

  const days = [];
  for (let i = 13; i >= 0; i--) days.push(day(Date.now() - i * 86400000));
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  rows.forEach((r) => { const d = day(r.created_at); if (d in counts) counts[d]++; });
  const max = Math.max(1, ...Object.values(counts));
  const last14 = Object.values(counts).reduce((a, b) => a + b, 0);

  const expired = link.expires_at && new Date(link.expires_at) < new Date();
  const status = !link.active ? ['kapalı', 'off'] : expired ? ['süresi dolmuş', 'off'] : ['açık', 'on'];
  const fmtDay = (d) => d.slice(8, 10) + '.' + d.slice(5, 7);

  return (
    <main className="wrap">
      <div className="m-top">
        <a href="/">› kısalt</a>
        <span className={`badge ${status[1]}`}>{status[0]}</span>
      </div>

      <h1 className="m-title">{short}</h1>
      <p className="m-target">→ {link.url}</p>
      <Actions k={key} active={link.active} short={short} />

      <div className="stats">
        <div className="stat"><b>{rows.length}</b><span>toplam tıklama</span></div>
        <div className="stat"><b>{counts[days[13]]}</b><span>bugün</span></div>
        <div className="stat"><b>{last14}</b><span>son 14 gün</span></div>
      </div>

      <div className="card">
        <h2>Günlük tıklama (son 14 gün)</h2>
        <div className="bars" role="img" aria-label="Günlük tıklama grafiği">
          {days.map((d) => (
            <div
              key={d}
              className={`bar ${counts[d] === 0 ? 'zero' : ''}`}
              style={{ height: `${(counts[d] / max) * 100}%` }}
              title={`${fmtDay(d)}: ${counts[d]} tıklama`}
            />
          ))}
        </div>
        <div className="axis"><span>{fmtDay(days[0])}</span><span>{fmtDay(days[13])}</span></div>
      </div>

      <div className="cols">
        <Breakdown title="Ülke" items={top(rows, 'country')} total={rows.length || 1} fmt={countryName} />
        <Breakdown title="Cihaz" items={top(rows, 'device')} total={rows.length || 1} />
        <Breakdown title="Kaynak" items={top(rows, 'source')} total={rows.length || 1} />
      </div>

      <div className="card">
        <h2>QR kod</h2>
        <div className="qrbox">
          <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <a className="dl" href={qrHref} download={`${link.code}-qr.svg`}>QR kodu indir (SVG)</a>
        </div>
      </div>
    </main>
  );
}
