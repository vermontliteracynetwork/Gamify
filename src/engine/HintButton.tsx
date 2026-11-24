import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import DialogFocus from '../ui/DialogFocus';
import Title from '../ui/Title';
import { playEffect } from './feedback';
import { POP_IN } from './pace';
import TapOk from './TapOk';

// Each game's how-to lines (its welcome steps), by game id.
const HOW_KEYS: Record<string, string> = {
  'game-show': 'tb', pinball: 'pb', 'castle-quest': 'cq', 'cast-catch': 'cc', 'match-three': 'bm',
  'four-in-a-row': 'fr', 'memory-match': 'mm', 'match-up': 'mu', 'bubble-pop': 'bp', bowling: 'sb',
  'road-hop': 'rh', 'lunch-rush': 'lr', 'farm-grow': 'fg', 'star-quiz': 'practice', territory: 'territory', flashcards: 'fc',
};

export function gameTips(gameId: string): string[] {
  const pre = HOW_KEYS[gameId];
  if (!pre) return [];
  const out: string[] = [];
  for (let n = 1; n <= 5; n++) {
    const key = `${pre}.how${n}` as StringKey;
    const line = t(key);
    if (!line || line === key) break;
    out.push(line);
  }
  return out;
}

// The lightbulb (teacher, 2026-11-24): rule and tip lines no longer sit under
// the scoreboard; a round button beside Settings opens the game's tips in a
// small card that stays until it is tapped closed.
export default function HintButton({ gameId, tips, small = true }: { gameId?: string; tips?: string[]; small?: boolean }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [open, setOpen] = useState(false);
  const list = tips ?? (gameId ? gameTips(gameId) : []);
  if (!list.length) return null;
  const close = () => { playEffect('close', settings); setOpen(false); };
  return (
    <>
      <button type="button" onClick={() => { playEffect('open', settings); setOpen(true); }} aria-label={t('hint.open')} title={t('hint.open')}
        className={`hint-btn ${small ? 'tool-round w-11 h-11' : 'w-14 h-14 border-bold bg-surface'} shrink-0 rounded-full border-border flex items-center justify-center active:scale-95 motion-safe:transition`}
        style={small ? undefined : { boxShadow: 'var(--shadow-sticker)' }}>
        <Lightbulb weight="bold" size={small ? 22 : 30} />
      </button>
      {/* On the page itself, so no board or tool row can sit over the card. */}
      {createPortal(<AnimatePresence>
        {open && (
          <motion.div key="tips" className="fixed inset-0 z-[75] grid place-items-center bg-ink-night/40 p-4" role="dialog" aria-modal="true" aria-label={t('hint.title')}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.3 }} onClick={close}>
            <DialogFocus onClose={close} />
            <motion.div onClick={(e) => e.stopPropagation()} className="brand-menu w-[min(22rem,92vw)] bg-surface border-heavy border-border rounded-panel px-6 pt-6 pb-7 grid justify-items-center gap-3 text-center"
              style={{ boxShadow: '0 8px 0 #000, 0 24px 40px rgba(0,0,0,0.25)' }}
              initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={still ? { duration: 0.15 } : POP_IN}>
              <span className="w-16 h-16 rounded-full bg-accent border-std border-border grid place-items-center" aria-hidden="true"><Lightbulb weight="bold" size={36} /></span>
              <h2 className="font-display text-3xl leading-tight"><Title text={t('hint.title')} /></h2>
              <ul className="m-0 p-0 list-none grid gap-2 font-bold text-lg leading-snug text-balance">
                {list.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <TapOk onTap={close} label={t('hint.gotIt')} className="mt-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}
