import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowClockwise, ListMagnifyingGlass, House } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';

// Confetti fires once, on entry, as feedback for the state transition into
// "game over" -- not a looping effect, so it never fights for attention
// during the score review below it.
function useWinConfetti(colors) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, colors, scalar: 0.9 });
  }, [reduce, colors]);
}

export default function WinnerScreen({ teams, scores, winners, history, onRestart, onMenu }) {
  const [showReview, setShowReview] = useState(false);
  useWinConfetti(winners.map((w) => w.color));

  return (
    <Panel className="text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="w-16 h-16 rounded-full bg-accent text-accent-ink flex items-center justify-center mx-auto mb-3"
      >
        <Trophy weight="fill" size={30} />
      </motion.div>

      <h2 className="font-display text-2xl font-bold text-text mb-1">
        {winners.length > 1 ? "It's a tie!" : 'Winner!'}
      </h2>
      {winners.map((w) => (
        <div key={w.id} className="font-display text-xl font-bold" style={{ color: w.color }}>
          {w.name} &middot; {scores[w.id]} pts
        </div>
      ))}

      <div className="my-5 flex flex-col gap-1.5 text-left">
        {teams.slice().sort((a, b) => scores[b.id] - scores[a.id]).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-input bg-bg-elevated"
          >
            <span className="font-bold text-sm" style={{ color: t.color }}>{t.name}</span>
            <span className="font-display font-bold text-text">{scores[t.id]}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <Button variant="primary" onClick={onRestart}>
          <ArrowClockwise weight="bold" size={16} /> Play again
        </Button>
        <Button variant="ghost" onClick={() => setShowReview((s) => !s)}>
          <ListMagnifyingGlass weight="bold" size={16} /> Review
        </Button>
        <Button variant="ghost" onClick={onMenu}>
          <House weight="bold" size={16} /> Menu
        </Button>
      </div>

      {showReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-5 text-left max-h-80 overflow-y-auto flex flex-col gap-2"
        >
          {history.map((h, i) => (
            <div key={i} className="px-3.5 py-2.5 rounded-input bg-bg-elevated text-sm">
              <div className="font-bold text-text">
                {h.team} &middot; Round {h.round} &middot; {h.correct ? `+${h.points}` : 'missed'}
              </div>
              {h.question && (
                <div className="text-muted text-xs whitespace-pre-line mt-0.5">
                  {h.question.prompt} <em>({h.question.answer})</em>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </Panel>
  );
}
