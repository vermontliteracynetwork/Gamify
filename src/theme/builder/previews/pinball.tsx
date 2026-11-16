import { useLayoutEffect, useRef, useState } from 'react';
import { BallArt, Flippers, LANE_COLORS, PegArt, Plunger, pocketStyle, StarArt, TableDecor, TableDefs } from '../../../games/pinball/art';
import { H, LANE_H, LANE_Y, LAUNCH, W, WALL, ZONE_X } from '../../../games/pinball/table';
import { backdropStyle, pieceFill } from '../../library';
import type { GameTheme } from '../../types';

// Pinball as play draws it (teacher, 2026-11-16): the whole table, standing
// tall on the page, with its pockets, numbered lanes, pegs, a star, the
// flippers, the plunger and the ball, all from the game's own art.
const VALUES = [30, 100, 10, 50, 20];
const PEGS = [{ x: 26, y: 46 }, { x: 52, y: 38 }, { x: 74, y: 52 }, { x: 40, y: 92 }];

export default function PinballPreview({ theme }: { theme: GameTheme }) {
  const box = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(300);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setH(el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const tableH = h * 0.92, tableW = (tableH * W) / H;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div ref={box} className="relative rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] grid place-items-center" style={backdropStyle(theme, false)}
      role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="relative rounded-[14px] border-[2.5px] border-border overflow-hidden" style={{ ...pieceFill(theme, 'board', '#314677'), width: tableW, height: tableH, boxShadow: '0 4px 0 #000' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
          <TableDefs theme={theme} />
          <TableDecor theme={theme} blink={false} />
          <rect x={3} y={3} width={W - 6} height={H - 6} rx={9} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.7} />
          {PEGS.map((b, i) => <PegArt key={i} b={b} i={i} theme={theme} />)}
          <g transform="translate(62 96)"><StarArt blink={false} /></g>
          <Flippers theme={theme} moving={false} />
          <Plunger />
          <g transform={`translate(${LAUNCH.x} ${LAUNCH.y})`}><BallArt theme={theme} aura={false} /></g>
        </svg>
        <div className="absolute flex" style={{ left: pct(WALL, W), right: pct(WALL, W), top: pct(6, H), height: pct(17, H) }}>
          {VALUES.map((v, i) => (
            <span key={i} className="relative flex-1 min-w-0 mx-[1px] border-[1.5px] border-border rounded-b-[8px] rounded-t-[3px] grid place-items-center"
              style={{ ...pocketStyle(theme, i, false), fontSize: tableW * 0.085, WebkitTextStroke: '1px #000' }}>{v}</span>
          ))}
        </div>
        <div className="absolute flex" style={{ left: pct(WALL, W), right: pct(WALL, W), top: pct(LANE_Y - LANE_H / 2, H), height: pct(LANE_H, H) }}>
          {ZONE_X.map((_, i) => (
            <span key={i} className="flex-1 border-y-[1.5px] border-border first:border-l-[1.5px] last:border-r-[1.5px] first:rounded-l-[6px] last:rounded-r-[6px] font-display text-white grid place-items-center"
              style={{ background: LANE_COLORS[i], fontSize: tableW * 0.1, WebkitTextStroke: '1px #000', paintOrder: 'stroke' }}>{i + 1}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
