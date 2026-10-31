import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { t } from '../i18n';
import ItemArt from '../theme/ItemArt';
import type { ThemeItem } from '../theme/types';
import { useSettings } from '../settings/SettingsContext';
import { playEffect } from './feedback';

// The power-up a right answer brought: its picture, name and what it does,
// popping in over the game for a moment. Never blocks a tap on the game, and
// always has an X to close it sooner (teacher, 2026-10-31).
export default function PowerUpPop({ pop, onDone }: { pop: { id: number; item: ThemeItem; text: string } | null; onDone: () => void }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  useEffect(() => {
    if (!pop) return;
    playEffect('win', settings);
    const id = window.setTimeout(onDone, still ? 2600 : 2200);
    return () => window.clearTimeout(id);
  }, [pop?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AnimatePresence>
      {pop && (
        <motion.div key={pop.id} role="status" aria-live="polite"
          className="fixed left-1/2 top-[22%] z-40 -translate-x-1/2 pointer-events-none bg-surface border-[3px] border-border rounded-panel px-5 py-3 flex items-center gap-3 max-w-[92vw]"
          style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
          initial={still ? { opacity: 0 } : { scale: 0.4, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: still ? 1 : 0.8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}>
          <ItemArt item={pop.item} size={72} still={still} />
          <span className="grid">
            <span className="font-display text-2xl leading-tight">{pop.item.name}</span>
            <span className="font-bold">{pop.text}</span>
          </span>
          <button type="button" onClick={onDone} aria-label={t('class.close')} className="pointer-events-auto self-start w-11 h-11 shrink-0 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
