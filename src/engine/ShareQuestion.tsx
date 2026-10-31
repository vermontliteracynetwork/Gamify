import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, SpeakerHigh, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, speak } from './feedback';
import { shuffleChoices } from './questions';
import { TeamBadge } from './TeamBadge';
import { CPU_ACCURACY, type CpuLevel, type TurnPlayer } from './turns';
import DialogFocus from '../ui/DialogFocus';
import { mirrorSend } from '../live/mirror';

const LETTERS = ['A', 'B', 'C', 'D'];
const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

// The Share-mode question: big enough to read from the back of the room.
// The team taps its answer (multiple choice, like the Independent Work
// Dashboard; teacher, 2026-10-24) and it checks itself: one tap a turn, and
// a miss shows the right answer. On the computer's turn it "answers" by its
// level; it never answers for students.
export default function ShareQuestion({ question, player, cpuLevel, onResult, chance }: {
  question: MultipleChoiceQuestion; player: TurnPlayer; cpuLevel: CpuLevel; onResult: (right: boolean) => void;
  // Which try this is, when a game gives more than one (Game Show: 3).
  chance?: { n: number; total: number };
}) {
  const { settings } = useSettings();
  const q = useMemo(() => shuffleChoices(question), [question]);
  const [shown, setShown] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [cpu, setCpu] = useState<'thinking' | 'right' | 'miss' | null>(player.kind === 'cpu' ? 'thinking' : null);

  // Share Mirror: the student's own copy shows this question.
  useEffect(() => {
    mirrorSend({ t: 'q', prompt: q.prompt, choices: q.choices, player: player.name, imageUrl: q.imageUrl, imageAlt: q.imageAlt });
    return () => mirrorSend({ t: 'clear' });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (shown) mirrorSend({ t: 'result', picked, correct: q.correctIndex, right: picked === q.correctIndex || cpu === 'right' }); }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (player.kind !== 'cpu') return;
    const right = Math.random() < CPU_ACCURACY[cpuLevel];
    const a = window.setTimeout(() => { setCpu(right ? 'right' : 'miss'); setShown(true); playEffect(right ? 'right' : 'miss', settings); }, 1800);
    const b = window.setTimeout(() => onResult(right), 3600);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i: number) {
    if (picked !== null || cpu) return;
    const right = i === q.correctIndex;
    setPicked(i); setShown(true);
    playEffect(right ? 'right' : 'miss', settings);
    window.setTimeout(() => onResult(right), settings.motion === 'still' ? 900 : right ? 1300 : 2200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl max-h-full overflow-y-auto bg-surface border-[3px] border-border rounded-panel p-6 grid gap-5"
        style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <TeamBadge colorIndex={player.colorIndex} size={48} />
          <span className="grid">
            <span className="font-display text-3xl font-bold">{t('share.whoseTurn', { name: player.name })}</span>
            {player.members && <span className="font-bold text-muted">{player.members.join(', ')}</span>}
          </span>
          <span className="flex-1" />
          {chance && chance.total > 1 && (
            <span className="inline-flex items-center gap-1.5 font-bold" aria-label={t('share.chance', { n: chance.n, total: chance.total })}>
              {Array.from({ length: chance.total }, (_, k) => <span key={k} aria-hidden="true" className={`w-4 h-4 rounded-full border-[2px] border-border ${k < chance.n - 1 ? 'bg-danger/70' : k === chance.n - 1 ? 'bg-accent' : 'bg-surface'}`} />)}
              <span className="ml-1">{t('share.chance', { n: chance.n, total: chance.total })}</span>
            </span>
          )}
          <button type="button" onClick={() => speak(`${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`, settings)}
            className="min-h-12 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2">
            <SpeakerHigh weight="bold" size={22} />{t('q.listen')}
          </button>
        </div>

        {player.kind === 'teacher' && <p className="font-bold text-xl">{t('share.teacherTurn')}</p>}

        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[min(16rem,22dvh)] w-auto mx-auto rounded-input border-[2px] border-border-soft" />}
        <h2 className="font-body text-4xl sm:text-5xl font-bold leading-tight text-balance">{q.prompt}</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {q.choices.map((c, i) => {
            const isRight = shown && i === q.correctIndex;
            const isWrong = picked === i && i !== q.correctIndex;
            return (
              <motion.button key={i} type="button" onClick={() => choose(i)} disabled={picked !== null || !!cpu}
                animate={isWrong && settings.motion !== 'still' ? { x: [0, -8, 8, -5, 5, 0] } : isRight && picked === i && settings.motion !== 'still' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`min-h-20 px-4 py-3 rounded-input border-[3px] border-border flex items-center gap-3 font-bold text-2xl sm:text-3xl text-left active:scale-[0.98] disabled:cursor-default
                ${TILE_COLORS[i]} ${shown && !isRight && !isWrong ? 'opacity-40' : ''} ${isRight ? 'ring-[5px] ring-success' : ''} ${isWrong ? 'ring-[5px] ring-danger' : ''}`}
                style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-12 h-12 shrink-0 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center font-display text-2xl">
                  {isRight ? <Check weight="bold" size={26} aria-label={t('q.rightMark')} /> : isWrong ? <X weight="bold" size={26} aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
                {q.choiceImages?.[i] && <img src={q.choiceImages[i]!} alt={q.choiceAlts?.[i] ?? ''} className="w-14 h-14 shrink-0 object-cover rounded-input border-[2px] border-border bg-surface" />}
                <span className="sr-only"> </span>
                <span className="min-w-0 break-words">{c}</span>
              </motion.button>
            );
          })}
        </div>

        {cpu ? (
          <p className="font-display text-3xl font-bold text-center" role="status" aria-live="polite">
            {cpu === 'thinking' ? t('share.cpuThinking') : cpu === 'right' ? t('share.cpuRight') : t('share.cpuMiss')}
          </p>
        ) : (
          <p className="min-h-10 font-display text-3xl font-bold text-center" role="status" aria-live="polite">
            {picked === null ? '' : picked === q.correctIndex ? t('share.tapRight') : chance && chance.n < chance.total ? t('share.tryAnother') : t('share.tapMiss')}
          </p>
        )}
      </motion.div>
    </div>
  );
}
