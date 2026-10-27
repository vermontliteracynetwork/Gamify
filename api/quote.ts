import { quoteDetails, quotePdf, type QuoteRequest } from '../src/lib/quotePdf';

// School quotes by email (teacher, 2026-10-26: the price is not on the
// website; the quote arrives as a PDF). Builds the PDF and sends it with
// Resend, with a copy to the owner.
// Vercel env: RESEND_API_KEY, QUOTE_FROM ("Gamify <quotes@yourdomain.com>",
// a domain verified in Resend), QUOTE_BCC (the owner's email).
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.QUOTE_FROM;
const BCC = process.env.QUOTE_BCC;

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Partial<Record<keyof QuoteRequest, unknown>>;
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const req: QuoteRequest = { name: text(body.name, 80), email: text(body.email, 120), school: text(body.school, 120), seats: Number(body.seats), notes: text(body.notes, 500) };
  if (!req.name || !req.school || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email) || !(req.seats >= 1 && req.seats <= 5000)) return Response.json({ problem: 'invalid' }, { status: 400 });
  if (!KEY || !FROM) return Response.json({ problem: 'setup' }, { status: 503 });
  const q = quoteDetails(req);
  if (!q) return Response.json({ problem: 'invalid' }, { status: 400 });
  const pdf = quotePdf(req, q);
  let bin = '';
  pdf.forEach((b) => { bin += String.fromCharCode(b); });
  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [req.email],
      ...(BCC && { bcc: [BCC] }),
      ...(BCC && { reply_to: BCC }),
      subject: `Your Gamify school quote (${q.number})`,
      text: `Hello ${req.name},\n\nThank you for asking about Gamify for ${req.school}. Your quote for ${q.seats} teachers is attached as a PDF, good until ${q.validUntil}.\n\nTo go ahead, reply to this email or send your purchase order. We answer within one school day.\n\nGamify (Vermont Literacy Network LLC)`,
      attachments: [{ filename: `Gamify-quote-${q.number}.pdf`, content: btoa(bin) }],
    }),
  });
  if (!send.ok) return Response.json({ problem: 'send' }, { status: 502 });
  return Response.json({ ok: true, number: q.number });
}
