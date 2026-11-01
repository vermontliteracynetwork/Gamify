import { createContext, useEffect, useState } from 'react';
import { ArrowRight, Lightbulb, Play, SpeakerHigh } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type { TeachCard } from '../data/types';
import { speak, stopSpeaking } from '../engine/feedback';
import { POP_IN } from '../engine/pace';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import DialogFocus from '../ui/DialogFocus';

export interface TeachShow { name: string; card: TeachCard }

// The set picker tells the setup pages which teach cards the picked sets
// have, so they show after Play, before the game (market gaps, 2026-11-01).
export const TeachCards = createContext<((cards: TeachShow[]) => void) | null>(null);

// A short teach card before play: the skill in a sentence or two, with a
// picture, read aloud. One card per picked set; then the game starts.
export function TeachCardBox({ cards, onDone }: { cards: TeachShow[]; onDone: () => void }) {
  const { settings } = useSettings();
  const [k, setK] = useState(0);
  const c = cards[k];
  const last = k === cards.length - 1;
  useEffect(() => {
    const id = settings.autoRead ? window.setTimeout(() => speak(c.card.text, settings), 400) : 0;
    return () => { window.clearTimeout(id); stopSpeaking(); };
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('teach.title')}>
      <DialogFocus />
      <motion.div key={k} initial={settings.motion === 'still' ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP_IN}
        className="brand-menu w-full max-w-2xl max-h-[92dvh] overflow-hidden bg-surface border-[3px] border-border rounded-panel p-6 sm:p-8 grid gap-4 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <span className="inline-flex items-center gap-2 rounded-pill border-[2px] border-border bg-accent px-4 py-1 font-bold"><Lightbulb weight="fill" size={20} />{t('teach.title')}</span>
        <p className="font-bold text-muted">{c.name}</p>
        {c.card.imageUrl && <img src={c.card.imageUrl} alt={c.card.imageAlt ?? ''} className="max-h-[32dvh] max-w-full rounded-input border-[2px] border-border object-contain" />}
        <p className="font-display text-3xl sm:text-4xl leading-snug">{c.card.text}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => speak(c.card.text, settings)} className="min-h-14 px-6 rounded-pill border-[2px] border-border bg-surface-2 font-bold text-lg inline-flex items-center gap-2"><SpeakerHigh weight="bold" size={22} />{t('q.listen')}</button>
          <button type="button" onClick={() => (last ? onDone() : setK(k + 1))} className="min-h-14 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl font-bold inline-flex items-center gap-2">
            {last ? <><Play weight="fill" size={22} />{t('teach.play')}</> : <>{t('setup.next')}<ArrowRight weight="bold" size={20} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
