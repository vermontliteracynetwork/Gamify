import type { ThemePieceSpec } from '../types';
import { isRound } from './template';

// The digital template as one PDF (teacher, 2026-10-31): a page per piece at
// the piece's exact size, so Canva opens the upload as one project with every
// page the right size. Canva reads a PDF at 96 dpi, so a piece W px wide is a
// page W x 0.75 points wide. Each page holds a faint dashed guide of the
// piece's shape and its name in a corner; nothing else, never Classic art.
// Written by hand like the quote PDF, no library.

const PT = 0.75;
const clean = (s: string) => s.replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, (c) => `\\${c}`);

function pageStream(p: ThemePieceSpec, n: number): string {
  const w = p.width * PT, h = p.height * PT;
  const m = Math.min(w, h), line = Math.max(1, m * 0.01), inset = line * 2;
  const ops = ['q', '0.72 0.72 0.72 RG', `${line.toFixed(2)} w`, `[${(line * 4).toFixed(2)} ${(line * 3).toFixed(2)}] 0 d`];
  if (isRound(p)) {
    const r = m / 2 - inset, cx = w / 2, cy = h / 2, k = 0.5523 * r;
    const f = (x: number) => x.toFixed(2);
    ops.push(`${f(cx + r)} ${f(cy)} m`,
      `${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c`,
      `${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} c`,
      `${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c`,
      `${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} c`, 'S');
  } else {
    ops.push(`${inset.toFixed(2)} ${inset.toFixed(2)} ${(w - inset * 2).toFixed(2)} ${(h - inset * 2).toFixed(2)} re S`);
  }
  ops.push('Q');
  const size = Math.max(6, Math.min(12, m * 0.05));
  ops.push('BT', '0.6 0.6 0.6 rg', `/F1 ${size.toFixed(1)} Tf`, `1 0 0 1 ${(inset * 3).toFixed(2)} ${(h - inset * 3 - size).toFixed(2)} Tm`,
    `(${clean(`${n}. ${p.label}, ${p.width} x ${p.height} px`)}) Tj`, 'ET');
  return ops.join('\n');
}

export function templatePdf(pieces: ThemePieceSpec[]): Uint8Array {
  // Objects: 1 catalog, 2 pages, 3 font, then a page and its stream per piece.
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const kids: string[] = [];
  pieces.forEach((p, i) => {
    const pageId = objects.length + 1, streamId = pageId + 1;
    const stream = pageStream(p, i + 1);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${(p.width * PT).toFixed(2)} ${(p.height * PT).toFixed(2)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(`${pageId} 0 R`);
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pieces.length} >>`;
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
