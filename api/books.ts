// Gamify Books on Stripe (owner, 2026-11-25): the Developer Portal's
// bookkeeping reads Stripe here, server side, so the secret key never reaches
// the browser. Owner only (two-step sign-in), see api/_owner.ts.
// GET ?year=2027: balance transactions for that year (charges, refunds, fees,
// payouts), the Stripe balance, recent payouts, customers, active
// subscriptions (for monthly recurring revenue) and invoices.
// POST { action: 'invoice', invoice }: makes a DRAFT Stripe invoice from a
// Books invoice (customer found by email or created). POST { action: 'send',
// id }: finalizes and emails it. Nothing is sent to a school without her tap.
// Vercel env: STRIPE_SECRET_KEY (plus the owner check's variables).
import { isOwner } from './_owner';

const KEY = process.env.STRIPE_SECRET_KEY ?? '';
const NO_STORE = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function stripe(path: string, init?: { method?: string; form?: Record<string, string> }): Promise<Any> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${KEY}`, ...(init?.form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: init?.form ? new URLSearchParams(init.form).toString() : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as Any)?.error?.message ?? `Stripe ${res.status}`);
  return body;
}

// Follows Stripe's pages up to a cap, so a busy year cannot time out.
async function all(path: string, cap = 2000): Promise<Any[]> {
  const out: Any[] = [];
  let after = '';
  while (out.length < cap) {
    const page = await stripe(`${path}${path.includes('?') ? '&' : '?'}limit=100${after ? `&starting_after=${after}` : ''}`);
    out.push(...page.data);
    if (!page.has_more || !page.data.length) break;
    after = page.data[page.data.length - 1].id;
  }
  return out;
}

export async function GET(request: Request): Promise<Response> {
  if (!(await isOwner(request))) return json({ problem: 'owner' }, 401);
  if (!KEY) return json({ configured: false });
  const year = Number(new URL(request.url).searchParams.get('year')) || new Date().getUTCFullYear();
  const from = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const to = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);
  try {
    const [txns, balance, payouts, custs, subs, invoices] = await Promise.all([
      all(`balance_transactions?created[gte]=${from}&created[lt]=${to}&expand[]=data.source`),
      stripe('balance'),
      stripe('payouts?limit=10'),
      all('customers', 500),
      all('subscriptions?status=active&expand[]=data.items.data.price', 1000),
      stripe('invoices?limit=50'),
    ]);
    const mrr = subs.reduce((n: number, s: Any) => n + s.items.data.reduce((m: number, it: Any) => {
      const p = it.price?.recurring;
      if (!p || it.price.unit_amount == null) return m;
      const perMonth = p.interval === 'year' ? 1 / 12 : p.interval === 'week' ? 52 / 12 : p.interval === 'day' ? 365 / 12 : 1;
      return m + (it.price.unit_amount * (it.quantity ?? 1) * perMonth) / (p.interval_count || 1);
    }, 0), 0);
    const sum = (list: Any[]) => list.filter((b) => b.currency === 'usd').reduce((n, b) => n + b.amount, 0);
    return json({
      configured: true,
      live: KEY.startsWith('sk_live') || KEY.startsWith('rk_live'),
      year,
      txns: txns.map((t: Any) => ({
        id: t.id, created: t.created, type: t.type, reporting_category: t.reporting_category, amount: t.amount, fee: t.fee, net: t.net,
        description: t.description, customer: t.source?.billing_details?.email ?? t.source?.receipt_email ?? null, invoice: !!t.source?.invoice,
      })),
      balance: { available: sum(balance.available ?? []), pending: sum(balance.pending ?? []) },
      payouts: payouts.data.map((p: Any) => ({ id: p.id, amount: p.amount, arrival: p.arrival_date, status: p.status })),
      customers: custs.map((c: Any) => ({ id: c.id, name: c.name ?? '', email: c.email ?? '' })),
      subscriptions: subs.length,
      mrr: Math.round(mrr),
      invoices: invoices.data.map((i: Any) => ({ id: i.id, number: i.number, status: i.status, total: i.total, customer: i.customer_name ?? i.customer_email ?? '', url: i.hosted_invoice_url })),
    });
  } catch (err) {
    return json({ configured: true, problem: String((err as Error).message ?? err) }, 502);
  }
}

interface BooksInvoice { number: string; customer: string; email: string; po: string; due: string; issued: string; lines: { description: string; qty: number; price: number }[]; note?: string }

export async function POST(request: Request): Promise<Response> {
  if (!(await isOwner(request))) return json({ problem: 'owner' }, 401);
  if (!KEY) return json({ configured: false }, 400);
  const body = (await request.json().catch(() => ({}))) as { action?: string; invoice?: BooksInvoice; id?: string };
  try {
    if (body.action === 'send' && typeof body.id === 'string' && body.id.startsWith('in_')) {
      const id = encodeURIComponent(body.id);
      const fin = await stripe(`invoices/${id}/finalize`, { method: 'POST', form: {} });
      if (fin.status === 'open') await stripe(`invoices/${id}/send`, { method: 'POST', form: {} });
      return json({ ok: true, id: fin.id, url: fin.hosted_invoice_url, status: 'sent' });
    }
    const inv = body.invoice;
    if (body.action !== 'invoice' || !inv || !inv.email || !Array.isArray(inv.lines) || !inv.lines.length) return json({ problem: 'bad request' }, 400);
    const found = await stripe(`customers?email=${encodeURIComponent(inv.email)}&limit=1`);
    const customer = found.data[0]?.id ?? (await stripe('customers', { method: 'POST', form: { email: inv.email.slice(0, 200), name: inv.customer.slice(0, 200) } })).id;
    const days = Math.max(0, Math.round((Date.parse(inv.due) - Date.parse(inv.issued)) / 86_400_000)) || 30;
    const form: Record<string, string> = {
      customer, collection_method: 'send_invoice', days_until_due: String(days), auto_advance: 'false', pending_invoice_items_behavior: 'exclude',
      'metadata[books_number]': inv.number.slice(0, 40),
    };
    if (inv.po) { form['custom_fields[0][name]'] = 'PO number'; form['custom_fields[0][value]'] = inv.po.slice(0, 30); }
    if (inv.note) form.description = inv.note.slice(0, 500);
    const draft = await stripe('invoices', { method: 'POST', form });
    for (const l of inv.lines.slice(0, 50)) {
      const qty = Math.max(1, Math.round(l.qty));
      const label = qty > 1 ? `${String(l.description).slice(0, 160)} (${qty} x $${l.price.toFixed(2)})` : String(l.description).slice(0, 200);
      await stripe('invoiceitems', { method: 'POST', form: {
        customer, invoice: draft.id, currency: 'usd', description: label, amount: String(Math.round(qty * l.price * 100)),
      } });
    }
    const fresh = await stripe(`invoices/${draft.id}`);
    return json({ ok: true, id: fresh.id, url: `https://dashboard.stripe.com/${KEY.startsWith('sk_live') ? '' : 'test/'}invoices/${fresh.id}`, status: 'draft' });
  } catch (err) {
    return json({ problem: String((err as Error).message ?? err) }, 502);
  }
}
