import { useState, type CSSProperties } from 'react';
import { Play } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';

// Universal patterns (PROPOSAL, teacher 2026-11-23: "add universal patterns
// (background and otherwise)"). Seamless SVG tiles drawn in code in the doodle
// crayon style, using the proposed palette (Grape main, Blue crystal light
// blue). Preview only on the Brand page; no live screen uses them yet.

const GRAIN = `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.11 0 0 0 0 0.1 0 0 0 0 0.2 0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="multiply"/></filter>`;
const sparkle = (x: number, y: number, s: number, c: string, ink = '') =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z" fill="${c}"${ink ? ` stroke="${ink}" stroke-width="${1.6 / s}" stroke-linejoin="round"` : ''}/>`;
const dot = (x: number, y: number, r: number, c: string, ink = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${ink ? ` stroke="${ink}" stroke-width="1.6"` : ''}/>`;
const squig = (x: number, y: number, c: string, w = 3.5) => `<path d="M${x} ${y} q5 -7 10 0 t10 0 t10 0" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const star = (x: number, y: number, r: number, c: string, ink = '') => {
  const p = Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.48 : r; return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return `<polygon points="${p}" fill="${c}" stroke-linejoin="round"${ink ? ` stroke="${ink}" stroke-width="1.6"` : ''}/>`;
};
const blob = (x: number, y: number, r: number, c: string, ink = '', grain = true) =>
  `<path transform="translate(${x} ${y}) scale(${r / 50})" d="M-46 -6 C-44 -38 -10 -50 18 -44 C46 -38 52 -8 46 18 C40 44 6 52 -20 44 C-42 38 -48 22 -46 -6 Z" fill="${c}"${ink ? ` stroke="${ink}" stroke-width="${3 * 50 / r}" stroke-linejoin="round"` : ''}${grain ? ' filter="url(#g)"' : ''}/>`;

// Every tile wraps its marks at the edges (9 copies) so it is seamless.
function tile(w: number, h: number, ground: string, marks: string) {
  const copies = [-w, 0, w].flatMap((dx) => [-h, 0, h].map((dy) => `<g transform="translate(${dx} ${dy})">${marks}</g>`)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${GRAIN}</defs><rect width="${w}" height="${h}" fill="${ground}"/>${copies}</svg>`;
  return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: `${w / 16}rem ${h / 16}rem` } as CSSProperties;
}

type Pattern = { id: string; name: string; use: string; rules: string; calmNote: string; make: (calm: boolean) => CSSProperties };
const I = PP.ink;
export const PATTERNS: Pattern[] = [
  { id: 'quiet', name: 'Quiet doodle ground', use: 'Site ground behind menus, teacher pages, start menus, results box backdrop',
    rules: 'The only pattern allowed behind text. Marks at 1.15:1 or less against cream (these are 1.13:1). Tile 160px.',
    calmNote: 'Dots only, fainter.',
    make: (c) => tile(160, 160, PP.cream, c
      ? `<g opacity="0.45">${dot(30, 40, 3, PP.lavender)}${dot(110, 120, 3, PP.blueCrystal)}${dot(120, 30, 2.5, PP.lavender)}</g>`
      : `<g opacity="0.6">${sparkle(30, 40, 0.9, PP.lavender)}${dot(110, 120, 3.5, PP.blueCrystal)}${squig(70, 90, PP.lavender, 3)}${dot(130, 34, 3, PP.lavender)}${sparkle(40, 130, 0.6, PP.blueCrystal)}</g>`) },
  { id: 'confetti', name: 'Doodle confetti', use: 'Edges only: celebrations, results decoration, lobby, social posts',
    rules: 'Never behind words: keep 24px clear of any text. Tile 180px, full color.',
    calmNote: 'Pastel dots, no ink, no motion.',
    make: (c) => tile(180, 180, PP.cream, c
      ? `${dot(30, 30, 5, PP.lavender)}${dot(120, 60, 5, PP.blueCrystal)}${dot(70, 140, 5, PP.blush)}${dot(150, 150, 4, PP.butter)}`
      : `${sparkle(30, 30, 1.1, PP.lemon, I)}${star(124, 52, 9, PP.pink, I)}${dot(80, 100, 5, PP.sky, I)}${squig(18, 140, PP.grape)}${sparkle(150, 140, 0.8, PP.kelly, I)}${dot(150, 98, 3.5, PP.orange, I)}${star(64, 160, 6, PP.grape, I)}`) },
  { id: 'cutpaper', name: 'Cut-paper shapes', use: 'Game covers, banners, social post frames, Blog headers',
    rules: 'Large and few (3 to 5 shapes a tile). Words go on a solid panel on top. Tile 240px.',
    calmNote: 'Pastel shapes, no ink edge.',
    make: (c) => tile(240, 240, PP.cream, c
      ? `${blob(60, 60, 40, PP.lavender, '', false)}${blob(180, 170, 46, PP.blueCrystal, '', false)}${dot(180, 50, 18, PP.butter)}${blob(56, 190, 26, PP.blush, '', false)}`
      : `${blob(60, 60, 40, PP.grape, I)}${blob(180, 170, 46, PP.sky, I)}<path d="M150 30 L206 44 L168 86 Z" fill="${PP.pink}" stroke="${I}" stroke-width="3" stroke-linejoin="round" filter="url(#g)"/>${dot(56, 190, 22, PP.lemon, I)}${sparkle(120, 118, 1, PP.orange, I)}`) },
  { id: 'stripes', name: 'Crayon stripes', use: 'Scoreboard bars, panel headers, tape, progress tracks',
    rules: 'Bands only, never under body text; a label sits on a solid chip. Tile 120 x 48px.',
    calmNote: 'Paler bands, half the waves.',
    make: (c) => tile(120, 48, c ? PP.paper : PP.blueCrystal, c
      ? `<path d="M0 24 C30 20 90 28 120 24" fill="none" stroke="${PP.lavender}" stroke-width="12" stroke-linecap="round"/>`
      : `<path d="M0 12 C15 6 45 18 60 12 S105 6 120 12" fill="none" stroke="${PP.sky}" stroke-width="10" stroke-linecap="round" filter="url(#g)"/><path d="M0 36 C15 30 45 42 60 36 S105 30 120 36" fill="none" stroke="${PP.lavender}" stroke-width="10" stroke-linecap="round" filter="url(#g)"/>`) },
  { id: 'polka', name: 'Crayon polka dots', use: 'Menu panel trims, buttons of the theme picker, studio sticker sheets',
    rules: 'Trims 8 to 24px wide, never a full text panel. Tile 48px.',
    calmNote: 'Smaller, paler dots.',
    make: (c) => tile(48, 48, PP.lavender, c ? `${dot(12, 12, 3.5, PP.paper)}${dot(36, 36, 3.5, PP.paper)}` : `${dot(12, 12, 6, PP.grape)}${dot(36, 36, 6, PP.periwinkle)}`) },
  { id: 'checker', name: 'Board checker', use: 'Game boards and grids, under pieces only (board zone)',
    rules: 'Squares match the board cell size. Pieces wear the ink edge so they stand out. Tile 96px.',
    calmNote: 'Paper and lavender, no pencil lines.',
    make: (c) => tile(96, 96, c ? PP.paper : PP.blueCrystal, c
      ? `<rect width="48" height="48" fill="${PP.lavender}"/><rect x="48" y="48" width="48" height="48" fill="${PP.lavender}"/>`
      : `<rect width="48" height="48" fill="${PP.lavender}" filter="url(#g)"/><rect x="48" y="48" width="48" height="48" fill="${PP.lavender}" filter="url(#g)"/><path d="M0 48.5 C30 47 66 50 96 48 M48.5 0 C47 30 50 66 48 96" stroke="${PP.grape}" stroke-opacity="0.35" stroke-width="2" fill="none"/>`) },
  { id: 'wash', name: 'Pastel blob wash', use: 'Game stage backgrounds around the board zone, lobby, waiting screens',
    rules: 'Blocks out the board zone with a solid panel. Tile 320px.',
    calmNote: 'Half strength, fewer blobs.',
    make: (c) => tile(320, 320, PP.cream, c
      ? `<g opacity="0.5">${blob(80, 80, 70, PP.lavender, '', false)}${blob(240, 240, 80, PP.blueCrystal, '', false)}</g>`
      : `${blob(80, 80, 70, PP.lavender)}${blob(240, 230, 80, PP.blueCrystal)}${blob(250, 70, 46, PP.blush)}${blob(70, 250, 50, PP.butter)}${blob(170, 160, 30, PP.aqua)}`) },
];

export default function PatternProposal() {
  const [calm, setCalm] = useState(false);
  const get = (id: string) => PATTERNS.find((p) => p.id === id)!.make(calm);
  return (
    <section className="grid gap-4 rounded-[2rem] p-5 sm:p-6" style={{ background: PP.paper, border: `3px dashed ${PP.grape}` }} aria-labelledby="pat-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: PP.lemon, color: PP.ink, border: `2px solid ${PP.ink}` }}>Proposal, not live</span>
        <h2 id="pat-title" className="font-heading text-xl" style={{ color: PP.ink }}>Universal patterns (proposal)</h2>
        <button type="button" aria-pressed={calm} onClick={() => setCalm((v) => !v)} className="ml-auto rounded-full px-4 min-h-11 font-bold"
          style={{ background: calm ? PP.blueCrystal : PP.paper, color: PP.ink, border: `2px solid ${PP.ink}` }}>{calm ? 'Calm version on' : 'Show Calm version'}</button>
      </div>
      <p className="text-sm font-semibold max-w-prose" style={{ color: PP.quiet }}>
        Your request of 2026-11-23: universal patterns, background and otherwise. Seven seamless tiles drawn in code in the doodle crayon style, in the proposed palette. The rule: only the Quiet doodle ground may sit behind words; every busier pattern stays at the edges, 24px clear of text, or under a solid panel.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-4">
        {PATTERNS.map((p) => (
          <div key={p.id} className="rounded-[1.25rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
            <div className="h-40" style={p.make(calm)} role="img" aria-label={`${p.name} pattern${calm ? ', Calm version' : ''}`} />
            <div className="px-3 py-2 grid gap-0.5 text-sm">
              <span className="font-bold">{p.name}</span>
              <span className="font-semibold" style={{ color: PP.quiet }}>{p.use}</span>
              <span className="font-semibold">{p.rules}</span>
              <span className="font-semibold" style={{ color: PP.quiet }}>Calm: {p.calmNote}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-heading font-bold">Mockup: a menu panel and a question card on the patterns</h3>
      <div className="rounded-[1.5rem] overflow-hidden" style={{ border: `2px solid ${PP.ink}`, ...get('quiet') }}>
        <div className="h-12" style={get('confetti')} aria-hidden="true" />
        <div className="grid gap-5 wide:grid-cols-2 p-5 sm:p-8 items-start">
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
            <div className="h-3" style={get('polka')} aria-hidden="true" />
            <div className="p-5 grid gap-3">
              <span className="font-heading font-bold text-xl">Pick a game</span>
              {['Board race', 'Bubble pop', 'Castle quest'].map((t) => (
                <span key={t} className="rounded-[1rem] px-4 min-h-12 flex items-center font-bold" style={{ background: PP.blueCrystal, border: `2px solid ${PP.ink}` }}>{t}</span>
              ))}
              <button type="button" className="justify-self-start rounded-full px-6 min-h-14 text-xl font-bold inline-flex items-center gap-2" style={{ background: PP.grape, color: '#fff', border: `2px solid ${PP.ink}`, boxShadow: `0 4px 0 ${PP.grapeDeep}` }}>
                <Play weight="fill" aria-hidden="true" /> Start
              </button>
            </div>
          </div>
          <div className="rounded-[1.5rem] p-4" style={{ border: `2px solid ${PP.ink}`, ...get('wash') }}>
            <div className="rounded-[1.25rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
              <div className="h-6" style={get('stripes')} aria-hidden="true" />
              <div className="px-4 py-3 text-lg font-bold">Which word needs a capital letter?</div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {[['monday', PP.grape, '#fff'], ['apple', PP.pink, PP.ink], ['run', PP.sky, PP.ink], ['blue', PP.kelly, PP.ink]].map(([t, bg, fg]) => (
                  <span key={t} className="rounded-[0.9rem] px-3 py-2 font-bold text-center" style={{ background: bg, color: fg, border: `2px solid ${PP.ink}` }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 h-24 rounded-[1rem]" style={{ border: `2px solid ${PP.ink}`, ...get('checker') }} role="img" aria-label="Board checker sample" />
          </div>
        </div>
        <div className="h-12" style={get('confetti')} aria-hidden="true" />
      </div>
    </section>
  );
}
