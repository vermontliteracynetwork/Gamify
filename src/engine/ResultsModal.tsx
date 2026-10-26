import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowCounterClockwise, Feather, HouseSimple, Mountains, Smiley, SmileyMeh, SmileySad, Target, Trophy } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { saveCheckIn } from '../beta/surveys';
import { getSession } from '../student/session';
import type { StringKey } from '../i18n/en';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import type { MultipleChoiceQuestion } from '../data/types';
import { useSettings } from '../settings/SettingsContext';
import LookBack from './LookBack';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';

// A two-tap review at the end of every game (teacher, 2026-10-26: instead of
// a class check-in): how it felt, then easy or tricky. Pictures only, read
// aloud by the device's Listen tools; only counts are kept, never names.
const FEEL = [Smiley, SmileyMeh, SmileySad];
const LEVEL = [Feather, Target, Mountains];
const COLORS = [['#ddfcc6', '#fdfd94', '#ed9d75'], ['#b4c4fb', '#ddfcc6', '#ed9d75']];
function GameReview() {
  const [feel, setFeel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const gameId = useLocation().pathname.split('/')[2];
  const step = feel === null ? 0 : 1;
  if (done) return <p className="font-bold text-center" role="status">{t('review.thanks')}</p>;
  const icons = step === 0 ? FEEL : LEVEL;
  const key = step === 0 ? 'feel' : 'level';
  function pick(i: number) {
    if (step === 0) { setFeel(i); return; }
    const oneHot = (n: number) => [0, 1, 2].map((k) => (k === n ? 1 : 0)) as [number, number, number];
    void saveCheckIn({ at: new Date().toISOString(), classroomId: getSession()?.classroomId ?? '', gameId, feel: oneHot(feel!), level: oneHot(i) });
    setDone(true);
  }
  return (
    <div className="grid gap-2 justify-items-center rounded-input border-[2px] border-border-soft p-3">
      <p className="font-bold">{t(step === 0 ? 'review.feel' : 'review.level')}</p>
      <div className="flex gap-2">
        {icons.map((I, i) => (
          <button key={i} type="button" onClick={() => pick(i)} aria-label={t(`checkin.${key}.${i}` as StringKey)}
            className="w-16 h-16 rounded-full border-[2.5px] border-border flex items-center justify-center active:scale-90" style={{ background: COLORS[step][i] }}>
            <I weight="fill" size={34} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

// End-of-game results in a box over the game, so the screen never scrolls:
// the headline, a few facts, Play again (back to this game's start) or
// Back to the Arcade, and Let's look back.
export default function ResultsModal({ title, children, missed, againLabel, onAgain }: {
  title: string; children?: ReactNode; missed: MultipleChoiceQuestion[]; againLabel: string; onAgain: () => void;
}) {
  const { settings } = useSettings();
  const { student } = useSignedIn();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      <DialogFocus />
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 32px)' }}>
        <div className="grid justify-items-center gap-1 text-center">
          <Trophy weight="fill" size={52} className="text-accent" aria-hidden="true" />
          <h2 className="font-display text-3xl font-bold text-balance"><Title text={title} /></h2>
          {children}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onAgain}
            className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2">
            <ArrowCounterClockwise weight="bold" size={22} />{againLabel}
          </button>
          <Link to={student ? '/arcade' : '/play'}
            className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-surface-2 font-display text-xl font-bold inline-flex items-center gap-2 no-underline text-text">
            <HouseSimple weight="bold" size={22} />{t('results.arcade')}
          </Link>
        </div>
        <GameReview />
        <LookBack missed={missed} />
      </motion.div>
    </div>
  );
}
