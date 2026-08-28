import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cards, X, Check, Timer, Lightning, List, GearSix, SpeakerSimpleHigh, SpeakerSimpleSlash } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';
import ScoreCount from '../components/ScoreCount';
import PlinkoBoard from '../PlinkoBoard';
import { POWER_UPS } from '../data';

const POWER_UPS_BY_ID = Object.fromEntries(POWER_UPS.map((p) => [p.id, p]));

const fadeSlide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
};

const QUIZ_COLORS = ['#fbdb6b', '#a3e6b8', '#a8d8f0', '#f7ad78'];

// Self-graded multiple-choice card -- matches the Canva quiz mockup's 2x2
// pastel option grid. Distinct from the 'open' type's host-judged
// Oops/Okay flow: tapping an option grades itself immediately, with a
// brief flash (right answer highlighted green, picked-wrong flashes red)
// before the turn advances, so a kid gets clear feedback either way.
function QuizOptions({ question, onAnswer }) {
  const [picked, setPicked] = useState(null);

  useEffect(() => setPicked(null), [question]);

  function choose(i) {
    if (picked != null) return;
    setPicked(i);
    setTimeout(() => onAnswer(i === question.correctIndex), 650);
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {question.options.map((opt, i) => {
        const isCorrect = i === question.correctIndex;
        const showResult = picked != null;
        const isPicked = picked === i;
        let bg = QUIZ_COLORS[i % QUIZ_COLORS.length];
        if (showResult && isCorrect) bg = 'var(--success)';
        else if (showResult && isPicked && !isCorrect) bg = 'var(--danger)';

        return (
          <motion.button
            key={i}
            onClick={() => choose(i)}
            disabled={picked != null}
            whileTap={picked == null ? { scale: 0.95 } : undefined}
            animate={showResult && isPicked ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            className="px-4 py-3.5 rounded-input border-[2.5px] border-border font-display font-bold text-lg text-accent-ink disabled:pointer-events-none"
            style={{ background: bg, boxShadow: 'var(--shadow-sticker)' }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

// Persistent side panel -- round counter, menu/settings, live scoreboard --
// matching the Canva gameplay mockup's HUD layout. Replaces the old
// top-bar-only header so the round/score state is always visible without
// competing for space with the question card.
function Hud({ teams, game, roundCount, activeTeam, onMenu, onToggleSound, soundOn }) {
  return (
    <div className="flex sm:flex-col gap-3 sm:w-56 sm:shrink-0">
      <div className="flex gap-2 flex-1 sm:flex-initial">
        <div
          className="flex-1 sm:flex-initial text-center px-3 py-2 rounded-input bg-surface border-[2.5px] border-border font-display font-bold text-sm"
          style={{ boxShadow: 'var(--shadow-sticker)' }}
        >
          Round {game.roundIndex}/{roundCount}
        </div>
        <button
          onClick={onMenu}
          className="px-3 py-2 rounded-input bg-surface border-[2.5px] border-border flex items-center gap-1.5 font-bold text-sm active:scale-95 motion-safe:transition-transform"
          style={{ boxShadow: 'var(--shadow-sticker)' }}
        >
          <List weight="bold" size={16} /> <span className="hidden sm:inline">Menu</span>
        </button>
        <button
          onClick={onToggleSound}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          className="px-3 py-2 rounded-input bg-surface border-[2.5px] border-border flex items-center justify-center active:scale-95 motion-safe:transition-transform"
          style={{ boxShadow: 'var(--shadow-sticker)' }}
        >
          {soundOn ? <SpeakerSimpleHigh weight="bold" size={16} /> : <SpeakerSimpleSlash weight="bold" size={16} />}
        </button>
      </div>

      <div className="hidden sm:flex flex-col gap-1.5 p-2 rounded-panel bg-surface-2 border-[2.5px] border-border">
        {teams.map((t) => {
          const active = t.id === activeTeam.id;
          return (
            <div key={t.id} className="relative px-3 py-2 rounded-input flex items-center justify-between gap-2">
              {active && (
                <motion.div
                  layoutId="active-team-ring"
                  className="absolute inset-0 rounded-input bg-surface border-2 border-accent-ink"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ boxShadow: '0 2px 0 var(--border)' }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 font-bold text-sm text-text min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-border" style={{ background: t.color }} />
                <span className="truncate">{t.name}</span>
              </span>
              <ScoreCount value={game.scores[t.id]} className="relative z-10 font-display font-bold text-sm text-text tabular-nums shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayScreen({ teams, game, options, roundCount, activeTeam, onReveal, onAnswer, onChoosePowerUp, onLanded, onMenu, onToggleSound }) {
  return (
    <div className="flex flex-col sm:flex-row-reverse gap-4 items-start">
      <Hud
        teams={teams} game={game} roundCount={roundCount} activeTeam={activeTeam}
        onMenu={onMenu} onToggleSound={onToggleSound} soundOn={options.soundsLevel !== 'off'}
      />

      <div className="flex-1 w-full min-w-0">
        <AnimatePresence mode="wait">
          {options.questionsEnabled && game.phase === 'reveal' && (
            <motion.div key="reveal" {...fadeSlide}>
              <Panel>
                <button onClick={onReveal} className="w-full flex flex-col items-center text-center">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-24 h-24 rounded-full mb-4 flex items-center justify-center font-display font-bold text-accent-ink border-[2.5px] border-border"
                    style={{ background: activeTeam.color, boxShadow: '0 3px 0 var(--border)' }}
                  >
                    {options.manualDeck ? <Cards weight="fill" size={34} /> : activeTeam.name}
                  </motion.span>
                  <span className="text-text font-bold text-sm">
                    {options.manualDeck ? 'Tap the deck to reveal a question' : `Tap to reveal ${activeTeam.name}'s question`}
                  </span>
                </button>
              </Panel>
            </motion.div>
          )}

          {options.questionsEnabled && game.phase === 'question' && game.currentQuestion && (
            <motion.div key="question" {...fadeSlide}>
              <Panel className="text-center">
                <p className="whitespace-pre-line text-lg font-bold text-text mb-2">{game.currentQuestion.prompt}</p>
                {options.timerEnabled && (
                  <div className="flex items-center justify-center gap-1 text-text font-bold text-sm mb-1">
                    <Timer weight="bold" size={14} /> {game.timeLeft}s
                  </div>
                )}

                {game.currentQuestion.type === 'multiple-choice' ? (
                  <QuizOptions question={game.currentQuestion} onAnswer={onAnswer} />
                ) : (
                  <>
                    <p className="text-accent-ink bg-accent inline-block px-3 py-0.5 rounded-pill border-2 border-border font-display text-xl font-bold mb-1 mt-1">
                      {game.currentQuestion.answer}
                    </p>
                    <div className="flex gap-3 justify-center mt-3">
                      <Button variant="danger" onClick={() => onAnswer(false)}>
                        <X weight="bold" size={16} /> Oops
                      </Button>
                      <Button variant="success" onClick={() => onAnswer(true)}>
                        <Check weight="bold" size={16} /> Okay
                      </Button>
                    </div>
                  </>
                )}
              </Panel>
            </motion.div>
          )}

          {game.phase === 'power-up' && (
            <motion.div key="power-up" {...fadeSlide}>
              <Panel className="text-center">
                <p className="text-text font-bold text-sm mb-4">Use a power-up on this turn, or skip. Unused ones don't carry over.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {game.powerUps[activeTeam.id].map((id) => {
                    const pu = POWER_UPS_BY_ID[id];
                    return (
                      <motion.button
                        key={id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChoosePowerUp(id)}
                        title={pu.description}
                        className="flex flex-col items-center gap-1 px-4 py-3 rounded-panel bg-surface-2 border-[2.5px] border-border hover:bg-secondary transition-colors"
                      >
                        <span className="text-2xl">{pu.icon}</span>
                        <span className="text-xs font-bold text-text">{pu.name}</span>
                      </motion.button>
                    );
                  })}
                  <Button variant="danger" onClick={() => onChoosePowerUp(null)}>
                    <X weight="bold" size={16} /> Skip
                  </Button>
                </div>
              </Panel>
            </motion.div>
          )}

          {game.phase === 'drop' && (
            <motion.div key="drop" {...fadeSlide}>
              <Panel className="flex flex-col items-center">
                {!options.questionsEnabled && (
                  <p className="text-text font-bold text-sm mb-3">{activeTeam.name}: pick a drop zone</p>
                )}
                {game.activePowerUp && (
                  <div className="flex items-center gap-1.5 mb-3 px-3 py-1 rounded-pill bg-accent border-2 border-border text-accent-ink text-xs font-bold">
                    <Lightning weight="fill" size={14} /> {game.activePowerUp.name} active
                  </div>
                )}
                <PlinkoBoard
                  dropZoneCount={Math.min(6, game.buckets.length + 1)}
                  buckets={game.buckets}
                  spikesEnabled={options.spikesEnabled}
                  activePowerUp={game.activePowerUp}
                  teamColor={activeTeam.color}
                  onLanded={onLanded}
                />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
          {teams.map((t) => {
            const active = t.id === activeTeam.id;
            return (
              <div
                key={t.id}
                className={`shrink-0 px-3 py-1.5 rounded-pill flex items-center gap-1.5 border-2 ${active ? 'border-accent-ink bg-surface' : 'border-border-soft bg-surface-2'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="font-bold text-xs text-text">{t.name}</span>
                <ScoreCount value={game.scores[t.id]} className="font-display font-bold text-xs text-text tabular-nums" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
