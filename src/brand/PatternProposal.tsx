import { useState, type CSSProperties } from 'react';
import { Play } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';

// Universal patterns (PROPOSAL, teacher 2026-11-23: "add universal patterns
// (background and otherwise)", then "improve the universal patterns" with
// three reference images: dense flat cut-paper shapes with no outline, a
// doodle scatter with an offset ink outline, and thick squiggle lines and
// curly flower outlines). Fuller, bolder and more playful; smooth flat fills,
// no grain (teacher, 2026-11-23). Every mark is drawn here in code. Preview
// only on the Brand page; no live screen uses them yet.

// ---------------------------------------------------------------- helpers
// Seeded random, so a tile looks the same on every render and every device.
function rand(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
type R = () => number;
const f = (n: number) => n.toFixed(1);
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length)];

// Spacing (teacher, 2026-11-23: "improve the spacing of the shapes"):
// Poisson-disc style placement on a wrapping tile. Each mark has a radius
// (ext); two marks never come closer than ext + ext + gap, measured across
// the tile edges too, and two big marks keep an extra gap. Big marks go down
// first, then smaller ones fill the holes until nothing more fits, so the
// spread is even: no clumps, no bald spots, no touching.
type Item = { ext: number; draw: (c: string) => string; spin?: boolean };
function scatter(r: R, W: number, H: number, make: () => Item, colors: string[], o: { gapK: number; max: number; tries?: number }) {
  const raw = Array.from({ length: o.max * 3 }, make);
  const bigT = [...raw].sort((a, b) => b.ext - a.ext)[Math.floor(raw.length * 0.35)].ext;
  // big marks first (in random kind order), then the rest fill the holes
  const pool = [...raw.filter((p) => p.ext >= bigT), ...raw.filter((p) => p.ext < bigT)];
  const avgD = (raw.reduce((s, p) => s + p.ext, 0) / raw.length) * 2, gap = o.gapK * avgD;
  const placed: (Item & { x: number; y: number; rot: number; c: string })[] = [];
  const dist = (ax: number, ay: number, bx: number, by: number) => { let dx = Math.abs(ax - bx), dy = Math.abs(ay - by); dx = Math.min(dx, W - dx); dy = Math.min(dy, H - dy); return Math.hypot(dx, dy); };
  const need = (a: Item, b: Item) => a.ext + b.ext + gap + (a.ext >= bigT && b.ext >= bigT ? gap * 0.5 : 0);
  for (const it of pool) {
    if (placed.length >= o.max) break;
    for (let t = 0; t < (o.tries ?? 120); t++) {
      const x = r() * W, y = r() * H;
      if (placed.every((p) => dist(x, y, p.x, p.y) >= need(it, p))) {
        // colour: one not worn by any near neighbour
        const near = new Set(placed.filter((p) => dist(x, y, p.x, p.y) < need(it, p) + avgD * 1.2).map((p) => p.c));
        const free = colors.filter((c) => !near.has(c));
        placed.push({ ...it, x, y, rot: it.spin === false ? 0 : r() * 360, c: pick(r, free.length ? free : colors) });
        break;
      }
    }
  }
  return placed.map((p) => at(p.x, p.y, p.rot, p.draw(p.c))).join('');
}

// Organic blob: random radii joined with a smooth closed curve.
function blobD(r: R, rad: number, n = 7, wob = 0.26) {
  const p = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5, rr = rad * (1 - wob + r() * wob * 2);
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}
const at = (x: number, y: number, rot: number, inner: string) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${inner}</g>`;
const LOOP = 'M-24 6 C-16 -12 -2 -12 -4 2 C-6 14 -18 4 -8 -6 C2 -14 14 -8 10 4 C6 14 -4 6 6 -6 C12 -12 22 -8 24 0';
const wave = (len: number, amp: number) => { const seg = len / 4; let d = `M${f(-len / 2)} 0`; for (let i = 0; i < 4; i++) d += ` q${f(seg / 2)} ${f(i % 2 ? amp : -amp)} ${f(seg)} 0`; return d; };
function flowerD(rad: number, petals: number) {
  const pts = Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * Math.PI * 2, rr = rad * (0.6 + 0.4 * Math.abs(Math.cos((petals / 2) * t))); return `${f(Math.cos(t) * rr)} ${f(Math.sin(t) * rr)}`; });
  return `M${pts.join(' L')} Z`;
}
const sparkleD = 'M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z';
function starPts(rad: number) { return Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? rad * 0.48 : rad; return `${f(rad * 0 + rr * Math.cos(a))},${f(rr * Math.sin(a))}`; }).join(' '); }

// Every tile draws its marks 9 times (one per neighbour) so any shape that
// crosses an edge comes back on the opposite side: the tile is seamless.
const cache = new Map<string, CSSProperties>();
function tile(key: string, w: number, h: number, ground: string, marks: () => string) {
  const hit = cache.get(key); if (hit) return hit;
  const m = marks();
  const copies = [-w, 0, w].flatMap((dx) => [-h, 0, h].map((dy) => `<g transform="translate(${dx} ${dy})">${m}</g>`)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${ground}"/>${copies}</svg>`;
  const css = { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: `${w / 16}rem ${h / 16}rem` } as CSSProperties;
  cache.set(key, css); return css;
}

const I = PP.ink;
const BRIGHT = [PP.periwinkle, PP.grape, PP.sky, PP.pink, PP.lemon, PP.orange, PP.kelly, PP.teal, PP.lime];
const PASTEL = [PP.gamify, PP.lavender, PP.blueCrystal, PP.blush, PP.butter, PP.peach, PP.mint, PP.aqua, PP.sage];
// Colors walk the list in a shuffled order so neighbours rarely match.

// ---------------------------------------------------------------- 1 Cut-paper toss
function cutPaper(seed: number, list: string[], calm: boolean) {
  const r = rand(seed);
  const make = (): Item => {
    const s = (calm ? 0.85 : 1) * (11 + r() * 15), kind = pick(r, ['blob', 'blob', 'moon', 'tri', 'plus', 'bar', 'dot', 'ring']);
    const d = kind === 'blob' ? blobD(r, s * 0.8) : '';
    const draw = (c: string) => kind === 'blob' ? `<path d="${d}" fill="${c}"/>`
      : kind === 'moon' ? `<path d="M${f(-s)} ${f(s * 0.4)} A${f(s)} ${f(s)} 0 0 1 ${f(s)} ${f(s * 0.4)} Z" fill="${c}"/>`
      : kind === 'tri' ? `<polygon points="0,${f(-s * 0.9)} ${f(s * 0.85)},${f(s * 0.6)} ${f(-s * 0.85)},${f(s * 0.6)}" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`
      : kind === 'plus' ? `<path d="M${f(-s * 0.3)} ${f(-s * 0.9)} h${f(s * 0.6)} v${f(s * 0.6)} h${f(s * 0.6)} v${f(s * 0.6)} h${f(-s * 0.6)} v${f(s * 0.6)} h${f(-s * 0.6)} v${f(-s * 0.6)} h${f(-s * 0.6)} v${f(-s * 0.6)} h${f(s * 0.6)} Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`
      : kind === 'bar' ? `<rect x="${f(-s)}" y="${f(-s * 0.28)}" width="${f(s * 2)}" height="${f(s * 0.56)}" rx="${f(s * 0.28)}" fill="${c}"/>`
      : kind === 'ring' ? `<circle r="${f(s * 0.68)}" fill="none" stroke="${c}" stroke-width="${f(s * 0.4)}"/>`
      : `<circle r="${f(s * 0.6)}" fill="${c}"/>`;
    return { ext: kind === 'dot' ? s * 0.6 : s, draw };
  };
  return scatter(r, 240, 240, make, list, { gapK: calm ? 0.9 : 0.6, max: calm ? 14 : 60 });
}

// ---------------------------------------------------------------- 2 Doodle scatter
function doodle(seed: number, calm: boolean) {
  const r = rand(seed), ink = `fill="none" stroke="${I}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
  const fills = calm ? PASTEL : [PP.gamify, PP.blush, PP.butter, PP.blueCrystal, PP.mint, PP.peach, PP.lavender, PP.aqua, PP.sage];
  const make = (): Item => {
    const kind = calm ? pick(r, ['blob', 'blob', 'dots', 'arc']) : pick(r, ['blob', 'blob', 'blob', 'arc', 'sun', 'wave', 'loop', 'dots', 'tri', 'plus']);
    if (kind === 'blob') {
      const s = 13 + r() * 10, d = blobD(r, s), dx = 3 + r() * 3, dy = -2 - r() * 3, rot = 6 + r() * 10;
      // the ink outline is offset and turned so it does not line up with the fill
      return { ext: s * 1.2 + (calm ? 0 : 5), draw: (c) => `<path d="${d}" fill="${c}"/>` + (calm ? '' : `<path d="${d}" transform="translate(${f(dx)} ${f(dy)}) rotate(${f(rot)})" ${ink}/>`) };
    }
    if (kind === 'arc') return { ext: 12, draw: () => `<path d="M-12 4 A12 12 0 0 1 12 4" ${ink}/>` };
    if (kind === 'sun') return { ext: 15, draw: () => `<circle r="5.5" fill="${PP.lemon}"/><circle r="5.5" transform="translate(2 -1.5)" ${ink}/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)} L${f(Math.cos(a) * 15)} ${f(Math.sin(a) * 15)}" ${ink}/>`; }).join('') };
    if (kind === 'wave') return { ext: 15, draw: () => `<path d="${wave(30, 6)}" ${ink}/>` };
    if (kind === 'loop') return { ext: 16, draw: () => `<path d="${LOOP}" transform="scale(0.68)" ${ink}/>` };
    if (kind === 'dots') return { ext: 8, draw: () => [[-3, -3], [4, 0], [-1, 5], [-7, 3]].slice(0, calm ? 3 : 4).map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.1" fill="${calm ? PP.quiet : I}"${calm ? ' opacity="0.45"' : ''}/>`).join('') };
    if (kind === 'tri') return { ext: 10, draw: (c) => `<polygon points="0,-8 7,5 -7,5" fill="${c}"/><polygon points="2,-10 9,3 -5,3" ${ink}/>` };
    return { ext: 7, draw: () => `<path d="M-6 0 H6 M0 -6 V6" fill="none" stroke="${I}" stroke-width="3" stroke-linecap="round"/>` };
  };
  return scatter(r, 260, 260, make, fills, { gapK: calm ? 0.9 : 0.6, max: calm ? 14 : 60 });
}

// ---------------------------------------------------------------- 3 Squiggle lines
function squiggle(seed: number, list: string[], calm: boolean) {
  const r = rand(seed), sw = calm ? 4 : 6;
  const make = (): Item => {
    const kind = pick(r, ['wave', 'wave', 'loop', 'flower', 'flower', 'zig', 'coil']);
    const line = (c: string) => `fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    if (kind === 'wave') { const len = 34 + r() * 14; return { ext: len / 2 + 3, draw: (c) => `<path d="${wave(len, 7)}" ${line(c)}/>` }; }
    if (kind === 'loop') return { ext: 22, draw: (c) => `<path d="${LOOP}" transform="scale(0.88)" ${line(c)}/>` };
    if (kind === 'flower') { const rad = 10 + r() * 5, pet = pick(r, [5, 6, 8]); return { ext: rad + 3, draw: (c) => `<path d="${flowerD(rad, pet)}" ${line(c)}/>` + (calm ? '' : `<circle r="3.2" fill="${c}"/>`) }; }
    if (kind === 'zig') return { ext: 22, draw: (c) => `<path d="M-20 4 L-12 -5 L-4 4 L4 -5 L12 4 L20 -4" ${line(c)}/>` };
    return { ext: 20, draw: (c) => `<path d="M-18 0 c0 -9 11 -9 11 0 s11 9 11 0 s11 -9 11 0" ${line(c)}/>` };
  };
  return scatter(r, 260, 260, make, list, { gapK: calm ? 0.8 : 0.5, max: calm ? 10 : 60 });
}

// ---------------------------------------------------------------- 4 Confetti doodles
function confetti(seed: number, calm: boolean) {
  const r = rand(seed), ed = calm ? '' : ` stroke="${I}" stroke-width="1.8" stroke-linejoin="round"`;
  const make = (): Item => {
    const kind = pick(r, ['spark', 'star', 'dot', 'squig', 'spark']), s = 0.7 + r() * 0.6;
    if (kind === 'spark') return { ext: 10 * s, draw: (c) => `<path d="${sparkleD}" transform="scale(${f(s)})" fill="${c}"${calm ? '' : ` stroke="${I}" stroke-width="${f(1.8 / s)}" stroke-linejoin="round"`}/>` };
    if (kind === 'star') return { ext: 8 * s, draw: (c) => `<polygon points="${starPts(8 * s)}" fill="${c}"${ed}/>` };
    if (kind === 'dot') return { ext: 4.5 * s, draw: (c) => `<circle r="${f(4.5 * s)}" fill="${c}"${ed}/>` };
    return { ext: 14, draw: (c) => `<path d="${wave(24, 5)}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` };
  };
  return scatter(r, 200, 200, make, calm ? PASTEL : BRIGHT, { gapK: calm ? 1.2 : 0.8, max: calm ? 10 : 60 });
}

// ---------------------------------------------------------------- 5 Quiet doodle ground
// The only pattern allowed behind text: marks are pastel at low opacity on
// cream, at or under 1.14:1 against the ground (WCAG text stays on cream).
function quiet(seed: number, calm: boolean) {
  const r = rand(seed), line = (c: string) => `fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"`;
  const make = (): Item => {
    const kind = calm ? 'dot' : pick(r, ['blob', 'wave', 'dot', 'arc', 'spark']);
    if (kind === 'blob') { const d = blobD(r, 6); return { ext: 8, draw: (c) => `<path d="${d}" fill="${c}"/>` }; }
    if (kind === 'wave') return { ext: 12, draw: (c) => `<path d="${wave(22, 4)}" ${line(c)}/>` };
    if (kind === 'arc') return { ext: 9, draw: (c) => `<path d="M-8 3 A8 8 0 0 1 8 3" ${line(c)}/>` };
    if (kind === 'spark') return { ext: 7, draw: (c) => `<path d="${sparkleD}" transform="scale(0.7)" fill="${c}"/>` };
    return { ext: 3, draw: (c) => `<circle r="3" fill="${c}"/>` };
  };
  return `<g opacity="${calm ? 0.45 : 0.65}">${scatter(r, 200, 200, make, [PP.blueCrystal, PP.lavender, PP.blush, PP.mint], { gapK: calm ? 2.5 : 1.6, max: calm ? 9 : 22 })}</g>`;
}
// ---------------------------------------------------------------- trims (kept for the mockups)
const wobbleSquare = (x: number, y: number, s: number, c: string) => `<path d="M${x + 1} ${y + 1} C${x + s * 0.4} ${y - 0.5} ${x + s * 0.7} ${y + 1.5} ${x + s - 1} ${y + 1} C${x + s + 0.5} ${y + s * 0.4} ${x + s - 1.5} ${y + s * 0.7} ${x + s - 1} ${y + s - 1} C${x + s * 0.6} ${y + s + 0.5} ${x + s * 0.3} ${y + s - 1.5} ${x + 1} ${y + s - 1} C${x - 0.5} ${y + s * 0.6} ${x + 1.5} ${y + s * 0.3} ${x + 1} ${y + 1} Z" fill="${c}"/>`;

type Pattern = { id: string; name: string; use: string; rules: string; calmNote: string; make: (calm: boolean) => CSSProperties; group?: 'main' | 'trim' };
export const PATTERNS: Pattern[] = [
  { id: 'cutpaper', name: 'Cut-paper toss', use: 'Game covers, banners, Blog headers, social post frames, lobby edges',
    rules: 'Busy: never behind words. Words sit on a solid paper panel with a 24px clear margin. Tile 240px, no outline, evenly spaced (gap about 0.6x a shape).',
    calmNote: 'Fewer, smaller pastel shapes, wider gaps.',
    make: (c) => tile(`cut${c}`, 240, 240, PP.paper, () => cutPaper(11, c ? PASTEL : BRIGHT, c)) },
  { id: 'cutpaper-pastel', name: 'Cut-paper toss, pastel', use: 'Game stage grounds around the board zone, waiting screens, sticker sheets',
    rules: 'Blocks out the board zone with a solid panel. Tile 240px.',
    calmNote: 'Fewer shapes, faded to half.',
    make: (c) => tile(`cutp${c}`, 240, 240, c ? PP.paper : PP.cream, () => c ? `<g opacity="0.55">${cutPaper(23, PASTEL, true)}</g>` : cutPaper(23, PASTEL, false)) },
  { id: 'doodle', name: 'Doodle scatter', use: 'Results box edges, celebration frames, theme guide headers, social posts',
    rules: 'Soft blobs with an offset ink outline, arcs, suns, waves, loops, dot clusters. Edges only, 24px clear of text. Tile 260px.',
    calmNote: 'Pastel blobs, no ink outlines, faint dots.',
    make: (c) => tile(`doo${c}`, 260, 260, PP.cream, () => doodle(37, c)) },
  { id: 'squiggle', name: 'Squiggle lines', use: 'Section bands, Blog post art, social story backgrounds, print covers',
    rules: 'Thick rounded lines, loops and curly flower outlines. Never behind words; put a solid panel on top. Tile 260px.',
    calmNote: 'Fewer, thinner pastel lines.',
    make: (c) => tile(`squ${c}`, 260, 260, PP.paper, () => squiggle(53, c ? PASTEL : BRIGHT, c)) },
  { id: 'squiggle-pastel', name: 'Squiggle lines, pastel', use: 'Teacher page headers, empty states, studio canvas trims',
    rules: 'Pastel lines on cream. A heading may sit on a solid chip above it. Tile 260px.',
    calmNote: 'Thinner and faded to half.',
    make: (c) => tile(`squp${c}`, 260, 260, PP.cream, () => c ? `<g opacity="0.55">${squiggle(71, PASTEL, true)}</g>` : squiggle(71, PASTEL, false)) },
  { id: 'confetti', name: 'Confetti doodles', use: 'Edges only: celebrations, results decoration, lobby, social posts',
    rules: 'Never behind words: keep 24px clear of any text. Tile 200px, ink-edged sparkles, stars and dots.',
    calmNote: 'Fewer pastel marks, no ink.',
    make: (c) => tile(`con${c}`, 200, 200, PP.cream, () => confetti(89, c)) },
  { id: 'quiet', name: 'Quiet doodle ground', use: 'Site ground behind menus, teacher pages, start menus, results box backdrop',
    rules: 'The only pattern allowed behind text. Pastel marks at 65% on cream, 1.14:1 or less against the ground (computed). Tile 200px.',
    calmNote: 'Dots only, fainter.',
    make: (c) => tile(`qui${c}`, 200, 200, PP.cream, () => quiet(101, c)) },
  { id: 'checker', name: 'Board checker', use: 'Game boards and grids, under pieces only (board zone)',
    rules: 'Squares match the board cell size; hand-drawn soft edges. Pieces wear the ink edge so they stand out. Tile 96px.',
    calmNote: 'Paper and lavender.',
    make: (c) => tile(`chk${c}`, 96, 96, PP.paper, () => `${wobbleSquare(0, 0, 48, c ? PP.lavender : PP.gamify)}${wobbleSquare(48, 48, 48, c ? PP.lavender : PP.gamify)}${wobbleSquare(48, 0, 48, c ? PP.paper : PP.blueCrystal)}${wobbleSquare(0, 48, 48, c ? PP.paper : PP.blueCrystal)}`) },
  // Trims: small bands for panels, kept so the mockups and other views keep working.
  { id: 'stripes', group: 'trim', name: 'Wavy stripes trim', use: 'Scoreboard bars, panel headers, tape, progress tracks',
    rules: 'Bands only, never under body text; a label sits on a solid chip. Tile 120 x 48px.',
    calmNote: 'One pale band.',
    make: (c) => tile(`str${c}`, 120, 48, c ? PP.paper : PP.blueCrystal, () => c
      ? `<path d="M0 24 C30 20 90 28 120 24" fill="none" stroke="${PP.gamify}" stroke-width="12" stroke-linecap="round"/>`
      : `<path d="M0 12 C15 6 45 18 60 12 S105 6 120 12" fill="none" stroke="${PP.sky}" stroke-width="10" stroke-linecap="round"/><path d="M0 36 C15 30 45 42 60 36 S105 30 120 36" fill="none" stroke="${PP.pink}" stroke-width="10" stroke-linecap="round"/>`) },
  { id: 'polka', group: 'trim', name: 'Polka dot trim', use: 'Menu panel trims, theme picker buttons, studio sticker sheets',
    rules: 'Trims 8 to 24px wide, never a full text panel. Tile 48px.',
    calmNote: 'Smaller, paler dots.',
    make: (c) => tile(`pol${c}`, 48, 48, PP.periwinkle, () => c ? `<circle cx="12" cy="12" r="3.5" fill="${PP.gamify}"/><circle cx="36" cy="36" r="3.5" fill="${PP.gamify}"/>` : `<circle cx="12" cy="12" r="6" fill="${PP.lemon}"/><circle cx="36" cy="36" r="6" fill="${PP.paper}"/>`) },
  { id: 'wash', group: 'trim', name: 'Pastel blob wash', use: 'Behind the question card and board zone frame',
    rules: 'Large soft blobs; the card or board sits on a solid panel. Tile 320px.',
    calmNote: 'Half strength, two blobs.',
    make: (c) => tile(`wsh${c}`, 320, 320, PP.cream, () => { const r = rand(7); return c
      ? `<g opacity="0.5"><path transform="translate(80 80)" d="${blobD(r, 70)}" fill="${PP.gamify}"/><path transform="translate(240 240)" d="${blobD(r, 80)}" fill="${PP.blueCrystal}"/></g>`
      : [[80, 80, 70, PP.gamify], [240, 230, 80, PP.blueCrystal], [250, 70, 46, PP.blush], [70, 250, 50, PP.butter], [170, 160, 30, PP.aqua]].map(([x, y, s, col]) => `<path transform="translate(${x} ${y})" d="${blobD(r, s as number)}" fill="${col}"/>`).join(''); }) },
];

function Card({ p, calm, tall }: { p: Pattern; calm: boolean; tall?: boolean }) {
  return (
    <div className="rounded-[1.25rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
      <div className={tall ? 'h-44' : 'h-16'} style={p.make(calm)} role="img" aria-label={`${p.name} pattern${calm ? ', Calm version' : ''}`} />
      <div className="px-3 py-2 grid gap-0.5 text-sm">
        <span className="font-bold">{p.name}</span>
        <span className="font-semibold" style={{ color: PP.quiet }}>{p.use}</span>
        <span className="font-semibold">{p.rules}</span>
        <span className="font-semibold" style={{ color: PP.quiet }}>Calm: {p.calmNote}</span>
      </div>
    </div>
  );
}

export default function PatternProposal() {
  const [calm, setCalm] = useState(false);
  const get = (id: string) => PATTERNS.find((p) => p.id === id)!.make(calm);
  return (
    <section className="grid gap-4 rounded-[2rem] p-5 sm:p-6" style={{ background: PP.paper, border: `3px dashed ${PP.periwinkle}` }} aria-labelledby="pat-title" data-testid="pattern-proposal">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: PP.lemon, color: PP.ink, border: `2px solid ${PP.ink}` }}>Proposal, not live</span>
        <h2 id="pat-title" className="font-heading text-xl" style={{ color: PP.ink }}>Universal patterns (proposal)</h2>
        <button type="button" aria-pressed={calm} onClick={() => setCalm((v) => !v)} className="ml-auto rounded-full px-4 min-h-11 font-bold"
          style={{ background: calm ? PP.blueCrystal : PP.paper, color: PP.ink, border: `2px solid ${PP.ink}` }}>{calm ? 'Calm version on' : 'Show Calm version'}</button>
      </div>
      <p className="text-sm font-semibold max-w-prose" style={{ color: PP.quiet }}>
        Your request of 2026-11-23: improve the universal patterns, from your three references (cut-paper shapes, a doodle scatter with offset outlines, thick squiggles). Eight seamless tiles drawn in code with smooth flat fills, plus three trims. The rule: only the Quiet doodle ground may sit behind words; every busier pattern stays at the edges, 24px clear of text, or under a solid panel. Every pattern has a Calm version: fewer, paler shapes and no motion.
      </p>

      <h3 className="font-heading font-bold">Mockup: a menu panel and a question card on the patterns</h3>
      <div className="rounded-[1.5rem] overflow-hidden" style={{ border: `2px solid ${PP.ink}`, ...get('quiet') }}>
        <div className="h-14" style={get('cutpaper')} aria-hidden="true" />
        <div className="grid gap-5 wide:grid-cols-2 p-5 sm:p-8 items-start">
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
            <div className="h-3" style={get('polka')} aria-hidden="true" />
            <div className="p-5 grid gap-3">
              <span className="font-heading font-bold text-xl">Pick a game</span>
              {['Board race', 'Bubble pop', 'Castle quest'].map((t) => (
                <span key={t} className="rounded-[1rem] px-4 min-h-12 flex items-center font-bold" style={{ background: PP.blueCrystal, border: `2px solid ${PP.ink}` }}>{t}</span>
              ))}
              <button type="button" className="justify-self-start rounded-full px-6 min-h-14 text-xl font-bold inline-flex items-center gap-2" style={{ background: PP.periwinkle, color: PP.ink, border: `2px solid ${PP.ink}`, boxShadow: `0 4px 0 ${PP.grapeDeep}` }}>
                <Play weight="fill" aria-hidden="true" /> Start
              </button>
            </div>
          </div>
          <div className="rounded-[1.5rem] p-4" style={{ border: `2px solid ${PP.ink}`, ...get('doodle') }}>
            <div className="rounded-[1.25rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
              <div className="h-6" style={get('stripes')} aria-hidden="true" />
              <div className="px-4 py-3 text-lg font-bold">Which word needs a capital letter?</div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {[['monday', PP.periwinkle], ['apple', PP.pink], ['run', PP.sky], ['blue', PP.kelly]].map(([t, bg]) => (
                  <span key={t} className="rounded-[0.9rem] px-3 py-2 font-bold text-center" style={{ background: bg, color: PP.ink, border: `2px solid ${PP.ink}` }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 h-24 rounded-[1rem]" style={{ border: `2px solid ${PP.ink}`, ...get('checker') }} role="img" aria-label="Board checker sample" />
          </div>
        </div>
        <div className="h-14" style={get('squiggle')} aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-4" data-testid="pattern-grid">
        {PATTERNS.filter((p) => p.group !== 'trim').map((p) => <Card key={p.id} p={p} calm={calm} tall />)}
      </div>
      <h3 className="font-heading font-bold">Trims</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {PATTERNS.filter((p) => p.group === 'trim').map((p) => <Card key={p.id} p={p} calm={calm} />)}
      </div>
    </section>
  );
}
