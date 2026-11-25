// Owner check shared by the owner-only API routes (the underscore keeps
// Vercel from serving this file as a route). A signed-in Supabase session
// with two-step sign-in (aal2) that is the owner account.
// Vercel env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_OWNER_EMAIL.
const SB_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.VITE_OWNER_EMAIL?.trim().toLowerCase();

export async function isOwner(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token || !SB_URL || !ANON) return false;
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { aal?: string };
    if (claims.aal !== 'aal2') return false;
  } catch { return false; }
  const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = (await res.json()) as { id?: string; email?: string };
  if (OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL) return true;
  if (!SERVICE || !user.id) return false;
  const admin: Record<string, string> = SERVICE.startsWith('sb_') ? { apikey: SERVICE } : { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
  const prof = await fetch(`${SB_URL}/rest/v1/profiles?select=is_owner&id=eq.${encodeURIComponent(user.id)}`, { headers: admin });
  if (!prof.ok) return false;
  const [row] = (await prof.json()) as { is_owner?: boolean }[];
  return !!row?.is_owner;
}
