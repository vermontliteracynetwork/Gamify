import { describe, expect, it } from 'vitest';
import { quoteDetails, quotePdf } from './quotePdf';

describe('school quote PDF', () => {
  const req = { name: 'Ms. Rivera', email: 'rivera@school.org', school: 'Maple (East) Elementary', seats: 12, notes: 'Starting in January.' };
  it('prices from the school plan', () => {
    const q = quoteDetails(req, new Date('2026-10-27T12:00:00Z'))!;
    expect(q.seats).toBe(12);
    expect(q.off).toBe(20);
    expect(q.total).toBe(q.perSeat * 12);
    expect(q.number).toMatch(/^Q-20261027-\d{4}$/);
  });
  it('is a well-formed one-page PDF with the school and the total', () => {
    const q = quoteDetails(req)!;
    const text = new TextDecoder().decode(quotePdf(req, q));
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('Maple \\(East\\) Elementary');
    expect(text).toContain(`Total: $${q.total.toLocaleString('en-US')} a year`);
    // The xref offset points at the xref table.
    const start = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(start, start + 4)).toBe('xref');
    // Each object offset points at its object.
    const offs = [...text.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offs.forEach((o, i) => expect(text.slice(o).startsWith(`${i + 1} 0 obj\n`)).toBe(true));
  });
});
