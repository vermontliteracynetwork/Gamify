import { verifyStripeSignature } from '../src/billing/stripeSignature';

// Stripe payment events (teacher, 2026-11-20). Only events whose signature
// checks out against STRIPE_WEBHOOK_SECRET get through; a fake "payment went
// through" message is refused with 400 and never changes a plan. Plans are
// not granted from here until checkout goes live (Waiting on you: Stripe);
// the plan change itself must then happen server side from the verified
// event, never from the browser.
// Vercel env: STRIPE_WEBHOOK_SECRET (whsec_...).
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const HANDLED = new Set(['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.payment_failed']);

export async function POST(request: Request): Promise<Response> {
  if (!SECRET) return Response.json({ problem: 'setup' }, { status: 503 });
  // The raw body exactly as sent; parsing first would break the signature.
  const raw = await request.text();
  if (raw.length > 512 * 1024) return Response.json({ problem: 'too big' }, { status: 413 });
  const ok = await verifyStripeSignature(raw, request.headers.get('stripe-signature'), SECRET);
  if (!ok) {
    console.warn('stripe-webhook: refused an event with a bad or missing signature');
    return Response.json({ problem: 'signature' }, { status: 400 });
  }
  let event: { id?: string; type?: string };
  try { event = JSON.parse(raw) as typeof event; } catch { return Response.json({ problem: 'invalid' }, { status: 400 }); }
  // Verified. Logged by id and type only (no customer details).
  console.info('stripe-webhook: verified', event.id, event.type, HANDLED.has(event.type ?? '') ? 'handled' : 'ignored');
  return Response.json({ received: true });
}
