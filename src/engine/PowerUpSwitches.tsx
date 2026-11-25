import { allowedItem } from './powerUps';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Check, X } from '@phosphor-icons/react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import ItemArt from '../theme/ItemArt';
import type { GameTheme } from '../theme/types';

export interface PowerCard { id: string; name: string; hint: string; art: ReactNode; on: boolean }

// Every power-up on one page as small square cards (teacher, 2026-11-01):
// tap a card to turn that power-up on or off. One element, so the setup
// pages always keep the whole set together.
export function PowerUpCards({ cards, hint, onChange }: { cards: PowerCard[]; hint: string; onChange: (id: string, on: boolean) => void }) {
  // Universal views 7 (approved 2026-11-25): white cards with a Kelly check
  // when on, dashed cream cards with an x when off, straight on the ground.
  // The cards size to the room the setup page has (width AND height), so
  // every card shows and nothing scrolls under the title, phones too
  // (two columns there).
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 800, h: 600 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const body = el.closest<HTMLElement>('[data-setup-body]');
    const measure = () => {
      const h = body ? body.clientHeight - 40 : window.innerHeight * 0.6;
      setRoom((r) => (r.w === el.clientWidth && r.h === h ? r : { w: el.clientWidth, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (body) ro.observe(body);
    return () => ro.disconnect();
  }, []);
  const n = Math.max(1, cards.length);
  const narrow = room.w < 500;
  const GAP = narrow ? 14 : 24;
  // Phones get squarer cards so the picture, name and line all fit (mockup: 160 x 156).
  const ratio = narrow ? 0.9 : 0.62;
  // The biggest card (4:3 wide, 10.5 to 20rem) that fits: try each column count.
  const fits = Array.from({ length: n }, (_, k) => {
    const cols = k + 1, rows = Math.ceil(n / cols);
    const byW = (room.w - GAP * (cols - 1)) / cols;
    const byH = ((room.h - GAP * (rows - 1)) / rows) / ratio;
    return { cols, w: Math.min(byW, byH, 320) };
  });
  // Fewer rows win when the cards stay nearly as big (the mockup's three across).
  const top = Math.max(...fits.map((f) => f.w));
  const best = [...fits].reverse().find((f) => f.w >= top * 0.9) ?? fits[0];
  const w = Math.max(120, Math.floor(best.w));
  const h = Math.round(w * ratio);
  const art = Math.round(h * (narrow ? 0.32 : 0.36));
  return (
    <div ref={box} className="grid min-w-0 w-full">
      {/* No heading or line of help: the step title says Power-ups and
          the check on each card says on or off (teacher, 2026-11-16). */}
      <div role="group" aria-label={hint} className="flex flex-wrap justify-center mx-auto" style={{ gap: GAP, maxWidth: best.cols * w + (best.cols - 1) * GAP }}>
        {cards.map((c) => (
          <button key={c.id} type="button" role="switch" aria-checked={c.on} onClick={() => onChange(c.id, !c.on)}
            aria-label={c.hint ? `${c.name}: ${c.hint}` : c.name}
            className={`relative rounded-[1.25rem] border-[3px] border-border tile-wiggle px-2 grid justify-items-center content-center gap-1 text-center motion-safe:transition-all motion-safe:active:scale-95 shrink-0 ${c.on ? 'bg-surface' : 'border-dashed bg-[#f6f0e4]'}`}
            style={{ width: w, height: h, ...(c.on ? { boxShadow: '0 5px 0 var(--ink)' } : {}) }}>
            <span className={`grid place-items-center ${c.on ? 'pu-bob' : 'grayscale opacity-50'}`} style={{ width: art, height: art }}>
              <span className="grid place-items-center [&_img]:!w-full [&_img]:!h-full [&_svg]:!w-full [&_svg]:!h-full w-full h-full">{c.art}</span>
            </span>
            <span className="font-bold leading-tight text-balance" style={{ fontSize: Math.max(15, Math.min(22, w / 14)) }}>{c.name}</span>
            {/* What it does, small and quiet (teacher, 2026-11-13). */}
            {c.hint && <span className="font-semibold leading-snug text-muted text-balance line-clamp-2" style={{ fontSize: Math.max(11, Math.min(16, w / 20)) }}>{c.hint}</span>}
            {/* On: a Kelly check in the corner. Off: an x. */}
            <span className={`absolute -top-3 -right-3 w-9 h-9 rounded-full border-[3px] border-border flex items-center justify-center ${c.on ? 'bg-kelly' : 'bg-surface'}`} aria-hidden="true">
              {c.on ? <Check weight="bold" size={18} /> : <X weight="bold" size={16} />}
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
  const items = (theme.items?.length ? theme.items : manifest.items?.classic ?? []).filter(allowedItem);
  if (!items.length) return null;
  const isOn = (id: string) => on && !off.includes(id);
  function set(id: string, v: boolean) {
    if (v) change(on ? { powerOff: off.filter((x) => x !== id) } : { powerUps: true, powerOff: items.filter((i) => i.id !== id).map((i) => i.id) });
    else { const next = [...new Set([...off, id])]; change({ powerOff: next, ...(next.length >= items.length ? { powerUps: false } : {}) }); }
  }
  const hint = (ability: string) => manifest.items?.abilities.find((a) => a.id === ability)?.hint ?? '';
  return (
    <PowerUpCards hint={t('pu.switchHint')} onChange={set}
      cards={items.map((it) => ({ id: it.id, name: it.name, hint: hint(it.ability), art: <ItemArt item={it} size={48} still />, on: isOn(it.id) }))} />
  );
}
