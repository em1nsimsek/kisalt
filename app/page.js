'use client';
import { useState } from 'react';
import Logo from './Logo.js';
import AuthBar from './AuthBar.js';
import Footer from './Footer.js';
import { getBrowserClient } from '../lib/supabase-browser.js';

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
      let token = null;
      const sb = getBrowserClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        token = data.session?.access_token || null;
      }
      const r = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      <div className="top">
        <Logo />
        <AuthBar />
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
          {res.saved && <p className="saved">Link hesabına kaydedildi, “Linklerim”de görebilirsin.</p>}
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
          <p className="warn">
            {res.saved
              ? 'Bunu kaydetmene gerek yok, hesabından istediğin zaman açabilirsin.'
              : 'Bunu kaydet. İstatistik ve düzenleme için tek yol bu, kaybedersen geri getirilemez.'}
          </p>
        </section>
      )}

      <section className="sec">
        <h2>Ne yapar?</h2>
        <p>Uzun linki kısaltır ve her tıklamayı sayar. Hesap açmadan kullanabilirsin, istersen Google ile girip tüm linklerini tek yerde toplayabilirsin.</p>
        <div className="cmds">
          <div className="cmd"><code>--özel-kod</code><span>Kendi kodunu seç: kisa.link/yks</span></div>
          <div className="cmd"><code>--süre</code><span>1, 7 ya da 30 gün sonra link kendiliğinden kapanır.</span></div>
          <div className="cmd"><code>--istatistik</code><span>Günlük tıklama grafiği, ülke, cihaz ve kaynak dökümü.</span></div>
          <div className="cmd"><code>--qr</code><span>Her link için indirilebilir QR kod.</span></div>
          <div className="cmd"><code>--hesap</code><span>İsteğe bağlı Google girişi. Linklerin “Linklerim”de durur.</span></div>
        </div>
      </section>

      <section className="sec">
        <h2>Nasıl çalışır?</h2>
        <ol className="steps">
          <li><b>Linki yapıştır.</b> İstersen özel kod ve süre seç.</li>
          <li><b>Kısa linki paylaş.</b> Instagram, WhatsApp, her yerde çalışır.</li>
          <li><b>Yönetim sayfasını aç.</b> Tıklamaları izle, linki kapat ya da sil.</li>
        </ol>
      </section>

      <Footer />
    </main>
  );
}
