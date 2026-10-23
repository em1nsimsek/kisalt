'use client';
import { useEffect, useState } from 'react';
import Logo from '../Logo.js';
import AuthBar from '../AuthBar.js';
import Footer from '../Footer.js';
import { getBrowserClient } from '../../lib/supabase-browser.js';

export default function Mine() {
  const [state, setState] = useState('loading');
  const [links, setLinks] = useState([]);
  const [err, setErr] = useState('');
  const [origin, setOrigin] = useState('');

  async function token() {
    const sb = getBrowserClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token || null;
  }

  async function load() {
    const t = await token();
    if (!t) { setState('out'); return; }
    const r = await fetch('/api/mine', { headers: { Authorization: `Bearer ${t}` } });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Linkler yüklenemedi.'); setState('ready'); return; }
    setLinks(d.links);
    setState('ready');
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function act(action, code) {
    const t = await token();
    const r = await fetch('/api/mine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ action, code }),
    });
    const d = await r.json();
    if (!r.ok) { alert(d.error || 'İşlem başarısız.'); return; }
    if (action === 'stats') { window.location.assign(d.manage); return; }
    load();
  }

  async function login() {
    const sb = getBrowserClient();
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/linklerim' },
    });
  }

  const status = (l) =>
    !l.active ? 'kapalı' : l.expires_at && new Date(l.expires_at) < new Date() ? 'süresi dolmuş' : 'açık';

  return (
    <main className="wrap">
      <div className="top">
        <Logo />
        <AuthBar />
      </div>

      <h1 style={{ fontSize: 'clamp(2rem,7vw,3rem)' }}>Linklerim</h1>

      {state === 'loading' && <p className="lead">Yükleniyor…</p>}

      {state === 'out' && (
        <>
          <p className="lead">Linklerini tek yerde görmek için Google ile giriş yap.</p>
          <button className="go" onClick={login}>Google ile giriş</button>
        </>
      )}

      {state === 'ready' && (
        <>
          {err && <div className="err" role="alert">{err}</div>}
          {!err && links.length === 0 && (
            <p className="lead">Henüz linkin yok. <a href="/">Ana sayfadan</a> bir tane oluştur, giriş yapmışken hesabına kaydedilir.</p>
          )}
          <div className="list">
            {links.map((l) => (
              <div className="lrow" key={l.code}>
                <div className="s">{origin}/{l.code}</div>
                <div className="t">→ {l.url}</div>
                <div className="meta">{l.clicks} tıklama · {status(l)}</div>
                <div className="m-actions">
                  <button className="ghost" onClick={() => act('stats', l.code)}>İstatistik</button>
                  <button className="ghost" onClick={() => act('toggle', l.code)}>
                    {l.active ? 'Kapat' : 'Aç'}
                  </button>
                  <button
                    className="danger"
                    onClick={() => { if (confirm('Link ve istatistikleri kalıcı olarak silinsin mi?')) act('delete', l.code); }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="empty" style={{ marginTop: 16, fontSize: '.85rem' }}>
            “İstatistik” her açılışta o link için yeni bir yönetim linki üretir; eski yönetim linki çalışmaz.
          </p>
        </>
      )}

      <Footer />
    </main>
  );
}
