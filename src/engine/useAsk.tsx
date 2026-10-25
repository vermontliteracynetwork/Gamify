import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { data, newId } from '../data';
import type { MultipleChoiceQuestion, QuestionLogEntry } from '../data/types';
import type { PlayMode } from '../games/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { makeDeck, reviewKeys, type PoolSet } from './picker';
import QuestionScreen, { type AnswerResult } from './QuestionScreen';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';
import { liveAnswered, liveAsked } from '../live/session';

export interface AskOptions { count?: number; player?: string }

interface Active {
  question: MultipleChoiceQuestion;
  setId?: string;
  n: number;
  total: number;
  player?: string;
  resolve: (completed: boolean) => void;
}

// Fast wrong taps in a row mean guessing: 4 misses, each under 3 seconds,
// all within 90 seconds (question engine section 3).
export function isGuessing(history: { at: number; ms: number; right: boolean }[]): boolean {
  const last = history.slice(-4);
  return last.length === 4 && last.every((h) => !h.right && h.ms < 3000) && last[3].at - last[0].at <= 90_000;
}

// The one hook games use to ask questions. A game calls `await ask()` (or
// ask({ count: 3 }) for a 3-question break) and renders `element` once. The
// promise resolves true after the right answers, false if the student left.
export function useAsk({ gameId, mode, pool, classroomId, studentId }: {
  gameId: string; mode: PlayMode; pool: PoolSet[]; classroomId?: string; studentId?: string;
}) {
  const [active, setActive] = useState<Active | null>(null);
  const [breathing, setBreathing] = useState(false);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const [stats, setStats] = useState({ asked: 0, right: 0, firstTry: 0 });
  const history = useRef<{ at: number; ms: number; right: boolean }[]>([]);
  const lastId = useRef<string>();
  const missedThis = useRef(false);

  // A signed-in student's missed questions from earlier days come back for review.
  const [review, setReview] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!studentId) return;
    void data.listQuestionLog({ studentId }).then((log) => setReview(reviewKeys(log)));
  }, [studentId]);
  const deck = useMemo(() => makeDeck(pool, Math.random, review), [pool, review]);
  const next = useCallback((avoid?: string) => {
    const drawn = deck.next(avoid);
    lastId.current = drawn.question.id;
    missedThis.current = false;
    return drawn;
  }, [deck]);

  const ask = useCallback((opts: AskOptions = {}) => new Promise<boolean>((resolve) => {
    const drawn = next(lastId.current);
    liveAsked();
    setActive({ question: drawn.question, setId: drawn.setId, n: 1, total: Math.max(1, opts.count ?? 1), player: opts.player, resolve });
  }), [next]);

  function log(a: Active, r: AnswerResult | null, outcome: QuestionLogEntry['outcome']) {
    void data.logQuestion({
      id: newId('log'), at: new Date().toISOString(), classroomId, studentId, teamName: a.player, gameId, mode, setId: a.setId,
      prompt: a.question.prompt, answer: a.question.choices[a.question.correctIndex], tries: r ? r.tries : [], ms: r?.ms ?? 0, outcome,
    });
  }

  function onAnswer(r: AnswerResult) {
    if (!active) return;
    log(active, r, r.right ? 'right' : 'skipped');
    liveAnswered(r.right);
    history.current.push({ at: Date.now(), ms: r.ms, right: r.right });
    setStats((s) => ({ asked: s.asked + 1, right: s.right + (r.right ? 1 : 0), firstTry: s.firstTry + (r.right && !missedThis.current ? 1 : 0) }));

    if (r.right) {
      if (active.n >= active.total) { active.resolve(true); setActive(null); return; }
      const drawn = next(active.question.id);
      setActive({ ...active, question: drawn.question, setId: drawn.setId, n: active.n + 1 });
      return;
    }
    // A miss never costs anything: note it for "Let's look back", then a new question.
    missedThis.current = true;
    setMissed((m) => (m.some((x) => x.id === active.question.id) ? m : [...m, active.question]));
    if (isGuessing(history.current)) { history.current = []; setBreathing(true); }
    const drawn = next(active.question.id);
    setActive({ ...active, question: drawn.question, setId: drawn.setId });
  }

  function onClose() {
    if (!active) return;
    log(active, null, 'left');
    active.resolve(false);
    setActive(null);
  }

  const element: ReactNode = breathing ? <BreathBreak onDone={() => setBreathing(false)} /> : active ? (
    <QuestionScreen
      question={active.question}
      progress={{ n: active.n, total: active.total }}
      player={active.player}
      onAnswer={onAnswer}
      onClose={onClose}
    />
  ) : null;

  return { ask, element, missed, stats, asking: active !== null };
}

function BreathBreak({ onDone }: { onDone: () => void }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('q.breathTitle')}>
      <DialogFocus />
      <div className="w-full max-w-md bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-4 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <h2 className="font-display text-3xl font-bold"><Title text={t('q.breathTitle')} /></h2>
        <motion.div
          className="w-32 h-32 rounded-full bg-quiz-blue border-[2.5px] border-border"
          animate={still ? undefined : { scale: [0.7, 1.1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <p className="font-bold">{t('q.breathBody')}</p>
        <button type="button" onClick={onDone} className="min-h-12 px-6 rounded-pill border-[2px] border-border bg-accent font-bold">{t('q.breathDone')}</button>
      </div>
    </div>
  );
}
