import { useEffect } from 'react';
import { POP_IN } from './pace';
import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { t } from '../i18n';
import ItemArt from '../theme/ItemArt';
import PopText from '../ui/PopText';
import type { ThemeItem } from '../theme/types';
import { useSettings } from '../settings/SettingsContext';
import { playEffect } from './feedback';
import { playClip, POWER_SOUNDS } from './music';

// Each power-up arrives its own way, from how its art moves (engagement audit, 2026-11-08).
const ENTER: Record<string, { scale: number; opacity: number; y?: number; rotate?: number; x?: number }> = {
  spin: { scale: 0.2, opacity: 0, rotate: -540 },
  wiggle: { scale: 0.5, opacity: 0, rotate: 25, x: -60 },
  bob: { scale: 0.6, opacity: 0, y: 120 },
  sparkle: { scale: 1.8, opacity: 0 },
  none: { scale: 0.4, opacity: 0, y: 20 },
};

// A power-up card (teacher, 2026-11-13): a tall card over the game with the
// picture on top, then its name, then a short line on what it does, and an X
// at the top. It stays until the X (or the card) is tapped, so everyone sees it.
export function PowerUpCard({ id, item, title, text, onClose }: { id: number | string; item: ThemeItem; title: string; text: string; onClose: () => void }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <motion.div key={id} className="fixed inset-0 z-[70] grid place-items-center bg-[#241c3d]/40 p-4" role="dialog" aria-label={title}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="relative w-[min(19rem,86vw)] bg-surface border-[3px] border-border rounded-panel px-6 pt-10 pb-7 grid justify-items-center gap-3 text-center cursor-pointer"
        style={{ boxShadow: '0 0 0 6px rgba(253,253,148,0.6), 0 8px 0 #000, 0 24px 40px rgba(0,0,0,0.25)' }}
        initial={still ? { opacity: 0 } : ENTER[item.motion] ?? ENTER.none} animate={{ scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 }} exit={{ opacity: 0, scale: still ? 1 : 0.85 }}
        transition={POP_IN} whileHover={still ? undefined : { scale: 1.03 }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label={t('class.close')}
          className="absolute top-3 right-3 w-11 h-11 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center motion-safe:hover:scale-110 motion-safe:transition-transform"><X weight="bold" size={20} /></button>
        <span className={still ? '' : 'pu-bob'}><ItemArt item={item} size={128} still={still} /></span>
        <span className="font-display text-3xl leading-tight"><PopText text={title} /></span>
        <span className="font-bold text-base leading-snug text-balance">{text}</span>
      </motion.div>
    </motion.div>
  );
}

// The power-up a right answer brought, as a power-up card. `onDone` runs when it is closed.
export default function PowerUpPop({ pop, onDone }: { pop: { id: number; item: ThemeItem; text: string } | null; onDone: () => void }) {
  const { settings } = useSettings();
  useEffect(() => {
    if (!pop) return;
    // Its own sound when it has one (magnet, tornado, chest), else the win chime.
    const own = (POWER_SOUNDS as Record<string, string>)[pop.item.ability];
    if (own) playClip(own, settings); else playEffect('win', settings);
  }, [pop?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AnimatePresence>
      {pop && <PowerUpCard key={pop.id} id={pop.id} item={pop.item} title={pop.item.name} text={pop.text} onClose={onDone} />}
    </AnimatePresence>
  );
}
