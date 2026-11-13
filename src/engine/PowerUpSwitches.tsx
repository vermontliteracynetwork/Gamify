import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Check, X } from '@phosphor-icons/react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import ItemArt from '../theme/ItemArt';
import { featuredId } from './powerUps';
import type { GameTheme } from '../theme/types';

export interface PowerCard { id: string; name: string; hint: string; art: ReactNode; on: boolean; featured?: boolean }

// Every power-up on one page as small square cards (teacher, 2026-11-01):
// tap a card to turn that power-up on or off. One element, so the setup
// pages always keep the whole set together.
export function PowerUpCards({ cards, hint, onChange }: { cards: PowerCard[]; hint: string; onChange: (id: string, on: boolean) => void }) {
  // As few rows as the width allows (one, else two even rows), so the
  // cards stay small and every one fits on the page.
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    setWidth(el.clientWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = Math.max(1, cards.length);
  const across = (cols: number) => (width - 10 * (cols - 1)) / cols;
  let cols = n;
  for (let rows = 1; rows <= n && across(cols) < 180; rows++) cols = Math.ceil(n / rows);
  // Picture, name, then a short caption of what it does, on its own page
  // (teacher, 2026-11-13; this replaces the 11-08 hover-text rule).
  const size = Math.max(150, Math.min(210, Math.floor(across(cols))));
  return (
    <div ref={box} className="grid gap-2 min-w-0 w-full">
      <div className="grid gap-0.5 text-center">
        <span className="font-bold">{t('tb.powers')}</span>
        <span className="text-sm font-semibold text-muted">{hint}</span>
      </div>
      <div className="grid gap-2.5 justify-center" style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridAutoRows: `minmax(${Math.round(size * 1.05)}px, auto)` }}>
        {cards.map((c) => (
          <button key={c.id} type="button" role="switch" aria-checked={c.on} onClick={() => onChange(c.id, !c.on)}
            aria-label={c.hint ? `${c.name}: ${c.hint}` : c.name}
            className={`relative rounded-input border-[2.5px] tile-wiggle p-3 pt-4 grid justify-items-center content-start gap-1.5 text-center motion-safe:transition-all motion-safe:active:scale-95 ${c.on ? 'border-border bg-[#c8f0dc]' : 'border-dashed border-border-soft bg-surface-2'}`}
            style={c.on ? { boxShadow: '0 4px 0 #000, 0 10px 18px rgba(36,28,61,0.12)' } : undefined}>
            <span className={`${c.on ? 'pu-bob' : 'grayscale opacity-45'}`}>{c.art}</span>
            <span className={`font-bold text-base leading-tight text-balance break-words ${c.on ? '' : 'text-muted'}`}>{c.name}</span>
            {c.hint && <span className="text-xs font-semibold leading-snug text-muted text-balance break-words">{c.hint}</span>}
            {c.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill border-[2px] border-border bg-accent px-2.5 py-0.5 text-xs font-bold motion-safe:animate-pulse">{t('pu.featured')}</span>}
            {/* On: a mint check in the corner. Off: a faded X. */}
            <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full border-[2px] flex items-center justify-center ${c.on ? 'bg-success border-border' : 'bg-surface border-border-soft text-muted'}`} aria-hidden="true">
              {c.on ? <Check weight="bold" size={15} /> : <X weight="bold" size={13} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// The power-up cards for a game (modeled on Game Show's): the teacher turns
// each one on or off. `on` is the game's old all-or-nothing switch; `off`
// lists the ones turned off.
export function powerUpSwitches({ manifest, theme, on, off, change }: {
  manifest: GameManifest; theme: GameTheme; on: boolean; off: string[];
  change: (patch: { powerUps?: boolean; powerOff?: string[] }) => void;
}): ReactNode {
  const items = theme.items?.length ? theme.items : manifest.items?.classic ?? [];
  if (!items.length) return null;
  const isOn = (id: string) => on && !off.includes(id);
  function set(id: string, v: boolean) {
    if (v) change(on ? { powerOff: off.filter((x) => x !== id) } : { powerUps: true, powerOff: items.filter((i) => i.id !== id).map((i) => i.id) });
    else { const next = [...new Set([...off, id])]; change({ powerOff: next, ...(next.length >= items.length ? { powerUps: false } : {}) }); }
  }
  const hint = (ability: string) => manifest.items?.abilities.find((a) => a.id === ability)?.hint ?? '';
  const featured = featuredId(items, manifest.id);
  return (
    <PowerUpCards hint={t('pu.switchHint')} onChange={set}
      cards={items.map((it) => ({ id: it.id, name: it.name, hint: hint(it.ability), art: <ItemArt item={it} size={64} still />, on: isOn(it.id), featured: it.id === featured }))} />
  );
}
