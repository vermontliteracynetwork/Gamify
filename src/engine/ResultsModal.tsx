import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowCounterClockwise, CaretLeft, CaretRight, ChalkboardTeacher, CheckCircle, Eye, Feather, HouseSimple, Mountains, Smiley, SmileyMeh, SmileySad, SpeakerHigh, Star, Target, X } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { saveCheckIn } from '../beta/surveys';
import { getSession } from '../student/session';
import type { StringKey } from '../i18n/en';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import type { MultipleChoiceQuestion } from '../data/types';
import { useSettings } from '../settings/SettingsContext';
import { speak } from './feedback';
import { TeamBadge } from './TeamBadge';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';

// A two-tap review at the end of every game (teacher, 2026-10-26: instead of
// a class check-in): how it felt, then easy or tricky. Pictures only, read
// aloud by the device's Listen tools; only counts are kept, never names.
// Since 2026-10-31 it sits behind the Rate game button.
const FEEL = [Smiley, SmileyMeh, SmileySad];
const LEVEL = [Feather, Target, Mountains];
const COLORS = [['#ddfcc6', '#fdfd94', '#ed9d75'], ['#b4c4fb', '#ddfcc6', '#ed9d75']];
function GameReview({ onDone }: { onDone: () => void }) {
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
    window.setTimeout(onDone, 1400);
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

// The winner (or winners, in a tie) floating over a little stage, with a
// halo around the icon (teacher, 2026-10-31). Solo games float a star.
function WinnerStage({ winners }: { winners?: { name: string; colorIndex: number }[] }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const list = winners?.length ? winners : null;
  const size = list && list.length > 2 ? 64 : 84;
  return (
    <div className="relative w-full max-w-sm mx-auto h-48 select-none" aria-hidden="true">
      {/* Stage lights */}
      <span className="absolute inset-x-[18%] bottom-8 top-0 rounded-t-full opacity-60" style={{ background: 'radial-gradient(ellipse at 50% 100%, #fdfd94 0%, rgba(253,253,148,0.35) 45%, transparent 72%)' }} />
      {/* The stage: a round top and a front */}
      <span className="absolute inset-x-[12%] bottom-0 h-9 rounded-b-[1.25rem] border-[2.5px] border-border" style={{ background: '#ed9d75' }} />
      <span className="absolute inset-x-[12%] bottom-6 h-7 rounded-[50%] border-[2.5px] border-border" style={{ background: '#fdfd94' }} />
      <div className="absolute inset-x-0 bottom-12 flex justify-center gap-4">
        {(list ?? [null]).map((w, i) => (
          <motion.div key={i} className="grid justify-items-center gap-1"
            animate={still ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
            <span className="rounded-full" style={{ boxShadow: '0 0 0 5px rgba(253,253,148,0.95), 0 0 22px 12px rgba(253,253,148,0.85), 0 0 46px 18px rgba(255,255,255,0.55)' }}>
              {w ? <TeamBadge colorIndex={w.colorIndex} size={size} /> : (
                <span className="rounded-full border-[2.5px] border-border bg-accent flex items-center justify-center" style={{ width: size, height: size }}><Star weight="fill" size={size * 0.6} color="#241c3d" /></span>
              )}
            </span>
            {w && <span className="font-display text-lg font-bold bg-surface border-[2px] border-border rounded-pill px-3 leading-tight max-w-36 truncate">{w.name}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Review (teacher, 2026-10-31): full screen, so the teacher can walk the
// class through each question that was missed, one at a time. Optional.
function ReviewScreen({ missed, onClose }: { missed: MultipleChoiceQuestion[]; onClose: () => void }) {
  const { settings } = useSettings();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const q = missed[i];
  const answer = q.choices[q.correctIndex];
  const go = (n: number) => { setI(n); setShown(false); };
  return (
    <div className="fixed inset-0 z-[60] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label={t('rv.title')}>
      <DialogFocus onClose={onClose} />
      <div className="flex items-center gap-3 px-4 sm:px-8 py-3 border-b-[2.5px] border-border bg-surface">
        <ChalkboardTeacher weight="fill" size={30} aria-hidden="true" />
        <h2 className="title-bubble text-3xl flex-1" style={{ color: 'var(--text)' }}><Title text={t('rv.title')} /></h2>
        <span className="font-bold tabular-nums">{t('q.progress', { n: i + 1, total: missed.length })}</span>
        <button type="button" onClick={onClose} aria-label={t('class.close')} className="w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={24} /></button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 grid gap-5">
          <p className="font-bold text-muted">{t(shown ? 'rv.afterTip' : 'rv.tip')}</p>
          <div className="flex items-start gap-3">
            <h3 className="font-body text-4xl sm:text-5xl font-bold leading-tight flex-1 text-balance">{q.prompt}</h3>
            <button type="button" aria-label={`${t('q.listen')}: ${q.prompt}`} onClick={() => speak(`${q.prompt}. ${q.choices.join('. ')}`, settings)}
              className="w-14 h-14 shrink-0 rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center"><SpeakerHigh weight="bold" size={26} /></button>
          </div>
          {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[30dvh] w-auto mx-auto rounded-input border-[2px] border-border-soft" />}
          <ol className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
            {q.choices.map((c, k) => {
              const right = shown && k === q.correctIndex;
              return (
                <li key={k} className={`min-h-20 px-4 py-3 rounded-input border-[3px] border-border flex items-center gap-3 font-bold text-2xl sm:text-3xl bg-surface ${shown && !right ? 'opacity-40' : ''} ${right ? 'ring-[6px] ring-success' : ''}`}
                  style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <span className="w-12 h-12 shrink-0 rounded-full bg-surface-2 border-[2.5px] border-border flex items-center justify-center font-display text-2xl">
                    {right ? <CheckCircle weight="fill" size={30} aria-label={t('q.rightMark')} /> : String.fromCharCode(65 + k)}
                  </span>
                  <span className="min-w-0 break-words">{c}</span>
                </li>
              );
            })}
          </ol>
          <AnimatePresence>
            {shown && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="justify-self-start inline-flex items-center gap-2 font-display text-2xl font-bold px-4 py-2 rounded-input bg-success/40 border-[2.5px] border-border" role="status">
                <CheckCircle weight="fill" size={28} />{t('look.rightAnswer', { answer })}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 border-t-[2.5px] border-border bg-surface">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className="min-h-14 px-5 rounded-pill border-[2.5px] border-border bg-surface-2 font-bold inline-flex items-center gap-2 disabled:opacity-30"><CaretLeft weight="bold" size={22} />{t('look.prev')}</button>
        {!shown
          ? <button type="button" onClick={() => setShown(true)} className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}><Eye weight="bold" size={24} />{t('rv.show')}</button>
          : i < missed.length - 1
            ? <button type="button" onClick={() => go(i + 1)} className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('look.next')}<CaretRight weight="bold" size={22} /></button>
            : <button type="button" onClick={onClose} className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('rv.done')}</button>}
        <span className="w-24" aria-hidden="true" />
      </div>
    </div>
  );
}

// End-of-game results in a box over the game, so the screen never scrolls
// (teacher, 2026-10-31): the winner on a stage, the headline in the Gamify
// font, and four buttons: Play again, Arcade, Review and Rate game.
export default function ResultsModal({ title, children, missed, againLabel, onAgain, winners }: {
  title: string; children?: ReactNode; missed: MultipleChoiceQuestion[]; againLabel: string; onAgain: () => void;
  // Share games: the winning team or teams, shown floating over the stage.
  winners?: { name: string; colorIndex: number }[];
}) {
  const { settings } = useSettings();
  const { student } = useSignedIn();
  const [view, setView] = useState<'main' | 'rate'>('main');
  const [reviewing, setReviewing] = useState(false);
  const btn = 'min-h-16 px-4 rounded-input border-[2.5px] border-border font-display text-xl font-bold inline-flex items-center justify-center gap-2 no-underline text-text disabled:opacity-40';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      {!reviewing && <DialogFocus />}
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4 overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 2rem)' }}>
        <WinnerStage winners={winners} />
        <div className="grid justify-items-center gap-1 text-center">
          <h2 className="title-bubble text-4xl text-balance" style={{ color: 'var(--text)' }}><Title text={title} /></h2>
          {children}
        </div>
        {view === 'main' ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onAgain} className={`${btn} bg-accent`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ArrowCounterClockwise weight="bold" size={24} />{againLabel}
            </button>
            {/* Students reach games only with a code (teacher, 2026-10-31). */}
            <Link to={student ? '/join' : '/play'} className={`${btn} bg-surface-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <HouseSimple weight="bold" size={24} />{student ? t('results.newCode') : t('results.arcadeShort')}
            </Link>
            <button type="button" onClick={() => setReviewing(true)} disabled={missed.length === 0}
              aria-label={missed.length ? t('rv.button', { count: missed.length }) : t('rv.none')} className={`${btn} bg-quiz-blue`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ChalkboardTeacher weight="bold" size={24} />{t('rv.short')}{missed.length > 0 && <span className="ml-1 min-w-7 h-7 px-1.5 rounded-full bg-surface border-[2px] border-border text-base flex items-center justify-center">{missed.length}</span>}
            </button>
            <button type="button" onClick={() => setView('rate')} className={`${btn} bg-quiz-green`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <Smiley weight="bold" size={24} />{t('rv.rate')}
            </button>
            {missed.length === 0 && <p className="col-span-2 text-sm font-bold text-center text-muted">{t('rv.none')}</p>}
          </div>
        ) : (
          <div className="grid gap-2">
            <GameReview onDone={() => setView('main')} />
            <button type="button" onClick={() => setView('main')} className="justify-self-center min-h-11 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold">{t('rv.back')}</button>
          </div>
        )}
      </motion.div>
      {reviewing && missed.length > 0 && <ReviewScreen missed={missed} onClose={() => setReviewing(false)} />}
    </div>
  );
}
