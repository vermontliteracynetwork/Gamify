import { PRICES_USD_PER_YEAR, SCHOOL_MIN_SEATS, SCHOOL_SEAT_DISCOUNTS, schoolQuote } from '../config';

// The school quote as a one-page PDF (teacher, 2026-10-26: the price is not
// on the website; schools get it by email as a PDF). Written by hand, no
// library: a few lines of Helvetica text, so it works on the server too.

export interface QuoteRequest { name: string; email: string; school: string; seats: number; notes?: string }
export interface QuoteDetails { number: string; date: string; validUntil: string; seats: number; perSeat: number; total: number; fullTotal: number; off: number }

export function quoteDetails(req: QuoteRequest, now = new Date()): QuoteDetails | null {
  const seats = Math.max(SCHOOL_MIN_SEATS, Math.round(req.seats));
  const q = schoolQuote(seats);
  if (!q) return null;
  const off = SCHOOL_SEAT_DISCOUNTS.find((d) => seats >= d.minSeats)?.discount ?? 0;
  const day = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  const stamp = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return { number: `Q-${stamp}-${rand}`, date: day(now), validUntil: day(new Date(now.getTime() + 60 * 86400000)), seats, perSeat: q.perSeat, total: q.total, fullTotal: PRICES_USD_PER_YEAR.pro * seats, off: Math.round(off * 100) };
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`;
// PDF text is Latin-1 here: keep to plain ASCII and escape the specials.
const clean = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, (c) => `\\${c}`);

export function quotePdf(req: QuoteRequest, q: QuoteDetails): Uint8Array {
  const lines: { text: string; size: number; bold?: boolean; gap?: number }[] = [
    { text: 'Gamify', size: 26, bold: true },
    { text: 'School plan quote', size: 16, bold: true, gap: 6 },
    { text: `Quote ${q.number}`, size: 11, gap: 18 },
    { text: `Date: ${q.date}`, size: 11 },
    { text: `Good until: ${q.validUntil}`, size: 11 },
    { text: 'Prepared for', size: 12, bold: true, gap: 18 },
    { text: req.name, size: 11 },
    { text: req.school, size: 11 },
    { text: req.email, size: 11 },
    { text: 'The plan', size: 12, bold: true, gap: 18 },
    { text: `Gamify Pro for ${q.seats} teachers, one year`, size: 11 },
    { text: `${money(q.perSeat)} per teacher a year (${q.off}% school savings, full price ${money(PRICES_USD_PER_YEAR.pro)})`, size: 11 },
    { text: `Total: ${money(q.total)} a year (full price would be ${money(q.fullTotal)})`, size: 14, bold: true, gap: 4 },
    { text: 'Every teacher gets', size: 12, bold: true, gap: 18 },
    { text: '- Every game, unlimited question sets and students, reports kept for good', size: 11 },
    { text: '- Live games with a monitor and lock, groups, a set for each student', size: 11 },
    { text: '- The Theme Builder, unlimited, and every starter theme', size: 11 },
    { text: '- Accessibility features for every student, never paywalled', size: 11 },
    { text: '- No ads, no trackers, no student emails; we sign your data privacy agreement', size: 11 },
    { text: 'Terms', size: 12, bold: true, gap: 18 },
    { text: 'Billed yearly, prepaid. Net 30. Purchase orders welcome.', size: 11 },
    { text: 'To go ahead, reply to the email this quote came with, or send your purchase order.', size: 11 },
    ...(req.notes?.trim() ? [{ text: 'Your note', size: 12, bold: true, gap: 18 }, ...wrap(req.notes.trim(), 90).map((text) => ({ text, size: 11 }))] : []),
    { text: 'Gamify is sold by Vermont Literacy Network LLC.', size: 9, gap: 30 },
  ];
  let y = 742;
  const ops: string[] = ['BT'];
  for (const l of lines) {
    y -= (l.gap ?? 0) + l.size * 1.35;
    ops.push(`/${l.bold ? 'F2' : 'F1'} ${l.size} Tf 1 0 0 1 60 ${y.toFixed(1)} Tm (${clean(l.text)}) Tj`);
  }
  ops.push('ET', '0.71 0.77 0.98 rg 0 772 612 20 re f');
  const stream = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width) { out.push(line); line = word; } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 6);
}
