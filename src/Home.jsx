import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Target } from '@phosphor-icons/react';

const GAMES = [
  {
    path: '/games/plink-oh',
    name: 'Plink-oh!',
    description: 'Answer a question, drop a ball, chase the high-value bucket.',
    icon: Target,
    color: '#f7c948',
  },
];

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-24">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-text mb-2">
          Pick a game
        </h1>
        <p className="text-muted text-base max-w-[50ch]">
          Play on your own, or join a game your teacher is running.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES.map((game, i) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.path}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={game.path}
                className="group relative flex flex-col gap-4 p-6 rounded-panel bg-surface border border-border-soft no-underline overflow-hidden
                           transition-colors hover:bg-surface-hover hover:border-border
                           active:scale-[0.98] motion-safe:transition-transform"
              >
                <div
                  className="w-12 h-12 rounded-input flex items-center justify-center text-accent-ink shrink-0
                             transition-transform group-hover:-rotate-6 group-hover:scale-110"
                  style={{ background: game.color }}
                >
                  <Icon weight="bold" size={26} />
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold text-text mb-1">{game.name}</h2>
                  <p className="text-muted text-sm leading-relaxed">{game.description}</p>
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-sm font-bold text-accent">
                  Play
                  <ArrowRight weight="bold" size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
