'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Actions({ k, active, short }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function call(action) {
    setBusy(true);
    try {
      const r = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: k, action }),
      });
      if (!r.ok) throw new Error();
      if (action === 'delete') router.push('/');
      else router.refresh();
    } catch {
      alert('İşlem başarısız oldu, tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(short);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="m-actions">
      <button className="ghost" onClick={copy}>{copied ? 'Kopyalandı' : 'Kısa linki kopyala'}</button>
      <button className="ghost" disabled={busy} onClick={() => call('toggle')}>
        {active ? 'Linki kapat' : 'Linki aç'}
      </button>
      <button
        className="danger"
        disabled={busy}
        onClick={() => {
          if (confirm('Link ve tüm istatistikleri kalıcı olarak silinsin mi?')) call('delete');
        }}
      >
        Sil
      </button>
    </div>
  );
}
