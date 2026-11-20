// Stripe webhook check (teacher, 2026-11-20: "verify the webhook signature so
// only real events from Stripe get through"). Stripe signs every event with
// the endpoint's secret: the Stripe-Signature header is "t=<time>,v1=<hex>",
// where hex = HMAC-SHA256(secret, "<time>.<raw body>"). Anything else, or an
// event older than five minutes (a replay), is refused.
const enc = new TextEncoder();

async function hmacHex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Same length, every character compared, so timing tells nothing.
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000), toleranceSeconds = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const time = Number(parts.find(([k]) => k === 't')?.[1]);
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
  if (!Number.isFinite(time) || !sigs.length) return false;
  if (Math.abs(nowSeconds - time) > toleranceSeconds) return false;
  const want = await hmacHex(secret, `${time}.${rawBody}`);
  return sigs.some((s) => sameText(s, want));
}

export const signForTest = (secret: string, time: number, body: string) => hmacHex(secret, `${time}.${body}`).then((h) => `t=${time},v1=${h}`);
