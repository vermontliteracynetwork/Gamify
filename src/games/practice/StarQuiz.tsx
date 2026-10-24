import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Star } from '@phosphor-icons/react';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { playEffect } from '../../engine/feedback';
import LookBack from '../../engine/LookBack';
import StartCard, { type RoundValues } from '../../engine/StartCard';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import type { GameManifest } from '../types';
import { pieceColor } from '../../theme/library';
import { ThemedPage, ThemePicker, useGameTheme } from '../../theme/useGameTheme';


export const starQuizManifest: GameManifest = {
  id: 'star-quiz',
  name: 'Star Quiz',
  description: 'Answer questions to fill the sky with stars.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Sky', width: 1600, height: 1000, hint: 'The sky behind the stars' },
    { id: 'star', label: 'Star', width: 128, height: 128, hint: 'What you collect for each right answer' },
  ],
  rounds: { label: 'Questions', min: 5, max: 30, default: 10 },
  hasCpu: false,
};

type Phase = 'start' | 'play' | 'end';

// The engine's test game (development plan Stage 2) and the first simple
// Quiz: every right answer adds a star. Uses only the shared engine.
export default function StarQuiz() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('star-quiz');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setId, setSetId] = useState(LIBRARY[0].id);
  const pool = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const { ask, element, missed, stats } = useAsk({ gameId: 'star-quiz', mode: 'solo', pool });
  const [phase, setPhase] = useState<Phase>('start');
  const [stars, setStars] = useState(0);
  const [round, setRound] = useState(0);
  const [total, setTotal] = useState(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftEarly, setLeftEarly] = useState(false);

  async function play(v: RoundValues) {
    setTotal(v.rounds); setStars(0); setRound(0); setLeftEarly(false); setPhase('play');
    for (let r = 0; r < v.rounds; r++) {
      setRound(r + 1);
      const done = await ask();
      if (!done) { setLeftEarly(true); break; }
      setStars((s) => s + 1);
    }
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && settings.motion !== 'still') {
      void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
    }
    setPhase('end');
  }

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24">
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="star-quiz" />

      {phase === 'start' && (
        <div className="grid gap-4">
          <label className="grid gap-1 font-bold max-w-lg mx-auto w-full stage-text">
            {t('practice.set')}
            <select id="practice-set" value={setId} onChange={(e) => setSetId(e.target.value)}
              className="min-h-12 px-3 rounded-input border-[2px] border-border bg-surface font-bold">
              {sets.map((s) => <option key={s.id} value={s.id}>{s.name || t('sets.untitled')}</option>)}
            </select>
          </label>
          <ThemePicker current={theme} themes={themes} playable={playable} onChoose={choose} />
          <StartCard gameId="star-quiz" title={t('practice.title')} description={t('practice.description')} rounds={starQuizManifest.rounds} onPlay={play} />
        </div>
      )}

      {phase !== 'start' && (
        <section className="bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-4 mb-6" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <div className="flex items-center justify-between gap-3">
            <h1 className="title-bubble text-3xl">{t('practice.title')}</h1>
            <span className="font-display text-2xl font-bold tabular-nums">{phase === 'play' ? `${round} / ${total}` : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2 min-h-14" aria-label={t('practice.stars', { count: stars })} role="img">
            {Array.from({ length: total }, (_, i) => (
              <motion.span key={i} initial={false} animate={i < stars ? { scale: [0.4, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
                <Star weight={i < stars ? 'fill' : 'regular'} size={44} className={i < stars ? 'drop-shadow' : 'text-border-soft'} style={i < stars ? { color: pieceColor(theme, 'star', '#f6c544') } : undefined} />
              </motion.span>
            ))}
          </div>
          {phase === 'end' && (
            <>
              <p className="font-display text-2xl font-bold">{t('practice.done', { count: stars })}</p>
              {leftEarly && <p className="font-bold">{t('practice.leftEarly')}</p>}
              <p className="font-bold">{t('practice.score', { right: stats.right, asked: stats.asked })}</p>
            </>
          )}
        </section>
      )}

      {phase === 'end' && <LookBack missed={missed} onDone={() => setPhase('start')} />}
      {element}
    </main>
    </ThemedPage>
  );
}
