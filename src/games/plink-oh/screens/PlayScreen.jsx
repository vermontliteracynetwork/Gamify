import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cards, X, Check, Timer, Lightning } from '@phosphor-icons/react';
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

function Scoreboard({ teams, game, activeTeam }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
      {teams.map((t) => {
        const active = t.id === activeTeam.id;
        return (
          <div
            key={t.id}
            className={`relative px-3 py-1.5 rounded-pill flex items-center gap-1.5 transition-colors
                        ${active ? 'bg-surface-hover' : 'bg-transparent'}`}
          >
            {active && (
              <motion.div
                layoutId="active-team-ring"
                className="absolute inset-0 rounded-pill border-2 border-accent"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
            <span className="font-bold text-sm text-text">{t.name}</span>
            <ScoreCount value={game.scores[t.id]} className="font-display font-bold text-sm text-muted tabular-nums" />
            {game.powerUps[t.id]?.length > 0 && (
              <span className="text-accent text-xs">{'★'.repeat(game.powerUps[t.id].length)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PlayScreen({ teams, game, options, roundCount, activeTeam, onReveal, onAnswer, onChoosePowerUp, onLanded }) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface border border-border-soft text-xs font-bold text-muted w-fit">
          Round {game.roundIndex} of {roundCount}
        </div>
        <Scoreboard teams={teams} game={game} activeTeam={activeTeam} />
      </div>

      <AnimatePresence mode="wait">
        {options.questionsEnabled && game.phase === 'reveal' && (
          <motion.div key="reveal" {...fadeSlide}>
            <Panel>
              <button onClick={onReveal} className="w-full flex flex-col items-center text-center">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-24 h-24 rounded-full mb-4 flex items-center justify-center font-display font-bold text-accent-ink"
                  style={{ background: activeTeam.color }}
                >
                  {options.manualDeck ? <Cards weight="fill" size={34} /> : activeTeam.name}
                </motion.span>
                <span className="text-muted text-sm font-bold">
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
              <p className="text-accent font-display text-2xl font-bold mb-1">{game.currentQuestion.answer}</p>
              {options.timerEnabled && (
                <div className="inline-flex items-center gap-1 text-muted text-sm font-bold mb-2">
                  <Timer weight="bold" size={14} /> {game.timeLeft}s
                </div>
              )}
              <div className="flex gap-3 justify-center mt-3">
                <Button variant="danger" onClick={() => onAnswer(false)}>
                  <X weight="bold" size={16} /> Oops
                </Button>
                <Button variant="success" onClick={() => onAnswer(true)}>
                  <Check weight="bold" size={16} /> Okay
                </Button>
              </div>
            </Panel>
          </motion.div>
        )}

        {game.phase === 'power-up' && (
          <motion.div key="power-up" {...fadeSlide}>
            <Panel className="text-center">
              <p className="text-muted text-sm font-bold mb-4">Use a power-up on this turn, or skip. Unused ones don't carry over.</p>
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
                      className="flex flex-col items-center gap-1 px-4 py-3 rounded-panel bg-bg-elevated border border-border-soft hover:border-accent transition-colors"
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
                <p className="text-muted text-sm font-bold mb-3">{activeTeam.name}: pick a drop zone</p>
              )}
              {game.activePowerUp && (
                <div className="flex items-center gap-1.5 mb-3 px-3 py-1 rounded-pill bg-accent/15 text-accent text-xs font-bold">
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
    </div>
  );
}
