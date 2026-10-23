'use client';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '../lib/supabase-browser.js';

export default function AuthBar() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb) { setReady(true); return; }
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function login() {
    const sb = getBrowserClient();
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/linklerim' },
    });
  }

  async function logout() {
    const sb = getBrowserClient();
    await sb.auth.signOut();
    window.location.href = '/';
  }

  if (!ready || !getBrowserClient()) return <div className="auth" />;

  return (
    <div className="auth">
      {user ? (
        <>
          <span className="mail">{user.email}</span>
          <a className="pill" href="/linklerim">Linklerim</a>
          <button className="ghost" onClick={logout}>Çıkış</button>
        </>
      ) : (
        <button className="ghost" onClick={login}>Google ile giriş</button>
      )}
    </div>
  );
}
