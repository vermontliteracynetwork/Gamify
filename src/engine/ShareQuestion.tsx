import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Eye, SpeakerHigh, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, speak } from './feedback';
import { shuffleChoices } from './questions';
import { TeamBadge } from './TeamBadge';
import { CPU_ACCURACY, type CpuLevel, type TurnPlayer } from './turns';

const LETTERS = ['A', 'B', 'C', 'D'];
const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

// The Share-mode question: big enough to read from the back of the room.
// The class answers out loud or on whiteboards and the teacher taps Right
// or Not yet. On the computer's turn it "answers" by its level; it never
// answers for students.
export default function ShareQuestion({ question, player, cpuLevel, onResult }: {
  question: MultipleChoiceQuestion; player: TurnPlayer; cpuLevel: CpuLevel; onResult: (right: boolean) => void;
}) {
  const { settings } = useSettings();
  const q = useMemo(() => shuffleChoices(question), [question]);
  const [shown, setShown] = useState(false);
  const [cpu, setCpu] = useState<'thinking' | 'right' | 'miss' | null>(player.kind === 'cpu' ? 'thinking' : null);

  useEffect(() => {
    if (player.kind !== 'cpu') return;
    const right = Math.random() < CPU_ACCURACY[cpuLevel];
    const a = window.setTimeout(() => { setCpu(right ? 'right' : 'miss'); setShown(true); playEffect(right ? 'right' : 'miss', settings); }, 1800);
    const b = window.setTimeout(() => onResult(right), 3600);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function judge(right: boolean) {
    playEffect(right ? 'right' : 'miss', settings);
    onResult(right);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={q.prompt}>
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
          <button type="button" onClick={() => speak(`${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`, settings)}
            className="min-h-12 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2">
            <SpeakerHigh weight="bold" size={22} />{t('q.listen')}
          </button>
        </div>

        {player.kind === 'teacher' && <p className="font-bold text-xl">{t('share.teacherTurn')}</p>}

        <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-balance">{q.prompt}</h2>
        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-64 w-auto mx-auto rounded-input border-[2px] border-border-soft" />}

        <div className="grid sm:grid-cols-2 gap-3">
          {q.choices.map((c, i) => {
            const isRight = shown && i === q.correctIndex;
            return (
              <div key={i} className={`min-h-20 px-4 py-3 rounded-input border-[3px] border-border flex items-center gap-3 font-bold text-2xl sm:text-3xl
                ${TILE_COLORS[i]} ${shown && !isRight ? 'opacity-40' : ''} ${isRight ? 'ring-4 ring-success' : ''}`}>
                <span className="w-12 h-12 shrink-0 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center font-display text-2xl" aria-hidden="true">
                  {isRight ? <Check weight="bold" size={26} /> : LETTERS[i]}
                </span>
                <span className="min-w-0 break-words">{c}</span>
              </div>
            );
          })}
        </div>

        {cpu ? (
          <p className="font-display text-3xl font-bold text-center" role="status" aria-live="polite">
            {cpu === 'thinking' ? t('share.cpuThinking') : cpu === 'right' ? t('share.cpuRight') : t('share.cpuMiss')}
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => judge(true)} className="min-h-16 px-8 rounded-pill border-[3px] border-border bg-success font-display text-2xl font-bold inline-flex items-center gap-2 active:scale-95">
              <Check weight="bold" size={28} />{t('share.right')}
            </button>
            <button type="button" onClick={() => judge(false)} className="min-h-16 px-8 rounded-pill border-[3px] border-border bg-surface-2 font-display text-2xl font-bold inline-flex items-center gap-2 active:scale-95">
              <X weight="bold" size={28} />{t('share.notYet')}
            </button>
            <button type="button" onClick={() => setShown((v) => !v)} aria-pressed={shown} className="min-h-16 px-6 rounded-pill border-[3px] border-border bg-surface font-bold text-lg inline-flex items-center gap-2">
              <Eye weight="bold" size={24} />{t('share.showAnswer')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
