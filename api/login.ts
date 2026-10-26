// Teacher log in by username (Stage 5). The browser sends username and
// password; this looks up the account's email with the service key (which
// never leaves the server), signs in, and returns only the session tokens.
// Vercel env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const wrong = () => Response.json({ problem: 'wrong' }, { status: 401 });

export async function POST(request: Request): Promise<Response> {
  if (!URL || !ANON || !SERVICE) return Response.json({ problem: 'setup' }, { status: 500 });
  const body = (await request.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-z0-9._]{3,20}$/.test(username) || !password || password.length > 200) return wrong();

  const admin = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
  const profiles = await fetch(`${URL}/rest/v1/profiles?select=id&username=eq.${encodeURIComponent(username)}`, { headers: admin });
  if (!profiles.ok) return Response.json({ problem: 'server' }, { status: 502 });
  const [profile] = (await profiles.json()) as { id: string }[];
  if (!profile) return wrong();
  const user = await fetch(`${URL}/auth/v1/admin/users/${profile.id}`, { headers: admin });
  if (!user.ok) return wrong();
  const { email } = (await user.json()) as { email?: string };
  if (!email) return wrong();

  const token = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json', 'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '' },
    body: JSON.stringify({ email, password }),
  });
  const result = (await token.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; error_code?: string };
  if (!token.ok) return result.error_code === 'email_not_confirmed' ? Response.json({ problem: 'confirm' }, { status: 403 }) : wrong();
  return Response.json({ access_token: result.access_token, refresh_token: result.refresh_token }, { headers: { 'Cache-Control': 'no-store' } });
}
