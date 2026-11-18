import { ArrowFatLeft, ArrowFatRight, ArrowFatUp, HourglassMedium } from '@phosphor-icons/react';
import { TeamArt, TeamBadge } from '../../../engine/TeamBadge';
import { carBox, Hopper, Lanes, roadLook, Vehicle } from '../../../games/road-hop/art';
import { COLS, makeMap, ROWS, START } from '../../../games/road-hop/road';
import { t } from '../../../i18n';
import { backdropStyle, pieceFill } from '../../library';
import type { GameTheme } from '../../types';

// Road Hop as play draws it (teacher, 2026-11-16): the grass and roads, the
// cars and a truck, the hopper at the start, the hop buttons and the teams.
let seed = 11;
const MAP = makeMap(1, () => ((seed = (seed * 9301 + 49297) % 233280) / 233280));
const TEAMS = ['Glowing Pickle', 'Magic Falcon', 'Brave Otter'];

export default function RoadHopPreview({ theme }: { theme: GameTheme }) {
  const { grass, roadColor, hopperColor, hopperArt, carColors } = roadLook(theme);
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] p-[3%] grid grid-cols-[minmax(0,1fr)_34%] gap-[3%]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image)}>
        <div className="min-h-0 grid grid-rows-[minmax(0,1fr)_auto] gap-[4%] justify-items-center">
          <div className="relative h-full max-w-full rounded-input border-bold border-border overflow-hidden" style={{ ...pieceFill(theme, 'background', grass), aspectRatio: `${COLS} / ${ROWS}` }}>
            <Lanes map={MAP} k={0} roadColor={roadColor} />
            {MAP.flatMap((lane, r) => lane.cars.map((c) => (
              <div key={`${r}-${c.id}`} className="absolute p-[3%]" style={carBox(lane, c, r)}>
                <Vehicle color={carColors[(r + c.id) % carColors.length]} long={c.len === 2} facing={lane.dir} />
              </div>
            )))}
            <div className="absolute p-[1.5%]" style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%`, left: `${(START.col / COLS) * 100}%`, top: `${((ROWS - 1 - START.row) / ROWS) * 100}%` }}>
              <Hopper color={hopperColor} art={hopperArt} dizzy={false} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr] gap-1 w-full max-w-[16rem]">
            {[<ArrowFatLeft key="l" weight="fill" />, <ArrowFatUp key="u" weight="fill" />, <ArrowFatRight key="r" weight="fill" />, <HourglassMedium key="w" weight="fill" />].map((icon, i) => (
              <span key={i} className={`h-7 rounded-md border-std border-border grid place-items-center text-base ${i === 1 ? 'bg-accent' : 'bg-surface'}`} style={{ boxShadow: '0 2px 0 #000' }}>{icon}</span>
            ))}
          </div>
        </div>
        <div className="min-w-0 grid content-start gap-2">
          <div className="flex items-center gap-1.5 bg-surface border-std border-border rounded-input px-2 py-1">
            <TeamBadge colorIndex={0} size={22} />
            <span className="font-display text-xs leading-tight">{t('rh.go', { name: TEAMS[0] })}</span>
          </div>
          <div className="score-card overflow-hidden">
            <ol className="grid gap-1 list-none p-1.5 m-0">
              {TEAMS.map((name, i) => (
                <li key={name} className={`flex items-center gap-1.5 rounded-md border-std p-1 ${i === 0 ? 'border-border bg-surface-2' : 'border-border-soft'}`}>
                  <TeamBadge colorIndex={i} size={20} /><span className="font-bold text-[11px] leading-tight flex-1 min-w-0 truncate">{name}</span>
                  <span className="font-display text-sm tabular-nums">{[3, 2, 0][i]}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </TeamArt.Provider>
    </div>
  );
}
