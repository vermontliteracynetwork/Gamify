import { useEffect, useMemo, useRef, useState } from 'react';
import { pace, POP_IN } from './pace';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { Check, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import Gif from '../ui/Gif';
import { useSettings } from '../settings/SettingsContext';
import { buzz, speakQuestion, stopSpeaking } from './feedback';
import { ANSWER_SOUNDS, playClip } from './music';
import { shuffleChoices } from './questions';
import { GearButton, SettingsPanel } from '../settings/SettingsPanel';
import DialogFocus from '../ui/DialogFocus';

import { answerScale, BADGE_COLORS, LETTERS, qfpx as fpx, qpx as px, qStep, TILE_COLORS } from './questionCard';

export interface AnswerResult { tapped: string; tries: string[]; right: boolean; ms: number }

// The one question screen every game uses (question engine section 3):
// read first, shuffled answers, one try, a short right moment, and after a
// miss a new question arrives without showing the answer.
// `framed` (Question Tracker, teacher 2026-10-31): a smaller card set into
// the game's scene, with no dark cover, so the background is the frame.
export default function QuestionScreen({ question, progress, player, onAnswer, framed = false }: {
  question: MultipleChoiceQuestion;
  framed?: boolean;
  progress?: { n: number; total: number };
  player?: string;
  onAnswer: (r: AnswerResult) => void;
  // Kept for callers; the question card has no close button now (teacher, 2026-11-24).
  onClose?: () => void;
}) {
  const { settings } = useSettings();
  const reduce = useReducedMotion() || settings.motion === 'still';
  const q = useMemo(() => (settings.shuffleAnswers ? shuffleChoices(question) : question), [question, settings.shuffleAnswers]);
  const shownAt = useRef(Date.now());
  const [locked, setLocked] = useState(settings.readFirstSeconds > 0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongTries, setWrongTries] = useState<number[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    shownAt.current = Date.now();
    setPicked(null);
    setWrongTries([]);
    setMarked(new Set());
    setLocked(settings.readFirstSeconds > 0);
    const timer = window.setTimeout(() => setLocked(false), settings.readFirstSeconds * 1000);
    // Little readers hear every question and its answers on their own.
    const say = settings.autoRead ? window.setTimeout(() => speakQuestion(q, settings), 350) : 0;
    return () => { window.clearTimeout(timer); window.clearTimeout(say); stopSpeaking(); };
  }, [q, settings.readFirstSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  function listen() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = `${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`;
    speakQuestion(q, settings);
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), Math.min(15000, text.length * 90));
  }

  function choose(i: number) {
    if (locked || picked !== null || wrongTries.includes(i)) return;
    const right = i === q.correctIndex;
    playClip(right ? ANSWER_SOUNDS.right : ANSWER_SOUNDS.wrong, settings);
    buzz(right ? 30 : [20, 60, 20], settings);
    const tries = [...wrongTries.map((k) => q.choices[k]), q.choices[i]];
    // Extra tries (a teacher accommodation): a miss with tries left greys
    // out that answer and lets the student pick again.
    if (!right && wrongTries.length + 1 < settings.triesPerQuestion) {
      setWrongTries((w) => [...w, i]);
      return;
    }
    setPicked(i);
    const ms = Date.now() - shownAt.current;
    window.setTimeout(() => onAnswer({ tapped: q.choices[i], tries, right, ms }), (right ? 900 : 1400) * pace(settings));
  }

  const words = q.prompt.split(/(\s+)/);
  const ansK = answerScale(q.choices);

  return (
    // One card over the game, the game still showing around it (teacher,
    // 2026-11-24: "the question card is a bit smaller so more theme background
    // shows around it"); `framed` games (their scene is the frame) skip the dim.
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 ${framed ? '' : 'bg-[rgba(29,26,51,0.28)]'}`} role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={reduce ? false : { scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={POP_IN}
        className={`q-card ${framed ? "q-framed" : ""} max-w-full max-h-full overflow-y-auto bg-white border-heavy border-border flex flex-col`}
        style={{ width: px('--q-w'), padding: px('--q-pad'), gap: px('--q-gap-y'), borderRadius: px('--q-radius'), boxShadow: '0 6px 0 var(--ink)' }}
      >
        <div className="flex flex-wrap items-center" style={{ gap: px('--q-gap') }}>
          <span className="flex-1 min-w-[9rem] flex items-center gap-2 flex-wrap">
            {player && <b className="font-heading leading-tight line-clamp-2" style={{ fontSize: fpx('--q-name') }}>{t('q.turn', { name: player })}</b>}
            {progress && progress.total > 1 && (
              <span className="px-3 min-h-8 inline-flex items-center rounded-pill bg-surface-2 border-std border-border font-bold text-sm">
                {t('q.progress', progress)}
              </span>
            )}
          </span>
          {/* Only Settings and Listen on a question; accessibility lives inside Settings (teacher, 2026-11-24). */}
          <GearButton small onClick={() => setSettingsOpen(true)} />
          {settings.tools.listen && <button type="button" onClick={listen} className="shrink-0 px-[1em] rounded-pill border-std border-border bg-blue-crystal font-bold inline-flex items-center gap-1.5 active:scale-95"
            style={{ minHeight: `max(2.75rem, ${px('--q-btn')})`, fontSize: `max(1rem, ${fpx('--q-btn-fs')})`, boxShadow: '0 3px 0 var(--ink)' }}>
            {speaking ? <SpeakerSlash weight="bold" size="1.15em" /> : <SpeakerHigh weight="bold" size="1.15em" />}
            {speaking ? t('q.stop') : t('q.listen')}
          </button>}
        </div>

        {/* A fixed block for the question (Universal views 10), its text left aligned. */}
        <div className={`shrink-0 flex ${q.imageUrl ? "flex-col justify-center items-start gap-2" : "items-center"} min-h-0 overflow-y-auto`} style={{ height: px('--q-block') }}>
          {q.imageUrl && <figure className="m-0 min-h-0 h-[55%] shrink-0 flex flex-col items-start"><Gif src={q.imageUrl} still={q.imageStill} alt={q.imageAlt ?? ''} className="min-h-0 flex-1 w-auto max-w-full object-contain rounded-input border-std border-border-soft" />{q.imageCredit && <figcaption className="text-[10px] font-semibold text-muted">{q.imageCredit}</figcaption>}</figure>}
          <h2 className="font-body font-bold leading-snug text-left text-pretty" style={{ fontSize: fpx(qStep(q.prompt.length + (q.imageUrl ? 40 : 0))) }}>
            {words.map((w, i) => <span key={i} className={marked.has(i) ? 'bg-butter rounded px-0.5' : ''}>{w}</span>)}
          </h2>
        </div>

        {locked && (
          <div className="grid gap-1 -my-1" aria-live="polite">
            <span className="font-bold text-sm">{t('q.readFirst')}</span>
            <div className="h-2.5 rounded-pill bg-surface-2 overflow-hidden border border-border-soft">
              <motion.div className="h-full bg-orange" initial={{ width: '100%' }} animate={{ width: '0%' }}
                transition={{ duration: settings.readFirstSeconds, ease: 'linear' }} />
            </div>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(var(--q-cols), minmax(0, 1fr))', gap: px('--q-gap') }}>
          {q.choices.map((c, i) => {
            const triedWrong = wrongTries.includes(i);
            const isPicked = picked === i;
            const right = isPicked && i === q.correctIndex;
            const wrong = isPicked && i !== q.correctIndex;
            return (
              <motion.button
                key={`${q.id}-${i}`}
                type="button"
                onClick={() => choose(i)}
                aria-disabled={locked || picked !== null || triedWrong}
                initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                animate={reduce ? { scale: 1, opacity: 1 } : wrong ? { x: [0, -6, 6, -4, 4, 0], scale: 1, opacity: 1 } : right ? { scale: [1, 1.05, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={wrong || right ? { duration: 0.4 } : { type: 'spring', stiffness: 420, damping: 22, delay: 0.08 + i * 0.05 }}
                className={`relative min-w-0 border-heavy border-border font-bold flex items-center text-left leading-tight motion-safe:hover:enabled:-translate-y-0.5
                            ${right ? 'bg-mint' : TILE_COLORS[i]} ${locked ? 'opacity-55' : ''} ${picked !== null && !isPicked ? 'opacity-45' : ''}
                            ${right ? 'ring-4 ring-success' : ''} ${wrong ? 'ring-4 ring-danger' : ''} ${triedWrong ? 'opacity-35 line-through' : ''}`}
                style={{ height: px('--q-tile'), gap: px('--q-gap'), padding: `0 ${px('--q-gap')}`, borderRadius: px('--q-tile-r'), fontSize: fpx('--q-tile-fs', ansK), boxShadow: '0 5px 0 var(--ink)' }}
              >
                <span className={`shrink-0 rounded-full border-heavy border-border flex items-center justify-center font-display ${right ? 'bg-kelly' : BADGE_COLORS[i]}`}
                  style={{ width: px('--q-badge'), height: px('--q-badge'), fontSize: fpx('--q-badge-fs') }}>
                  {right ? <Check weight="bold" size="0.8em" aria-label={t('q.rightMark')} /> : wrong || triedWrong ? <X weight="bold" size="0.8em" aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
                {q.choiceImages?.[i] && <img src={q.choiceImages[i]!} alt={q.choiceAlts?.[i] ?? ''} className="shrink-0 object-cover rounded-input border-std border-border bg-surface" style={{ width: px('--q-badge'), height: px('--q-badge') }} />}
                <span className="sr-only"> </span>
                <span className="min-w-0 line-clamp-2">{c}</span>
              </motion.button>
            );
          })}
        </div>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <p className="min-h-7 -mb-1 font-display text-xl font-bold text-center" role="status" aria-live="polite">
          {picked === null
            ? wrongTries.length ? `${t('q.tryAgain')} ${t('q.triesLeft', { count: settings.triesPerQuestion - wrongTries.length })}` : ''
            : picked === q.correctIndex ? t('q.right') : t('q.miss')}
        </p>
      </motion.div>
    </div>
  );
}
