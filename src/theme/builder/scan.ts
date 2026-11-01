import type { ThemePieceSpec } from '../types';
import { MARKER, markerCenters, OUTLINE_STROKE, outlineBox, PAGE } from './template';

// Reads photos (or scans) of printed theme template pages and cuts out the
// art inside each piece's outline. Steps: find the four corner squares,
// straighten the page, crop just inside the piece's outline,
// skip spaces left empty. Rebuilt from the Dashboard's scanner idea.

type Pt = [number, number];
const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d', { willReadFrequently: true })!;

// Corner squares: dark, roughly square, solid blobs at the page's corners.
// Photos vary (shadows, colored paper, a page small in the frame, drawings
// full of dark marker), so several ways of telling "dark" are tried, and of
// every square-ish blob the four that make a page-shaped corner frame win
// (teacher, 2026-11-01: every hand-drawn page must be found and cut).
interface Blob { x: number; y: number; size: number; hollow: boolean }
export function findMarkers(img: CanvasImageSource & { width: number; height: number }): Pt[] | null {
  const s = Math.min(1, 1100 / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = canvas(w, h), ctx = ctx2d(c);
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) { lum[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; sum += lum[i]; }
  // Local brightness (a box blur from a summed table) for the adaptive test.
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += lum[y * w + x]; integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + row; } }
  const r = Math.round(Math.max(w, h) / 12);
  const local = (x: number, y: number) => {
    const xa = Math.max(0, x - r), ya = Math.max(0, y - r), xb = Math.min(w, x + r + 1), yb = Math.min(h, y + r + 1);
    return (integ[yb * (w + 1) + xb] - integ[ya * (w + 1) + xb] - integ[yb * (w + 1) + xa] + integ[ya * (w + 1) + xa]) / ((xb - xa) * (yb - ya));
  };
  const mean = sum / (w * h);
  const tests: ((i: number) => boolean)[] = [
    (i) => lum[i] < 150 && lum[i] < 0.6 * local(i % w, (i / w) | 0),
    (i) => lum[i] <= Math.min(100, mean * 0.45),
    (i) => lum[i] <= 70,
    (i) => lum[i] <= 110,
  ];
  let near = false;
  for (const dark of tests) {
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = dark(i) ? 1 : 0;
    const blobs = blobsOf(mask, w, h);
    const corners = cornerFrame(blobs, w, h);
    if (corners) return corners.map(([x, y]) => [x / s, y / s] as Pt);
    // Square blobs near two or more corners: a template page we could not read.
    const zone = (b: Blob) => (b.x < w * 0.25 || b.x > w * 0.75) && (b.y < h * 0.25 || b.y > h * 0.75);
    if (blobs.filter(zone).length >= 2) near = true;
  }
  if (near) throw new MarkersMissing();
  return null;
}

// A template page whose four corner squares did not all show or read.
export class MarkersMissing extends Error {
  constructor() { super('This looks like a template page, but all four black corner squares could not be found. Take the photo again with the whole page showing, flat and in good light.'); }
}

function blobsOf(mask: Uint8Array, w: number, h: number): Blob[] {
  const seen = new Uint8Array(w * h), stack: number[] = [], out: Blob[] = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || !mask[i]) continue;
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const k = stack.pop()!, x = k % w, y = (k / w) | 0; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !seen[k - 1] && mask[k - 1]) { seen[k - 1] = 1; stack.push(k - 1); }
      if (x < w - 1 && !seen[k + 1] && mask[k + 1]) { seen[k + 1] = 1; stack.push(k + 1); }
      if (k >= w && !seen[k - w] && mask[k - w]) { seen[k - w] = 1; stack.push(k - w); }
      if (k < w * (h - 1) && !seen[k + w] && mask[k + w]) { seen[k + w] = 1; stack.push(k + w); }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, big = Math.max(w, h);
    if (bw < big * 0.012 || bw > big * 0.12 || bw / bh < 0.6 || bw / bh > 1.6 || n / (bw * bh) < 0.55) continue;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    out.push({ x: cx, y: cy, size: Math.sqrt(bw * bh), hollow: !mask[Math.round(cy) * w + Math.round(cx)] });
  }
  return out;
}

// The four blobs that frame a page: the most outlying ones in each corner
// direction, of like size, making a convex shape with the page's proportions
// (upright or sideways). The hollow square marks the page's top left.
function cornerFrame(blobs: Blob[], w: number, h: number): Pt[] | null {
  if (blobs.length < 4) return null;
  const dirs: ((b: Blob) => number)[] = [(b) => -(b.x + b.y), (b) => b.x - b.y, (b) => b.x + b.y, (b) => b.y - b.x];
  const pools = dirs.map((f) => [...blobs].sort((a, b) => f(b) - f(a)).slice(0, 5));
  const want = (PAGE.width - 2 * (MARKER.inset + MARKER.size / 2)) / (PAGE.height - 2 * (MARKER.inset + MARKER.size / 2));
  let best: Blob[] | null = null, bestArea = 0;
  const dist = (a: Blob, b: Blob) => Math.hypot(a.x - b.x, a.y - b.y);
  for (const a of pools[0]) for (const b of pools[1]) for (const c of pools[2]) for (const d of pools[3]) {
    const q = [a, b, c, d];
    if (new Set(q).size < 4) continue;
    const sizes = q.map((m) => m.size);
    if (Math.max(...sizes) > Math.min(...sizes) * 2.2) continue;
    // Convex, going around in order.
    let sign = 0, ok = true;
    for (let i = 0; i < 4; i++) {
      const p0 = q[i], p1 = q[(i + 1) % 4], p2 = q[(i + 2) % 4];
      const cr = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
      if (!sign) sign = Math.sign(cr); else if (Math.sign(cr) !== sign) { ok = false; break; }
    }
    if (!ok) continue;
    const top = dist(a, b), bottom = dist(d, c), left = dist(a, d), right = dist(b, c);
    if (Math.min(top, bottom) / Math.max(top, bottom) < 0.65 || Math.min(left, right) / Math.max(left, right) < 0.65) continue;
    const ratio = (top + bottom) / (left + right);
    if (Math.abs(ratio - want) > 0.16 && Math.abs(ratio - 1 / want) > 0.27) continue;
    // Corner squares are small next to the page they frame.
    if (Math.max(...sizes) > Math.min(top, left) * 0.2) continue;
    const area = Math.abs((a.x * b.y - b.x * a.y) + (b.x * c.y - c.x * b.y) + (c.x * d.y - d.x * c.y) + (d.x * a.y - a.x * d.y)) / 2;
    if (area > bestArea && area > w * h * 0.08) { best = q; bestArea = area; }
  }
  if (!best) return null;
  const turn = Math.max(0, best.findIndex((m) => m.hollow));
  return [0, 1, 2, 3].map((i) => { const m = best![(i + turn) % 4]; return [m.x, m.y] as Pt; });
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

// Share of a crop that is still plain paper.
function paperShare(d: Uint8ClampedArray) {
  let white = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { n++; if (d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225) white++; }
  return n ? white / n : 1;
}

function cutPiece(page: HTMLCanvasElement, piece: ThemePieceSpec, round: boolean): string | null {
  const box = outlineBox(piece);
  const inset = OUTLINE_STROKE * 1.5 + 8;
  // Just inside the outline, trimmed evenly to the piece's own proportions,
  // so the art comes out at exactly the piece's size (teacher, 2026-11-01).
  const ratio = piece.width / piece.height;
  let w = box.width - inset * 2, h = box.height - inset * 2;
  if (w / h > ratio) w = h * ratio; else h = w / ratio;
  const x = box.x + (box.width - w) / 2, y = box.y + (box.height - h) / 2;
  const crop = canvas(Math.round(w), Math.round(h)), cctx = ctx2d(crop);
  cctx.drawImage(page, x, y, w, h, 0, 0, crop.width, crop.height);
  if (paperShare(cctx.getImageData(0, 0, crop.width, crop.height).data) > 0.97) return null; // left empty
  const k = Math.max(piece.width, piece.height, 256) / Math.max(piece.width, piece.height);
  const out = canvas(Math.round(piece.width * k), Math.round(piece.height * k)), octx = ctx2d(out);
  if (round) { octx.beginPath(); octx.ellipse(out.width / 2, out.height / 2, out.width / 2, out.height / 2, 0, 0, Math.PI * 2); octx.clip(); }
  octx.drawImage(crop, 0, 0, out.width, out.height);
  return round || piece.width <= 400 ? out.toDataURL('image/png') : out.toDataURL('image/jpeg', 0.86);
}

export const MARKER_SIZE = MARKER.size;

// One photo for one piece (teacher, 2026-11-01: no separate "add photos of
// the pages"; every upload is cut out). A photo of a printed template page is
// straightened and cut to this piece's outline, whatever page it was, so an
// older template's page works too. Any other picture is cut out as a drawing:
// paper around it turns see-through (for pieces that may be see-through), it
// is trimmed to the drawing, and round pieces are cut in a circle. Solid
// pieces (backgrounds, covers) fill their whole shape.
export async function cutPhotoForPiece(file: File, piece: ThemePieceSpec, round: boolean, solid: boolean): Promise<string | null> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a picture file (PNG, JPG, GIF or WebP).');
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { throw new Error('That picture could not be opened.'); }
  const corners = findMarkers(bmp);
  if (corners) return cutPiece(straighten(bmp, corners), piece, round);
  return cutDrawing(bmp, piece, round, solid);
}

function cutDrawing(img: ImageBitmap, piece: ThemePieceSpec, round: boolean, solid: boolean): string {
  const sc = Math.min(1, 1400 / Math.max(img.width, img.height));
  const W = Math.round(img.width * sc), H = Math.round(img.height * sc);
  const src = canvas(W, H), sctx = ctx2d(src);
  sctx.drawImage(img, 0, 0, W, H);
  const id = sctx.getImageData(0, 0, W, H), d = id.data;
  // A picture with its own see-through parts is digital art: keep it as is.
  let clear = 0;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 250) clear++;
  const digital = clear > d.length / 16 * 0.01;
  let x0 = 0, y0 = 0, x1 = W, y1 = H;
  if (!digital) {
    // Whiten gray paper, like a template page.
    const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
    for (let i = 0; i < d.length; i += 16) { hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; }
    const total = d.length / 16;
    const paper = hist.map((hh) => { let acc = 0; for (let v = 255; v >= 0; v--) { acc += hh[v]; if (acc > total * 0.03) return Math.max(v, 60); } return 255; });
    if (paper.some((v) => v < 245)) for (let i = 0; i < d.length; i += 4) for (let ch = 0; ch < 3; ch++) d[i + ch] = Math.min(255, (d[i + ch] * 255) / paper[ch]);
    if (!solid) {
      // Paper reached from the edges turns see-through; white inside the
      // drawing (a white eye, a shine) stays.
      const light = (p: number) => d[p * 4] > 215 && d[p * 4 + 1] > 215 && d[p * 4 + 2] > 215;
      const seen = new Uint8Array(W * H), stack: number[] = [];
      const push = (p: number) => { if (!seen[p] && light(p)) { seen[p] = 1; stack.push(p); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (stack.length) {
        const p = stack.pop()!, x = p % W;
        d[p * 4 + 3] = 0;
        if (x > 0) push(p - 1);
        if (x < W - 1) push(p + 1);
        if (p >= W) push(p - W);
        if (p < W * (H - 1)) push(p + W);
      }
    }
  }
  if (!solid) {
    // Trim to the drawing, with a little room around it.
    x0 = W; y0 = H; x1 = 0; y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad);
  }
  sctx.putImageData(id, 0, 0);
  // Fit the piece's shape: a solid piece is cropped to it (like a cover
  // photo); a see-through piece sits whole and centered inside it.
  const ratio = piece.width / piece.height;
  const bw = x1 - x0, bh = y1 - y0;
  const max = Math.max(piece.width, piece.height, 256);
  const ow = ratio >= 1 ? max : Math.round(max * ratio), oh = ratio >= 1 ? Math.round(max / ratio) : max;
  const out = canvas(ow, oh), octx = ctx2d(out);
  if (solid) {
    const s = Math.max(ow / bw, oh / bh);
    octx.drawImage(src, x0 + (bw - ow / s) / 2, y0 + (bh - oh / s) / 2, ow / s, oh / s, 0, 0, ow, oh);
    return piece.width <= 400 ? out.toDataURL('image/png') : out.toDataURL('image/jpeg', 0.86);
  }
  if (round) { octx.beginPath(); octx.ellipse(ow / 2, oh / 2, ow / 2, oh / 2, 0, 0, Math.PI * 2); octx.clip(); }
  // Round pieces fill their circle (the drawing's own circle edge); others fit inside.
  const s = round ? Math.max(ow / bw, oh / bh) : Math.min(ow / bw, oh / bh);
  const dw = bw * s, dh = bh * s;
  octx.drawImage(src, x0, y0, bw, bh, (ow - dw) / 2, (oh - dh) / 2, dw, dh);
  return out.toDataURL('image/png');
}
