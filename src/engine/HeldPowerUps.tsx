import { useEffect, useRef, useState } from 'react';
import { pace } from './pace';
import { AnimatePresence, motion } from 'motion/react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import ItemArt from '../theme/ItemArt';
import PopText from '../ui/PopText';
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

// Earned power-ups switch on by themselves at the start of the player's next
// turn (teacher, 2026-11-07): no box to tap, just a big centered message with
// the power-up's picture so everyone sees what happened.
export function PowerUpTray({ manifest, items, onUse, disabled = false }: { manifest: GameManifest; items: ThemeItem[]; onUse: (index: number) => void; disabled?: boolean }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [shown, setShown] = useState<{ id: number; item: ThemeItem } | null>(null);
  const tried = useRef(new Set<ThemeItem>());
  const next = items.findIndex((it) => !tried.current.has(it));
  useEffect(() => {
    if (disabled || next < 0) return;
    const id = window.setTimeout(() => {
      const it = items[next];
      tried.current.add(it); // one that needs a tap on the board (like a magnet) is not retried
      setShown({ id: Date.now(), item: it });
      onUse(next);
    }, 900 * pace(settings));
    return () => window.clearTimeout(id);
  }, [disabled, next, items]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!shown) return; const id = window.setTimeout(() => setShown(null), 2400); return () => window.clearTimeout(id); }, [shown]);
  return (
    <AnimatePresence>
      {shown && (
        <motion.div key={shown.id} role="status" aria-live="polite" aria-label={t('pu.used', { name: shown.item.name, role: roleOf(manifest, shown.item) })}
          className="fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 pointer-events-none grid justify-items-center gap-1 bg-surface border-[3px] border-border rounded-panel px-6 py-4 text-center"
          style={{ boxShadow: '0 0 0 6px rgba(253,253,148,0.6), var(--shadow-sticker-lg)' }}
          initial={still ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: still ? 1 : 0.8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
          <span className={still ? '' : 'pu-bob'}><ItemArt item={shown.item} size={84} still={still} /></span>
          <span className="font-display text-2xl font-bold"><PopText text={t('pu.on', { name: shown.item.name })} /></span>
          <span className="text-sm font-bold max-w-[22rem]">{roleOf(manifest, shown.item)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
