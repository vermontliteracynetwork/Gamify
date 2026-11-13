import type { ThemePieceSpec } from '../types';
import { isRound } from './template';
import { hasShape, shapePdf } from './shapes';

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
  if (p.id === 'dice') {
    const cw = (w - inset * 2) / 6;
    for (let k = 0; k < 6; k++) ops.push(`${(inset + k * cw + line * 2).toFixed(2)} ${(inset + line * 2).toFixed(2)} ${(cw - line * 4).toFixed(2)} ${(h - inset * 2 - line * 4).toFixed(2)} re S`);
  } else if (hasShape(p.id)) {
    ops.push(...shapePdf(p.id, inset, inset, w - inset * 2, h - inset * 2, h), 'S');
  } else if (isRound(p)) {
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
  // The piece's name and size, then what it is for (a power-up's power),
  // wrapped to the page so nothing runs off a small page.
  const size = Math.max(5, Math.min(12, m * 0.045));
  const max = Math.max(12, Math.floor((w - inset * 6) / (size * 0.52)));
  const wrapText = (text: string) => { const out: string[] = []; let cur = ''; for (const wd of clean(text).split(' ')) { if ((cur + ' ' + wd).trim().length > max && cur) { out.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); } if (cur) out.push(cur); return out; };
  const lines = [...wrapText(`${n}. ${p.label}, ${p.width} x ${p.height} px`), ...(p.hint ? wrapText(p.hint) : [])].slice(0, Math.max(2, Math.floor((h * 0.45) / (size * 1.3))));
  lines.forEach((ln, i) => ops.push('BT', '0.6 0.6 0.6 rg', `/F1 ${size.toFixed(1)} Tf`, `1 0 0 1 ${(inset * 3).toFixed(2)} ${(h - inset * 3 - size - i * size * 1.3).toFixed(2)} Tm`, `(${ln}) Tj`, 'ET'));
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
