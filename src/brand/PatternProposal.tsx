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

// Jittered grid: even coverage (no clumps, no bald spots), still irregular.
function spots(r: R, w: number, h: number, cols: number, rows: number, jitter = 0.75) {
  const cw = w / cols, ch = h / rows, out: { x: number; y: number }[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const ox = (j % 2) * cw * 0.5; // offset rows like bricks so no lines form
    out.push({ x: (i + 0.5) * cw + ox + (r() - 0.5) * cw * jitter, y: (j + 0.5) * ch + (r() - 0.5) * ch * jitter });
  }
  return out;
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
const colorer = (r: R, list: string[]) => { const order = [...list].sort(() => r() - 0.5); let i = 0; return () => order[i++ % order.length]; };

// ---------------------------------------------------------------- 1 Cut-paper toss
function cutPaper(seed: number, list: string[], calm: boolean) {
  const r = rand(seed), col = colorer(r, list), W = 240;
  return spots(r, W, W, calm ? 4 : 6, calm ? 4 : 6).map(({ x, y }) => {
    const c = col(), s = (calm ? 0.8 : 1) * (12 + r() * 12), kind = pick(r, ['blob', 'blob', 'moon', 'tri', 'plus', 'bar', 'dot', 'ring']);
    const shape = kind === 'blob' ? `<path d="${blobD(r, s * 1.15)}" fill="${c}"/>`
      : kind === 'moon' ? `<path d="M${f(-s)} 0 A${f(s)} ${f(s)} 0 0 1 ${f(s)} 0 Z" fill="${c}"/>`
      : kind === 'tri' ? `<polygon points="0,${f(-s)} ${f(s * 0.95)},${f(s * 0.7)} ${f(-s * 0.95)},${f(s * 0.7)}" fill="${c}" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>`
      : kind === 'plus' ? `<path d="M${f(-s * 0.3)} ${f(-s)} h${f(s * 0.6)} v${f(s * 0.7)} h${f(s * 0.7)} v${f(s * 0.6)} h${f(-s * 0.7)} v${f(s * 0.7)} h${f(-s * 0.6)} v${f(-s * 0.7)} h${f(-s * 0.7)} v${f(-s * 0.6)} h${f(s * 0.7)} Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`
      : kind === 'bar' ? `<rect x="${f(-s * 1.2)}" y="${f(-s * 0.32)}" width="${f(s * 2.4)}" height="${f(s * 0.64)}" rx="${f(s * 0.32)}" fill="${c}"/>`
      : kind === 'ring' ? `<circle r="${f(s * 0.7)}" fill="none" stroke="${c}" stroke-width="${f(s * 0.42)}"/>`
      : `<circle r="${f(s * 0.55)}" fill="${c}"/>`;
    return at(x, y, r() * 360, shape);
  }).join('');
}

// ---------------------------------------------------------------- 2 Doodle scatter
function doodle(seed: number, calm: boolean) {
  const r = rand(seed), col = colorer(r, calm ? PASTEL : [PP.gamify, PP.blush, PP.butter, PP.blueCrystal, PP.mint, PP.peach, PP.periwinkle, PP.sky, PP.pink, PP.lemon]);
  const ink = `fill="none" stroke="${I}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`, W = 260;
  return spots(r, W, W, calm ? 4 : 6, calm ? 4 : 6).map(({ x, y }) => {
    const kind = calm ? pick(r, ['blob', 'dots', 'arc']) : pick(r, ['blob', 'blob', 'blob', 'arc', 'sun', 'wave', 'loop', 'dots', 'tri', 'plus']);
    let g = '';
    if (kind === 'blob') {
      const s = 10 + r() * 9, d = blobD(r, s);
      // the ink outline is offset and turned so it does not line up with the fill
      g = `<path d="${d}" fill="${col()}"/>` + (calm ? '' : `<path d="${d}" transform="translate(${f(3 + r() * 3)} ${f(-2 - r() * 3)}) rotate(${f(6 + r() * 10)})" ${ink}/>`);
    } else if (kind === 'arc') g = `<path d="M-12 0 A12 12 0 0 1 12 0" ${ink}/>`;
    else if (kind === 'sun') g = `<circle r="5.5" fill="${PP.lemon}"/><circle r="5.5" transform="translate(2 -1.5)" ${ink}/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)} L${f(Math.cos(a) * 15)} ${f(Math.sin(a) * 15)}" ${ink}/>`; }).join('');
    else if (kind === 'wave') g = `<path d="${wave(34, 6)}" ${ink}/>`;
    else if (kind === 'loop') g = `<path d="${LOOP}" transform="scale(0.8)" ${ink}/>`;
    else if (kind === 'dots') g = [[0, 0], [7, 3], [2, 8], [-6, 5]].slice(0, calm ? 3 : 4).map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.1" fill="${calm ? PP.quiet : I}"${calm ? ' opacity="0.45"' : ''}/>`).join('');
    else if (kind === 'tri') g = `<polygon points="0,-8 7,5 -7,5" fill="${col()}"/><polygon points="2,-10 9,3 -5,3" ${ink}/>`;
    else g = `<path d="M-6 0 H6 M0 -6 V6" ${ink} stroke-width="3"/>`;
    return at(x, y, r() * 360, g);
  }).join('');
}

// ---------------------------------------------------------------- 3 Squiggle lines
function squiggle(seed: number, list: string[], calm: boolean) {
  const r = rand(seed), col = colorer(r, list), sw = calm ? 4 : 6.5, W = 260;
  return spots(r, W, W, calm ? 3 : 5, calm ? 3 : 5).map(({ x, y }) => {
    const c = col(), kind = pick(r, ['wave', 'wave', 'loop', 'flower', 'flower', 'zig', 'coil']);
    const line = `fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    const g = kind === 'wave' ? `<path d="${wave(48 + r() * 18, 8)}" ${line}/>`
      : kind === 'loop' ? `<path d="${LOOP}" transform="scale(1.15)" ${line}/>`
      : kind === 'flower' ? `<path d="${flowerD(15 + r() * 5, pick(r, [5, 6, 8]))}" ${line}/>` + (calm ? '' : `<circle r="3.5" fill="${col()}"/>`)
      : kind === 'zig' ? `<path d="M-24 4 L-14 -6 L-4 4 L6 -6 L16 4 L24 -4" ${line}/>`
      : `<path d="M-20 0 c0 -10 12 -10 12 0 s12 10 12 0 s12 -10 12 0" ${line}/>`;
    return at(x, y, r() * 360, g);
  }).join('');
}

// ---------------------------------------------------------------- 4 Confetti doodles
function confetti(seed: number, calm: boolean) {
  const r = rand(seed), col = colorer(r, calm ? PASTEL : BRIGHT), W = 200;
  return spots(r, W, W, calm ? 3 : 5, calm ? 3 : 5).map(({ x, y }) => {
    const c = col(), ed = calm ? '' : ` stroke="${I}" stroke-width="1.8" stroke-linejoin="round"`, kind = pick(r, ['spark', 'star', 'dot', 'squig', 'spark']);
    const s = 0.7 + r() * 0.6;
    const g = kind === 'spark' ? `<path d="${sparkleD}" transform="scale(${f(s)})" fill="${c}"${calm ? '' : ` stroke="${I}" stroke-width="${f(1.8 / s)}" stroke-linejoin="round"`}/>`
      : kind === 'star' ? `<polygon points="${starPts(8 * s)}" fill="${c}"${ed}/>`
      : kind === 'dot' ? `<circle r="${f(4.5 * s)}" fill="${c}"${ed}/>`
      : `<path d="${wave(26, 5)}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    return at(x, y, r() * 360, g);
  }).join('');
}

// ---------------------------------------------------------------- 5 Quiet doodle ground
// The only pattern allowed behind text: marks are pastel at low opacity on
// cream, at or under 1.15:1 against the ground (WCAG text stays on cream).
function quiet(seed: number, calm: boolean) {
  const r = rand(seed), col = colorer(r, [PP.gamify, PP.blueCrystal, PP.lavender]), W = 200;
  const marks = spots(r, W, W, calm ? 3 : 4, calm ? 3 : 4).map(({ x, y }) => {
    const c = col(), line = `fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"`;
    const kind = calm ? 'dot' : pick(r, ['blob', 'wave', 'dot', 'arc', 'spark']);
    const g = kind === 'blob' ? `<path d="${blobD(r, 7)}" fill="${c}"/>` : kind === 'wave' ? `<path d="${wave(24, 4)}" ${line}/>`
      : kind === 'arc' ? `<path d="M-8 0 A8 8 0 0 1 8 0" ${line}/>` : kind === 'spark' ? `<path d="${sparkleD}" transform="scale(0.7)" fill="${c}"/>` : `<circle r="3" fill="${c}"/>`;
    return at(x, y, r() * 360, g);
  }).join('');
  return `<g opacity="${calm ? 0.4 : 0.55}">${marks}</g>`;
}

// ---------------------------------------------------------------- trims (kept for the mockups)
const wobbleSquare = (x: number, y: number, s: number, c: string) => `<path d="M${x + 1} ${y + 1} C${x + s * 0.4} ${y - 0.5} ${x + s * 0.7} ${y + 1.5} ${x + s - 1} ${y + 1} C${x + s + 0.5} ${y + s * 0.4} ${x + s - 1.5} ${y + s * 0.7} ${x + s - 1} ${y + s - 1} C${x + s * 0.6} ${y + s + 0.5} ${x + s * 0.3} ${y + s - 1.5} ${x + 1} ${y + s - 1} C${x - 0.5} ${y + s * 0.6} ${x + 1.5} ${y + s * 0.3} ${x + 1} ${y + 1} Z" fill="${c}"/>`;

type Pattern = { id: string; name: string; use: string; rules: string; calmNote: string; make: (calm: boolean) => CSSProperties; group?: 'main' | 'trim' };
export const PATTERNS: Pattern[] = [
  { id: 'cutpaper', name: 'Cut-paper toss', use: 'Game covers, banners, Blog headers, social post frames, lobby edges',
    rules: 'Busy: never behind words. Words sit on a solid paper panel with a 24px clear margin. Tile 240px, 36 shapes, no outline.',
    calmNote: '16 smaller pastel shapes.',
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
    calmNote: '9 thin pastel lines.',
    make: (c) => tile(`squ${c}`, 260, 260, PP.paper, () => squiggle(53, c ? PASTEL : BRIGHT, c)) },
  { id: 'squiggle-pastel', name: 'Squiggle lines, pastel', use: 'Teacher page headers, empty states, studio canvas trims',
    rules: 'Pastel lines on cream. A heading may sit on a solid chip above it. Tile 260px.',
    calmNote: 'Thinner and faded to half.',
    make: (c) => tile(`squp${c}`, 260, 260, PP.cream, () => c ? `<g opacity="0.55">${squiggle(71, PASTEL, true)}</g>` : squiggle(71, PASTEL, false)) },
  { id: 'confetti', name: 'Confetti doodles', use: 'Edges only: celebrations, results decoration, lobby, social posts',
    rules: 'Never behind words: keep 24px clear of any text. Tile 200px, ink-edged sparkles, stars and dots.',
    calmNote: '9 pastel marks, no ink.',
    make: (c) => tile(`con${c}`, 200, 200, PP.cream, () => confetti(89, c)) },
  { id: 'quiet', name: 'Quiet doodle ground', use: 'Site ground behind menus, teacher pages, start menus, results box backdrop',
    rules: 'The only pattern allowed behind text. Pastel marks at 55% on cream, 1.15:1 or less against the ground. Tile 200px.',
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
