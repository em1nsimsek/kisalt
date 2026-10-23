'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [days, setDays] = useState('0');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState(null);
  const [copied, setCopied] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setRes(null);
    setBusy(true);
    try {
      const r = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, code, days: Number(days) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Bir şeyler ters gitti.');
      setRes(d);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  }

  return (
    <main className="wrap">
      <div className="brand">
        <span>›</span>
        <span className="cur">▍</span>
        <span>kısalt</span>
      </div>

      <h1>Linkini yapıştır.<br />Kısalt.</h1>
      <p className="lead">
        Üyelik yok, form yok. Kısa linkini al, tıklamaları gizli yönetim sayfandan takip et.
      </p>

      <form className="term" onSubmit={submit}>
        <div className="line">
          <span className="prompt">›</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://uzun-bir-link.com/sayfa"
            aria-label="Kısaltılacak link"
            inputMode="url"
            autoComplete="off"
            required
          />
          <button className="go" disabled={busy}>{busy ? '…' : 'Kısalt'}</button>
        </div>
        <div className="opts">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="özel kod (isteğe bağlı)"
            aria-label="Özel kod"
            maxLength={30}
          />
          <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Süre">
            <option value="0">süresiz</option>
            <option value="1">1 gün</option>
            <option value="7">7 gün</option>
            <option value="30">30 gün</option>
          </select>
        </div>
      </form>

      <div className="err" role="alert">{err}</div>

      {res && (
        <section className="out" aria-live="polite">
          <small>kısa link</small>
          <div className="short">{res.short}</div>
          <div className="row">
            <button className="ghost" onClick={() => copy(res.short, 's')}>
              {copied === 's' ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
          <small>yönetim linki (sadece sende)</small>
          <div className="manage">{res.manage}</div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="ghost" onClick={() => copy(res.manage, 'm')}>
              {copied === 'm' ? 'Kopyalandı' : 'Yönetim linkini kopyala'}
            </button>
          </div>
          <p className="warn">Bunu kaydet. İstatistik ve düzenleme için tek yol bu, kaybedersen geri getirilemez.</p>
        </section>
      )}
    </main>
  );
}
