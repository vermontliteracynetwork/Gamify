import type { CSSProperties } from 'react';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import type { FishKind } from './fish';

// Cast and Catch's scene: water and sky, sun, clouds, lake floor, boat and
// rod, and the fish. Drawn the same in the game and in the Theme Builder's
// preview (teacher, 2026-11-16: the preview is the real game).

// A fish drawn in code: body, tail, fin, optional stripes, an eye.
// The waterline sits at 20% of the scene; the boat's deck rests on it.
export const BOAT_TOP = 20;
const CLASSIC_FISH: Record<string, string> = {
  perch: 'orange', bluegill: 'blue', sunfish: 'orange', guppy: 'pink', trout: 'grey', brooktrout: 'green', bass: 'green',
  puffer: 'brown', clown: 'orange', tang: 'blue', swordfish: 'grey-long-a', goldfish: 'red',
};
// A theme can draw each rarity's fish (fish-common ... fish-legendary).
const RARITY_PIECE = ['fish-common', 'fish-uncommon', 'fish-rare', 'fish-legendary'];
export function FishArt({ fish, size, theme }: { fish: FishKind; size: number; theme?: Parameters<typeof pieceImage>[0] }) {
  const art = pieceImage(theme, RARITY_PIECE[fish.rarity]);
  if (art) return <img src={art} alt="" aria-hidden="true" style={{ width: size, height: size * 0.6, objectFit: 'contain' }} />;
  // Classic fish (teacher, 2026-10-31): Kenney's Fish Pack (CC0), turned to face left.
  const classic = CLASSIC_FISH[fish.id];
  if (classic) return <img src={`/classic/cast-catch/fish-${classic}.svg`} alt="" aria-hidden="true" style={{ width: size, height: size * 0.75, objectFit: 'contain', transform: 'scale(-1.15, 1.15)' }} />;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" aria-hidden="true">
      <path d="M78 30 L98 12 L94 30 L98 48 Z" fill={fish.fin} stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="44" cy="30" rx="38" ry="22" fill={fish.body} stroke="#000" strokeWidth="2.5" />
      {fish.stripe && <><path d="M36 9 Q32 30 36 51" stroke={fish.stripe} strokeWidth="5" fill="none" /><path d="M54 10 Q50 30 54 50" stroke={fish.stripe} strokeWidth="5" fill="none" /></>}
      <path d="M40 9 Q50 0 60 10" fill={fish.fin} stroke="#000" strokeWidth="2.5" />
      <circle cx="20" cy="25" r="5" fill="#fff" stroke="#000" strokeWidth="2" /><circle cx="19" cy="25" r="2.3" fill="#000" />
      <path d="M8 34 Q12 37 16 35" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// The fish that swim by in the background: depth (% from the top), size,
// direction, speed and a head start, so they never move in step.
export const SWIMMERS = [
  { kind: 0, top: 30, size: 70, dir: 1, secs: 19, delay: 2 },
  { kind: 3, top: 44, size: 90, dir: -1, secs: 24, delay: 9 },
  { kind: 6, top: 56, size: 60, dir: 1, secs: 15, delay: 6 },
  { kind: 9, top: 66, size: 110, dir: -1, secs: 30, delay: 17 },
  { kind: 12, top: 78, size: 75, dir: 1, secs: 22, delay: 12 },
  { kind: 4, top: 86, size: 55, dir: -1, secs: 17, delay: 3 },
];

// The water and sky: the theme's water picture, or Classic's sky over a lake.
export const sceneBackground = (theme: GameTheme): CSSProperties => (theme.pieces.background?.image ? pieceFill(theme, 'background', '#5aa9d6') : { background: 'linear-gradient(180deg, #cfe9ff 0%, #cfe9ff 20%, #5aa9d6 20%, #2f6fb0 100%)' });

// The sun and the puffy clouds that drift slowly across the sky (teacher, 2026-11-13).
export function Sky({ theme, still }: { theme: GameTheme; still: boolean }) {
  return (
    <>
      <span className="absolute right-[16%] top-[3%] w-[5%] aspect-square rounded-full border-bold border-border" style={pieceFill(theme, 'sun', '#fdfd94')} aria-hidden="true" />
      {/* Puffy clouds drift slowly across the sky (teacher, 2026-11-13). */}
      {[[8, 4, 13, 0], [40, 9, 10, 1], [70, 3, 15, 2], [92, 10, 9, 3]].map(([x, y, w, i]) => (
        pieceImage(theme, 'cloud')
          ? <span key={`c${i}`} className="absolute aspect-[2/1]" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, background: `center / contain no-repeat url("${pieceImage(theme, 'cloud')}")`, animation: still ? undefined : `cc-cloud ${70 + i * 18}s linear ${-i * 23}s infinite` }} aria-hidden="true" />
          : <svg key={`c${i}`} viewBox="0 0 120 56" className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, animation: still ? undefined : `cc-cloud ${70 + i * 18}s linear ${-i * 23}s infinite`, filter: 'drop-shadow(0 4px 0 rgba(36,28,61,0.12))' }} aria-hidden="true">
              <path d="M18 50 Q2 50 4 38 Q6 26 20 28 Q22 12 40 12 Q50 0 66 6 Q80 0 90 14 Q108 12 112 28 Q120 34 116 44 Q114 50 104 50 Z" fill={pieceColor(theme, 'cloud', '#ffffff')} stroke="#241c3d" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M24 42 Q40 46 58 42 M70 44 Q86 47 100 42" fill="none" stroke="#c9d6f2" strokeWidth="3" strokeLinecap="round" />
            </svg>
      ))}
    </>
  );
}

// Classic lake floor (Kenney Fish Pack, CC0): seaweed sways, rocks sit still.
export function LakeFloor({ theme, still }: { theme: GameTheme; still: boolean }) {
  return (
    <>
      {/* Classic lake floor (Kenney Fish Pack, CC0): seaweed sways, rocks sit still. */}
      {!pieceImage(theme, 'background') && ([['seaweed-green-a', 30, 9], ['rock-a', 38, 7], ['seaweed-pink-a', 47, 8], ['seaweed-green-b', 62, 10], ['rock-b', 71, 6], ['seaweed-orange-a', 80, 8], ['seaweed-green-a', 91, 9]] as const).map(([art, x, w], i) => (
        <img key={`sea${i}`} src={`/classic/cast-catch/${art}.svg`} alt="" aria-hidden="true" className="absolute bottom-0 pointer-events-none origin-bottom"
          style={{ left: `${x}%`, width: `${w}%`, aspectRatio: '1', objectFit: 'contain', objectPosition: 'bottom', animation: still || art.startsWith('rock') ? undefined : `cc-sway ${4 + (i % 3)}s ease-in-out ${-i}s infinite` }} />
      ))}
    </>
  );
}

// The boat and rod share one drawing (viewBox 0 -60 320 180, 26% of the
// scene's width, from -8%), so the rod always sits on the boat. `aspect` is
// the scene's width over its height.
const ROD_TIP = { x: 316, y: -52 };
export const rodTipAt = (aspect: number) => ({ x: -8 + (ROD_TIP.x * 26) / 320, y: BOAT_TOP - 9.1 * aspect + ((ROD_TIP.y + 60) * 26 * aspect) / 320 });
export function BoatAndRod({ theme, aspect, still }: { theme: GameTheme; aspect: number; still: boolean }) {
  const tip = ROD_TIP;
  // A wooden boat at the top left, half showing, with the rod off its bow
  // (teacher, 2026-10-31). A theme's "dock" and "rod" pictures stand in.
  return (
      <svg className="absolute pointer-events-none" style={{ left: '-8%', top: `${BOAT_TOP - 9.1 * aspect}%`, width: '26%', aspectRatio: '320 / 180', overflow: 'visible', animation: still ? undefined : 'cc-rock 4s ease-in-out infinite', transformOrigin: '70% 70%' }} viewBox="0 -60 320 180" aria-hidden="true">
        {pieceImage(theme, 'dock')
          ? <image href={pieceImage(theme, 'dock')} x="0" y="20" width="320" height="100" preserveAspectRatio="xMaxYMax meet" />
          : <>
              <path d="M10 40 L300 40 Q290 90 240 112 L60 112 Q20 90 10 40 Z" fill={pieceColor(theme, 'dock', '#a0683a')} stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <path d="M18 62 L292 62 M30 86 L278 86" stroke="#000" strokeOpacity="0.35" strokeWidth="4" />
              <path d="M6 34 L304 34 L300 44 L10 44 Z" fill="#7a4a24" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <rect x="150" y="18" width="40" height="18" rx="3" fill="#7a4a24" stroke="#000" strokeWidth="4" />
            </>}
        {pieceImage(theme, 'rod')
          ? <image href={pieceImage(theme, 'rod')} x="240" y="-60" width="90" height="100" preserveAspectRatio="xMinYMax meet" />
          : <line x1="250" y1="36" x2={tip.x} y2={tip.y} stroke={pieceColor(theme, 'rod', '#5b3a1e')} strokeWidth="7" strokeLinecap="round" />}
        <circle cx="262" cy="20" r="9" fill="#314677" stroke="#000" strokeWidth="4" />
      </svg>
  );
}
