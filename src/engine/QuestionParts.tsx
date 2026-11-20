import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { ANSWER_SOUNDS, playClip } from './music';
import { buzz } from './feedback';
import PopText from '../ui/PopText';

// The parts of every question screen (teacher, 2026-11-20: "question screens
// need to be universally for all games. the same text effects, sounds,
// colors, design"). QuestionScreen (one device) and ShareQuestion (the shared
// screen) both build from these, so the prompt, the four answer tiles, the
// sounds, the result words and the OK button look and feel the same in
// every game. Sizes are a step smaller than before (2026-11-20), and answers
// can be tapped right away (no faded wait). Tiles are twice as deep as
// that (teacher, 2026-11-20: "double the depth of the current answer fields").

export const LETTERS = ['A', 'B', 'C', 'D'];
export const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

// One sound and buzz for every answer, in every game (a theme's Advanced
// audio can still swap them, inside playClip).
export function answerFeedback(right: boolean, settings: ReturnType<typeof useSettings>['settings']) {
  playClip(right ? ANSWER_SOUNDS.right : ANSWER_SOUNDS.wrong, settings);
  buzz(right ? 30 : [20, 60, 20], settings);
}

export function QuestionPrompt({ children }: { children: ReactNode }) {
  return <h2 className="w-full text-left font-body font-bold leading-snug text-balance text-fit-question">{children}</h2>;
}

export function AnswerGrid({ children }: { children: ReactNode }) {
  return <div className="w-full grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-[clamp(0.5rem,1.6vh,1rem)]">{children}</div>;
}

export type TileState = 'open' | 'right' | 'wrong' | 'tried' | 'faded';

export function AnswerTile({ index, text, image, imageAlt, state, onClick, disabled, extra, magnet }: {
  index: number; text: string; image?: string | null; imageAlt?: string; state: TileState; onClick: () => void; disabled?: boolean; extra?: ReactNode; magnet?: boolean;
}) {
  const still = useSettings().settings.motion === 'still';
  const live = state === 'open' && !disabled && !still;
  return (
    <motion.button type="button" onClick={onClick} aria-disabled={disabled || state !== 'open'} data-magnet={magnet ? 'true' : undefined}
      animate={still ? undefined : state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : state === 'right' ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ duration: 0.4 }}
      whileHover={live ? { scale: 1.02, transition: { duration: 0.15 } } : undefined}
      whileTap={live ? { scale: 0.97 } : undefined}
      className={`relative min-h-[clamp(5.5rem,16vh,9.5rem)] pl-[calc(clamp(0.6rem,1.4vw,1.1rem)+clamp(2rem,5.5vh,3rem)+0.75rem)] pr-[clamp(0.75rem,2vw,1.75rem)] py-[clamp(0.35rem,1.2vh,0.75rem)] rounded-input border-bold border-border font-bold leading-tight text-left text-fit-answer flex items-center gap-3
        ${TILE_COLORS[index]} motion-safe:transition-opacity motion-safe:duration-300
        ${state === 'right' ? 'ring-4 ring-success' : ''} ${state === 'wrong' ? 'ring-4 ring-danger' : ''} ${state === 'tried' ? 'opacity-35 line-through' : ''} ${state === 'faded' ? 'opacity-45' : ''} ${magnet && state === 'open' ? 'ring-4 ring-accent' : ''}`}
      style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="absolute left-[clamp(0.6rem,1.4vw,1.1rem)] top-1/2 -translate-y-1/2 w-[clamp(2rem,5.5vh,3rem)] h-[clamp(2rem,5.5vh,3rem)] rounded-full bg-surface border-std border-border flex items-center justify-center font-display text-[clamp(0.95rem,2.6vh,1.4rem)]">
        {state === 'right' ? <Check weight="bold" size={20} aria-label={t('q.rightMark')} /> : state === 'wrong' || state === 'tried' ? <X weight="bold" size={20} aria-label={t('q.notThisMark')} /> : LETTERS[index]}
      </span>
      {image && <img src={image} alt={imageAlt ?? ''} className="w-12 h-12 shrink-0 object-cover rounded-input border-std border-border bg-surface" />}
      <span className="sr-only"> </span>
      <span className="min-w-0 break-words">{text}</span>
      {extra}
    </motion.button>
  );
}

// The words after an answer, popping in the same way everywhere.
export function ResultLine({ text, right, popKey }: { text: string; right: boolean; popKey: string }) {
  return (
    <p className="min-h-9 font-display text-2xl font-bold text-center" role="status" aria-live="polite">
      {text && <PopText key={popKey} text={text} gold={right} />}
    </p>
  );
}

export function OkButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" autoFocus onClick={onClick}
      className="justify-self-center self-center min-h-12 px-10 rounded-pill border-bold border-border bg-accent font-display text-xl font-bold motion-safe:hover:scale-105 motion-safe:active:scale-[0.97] motion-safe:transition-transform"
      style={{ boxShadow: '0 4px 0 #000' }}>{t('q.continue')}</button>
  );
}
