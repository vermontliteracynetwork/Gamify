import type { ThemePieceSpec } from '../types';
import { CODE, codeX, MARKER, markerCenters, OUTLINE_STROKE, outlineBox, PAGE } from './template';

// Reads photos (or scans) of printed theme template pages and cuts out the
// art inside each piece's outline. Steps: find the four corner squares,
// straighten the page, read its page number, crop just inside the outline,
// skip spaces left empty. Rebuilt from the Dashboard's scanner idea.

type Pt = [number, number];
const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d', { willReadFrequently: true })!;

// Corner squares: dark, roughly square, solid blobs nearest each corner.
export function findMarkers(img: CanvasImageSource & { width: number; height: number }): Pt[] | null {
  const s = Math.min(1, 900 / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = canvas(w, h), ctx = ctx2d(c);
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) { lum[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; sum += lum[i]; }
  const dark = Math.min(100, (sum / (w * h)) * 0.45);
  const seen = new Uint8Array(w * h);
  const found: { x: number; y: number; hollow: boolean }[] = [];
  const stack: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || lum[i] > dark) continue;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const k = stack.pop()!, x = k % w, y = (k / w) | 0; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const near = [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w];
      for (const nb of near) if (nb >= 0 && nb < w * h && !seen[nb] && lum[nb] <= dark) { seen[nb] = 1; stack.push(nb); }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw < w * 0.015 || bw > w * 0.15 || bw / bh < 0.6 || bw / bh > 1.6 || n / (bw * bh) < 0.55) continue;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    found.push({ x: cx / s, y: cy / s, hollow: lum[Math.round(cy) * w + Math.round(cx)] > dark });
  }
  if (found.length < 4) return null;
  const corners: Pt[] = [[0, 0], [img.width, 0], [img.width, img.height], [0, img.height]];
  const picked = corners.map(([X, Y]) => found.reduce((b, m) => ((m.x - X) ** 2 + (m.y - Y) ** 2 < (b.x - X) ** 2 + (b.y - Y) ** 2 ? m : b)));
  if (new Set(picked).size < 4) return null;
  const turn = Math.max(0, picked.findIndex((m) => m.hollow));
  return [0, 1, 2, 3].map((i) => { const m = picked[(i + turn) % 4]; return [m.x, m.y] as Pt; });
}

// The 3x3 perspective transform taking page points to photo points.
export function homography(from: Pt[], to: Pt[]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = from[i], [u, v] = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  return [...A.map((row, i) => row[8] / row[i]), 1];
}

export function project(h: number[], x: number, y: number): Pt {
  const z = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / z, (h[3] * x + h[4] * y + h[5]) / z];
}

// Flattens the photo onto a clean page and whitens gray paper.
function straighten(img: CanvasImageSource & { width: number; height: number }, corners: Pt[]): HTMLCanvasElement {
  const W = PAGE.width, H = PAGE.height;
  const out = canvas(W, H), octx = ctx2d(out);
  const h = homography(markerCenters(), corners);
  const sc = Math.min(1, 3200 / Math.max(img.width, img.height));
  const sw = Math.round(img.width * sc), sh = Math.round(img.height * sc);
  const src = canvas(sw, sh), sctx = ctx2d(src);
  sctx.drawImage(img, 0, 0, sw, sh);
  const sd = sctx.getImageData(0, 0, sw, sh).data;
  const od = octx.createImageData(W, H), o = od.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [pu, pv] = project(h, x, y);
    const u = Math.round(pu * sc), v = Math.round(pv * sc), di = (y * W + x) * 4;
    o[di + 3] = 255;
    if (u < 0 || v < 0 || u >= sw || v >= sh) { o[di] = o[di + 1] = o[di + 2] = 255; continue; }
    const si = (v * sw + u) * 4;
    o[di] = sd[si]; o[di + 1] = sd[si + 1]; o[di + 2] = sd[si + 2];
  }
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  for (let i = 0; i < o.length; i += 16) { hist[0][o[i]]++; hist[1][o[i + 1]]++; hist[2][o[i + 2]]++; }
  const total = o.length / 16;
  const paper = hist.map((hh) => { let acc = 0; for (let v = 255; v >= 0; v--) { acc += hh[v]; if (acc > total * 0.03) return Math.max(v, 60); } return 255; });
  if (paper.some((v) => v < 245)) for (let i = 0; i < o.length; i += 4) for (let ch = 0; ch < 3; ch++) o[i + ch] = Math.min(255, (o[i + ch] * 255) / paper[ch]);
  octx.putImageData(od, 0, 0);
  return out;
}

function readPageNumber(page: HTMLCanvasElement): number {
  const ctx = ctx2d(page);
  let n = 0;
  for (let b = 0; b < CODE.bits; b++) {
    const q = CODE.size * 0.25, d = ctx.getImageData(Math.round(codeX(b) + q), Math.round(CODE.y + q), CODE.size / 2, CODE.size / 2).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
    n = n * 2 + (sum / (d.length / 4) / 3 < 110 ? 1 : 0);
  }
  return n;
}

// Share of a crop that is still plain paper.
function paperShare(d: Uint8ClampedArray) {
  let white = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { n++; if (d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225) white++; }
  return n ? white / n : 1;
}

function cutPiece(page: HTMLCanvasElement, piece: ThemePieceSpec, round: boolean): string | null {
  const box = outlineBox(piece);
  const inset = OUTLINE_STROKE * 1.5 + 8;
  const w = Math.round(box.width - inset * 2), h = Math.round(box.height - inset * 2);
  const crop = canvas(w, h), cctx = ctx2d(crop);
  cctx.drawImage(page, box.x + inset, box.y + inset, w, h, 0, 0, w, h);
  if (paperShare(cctx.getImageData(0, 0, w, h).data) > 0.97) return null; // left empty
  const scale = Math.min(1, Math.max(piece.width, piece.height, 256) / Math.max(w, h));
  const out = canvas(Math.round(w * scale), Math.round(h * scale)), octx = ctx2d(out);
  if (round) { octx.beginPath(); octx.ellipse(out.width / 2, out.height / 2, out.width / 2, out.height / 2, 0, 0, Math.PI * 2); octx.clip(); }
  octx.drawImage(crop, 0, 0, out.width, out.height);
  return round || piece.width <= 400 ? out.toDataURL('image/png') : out.toDataURL('image/jpeg', 0.86);
}

export interface ScanResult { pieces: Record<string, string>; empty: string[]; unread: number }

// `pieces` is the game's piece list in template page order (page 1 first).
export async function scanTemplatePages(files: File[], pieces: ThemePieceSpec[], isRoundPiece: (p: ThemePieceSpec) => boolean): Promise<ScanResult> {
  const result: ScanResult = { pieces: {}, empty: [], unread: 0 };
  for (const file of files) {
    let bmp: ImageBitmap;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { result.unread++; continue; }
    const corners = findMarkers(bmp);
    if (!corners) { result.unread++; continue; }
    const page = straighten(bmp, corners);
    const piece = pieces[readPageNumber(page) - 1];
    if (!piece) { result.unread++; continue; }
    const art = cutPiece(page, piece, isRoundPiece(piece));
    if (art) result.pieces[piece.id] = art; else result.empty.push(piece.id);
  }
  return result;
}

export const MARKER_SIZE = MARKER.size;
