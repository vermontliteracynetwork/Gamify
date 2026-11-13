import { useLayoutEffect, useRef, useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { classicTheme } from '../classic';
import { backdropStyle, pieceColor, pieceFill, pieceImage } from '../library';
import { PICTURES } from '../../student/pictures';
import PictureBadge from '../../student/PictureBadge';
import { TeamBadge, TeamArt } from '../../engine/TeamBadge';
import { THEME_FONTS, type GameTheme, type ThemeItem } from '../types';
import ItemArt from '../ItemArt';
import { PIN_OUTLINE } from './shapes';
import { GAMES } from '../../games/registry';
import { halfWidthAt, PIN_XY, scaleAt, toView, xAt, yAt } from '../../games/bowling/lane';

const TILE_COLORS = ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'];

// The views a game's preview can show (teacher, 2026-11-01: "tabs can be
// toggled through to see the different views where your items will be
// shown"), each a screen of the game where the theme's pieces appear.
export type PreviewView = 'game' | 'pick' | 'powers';
export function previewViews(gameId: string, hasItems: boolean): { id: PreviewView; label: string }[] {
  const views: { id: PreviewView; label: string }[] = [{ id: 'game', label: gameId === 'bowling' ? 'Lane' : 'Game' }];
  if (gameId === 'bowling') views.push({ id: 'pick', label: 'Pick a ball' });
  else if (gameId === 'game-show') views.push({ id: 'pick', label: 'Team icons' });
  if (hasItems) views.push({ id: 'powers', label: 'Power-ups' });
  return views;
}

// A small live copy of the game screen wearing the theme being built.
export default function ThemePreview({ theme: own, gameName, view = 'game' }: { theme: GameTheme; gameName: string; view?: PreviewView }) {
  const theme = withClassicArt(own);
  const c = theme.colors;
  const sky = theme.gameId === 'star-quiz' ? pieceImage(theme, 'background') : undefined;
  // Start menus wear the standard Gamify look, never a theme's (teacher, 2026-10-31).
  if (view === 'pick') return <PickView theme={theme} />;
  return (
    <div className="rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] p-3 grid grid-rows-[auto_1fr] gap-2" style={sky ? { background: `center / cover url("${sky}")` } : backdropStyle(theme, false)} aria-label={`Preview of ${theme.name || 'this theme'}`} role="img">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xl font-extrabold truncate" style={{ color: c.backgroundText, fontFamily: THEME_FONTS[theme.fonts.display] }}>{gameName}</span>
        <span className="px-3 py-1 rounded-pill border-[2px] border-border font-bold text-xs" style={{ background: c.accent, color: c.accentText }}>Play</span>
      </div>
      <div className="min-h-0 min-w-0 flex items-center justify-center">{view === 'powers' ? <PowersView theme={theme} /> : board(theme)}</div>
    </div>
  );
}

// Each team's picture as the game shows it: Bowling's balls, else team icons.
const teamArt = (theme: GameTheme) => Array.from({ length: 10 }, (_, k) => theme.gameId === 'bowling'
  ? pieceImage(theme, `ball-${k + 1}`) ?? pieceImage(theme, `team-${k + 1}`) ?? `/classic/bowling/ball-${k}.webp`
  : pieceImage(theme, `team-${k + 1}`));

// The Teams page picker, where each team taps its picture (Bowling: its ball).
// Tap a ball to see it big on white in the preview; tap again to go back
// (teacher, 2026-11-02).
function PickView({ theme }: { theme: GameTheme }) {
  const names = ['Glowing Pickle', 'Magic Falcon'];
  const art = teamArt(theme);
  const [big, setBig] = useState<number | null>(null);
  const label = theme.gameId === 'bowling' ? 'Preview: each team picks its ball' : 'Preview: each team picks its icon';
  return (
    <div className="relative brand-menu rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] p-3 grid content-start gap-2 bg-[#c8d2fb]" role="group" aria-label={label}>
      <TeamArt.Provider value={art}>
        <div className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <span className="font-bold text-lg">Teams</span>
          {names.map((n, i) => (
            <span key={n} className="flex items-center gap-2 rounded-input border-[2px] border-border-soft p-1.5"><TeamBadge colorIndex={i} size={30} /><span className="font-bold text-sm truncate">{n}</span></span>
          ))}
          <div className="grid grid-cols-5 gap-1.5 rounded-input border-[2px] border-border p-2 bg-[#e6ebff] justify-items-center">
            {Array.from({ length: 10 }, (_, k) => (
              <button key={k} type="button" onClick={() => setBig(k)} aria-label={`See picture ${k + 1} big`} className={`rounded-full motion-safe:hover:scale-110 motion-safe:transition-transform ${k === 0 ? 'ring-4 ring-accent' : ''}`}>
                <TeamBadge colorIndex={k} size={34} />
              </button>
            ))}
          </div>
        </div>
      </TeamArt.Provider>
      {big !== null && (
        <button type="button" onClick={() => setBig(null)} aria-label="Back to the list" className="absolute inset-0 z-10 bg-white grid place-items-center p-6">
          {art[big]
            ? <img src={art[big]} alt={`Picture ${big + 1}`} className="max-w-full max-h-full aspect-square object-contain rounded-full" />
            : <TeamArt.Provider value={art}><TeamBadge colorIndex={big} size={220} /></TeamArt.Provider>}
        </button>
      )}
    </div>
  );
}

// The power-ups as they pop up in play: the theme's own, else Classic's,
// sized to fill the preview without spilling out of it.
function PowersView({ theme }: { theme: GameTheme }) {
  const items: ThemeItem[] = (theme.items?.length ? theme.items : GAMES.find((g) => g.id === theme.gameId)?.items?.classic ?? []).slice(0, 8);
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 300, h: 200 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRoom({ w: el.clientWidth, h: el.clientHeight }));
    setRoom({ w: el.clientWidth, h: el.clientHeight });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = Math.max(1, items.length);
  let best = { cols: n, cell: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols), cell = Math.min((room.w - 8 * (cols - 1)) / cols, (room.h - 8 * (rows - 1)) / rows);
    if (cell > best.cell) best = { cols, cell };
  }
  const art = Math.max(16, Math.floor(best.cell * 0.62));
  return (
    <div ref={box} className="w-full h-full grid place-content-center gap-2" style={{ gridTemplateColumns: `repeat(${best.cols}, ${Math.floor(best.cell)}px)`, gridAutoRows: `${Math.floor(best.cell)}px` }}>
      {items.map((it) => (
        <span key={it.id} className="grid place-items-center content-center gap-0.5 rounded-input border-[2px] border-border bg-surface overflow-hidden" style={{ boxShadow: '0 3px 0 #000' }} title={it.name}>
          <ItemArt item={it} size={art} still />
          {best.cell > 70 && <span className="text-[11px] leading-tight font-bold max-w-full px-1 truncate">{it.name}</span>}
        </span>
      ))}
    </div>
  );
}

// Bowling's lane as the game draws it: the lane in perspective, ten pins, a ball.
function BowlingLane({ theme }: { theme: GameTheme }) {
  const laneColor = pieceColor(theme, 'lane', '#e2b07a'), laneArt = pieceImage(theme, 'lane');
  const pinColor = pieceColor(theme, 'pin', '#fbfcf8'), pinArt = pieceImage(theme, 'pin');
  const ball = teamArt(theme)[0]!;
  const lane = `${50 - halfWidthAt(0)},${yAt(0)} ${50 + halfWidthAt(0)},${yAt(0)} ${50 + halfWidthAt(1)},${yAt(1)} ${50 - halfWidthAt(1)},${yAt(1)}`;
  const pins = PIN_XY.map(([x, y]) => toView(x, y)).sort((a, b) => b.d - a.d);
  return (
    <svg viewBox="0 18 100 112" className="h-full max-w-full" aria-hidden="true">
      <defs>
                  {/* A drawn pin always shows inside the pin's outline (teacher, 2026-11-02). */}
                  <clipPath id="pv-pin-shape"><path d={PIN_OUTLINE} /></clipPath>
        {laneArt && <pattern id="pv-lane" patternUnits="userSpaceOnUse" x={50 - halfWidthAt(0)} y={yAt(1)} width={halfWidthAt(0) * 2} height={yAt(0) - yAt(1)}><image href={laneArt} width={halfWidthAt(0) * 2} height={yAt(0) - yAt(1)} preserveAspectRatio="xMidYMid slice" /></pattern>}
        <clipPath id="pv-ball"><circle r={6} /></clipPath>
      </defs>
      <polygon points={`${50 - halfWidthAt(0) - 5},${yAt(0)} ${50 + halfWidthAt(0) + 5},${yAt(0)} ${50 + halfWidthAt(1) + 5 * scaleAt(1)},${yAt(1)} ${50 - halfWidthAt(1) - 5 * scaleAt(1)},${yAt(1)}`} fill="#7d8597" stroke="#000" strokeWidth={0.6} />
      <polygon points={lane} fill={laneArt ? 'url(#pv-lane)' : laneColor} stroke="#000" strokeWidth={0.6} />
      {pins.map((p, i) => (
        <g key={i} transform={`translate(${xAt(p.laneX, p.d)} ${yAt(p.d)}) scale(${scaleAt(p.d) * 2.6})`}>
          {pinArt ? <image href={pinArt} x={-1.8} y={-11} width={3.6} height={11.3} preserveAspectRatio="none" clipPath="url(#pv-pin-shape)" /> : <>
            <path d="M0,-11 C0.6,-11 0.99,-10.6 0.99,-9.87 C0.99,-9 0.58,-8 0.58,-6.93 C0.58,-5.6 1.75,-5 1.75,-3.54 C1.75,-2 1.15,-0.9 0.94,-0.13 C0.85,0.2 0.4,0.3 0,0.3 C-0.4,0.3 -0.85,0.2 -0.94,-0.13 C-1.15,-0.9 -1.75,-2 -1.75,-3.54 C-1.75,-5 -0.58,-5.6 -0.58,-6.93 C-0.58,-8 -0.99,-9 -0.99,-9.87 C-0.99,-10.6 -0.6,-11 0,-11 Z" fill={pinColor} stroke="#000" strokeWidth={0.5} />
            <rect x={-0.8} y={-8.5} width={1.6} height={0.55} fill="#e5635f" /><rect x={-0.62} y={-7.6} width={1.24} height={0.55} fill="#e5635f" />
          </>}
        </g>
      ))}
      <g transform={`translate(50 ${yAt(0.04) - 6})`}>
        <image href={ball} x={-6.3} y={-6.3} width={12.6} height={12.6} clipPath="url(#pv-ball)" preserveAspectRatio="xMidYMid slice" />
        <circle r={6} fill="none" stroke="#000" strokeWidth={0.6} />
      </g>
    </svg>
  );
}

function board(theme: GameTheme) {
  switch (theme.gameId) {
    case 'bowling':
      return <BowlingLane theme={theme} />;
    case 'match-three':
      return (
        <div className="grid grid-cols-5 gap-1 p-2 rounded-input border-[2px] border-border h-full aspect-square" style={pieceFill(theme, 'board', '#ffffff')}>
          {Array.from({ length: 25 }, (_, i) => <span key={i} className="rounded-md border-[1.5px] border-border-soft" style={pieceFill(theme, `tile-${(i * 7) % 6}`, TILE_COLORS[(i * 7) % 6])} />)}
        </div>
      );
    case 'four-in-a-row':
      return (
        <div className="grid grid-cols-7 gap-1 p-2 rounded-input border-[2px] border-border h-full aspect-[7/6]" style={pieceFill(theme, 'board', '#a8d8f0')}>
          {Array.from({ length: 42 }, (_, i) => {
            const who = [38, 31, 24, 39].includes(i) ? 1 : [37, 40, 32].includes(i) ? 2 : 0;
            return <span key={i} className="rounded-full border-[1.5px] border-border bg-white overflow-hidden">{who > 0 && <span className="block w-full h-full rounded-full" style={pieceFill(theme, `piece-${who}`, who === 1 ? '#f6a5c0' : '#9fd8f0')} />}</span>;
          })}
        </div>
      );
    case 'farm-grow':
      return (
        <div className="grid grid-cols-5 gap-2 items-end w-full p-2 rounded-input" style={{ background: pieceColor(theme, 'soil', '#b98a5e') }}>
          {(['sprout', 'crop-corn', 'crop-pumpkin', 'crop-sunflower', 'crop-tomato'] as const).map((id) => pieceImage(theme, id) ? <img key={id} src={pieceImage(theme, id)} alt="" className="h-14 object-contain justify-self-center" /> : <span key={id} className="h-10 w-10 justify-self-center rounded-full border-[2px] border-border bg-[#7cc66a]" />)}
        </div>
      );
    case 'big-screen':
      return (
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 w-full">
          {pieceImage(theme, 'mascot') ? <img src={pieceImage(theme, 'mascot')} alt="" className="w-16 h-16 object-contain" /> : <Star weight="fill" size={56} color="#f6c544" />}
          <span className="rounded-input border-[2px] border-border bg-surface p-2 font-display text-2xl tracking-[0.15em] text-center">ABCDE</span>
          {pieceImage(theme, 'trophy') && <img src={pieceImage(theme, 'trophy')} alt="" className="col-span-2 h-12 justify-self-center object-contain" />}
        </div>
      );
    case 'sign-in':
      return <div className="grid grid-cols-4 gap-2">{PICTURES.map((p) => <PictureBadge key={p.id} id={p.id} theme={theme} size={44} />)}</div>;
    case 'game-show':
      return (
        <div className="grid grid-cols-4 gap-1.5 w-full">
          <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image ?? (theme.gameId === 'bowling' ? theme.pieces[`ball-${k + 1}`]?.image : undefined))}>
            <span className="col-span-4 flex gap-1.5 justify-center">{[0, 1, 2, 3].map((k) => <TeamBadge key={k} colorIndex={k} size={30} />)}</span>
          </TeamArt.Provider>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="aspect-[4/3] rounded-md border-[2px] border-border flex items-center justify-center font-display font-bold" style={pieceFill(theme, i < 4 ? 'card-back' : 'square', '#fdfd94')}>
              {!pieceImage(theme, i < 4 ? 'card-back' : 'square') && (i < 4 ? i + 1 : (i - 3) * 100)}
            </span>
          ))}
        </div>
      );
    default:
      return (
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {Array.from({ length: 6 }, (_, i) => {
            const img = pieceImage(theme, `item-${i + 1}`);
            const look = { transform: `rotate(${[-18, 12, -6, 24, -28, 8][i]}deg)`, width: `${[3, 2.25, 3.5, 2.5, 2, 3][i]}rem`, height: `${[3, 2.25, 3.5, 2.5, 2, 3][i]}rem` };
            return img
              ? <img key={i} src={img} alt="" className="object-contain" style={look} />
              : <Star key={i} weight="fill" style={look} color={pieceColor(theme, 'item-1', '#f6c544')} />;
          })}
        </div>
      );
  }
}

// Pieces a design leaves empty show the Classic look (teacher, 2026-10-31:
// "anything left empty keeps the Classic look"). The Classic sky only stays
// while the background color is still Classic's.
function withClassicArt(theme: GameTheme): GameTheme {
  const classic = classicTheme(theme.gameId);
  const keep = Object.entries(classic.pieces).filter(([id]) => !theme.pieces[id]?.image && (id !== 'background' || theme.colors.background === classic.colors.background));
  return keep.length ? { ...theme, pieces: { ...theme.pieces, ...Object.fromEntries(keep.map(([id, art]) => [id, { ...theme.pieces[id], ...art }])) } } : theme;
}
