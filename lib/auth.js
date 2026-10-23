import { supabase } from './supabase.js';

// İstekteki "Authorization: Bearer <token>" başlığından giriş yapmış kullanıcıyı bulur.
export async function userFrom(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}
