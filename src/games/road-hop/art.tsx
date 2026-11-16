import type { GameTheme } from '../../theme/types';
import { pieceColor, pieceImage } from '../../theme/library';
import { COLS, HIDE, ROWS, type Car, type Lane } from './road';

// Road Hop's board drawing, shared by the game and the Theme Builder preview
// so the preview is always the real game (teacher, 2026-11-16).

export const CAR_COLORS = ['#e5635f', '#6aa9e9', '#f6c544', '#c58ce8', '#f39a6b', '#5cc3a0'];

// The theme's colors and art for the board, Classic where a piece is empty.
export function roadLook(theme: GameTheme) {
  return {
    grass: pieceColor(theme, 'background', '#8fe3a0'),
    roadColor: pieceColor(theme, 'road', '#4a4f6a'),
    hopperColor: pieceColor(theme, 'hopper', '#9bd35a'),
    hopperArt: pieceImage(theme, 'hopper'),
    carColors: [pieceColor(theme, 'car', CAR_COLORS[0]), ...CAR_COLORS.slice(1)],
  };
}

// Where row r sits on the board (row 0 is the bottom).
export const cell = (r: number) => ({ top: `${((ROWS - 1 - r) / ROWS) * 100}%`, height: `${100 / ROWS}%` });

// A car's box on its lane.
export function carBox(lane: Lane, c: Car, r: number) {
  const leftCol = c.len === 2 && lane.dir === 1 ? c.x - HIDE - 1 : c.x - HIDE;
  return { ...cell(r), left: `${(leftCol / COLS) * 100}%`, width: `${(c.len / COLS) * 100}%` };
}

// The grass strips and roads, with a dashed line between roads and a
// checkered finish at the top.
export function Lanes({ map, k, roadColor }: { map: Lane[]; k: number; roadColor: string }) {
  return (
    <>
      {map.map((lane, r) => lane.kind === 'road' ? (
        <div key={`${k}-${r}`} className="absolute inset-x-0" style={{ ...cell(r), background: roadColor }}>
          {map[r + 1]?.kind === 'road' && <div className="absolute inset-x-0 top-0 border-t-[3px] border-dashed border-white/50" />}
        </div>
      ) : (
        <div key={`${k}-${r}`} className="absolute inset-x-0" style={{ ...cell(r), backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1.5px, transparent 1.6px)', backgroundSize: '18px 18px' }}>
          {r === ROWS - 1 && <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-conic-gradient(#000 0 25%, #fff 0 50%)', backgroundSize: '24px 24px' }} />}
        </div>
      ))}
    </>
  );
}

// A round little hopper drawn in code, with big eyes a pre-reader spots.
export function Hopper({ color, art, dizzy }: { color: string; art?: string; dizzy: boolean }) {
  if (art) return <img src={art} alt="" className="w-full h-full object-contain" />;
  return (
    <svg viewBox="-10 -10 20 20" className="w-full h-full drop-shadow" aria-hidden="true">
      <ellipse cx="0" cy="3" rx="8" ry="6" fill={color} stroke="#000" strokeWidth="0.9" />
      <circle cx="-4" cy="-3.5" r="3.3" fill={color} stroke="#000" strokeWidth="0.9" />
      <circle cx="4" cy="-3.5" r="3.3" fill={color} stroke="#000" strokeWidth="0.9" />
      {dizzy ? (
        <g stroke="#241c3d" strokeWidth="0.9" strokeLinecap="round"><path d="M-5.4,-4.9 L-2.6,-2.1 M-2.6,-4.9 L-5.4,-2.1" /><path d="M2.6,-4.9 L5.4,-2.1 M5.4,-4.9 L2.6,-2.1" /></g>
      ) : (
        <g><circle cx="-4" cy="-3.5" r="1.8" fill="#fff" /><circle cx="4" cy="-3.5" r="1.8" fill="#fff" /><circle cx="-3.6" cy="-3.9" r="0.9" fill="#241c3d" /><circle cx="4.4" cy="-3.9" r="0.9" fill="#241c3d" /></g>
      )}
      <path d="M-3,3.5 Q0,6 3,3.5" fill="none" stroke="#241c3d" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="-5.5" cy="3" r="1.1" fill="#f6a5c0" opacity="0.8" /><circle cx="5.5" cy="3" r="1.1" fill="#f6a5c0" opacity="0.8" />
    </svg>
  );
}

// A friendly car (or a long truck) facing the way its lane drives.
export function Vehicle({ color, long, facing }: { color: string; long: boolean; facing: 1 | -1 }) {
  const w = long ? 40 : 20;
  return (
    <svg viewBox={`0 0 ${w} 14`} className="w-full h-full" preserveAspectRatio="none" aria-hidden="true" style={{ transform: facing === -1 ? 'scaleX(-1)' : undefined }}>
      <circle cx={4.5} cy={11.5} r={2.2} fill="#241c3d" /><circle cx={w - 4.5} cy={11.5} r={2.2} fill="#241c3d" />
      {long && <circle cx={w / 2} cy={11.5} r={2.2} fill="#241c3d" />}
      <rect x={1} y={long ? 2 : 4.5} width={w - 2} height={long ? 8.5 : 6} rx={2.5} fill={color} stroke="#000" strokeWidth={0.8} />
      {!long && <path d={`M5,4.8 L7.5,1.2 L13.5,1.2 L16,4.8 Z`} fill={color} stroke="#000" strokeWidth={0.8} />}
      <rect x={w - (long ? 9 : 7.5)} y={long ? 3.5 : 2.2} width={long ? 6 : 3} height={long ? 3.5 : 2.4} rx={0.8} fill="#cdeaff" stroke="#000" strokeWidth={0.5} />
      <circle cx={w - 1.5} cy={long ? 8.5 : 7.5} r={0.9} fill="#fdfd94" />
    </svg>
  );
}
