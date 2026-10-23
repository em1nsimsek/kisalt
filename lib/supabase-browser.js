import { createClient } from '@supabase/supabase-js';

let client = null;

// Tarayıcıda kullanılan (herkese açık) anahtarla bağlanır. Gizli anahtar buraya ASLA girmez.
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}
