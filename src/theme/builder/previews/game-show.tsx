import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TeamArt } from '../../../engine/TeamBadge';
import Meter, { METER_H } from '../../../ui/Meter';
import { GAMES } from '../../../games/registry';
import { ClosedFace, Marquee, OpenFace, StudioBack, studioLook } from '../../../games/game-show/studio';
import type { CardKind } from '../../../games/game-show/cards';
import { pieceFill, pieceImage } from '../../library';
import { THEME_FONTS, type GameTheme } from '../../types';

// Game Show mid-game in the theme's own studio (owner, 2026-11-26): the same
// studio the game plays in (curtains and valance, spotlights, stage floor, the
// bulb marquee round a 4 x 3 board of surprise cards, the meter on top) drawn
// from the theme's colors, backdrop, card-back art, team icons, power-ups and
// title font, with Classic in whatever the theme leaves empty. Drawn at laptop
// size and scaled to the preview. No game name on the picture.
const W = 720, H = 540, REM = 16;
const COLS = 4, ROWS = 3, GAP = 10, BOARD = 520;
// Three cards already won (a goal that builds): two prizes and a power-up.
const WON: Record<number, { by: number; kind: 'points' | 'power'; points?: number }> = {
  1: { by: 0, kind: 'points', points: 30 }, 6: { by: 1, kind: 'power' }, 8: { by: 2, kind: 'points', points: 20 },
};

export default function GameShowPreview({ theme }: { theme: GameTheme }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const look = useMemo(() => studioLook(theme), [theme]);
  const power = (theme.items?.length ? theme.items : GAMES.find((g) => g.id === 'game-show')?.items?.classic ?? [])[0];
  const art = Array.from({ length: 10 }, (_, k) => pieceImage(theme, `team-${k + 1}`));
  const back = pieceFill(theme, 'card-back', '#fff1b8');
  const backArt = !!pieceImage(theme, 'card-back');
  // The marquee's ink edge, rim, inner edge and pad, each side.
  const frame = 4 + 17 + 3 + 10;
  const cardW = (BOARD - 2 * frame - (COLS - 1) * GAP) / COLS;
  const kindOf = (i: number): CardKind => (WON[i].kind === 'power' && power ? { kind: 'power', item: power } : { kind: 'points', points: WON[i].points ?? 30 });
  const won = Object.keys(WON).length;
  return (
    <div ref={box} className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3]" style={{ background: look.back }} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <TeamArt.Provider value={art}>
        <div className="absolute left-0 top-0 origin-top-left pointer-events-none" aria-hidden="true"
          style={{ width: W, height: H, transform: `scale(${scale})`, ['--gs-rim' as string]: '17px', ['--gs-inner' as string]: '10px', ['--font-display' as string]: THEME_FONTS[theme.fonts.display] } as CSSProperties}>
          <StudioBack w={W} h={H} rem={REM} look={look} />
          <div className="absolute left-1/2 -translate-x-1/2 grid justify-items-center gap-[10px]" style={{ top: 70, width: BOARD }}>
            <div className="flex items-center gap-2" style={{ width: 300 }}>
              <span className="flex-1 min-w-0 flex"><Meter width="100%" segments={1} done={0} part={won / (COLS * ROWS)} label="" /></span>
              <span className="shrink-0 grid place-items-center rounded-pill bg-[var(--paper)] px-2.5 text-sm font-bold leading-none tabular-nums text-[var(--ink)]"
                style={{ height: METER_H, border: '2.5px solid var(--color-border)', boxShadow: '0 2px 0 var(--color-border)' }}>{won}/{COLS * ROWS}</span>
            </div>
            <Marquee bulbs={16} chase={false} look={look} className="w-full">
              <div className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                {Array.from({ length: COLS * ROWS }, (_, i) => (
                  <span key={i} className="relative rounded-[0.9rem] overflow-hidden" style={{ aspectRatio: '300 / 220', border: '3px solid #1d1a33', boxShadow: WON[i] ? 'none' : '0 4px 0 #1d1a33' }}>
                    {WON[i] ? <OpenFace kind={kindOf(i)} by={WON[i].by} w={cardW} /> : <ClosedFace fill={back} art={!backArt} dash={look.dash} w={cardW} />}
                  </span>
                ))}
              </div>
            </Marquee>
          </div>
        </div>
      </TeamArt.Provider>
    </div>
  );
}
