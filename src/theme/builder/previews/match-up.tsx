import { useLayoutEffect, useRef, useState } from 'react';
import { Timer } from '@phosphor-icons/react';
import { answerClass, tileClass, tileStyle } from '../../../games/match-up/tileArt';
import { t } from '../../../i18n';
import { backdropStyle } from '../../library';
import { THEME_FONTS, type GameTheme } from '../../types';

// Match Up mid-round, drawn with the game's own tiles at laptop size and
// scaled to the preview: two pairs matched, one question picked.
const W = 720, H = 540;
const LEFT = ['A baby cat', 'The opposite of hot', 'A place to read books', 'It falls from clouds'];
const RIGHT = ['library', 'kitten', 'rain', 'cold'];
const PAIR_OF_RIGHT = [2, 0, 3, 1]; // which left tile each right tile answers
const DONE = new Set([0, 3]);
const PICKED = 1;

export default function MatchUpPreview({ theme }: { theme: GameTheme }) {
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
  return (
    <div ref={box} className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="absolute left-0 top-0 origin-top-left px-8 pt-8 grid gap-3 content-start pointer-events-none" aria-hidden="true"
        style={{ width: W, height: H, transform: `scale(${scale})`, ['--color-accent' as string]: theme.colors.accent, ['--font-display' as string]: THEME_FONTS[theme.fonts.display] }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-surface border-bold border-border rounded-pill px-4 min-h-11 font-display text-xl tabular-nums"><Timer weight="bold" size={22} />0:42</span>
          <span className="inline-flex items-center bg-surface border-bold border-border rounded-pill px-4 min-h-11 font-bold">{t('mu.round', { n: 1, total: 2 })}</span>
          <span className="inline-flex items-center bg-surface border-bold border-border rounded-pill px-4 min-h-11 font-bold">{t('mu.matched', { done: 2, total: 4 })}</span>
        </div>
        <div className="grid grid-cols-2 gap-5" style={{ gridTemplateRows: 'repeat(4, minmax(0, 1fr))', gridAutoFlow: 'column', height: 4 * 104 }}>
          {LEFT.map((text, i) => (
            <span key={`l${i}`} className={tileClass(i === PICKED, DONE.has(i))} style={tileStyle(theme, 'l', DONE.has(i))}><span className="text-lg break-words">{text}</span></span>
          ))}
          {RIGHT.map((text, i) => (
            <span key={`r${i}`} className={`${tileClass(false, DONE.has(PAIR_OF_RIGHT[i]))} ${answerClass}`} style={tileStyle(theme, 'r', DONE.has(PAIR_OF_RIGHT[i]))}>{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
