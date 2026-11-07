import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import ItemArt from '../theme/ItemArt';
import type { ThemeItem } from '../theme/types';

// Power-ups you hold (teacher, 2026-10-31): one earned on a right answer
// waits for that player's NEXT turn, then shows under the scoreboard (a
// vertical list when there is more than one). Tap one to use it. Whatever is
// not used is gone when the turn ends.
export function useHeldPowerUps() {
  const pending = useRef<Record<string, ThemeItem[]>>({});
  const [held, setHeld] = useState<{ who: string; items: ThemeItem[] }>({ who: '', items: [] });
  return {
    held: held.items,
    // Earned now, ready on this player's next turn.
    earn(who: string, item: ThemeItem) { pending.current = { ...pending.current, [who]: [...(pending.current[who] ?? []), item] }; },
    beginTurn(who: string) { const items = pending.current[who] ?? []; const { [who]: _, ...rest } = pending.current; pending.current = rest; setHeld({ who, items }); },
    endTurn() { setHeld({ who: '', items: [] }); },
    use(index: number): ThemeItem | null { const it = held.items[index] ?? null; setHeld((h) => ({ ...h, items: h.items.filter((_, i) => i !== index) })); return it; },
    reset() { pending.current = {}; setHeld({ who: '', items: [] }); },
  };
}

// Each item's role: what it does in Classic, which a theme can dress up
// but never changes (e.g. "2x points: Earn double points").
export function roleOf(manifest: GameManifest, it: ThemeItem) {
  const a = manifest.items?.abilities.find((x) => x.id === it.ability);
  return a ? `${a.label}: ${a.hint}` : '';
}

export function PowerUpTray({ manifest, items, onUse, disabled = false }: { manifest: GameManifest; items: ThemeItem[]; onUse: (index: number) => void; disabled?: boolean }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  if (!items.length) return null;
  return (
    <section className="bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-3 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('pu.tray')}>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted px-1">{t('pu.tray')}</h2>
      <ul className="grid gap-2 list-none p-0 m-0">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.li key={`${it.id}-${i}`} initial={still ? false : { x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={still ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}>
              {/* The power-up's picture is the star of the card, its name under it,
                  and what it does in hover text (teacher, 2026-11-07). */}
              <button type="button" disabled={disabled} onClick={() => onUse(i)} aria-label={t('pu.use', { name: it.name, role: roleOf(manifest, it) })} data-tip={roleOf(manifest, it)}
                className={`tile-wiggle w-full grid justify-items-center gap-1 text-center rounded-input border-[2.5px] border-border bg-accent px-2 pt-2 pb-2.5 disabled:opacity-60 ${disabled || still ? '' : 'hover:-translate-y-0.5'} transition-transform`}>
                <span className={disabled || still ? '' : 'pu-bob'}><ItemArt item={it} size={76} still={still} /></span>
                <span className="font-display font-bold text-lg leading-tight">{it.name}</span>
                <span className="rounded-pill border-[2px] border-border bg-surface px-3 py-0.5 text-sm font-bold">{t('pu.useShort')}</span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
