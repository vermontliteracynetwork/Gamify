import '@fontsource/chicle/400.css';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowsClockwise, FlagCheckered, HourglassHigh, Star } from '@phosphor-icons/react';
import { t } from '../../i18n';
import { pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import type { Layout, SpaceKind } from './board';

// The Board Game's board and die, drawn the same in the game and in the
// Theme Builder's preview (teacher, 2026-11-16: "ALWAYS show preview as the
// actual game template being changed").

export const C = { blue: '#BCD9E2', yellow: '#F9CC14', red: '#D35252', sage: '#9AB582', cream: '#F1DFBB', blush: '#FAE9DF', ink: '#474241' };
export const SQUARE_COLORS = [C.blue, C.yellow, C.red, C.sage];
export const CHICLE: CSSProperties = { fontFamily: "'Chicle', 'Grow Year', system-ui, sans-serif" };
// A little wobble per square, the same all game (surprise and irregularity).
export const WOBBLE = Array.from({ length: 80 }, (_, i) => ({ r: ((i * 37) % 7) - 3, dx: ((i * 53) % 5) - 2, dy: ((i * 29) % 5) - 2 }));

// The ground behind the board: the theme's background, or Classic's cream
// with a soft dotted pattern like an old board-game box.
export function boardGround(theme: GameTheme): CSSProperties {
  const bg = pieceImage(theme, 'background');
  if (bg) return { background: `center / cover no-repeat url("${bg}")` };
  return { backgroundColor: C.cream, backgroundImage: `radial-gradient(${C.blush} 18%, transparent 19%), radial-gradient(${C.blush} 18%, transparent 19%)`, backgroundSize: '28px 28px', backgroundPosition: '0 0, 14px 14px' };
}

// ---- The board --------------------------------------------------------------

export function BoardArt({ L, ox, oy, n, kinds, theme, wobble, still, here, color }: { L: Layout; ox: number; oy: number; n: number; kinds: SpaceKind[]; theme: GameTheme; wobble: { r: number; dx: number; dy: number }[]; still: boolean; here: number | null; color: string }) {
  const s = L.size;
  const used = new Set(L.cells.map((c) => `${c.x},${c.y}`));
  const regular = ['space', 'space-2', 'space-3', 'space-4'].map((id) => pieceImage(theme, id) ?? pieceImage(theme, 'space'));
  const art = { regular: pieceImage(theme, 'space'), lose: pieceImage(theme, 'space-lose'), again: pieceImage(theme, 'space-again'), start: pieceImage(theme, 'start'), finish: pieceImage(theme, 'finish') };
  // The empty spots between the lanes get little doodles that bob.
  const blanks: { x: number; y: number; k: number }[] = [];
  // Only the little flowers (teacher, 2026-11-13: no clouds or stars).
  for (let y = 1; y < L.rows; y += 2) for (let x = 0; x < L.cols; x++) if (!used.has(`${x},${y}`) && (x * 7 + y * 3) % 3 === 0 && (x * 11 + y) % 3 === 2) blanks.push({ x, y, k: x * 11 + y });
  return (
    <div className="absolute inset-0" role="img" aria-label={t('cq.board', { n })}>
      {/* The board: one rounded panel with a charcoal edge, like a printed board. */}
      <div className="absolute rounded-[22px] border-[4px]" style={{ left: ox - 10, top: oy - 10, width: L.cols * s + 20, height: L.rows * s + 20, borderColor: C.ink, background: pieceImage(theme, 'background') ? 'rgba(255,253,246,0.55)' : C.blush, boxShadow: `0 6px 0 ${C.ink}` }} />
      {blanks.map((b) => (
        <span key={`d${b.k}`} className={`absolute grid place-items-center ${still ? '' : 'cq-bob'}`} style={{ left: ox + b.x * s, top: oy + b.y * s, width: s, height: s, animationDelay: `${-(b.k % 7) * 0.4}s` }} aria-hidden="true">
          {b.k % 3 === 0 ? <Star weight="fill" size={s * 0.38} color={C.yellow} /> : b.k % 3 === 1 ? <svg width={s * 0.5} height={s * 0.3} viewBox="0 0 50 30"><path d="M10 26 Q0 26 2 18 Q4 10 12 12 Q16 2 27 4 Q37 4 39 13 Q49 12 48 20 Q48 26 40 26 Z" fill="#fff" stroke={C.ink} strokeWidth="2" /></svg> : <svg width={s * 0.34} height={s * 0.34} viewBox="0 0 30 30"><circle cx="15" cy="15" r="5" fill={C.yellow} stroke={C.ink} strokeWidth="1.6" />{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={15 + Math.cos((a * Math.PI) / 180) * 9} cy={15 + Math.sin((a * Math.PI) / 180) * 9} r="5" fill={C.red} stroke={C.ink} strokeWidth="1.6" />)}</svg>}
        </span>
      ))}
      {L.cells.map((c, i) => {
        const w = wobble[i % wobble.length];
        const kind: SpaceKind | 'start' | 'finish' = i === 0 ? 'start' : i === n - 1 ? 'finish' : kinds[i] ?? 'regular';
        const img = kind === 'regular' ? regular[i % 4] : art[kind];
        const fill = kind === 'start' ? C.sage : kind === 'finish' ? C.yellow : kind === 'lose' ? C.ink : kind === 'again' ? C.cream : SQUARE_COLORS[i % SQUARE_COLORS.length];
        const lit = here === i;
        return (
          <div key={i} className="absolute tile-wiggle" style={{ left: ox + c.x * s + s * 0.05 + w.dx, top: oy + c.y * s + s * 0.05 + w.dy, width: s * 0.9, height: s * 0.9, transform: `rotate(${w.r}deg)` }}>
            <div className={`w-full h-full rounded-[16%] border-heavy grid place-items-center overflow-hidden ${lit && !still ? 'cq-glow' : ''}`}
              style={{ borderColor: C.ink, background: img ? `center / cover url("${img}")` : fill, boxShadow: lit ? `0 0 0 4px ${color}, 0 0 16px 4px ${color}` : `0 3px 0 ${C.ink}` }}>
              {!img && kind === 'start' && <span className="text-[#fffdf6] leading-none" style={{ ...CHICLE, fontSize: s * 0.26, WebkitTextStroke: `1px ${C.ink}` }}>{t('cq.startWord')}</span>}
              {!img && kind === 'finish' && <span className="grid justify-items-center leading-none" style={{ ...CHICLE, fontSize: s * 0.22, color: C.ink }}><FlagCheckered weight="fill" size={s * 0.4} />{t('cq.finishWord')}</span>}
              {!img && kind === 'lose' && <span className="grid justify-items-center leading-none text-center" style={{ ...CHICLE, fontSize: s * 0.15, color: C.cream }}><HourglassHigh weight="fill" size={s * 0.42} color={C.yellow} />{t('cq.loseWord')}</span>}
              {!img && kind === 'again' && <span className="grid justify-items-center leading-none text-center" style={{ ...CHICLE, fontSize: s * 0.15, color: C.ink }}><ArrowsClockwise weight="bold" size={s * 0.42} color={C.red} className={still ? '' : 'cq-spin-slow'} />{t('cq.againWord')}</span>}
              {!img && kind === 'regular' && <span className="w-[30%] h-[30%] rounded-full opacity-35" style={{ background: '#fffdf6' }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- The die: a flat classic die; a theme draws all six sides on one strip --

const PIPS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
export function Die2D({ value, size, rolling, theme }: { value: number; size: number; rolling: boolean; theme: GameTheme }) {
  const [face, setFace] = useState(value);
  useEffect(() => {
    if (!rolling) { setFace(value); return; }
    const id = window.setInterval(() => setFace((f) => 1 + ((f + 1 + Math.floor(Math.random() * 4)) % 6)), 85);
    return () => window.clearInterval(id);
  }, [rolling, value]);
  const strip = pieceImage(theme, 'dice');
  return (
    <span role="img" aria-label={rolling ? t('cq.dieRolling') : t('cq.dieShows', { n: value })} className="inline-block shrink-0" style={{ width: size, height: size }}>
      {strip
        ? <span className="block w-full h-full rounded-[18%]" style={{ backgroundImage: `url("${strip}")`, backgroundSize: '600% 100%', backgroundPosition: `${(face - 1) * 20}% 0` }} />
        : <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect x="5" y="9" width="90" height="88" rx="18" fill={C.ink} />
            <rect x="5" y="4" width="90" height="88" rx="18" fill="#fffdf6" stroke={C.ink} strokeWidth="4" />
            {PIPS[face].map(([x, y], k) => <circle key={k} cx={x} cy={y - 2} r={face === 1 ? 12 : 9} fill={face === 1 ? C.red : C.ink} />)}
          </svg>}
    </span>
  );
}