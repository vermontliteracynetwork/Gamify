import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';

// Each entry: { path, name, description, icon, color }. Empty while the
// first commercial game modules are rebuilt (see docs/product-plan.md).
const GAMES = [];

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
        <h1 className="title-bubble text-4xl sm:text-5xl tracking-tight mb-2">
          Pick a game
        </h1>
        <p className="text-text font-bold text-base max-w-[50ch]">
          Play on your own, or join a game your teacher is running.
        </p>
      </motion.div>

      {GAMES.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 p-8 rounded-panel bg-surface border-[2.5px] border-border text-center"
          style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
        >
          <Sparkle weight="fill" size={40} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-text">New games are on the way</h2>
        </div>
      )}

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
                className="group relative flex flex-col gap-4 p-6 rounded-panel bg-surface border-[2.5px] border-border no-underline overflow-hidden
                           hover:bg-surface-hover active:scale-[0.98] motion-safe:transition-transform"
                style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
              >
                <div
                  className="w-12 h-12 rounded-input flex items-center justify-center text-accent-ink shrink-0 border-[2px] border-border
                             transition-transform group-hover:-rotate-6 group-hover:scale-110"
                  style={{ background: game.color, boxShadow: '0 2px 0 var(--border)' }}
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
