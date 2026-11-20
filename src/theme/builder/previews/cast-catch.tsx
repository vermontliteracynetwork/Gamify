import { useLayoutEffect, useRef, useState } from 'react';
import { Fish as FishIcon, Timer } from '@phosphor-icons/react';
import { pieceFill, pieceImage } from '../../library';
import type { GameTheme } from '../../types';
import { TeamBadge } from '../../../engine/TeamBadge';
import { FISH } from '../../../games/cast-catch/fish';
import { BoatAndRod, FishArt, LakeFloor, rodTipAt, sceneBackground, Sky } from '../../../games/cast-catch/sceneArt';

// Cast and Catch's play screen, still: sky and water, sun and clouds, the
// lake floor, the boat and rod with the line out to the bobber, one fish of
// each rarity swimming by, and the score chips across the top.
const ASPECT = 4 / 3;
const SWIM = [
  { fish: FISH[0], top: 40, left: 82, size: 0.13, flip: true }, // common
  { fish: FISH[4], top: 46, left: 18, size: 0.16, flip: false }, // uncommon
  { fish: FISH[8], top: 60, left: 70, size: 0.12, flip: false }, // rare
  { fish: FISH[11], top: 72, left: 36, size: 0.18, flip: true }, // legendary
];
const BOB = { x: 58, y: 34 };

export default function CastCatchPreview({ theme }: { theme: GameTheme }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setW(el.clientWidth || 400);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const tip = rodTipAt(ASPECT);
  const player = (pieceImage(theme, 'team-1') ?? pieceImage(theme, 'player'));
  const chip = 'inline-flex items-center gap-1 bg-surface border-std border-border rounded-pill px-2 min-h-6 font-display text-xs whitespace-nowrap tabular-nums';
  return (
    <div ref={box} className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] select-none" style={sceneBackground(theme)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      {!theme.pieces.background?.image && <span className="absolute inset-x-0 bottom-0 top-[20%] pointer-events-none cc-water" aria-hidden="true" />}
      <Sky theme={theme} still />
      {SWIM.map((f, i) => (
        <span key={i} className="absolute -translate-x-1/2" style={{ top: `${f.top}%`, left: `${f.left}%` }} aria-hidden="true">
          <span className="block" style={{ transform: f.flip ? 'scaleX(-1)' : 'none' }}><FishArt fish={f.fish} size={w * f.size} theme={theme} /></span>
        </span>
      ))}
      <LakeFloor theme={theme} still />
      <BoatAndRod theme={theme} aspect={ASPECT} still />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1={tip.x} y1={tip.y} x2={BOB.x} y2={BOB.y} stroke="#000" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-std border-border" style={{ left: `${BOB.x}%`, top: `${BOB.y}%`, width: w * 0.055, height: w * 0.055, ...pieceFill(theme, 'bobber', '#e5635f') }} aria-hidden="true" />
      {/* The score chips, like the game's top row. */}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {player ? <img src={player} alt="" className="w-6 h-6 rounded-full border-std border-border bg-surface object-contain" /> : <TeamBadge colorIndex={0} size={24} />}
        <span className={chip}><Timer weight="bold" size={14} />2:45</span>
        <span className={chip}>60 pts</span>
        <span className={chip}><FishIcon weight="fill" size={14} />3</span>
      </div>
    </div>
  );
}
