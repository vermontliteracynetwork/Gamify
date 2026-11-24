import type { ReactNode } from 'react';
import { POP_IN } from './pace';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowCounterClockwise, CaretLeft, CaretRight, ChalkboardTeacher, CheckCircle, Eye, Flag, Flask, SquaresFour, Smiley, SmileyMeh, SmileySad, SpeakerHigh, Star, X } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { saveCheckIn } from '../beta/surveys';
import BetaGameForm from '../beta/BetaGameForm';
import { useBetaTester } from '../beta/tester';
import { data, newId } from '../data';
import { getGame } from '../games/registry';
import { getSession } from '../student/session';
import type { StringKey } from '../i18n/en';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import type { MultipleChoiceQuestion } from '../data/types';
import { useSettings } from '../settings/SettingsContext';
import { speak } from './feedback';
import { TeamBadge } from './TeamBadge';
import { TellGamify } from '../ui/TellGamify';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';

// The end-of-game rating (owner, 2026-11-24: "all student feedback will be a
// three face tap. comment text field is optional"). Faces first (only counts
// are kept), then an optional comment, typed or spoken with the keyboard's
// microphone. A comment goes to the owner's Feedback as a beta report, never
// with a name. Sits behind the Rate game button.
const FEEL = [Smiley, SmileyMeh, SmileySad];
const COLORS = ['#ddfcc6', '#fdfd94', '#ed9d75'];
function GameReview({ onDone }: { onDone: () => void }) {
  const [feel, setFeel] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const gameId = useLocation().pathname.split('/')[2];
  if (done) return <p className="font-bold text-center" role="status">{t('review.thanks')}</p>;
  function pick(i: number) {
    const oneHot = (n: number) => [0, 1, 2].map((k) => (k === n ? 1 : 0)) as [number, number, number];
    void saveCheckIn({ at: new Date().toISOString(), classroomId: getSession()?.classroomId ?? '', gameId, feel: oneHot(i), level: [0, 0, 0] });
    setFeel(i);
  }
  function finish() {
    const text = comment.trim();
    if (text && feel !== null) {
      void data.sendFeedback({ id: newId('fb'), at: new Date().toISOString(), kind: 'beta', role: getSession() ? 'student' : 'teacher', where: `/play/${gameId}`, device: navigator.userAgent,
        details: `Student rating: ${getGame(gameId)?.name ?? gameId}, ${t(`checkin.feel.${feel}` as StringKey)}. Comment: ${text}`.slice(0, 1000) });
    }
    setDone(true);
    window.setTimeout(onDone, 1400);
  }
  if (feel === null) return (
    <div className="grid gap-2 justify-items-center rounded-input border-std border-border-soft p-3">
      <p className="font-bold">{t('review.feel')}</p>
      <div className="flex gap-2">
        {FEEL.map((I, i) => (
          <button key={i} type="button" onClick={() => pick(i)} aria-label={t(`checkin.feel.${i}` as StringKey)}
            className="w-16 h-16 rounded-full border-bold border-border flex items-center justify-center active:scale-90" style={{ background: COLORS[i] }}>
            <I weight="fill" size={34} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <form className="grid gap-2 rounded-input border-std border-border-soft p-3" onSubmit={(e) => { e.preventDefault(); finish(); }}>
      <label className="grid gap-1 font-bold">{t('review.comment')}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={600} className="w-full px-3 py-2 rounded-input border-std border-border font-semibold resize-none" />
      </label>
      <p className="text-sm font-semibold text-muted m-0">{t('review.commentHint')}</p>
      <div className="flex justify-center gap-2">
        <button type="submit" className="min-h-12 px-6 rounded-input border-bold border-border bg-accent font-display text-lg">{comment.trim() ? t('review.send') : t('review.skip')}</button>
      </div>
    </form>
  );
}

// THE winner box (Brand Kit game components, teacher 2026-11-24): the winner's
// icon (no circle, no podium, no stat chips) in THE turn glow, the spinning
// sun rays and the breathing halo; a tie shows each winner. Solo games show a
// star.
function WinnerStage({ winners }: { winners?: { name: string; colorIndex: number; art?: string }[] }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const list = winners?.length ? winners : null;
  const size = list && list.length > 2 ? 104 : 150;
  return (
    <div className="relative w-full mx-auto h-[15rem] select-none overflow-hidden grid place-items-center" aria-hidden="true">
      <span className="turn-rays absolute left-1/2 top-1/2 w-[26rem] h-[26rem] -ml-[13rem] -mt-[13rem] rounded-full pointer-events-none" />
      <span className="turn-halo absolute left-1/2 top-1/2 w-[17rem] h-[17rem] -ml-[8.5rem] -mt-[8.5rem] rounded-full pointer-events-none" />
      <div className="relative flex justify-center gap-4">
        {(list ?? [null]).map((w, i) => (
          <motion.span key={i} className="grid place-items-center"
            animate={still ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
            {w?.art ? <img src={w.art} alt="" className="object-contain" style={{ width: size, height: size }} />
              : w ? <TeamBadge colorIndex={w.colorIndex} size={size} />
              : <Star weight="fill" size={size * 0.8} color="var(--lemon)" style={{ filter: 'drop-shadow(0 3px 0 var(--color-border))' }} />}
          </motion.span>
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
    <div className="brand-menu fixed inset-0 z-[60] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label={t('rv.title')}>
      <DialogFocus onClose={onClose} />
      <div className="flex items-center gap-3 px-4 sm:px-8 py-3 border-b-[2.5px] border-border bg-surface">
        <ChalkboardTeacher weight="fill" size={30} aria-hidden="true" />
        <h2 className="title-bubble text-2xl flex-1" style={{ color: 'var(--text)' }}><Title text={t('rv.title')} /></h2>
        <span className="font-bold tabular-nums">{t('q.progress', { n: i + 1, total: missed.length })}</span>
        <button type="button" onClick={onClose} aria-label={t('class.close')} className="w-12 h-12 rounded-full border-bold border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={24} /></button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 grid gap-5">
          <p className="font-bold text-muted">{t(shown ? 'rv.afterTip' : 'rv.tip')}</p>
          <div className="flex items-start gap-3">
            <h3 className="font-body text-4xl sm:text-5xl font-bold leading-tight flex-1 text-balance">{q.prompt}</h3>
            <button type="button" aria-label={`${t('q.listen')}: ${q.prompt}`} onClick={() => speak(`${q.prompt}. ${q.choices.join('. ')}`, settings)}
              className="w-14 h-14 shrink-0 rounded-full border-bold border-border bg-surface flex items-center justify-center"><SpeakerHigh weight="bold" size={26} /></button>
          </div>
          {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[30dvh] w-auto mx-auto rounded-input border-std border-border-soft" />}
          <ol className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
            {q.choices.map((c, k) => {
              const right = shown && k === q.correctIndex;
              return (
                <li key={k} className={`min-h-20 px-4 py-3 rounded-input border-heavy border-border flex items-center gap-3 font-bold text-2xl sm:text-3xl bg-surface ${shown && !right ? 'opacity-40' : ''} ${right ? 'ring-[6px] ring-success' : ''}`}
                  style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <span className="w-12 h-12 shrink-0 rounded-full bg-surface-2 border-bold border-border flex items-center justify-center font-display text-2xl">
                    {right ? <CheckCircle weight="fill" size={30} aria-label={t('q.rightMark')} /> : String.fromCharCode(65 + k)}
                  </span>
                  <span className="min-w-0">{c}</span>
                </li>
              );
            })}
          </ol>
          <AnimatePresence>
            {shown && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="justify-self-start inline-flex items-center gap-2 font-display text-2xl font-bold px-4 py-2 rounded-input bg-success/40 border-bold border-border" role="status">
                <CheckCircle weight="fill" size={28} />{t('look.rightAnswer', { answer })}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 border-t-[2.5px] border-border bg-surface">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className="min-h-11 px-5 rounded-pill border-bold border-border bg-surface-2 font-bold inline-flex items-center gap-2 disabled:opacity-40"><CaretLeft weight="bold" size={22} />{t('look.prev')}</button>
        {!shown
          ? <button type="button" onClick={() => setShown(true)} className="min-h-11 px-7 rounded-pill border-bold border-border bg-accent font-display text-lg font-bold inline-flex items-center gap-2" style={{ boxShadow: '0 3px 0 #000' }}><Eye weight="bold" size={24} />{t('rv.show')}</button>
          : i < missed.length - 1
            ? <button type="button" onClick={() => go(i + 1)} className="min-h-11 px-7 rounded-pill border-bold border-border bg-accent font-display text-lg font-bold inline-flex items-center gap-2" style={{ boxShadow: '0 3px 0 #000' }}>{t('look.next')}<CaretRight weight="bold" size={22} /></button>
            : <button type="button" onClick={onClose} className="min-h-11 px-7 rounded-pill border-bold border-border bg-accent font-display text-xl font-bold" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('rv.done')}</button>}
        <span className="w-24" aria-hidden="true" />
      </div>
    </div>
  );
}

// End-of-game results in a box over the game, so the screen never scrolls
// (teacher, 2026-10-31): the winner on a stage, the headline in the Gamify
// font, and four buttons: Play again, New game, Review and Rate game
// (teacher, 2026-10-31: no "Arcade" button).
export default function ResultsModal({ title, children, missed, againLabel, onAgain, winners }: {
  title: string; children?: ReactNode; missed: MultipleChoiceQuestion[]; againLabel: string; onAgain: () => void;
  // Share games: the winning team or teams, shown floating over the stage.
  winners?: { name: string; colorIndex: number; art?: string }[];
}) {
  const { settings } = useSettings();
  const { student } = useSignedIn();
  const [view, setView] = useState<'main' | 'rate' | 'beta' | 'report'>('main');
  const betaTester = useBetaTester();
  const gameId = useLocation().pathname.split('/')[2];
  const [reviewing, setReviewing] = useState(false);
  const btn = 'min-h-12 px-3 rounded-input border-bold border-border font-display text-base font-bold inline-flex items-center justify-center gap-1.5 no-underline text-text disabled:opacity-40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:transition-transform min-h-14 text-lg';
  return (
    <div className="results-box brand-menu fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      {!reviewing && <DialogFocus />}
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP_IN}
        className="w-full max-w-xl bg-surface border-heavy border-border rounded-panel grid gap-4 overflow-y-auto overflow-x-hidden" style={{ boxShadow: '0 8px 0 #000, 0 30px 60px rgba(36,28,61,0.35)', maxHeight: 'calc(100dvh - 2rem)' }}>
        {/* THE winner box (Brand Kit, 2026-11-24): the title, the winner in the glow,
            then only the score centered under it, then the buttons. */}
        <div className="grid justify-items-center gap-1 text-center px-5 pt-6">
          <h2 className="title-bubble text-4xl text-balance" style={{ color: 'var(--text)' }}><Title text={title} /></h2>
          <WinnerStage winners={winners} />
          {children}
        </div>
        {view === 'main' ? (
          <div className="grid grid-cols-2 gap-3 px-5 pb-5">
            <button type="button" onClick={onAgain} className={`${btn} bg-accent`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ArrowCounterClockwise weight="bold" size={18} />{againLabel}
            </button>
            {/* Students reach games only with a code (teacher, 2026-10-31). */}
            <Link to={student ? '/join' : '/play'} className={`${btn} bg-surface-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <SquaresFour weight="bold" size={18} />{student ? t('results.newCode') : t('results.arcadeShort')}
            </Link>
            <button type="button" onClick={() => setReviewing(true)} disabled={missed.length === 0}
              aria-label={missed.length ? t('rv.button', { count: missed.length }) : t('rv.none')} className={`${btn} bg-quiz-blue`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ChalkboardTeacher weight="bold" size={18} />{t('rv.short')}{missed.length > 0 && <span className="ml-1 min-w-7 h-7 px-1.5 rounded-full bg-surface border-std border-border text-base flex items-center justify-center">{missed.length}</span>}
            </button>
            <button type="button" onClick={() => setView('rate')} className={`${btn} bg-quiz-green`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <Smiley weight="bold" size={24} />{t('rv.rate')}
            </button>
            {betaTester && !student && (
              <button type="button" onClick={() => setView('beta')} className={`${btn} bg-secondary col-span-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <Flask weight="bold" size={20} />{t('bform.open')}
              </button>
            )}
            {missed.length === 0 && <p className="col-span-2 text-sm font-bold text-center text-muted">{t('rv.none')}</p>}
            {/* Report, for everyone (owner, 2026-11-24). */}
            <button type="button" onClick={() => setView('report')} className="col-span-2 justify-self-center min-h-11 px-4 rounded-pill border-std border-border bg-surface-2 font-bold inline-flex items-center gap-1.5">
              <Flag weight="bold" size={18} />{t('report.open')}
            </button>
          </div>
        ) : (
          <div className="grid gap-2 px-5 pb-5">
            {view === 'beta' ? <BetaGameForm gameId={gameId} onDone={() => setView('main')} /> : view === 'report' ? <TellGamify role={student ? 'student' : 'teacher'} context={gameId} bare /> : <GameReview onDone={() => setView('main')} />}
            <button type="button" onClick={() => setView('main')} className="justify-self-center min-h-11 px-5 rounded-pill border-std border-border bg-surface-2 font-bold">{t('rv.back')}</button>
          </div>
        )}
      </motion.div>
      {reviewing && missed.length > 0 && <ReviewScreen missed={missed} onClose={() => setReviewing(false)} />}
    </div>
  );
}

