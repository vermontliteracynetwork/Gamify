import { useLayoutEffect, useRef, useState } from 'react';
import { CardFace, cardClass, cardStyle } from '../../../games/memory-match/cardArt';
import { TeamArt, TeamBadge } from '../../../engine/TeamBadge';
import { t } from '../../../i18n';
import { backdropStyle } from '../../library';
import { THEME_FONTS, type GameTheme } from '../../types';

// Memory Match mid-game for two players, drawn with the game's own cards at
// laptop size and scaled to the preview: one pair found, two cards turned up.
const W = 720, H = 540;
const CARDS: { side: 'q' | 'a'; text: string; up?: boolean; won?: boolean }[] = [
  { side: 'q', text: '' }, { side: 'a', text: 'kitten', up: true, won: true }, { side: 'q', text: '' }, { side: 'q', text: '' },
  { side: 'q', text: 'The opposite of hot', up: true }, { side: 'q', text: '' }, { side: 'q', text: 'A baby cat', up: true, won: true }, { side: 'a', text: '' },
  { side: 'q', text: '' }, { side: 'a', text: 'library', up: true }, { side: 'q', text: '' }, { side: 'a', text: '' },
  { side: 'a', text: '' }, { side: 'q', text: '' }, { side: 'a', text: '' }, { side: 'q', text: '' },
];

export default function MemoryMatchPreview({ theme }: { theme: GameTheme }) {
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
  const art = Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image);
  return (
    <div ref={box} className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <TeamArt.Provider value={art}>
        <div className="absolute left-0 top-0 origin-top-left px-8 pt-7 grid gap-3 content-start pointer-events-none" aria-hidden="true"
          style={{ width: W, height: H, transform: `scale(${scale})`, ['--color-accent' as string]: theme.colors.accent, ['--font-display' as string]: THEME_FONTS[theme.fonts.display] }}>
          <div className="flex flex-wrap items-center gap-2">
            {['Glowing Pickle', 'Magic Falcon'].map((name, i) => (
              <span key={name} className={`inline-flex items-center gap-2 rounded-pill border-bold px-3 min-h-11 font-bold bg-surface ${i === 0 ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}>
                <TeamBadge colorIndex={i} size={28} />{name}<span className="font-display text-xl tabular-nums">{i === 0 ? 1 : 0}</span>
              </span>
            ))}
            <span className="inline-flex items-center rounded-pill border-bold border-border px-4 min-h-11 font-bold bg-surface">{t('mm.moves', { count: 5 })}</span>
          </div>
          <div className="grid gap-3 mx-auto w-full" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', maxWidth: 520 }}>
            {CARDS.map((c, i) => (
              <span key={i} className={cardClass(!!c.won)} style={{ aspectRatio: '1.333', ...cardStyle(theme, !!c.up, c.side) }}>
                <CardFace theme={theme} up={!!c.up} side={c.side} text={c.text} />
              </span>
            ))}
          </div>
        </div>
      </TeamArt.Provider>
    </div>
  );
}
