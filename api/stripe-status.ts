// Stripe connection check for the owner's production line (2026-11-09).
// Says only what is set up (true or false) and whether Stripe answers;
// never returns a key or any customer data.
// Vercel env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
const KEY = process.env.STRIPE_SECRET_KEY ?? '';
const HOOK = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function GET(): Promise<Response> {
  const out = { secretKey: !!KEY, live: KEY.startsWith('sk_live'), webhook: !!HOOK, reachable: false, chargesEnabled: false, prices: 0 };
  if (KEY) {
    try {
      const auth = { headers: { Authorization: `Bearer ${KEY}` } };
      const acct = await fetch('https://api.stripe.com/v1/account', auth);
      if (acct.ok) {
        out.reachable = true;
        out.chargesEnabled = !!((await acct.json()) as { charges_enabled?: boolean }).charges_enabled;
        const prices = await fetch('https://api.stripe.com/v1/prices?active=true&limit=100', auth);
        if (prices.ok) out.prices = (((await prices.json()) as { data?: unknown[] }).data ?? []).length;
      }
    } catch { /* not reachable */ }
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
