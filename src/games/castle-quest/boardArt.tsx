import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowsClockwise, FlagCheckered, HourglassHigh, Play } from '@phosphor-icons/react';
import { t } from '../../i18n';
import { pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import type { Layout, SpaceKind } from './board';
import { CrayonDieFace, INK, PARK_BG, PK, quietMat } from './park';
import { useSettings } from '../../settings/SettingsContext';

// The Board Game's board and die, drawn the same in the game and in the
// Theme Builder's preview (teacher, 2026-11-16: "ALWAYS show preview as the
// actual game template being changed"). Classic follows the approved mockup
// (/brand Game mockups, Board Game, 2026-11-24): four pastel regular squares
// in turn (Lavender, Blue crystal, Blush, Butter), no dots and no numbers; an
// ink Lose a turn square and a paper Roll again square marked by icons, not
// words; a mint Start and a lemon Finish; all on a quiet paper mat in the park.

export const C = { blue: PK.crystal, yellow: PK.lemon, red: PK.pink, sage: PK.kelly, cream: PK.cream, blush: PK.blush, ink: INK, paper: PK.paper, mint: PK.mint };
export const SQUARE_COLORS = [PK.lavender, PK.crystal, PK.blush, PK.butter];
// Bright confetti for celebrations (pastels would vanish against the park).
export const PARTY_COLORS = [PK.pink, PK.lemon, PK.sky, PK.kelly, '#6a45f0'];
// The board's words wear Grow Year, the brand title font, in capitals.
export const CHICLE: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, textTransform: 'uppercase', lineHeight: 1.05 };
// A tiny tilt per square, the same all game (hand-placed, never a ruler grid).
export const WOBBLE = Array.from({ length: 80 }, (_, i) => ({ r: (((i * 37) % 5) - 2) * 0.5, dx: 0, dy: 0 }));

// The ground behind the board: the theme's background, or Classic's park.
export function boardGround(theme: GameTheme): CSSProperties {
  const bg = pieceImage(theme, 'background');
  if (bg) return { background: `center / cover no-repeat url("${bg}")` };
  return { backgroundColor: PK.sky, backgroundImage: PARK_BG, backgroundSize: 'cover', backgroundPosition: 'center bottom' };
}

// ---- The board --------------------------------------------------------------

export function BoardArt({ L, ox, oy, n, kinds, theme, wobble, still, here, color }: { L: Layout; ox: number; oy: number; n: number; kinds: SpaceKind[]; theme: GameTheme; wobble: { r: number; dx: number; dy: number }[]; still: boolean; here: number | null; color: string }) {
  const s = L.size;
  const regular = ['space', 'space-2', 'space-3', 'space-4'].map((id) => pieceImage(theme, id) ?? pieceImage(theme, 'space'));
  const art = { regular: pieceImage(theme, 'space'), lose: pieceImage(theme, 'space-lose'), again: pieceImage(theme, 'space-again'), start: pieceImage(theme, 'start'), finish: pieceImage(theme, 'finish') };
  const themed = !!pieceImage(theme, 'background');
  const { settings } = useSettings();
  // The mat: a quiet paper panel with an ink edge (a theme's background shows through, softened).
  // Never past the box it is drawn in (the Theme Builder preview leaves less room).
  const m = Math.max(4, Math.min(matPad(s), ox - 4, oy - 4));
  const icon = s * 0.46;
  const edge = Math.max(2, Math.min(3, s * 0.05));
  return (
    <div className="absolute inset-0" role="img" aria-label={t('cq.board', { n })}>
      <div className="absolute" style={{ left: ox - m, top: oy - m, width: L.cols * s + m * 2, height: L.rows * s + m * 2, borderRadius: Math.max(18, s * 0.42), border: `4px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, ...(themed ? { background: 'rgba(255,250,240,0.6)' } : quietMat(settings.calm)) }} />
      {L.cells.map((c, i) => {
        const w = wobble[i % wobble.length];
        const kind: SpaceKind | 'start' | 'finish' = i === 0 ? 'start' : i === n - 1 ? 'finish' : kinds[i] ?? 'regular';
        const img = kind === 'regular' ? regular[i % 4] : art[kind];
        const fill = kind === 'start' ? PK.mint : kind === 'finish' ? PK.lemon : kind === 'lose' ? INK : kind === 'again' ? PK.paper : SQUARE_COLORS[i % SQUARE_COLORS.length];
        const lit = here === i;
        return (
          <div key={i} className="absolute tile-wiggle" style={{ left: ox + c.x * s + s * 0.05 + w.dx, top: oy + c.y * s + s * 0.05 + w.dy, width: s * 0.9, height: s * 0.9, transform: `rotate(${w.r}deg)` }}>
            <div className="w-full h-full grid place-items-center overflow-hidden" data-kind={kind}
              style={{ borderRadius: '22%', border: `${edge}px solid ${INK}`, background: img ? `center / cover url("${img}")` : fill, boxShadow: lit ? `0 0 0 3px ${color}, 0 3px 0 ${INK}` : `0 3px 0 ${INK}` }}>
              {!img && kind === 'start' && <Play weight="fill" size={icon * 0.85} color={PK.kelly} style={{ marginLeft: icon * 0.08 }} />}
              {!img && kind === 'finish' && <FlagCheckered weight="fill" size={icon} color={INK} />}
              {!img && kind === 'lose' && <HourglassHigh weight="fill" size={icon} color={PK.lemon} />}
              {!img && kind === 'again' && <ArrowsClockwise weight="bold" size={icon} color={PK.pink} className={still ? '' : 'cq-spin-slow'} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
// How far the paper mat reaches past the squares.
export const matPad = (s: number) => Math.max(10, s * 0.32);

// ---- The die: her one-side die; a theme draws all six sides on one strip ----

export function Die2D({ value, size, rolling, theme }: { value: number; size: number | string; rolling: boolean; theme: GameTheme }) {
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
        : <CrayonDieFace value={face} size="100%" />}
    </span>
  );
}
