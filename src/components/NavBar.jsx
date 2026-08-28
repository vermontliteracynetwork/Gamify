import React from 'react';
import { Link } from 'react-router-dom';
import { HouseSimple, GameController } from '@phosphor-icons/react';

// Persistent top nav on every screen -- the original build had none once you
// left Home, which was the single biggest cause of "navigation is difficult":
// there was no way back to the game list from inside a game.
export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-surface border-b-[2.5px] border-border">
      <Link
        to="/"
        className="flex items-center gap-2 text-text no-underline font-display text-lg font-bold tracking-tight active:scale-95 motion-safe:transition-transform"
      >
        <span
          className="w-9 h-9 rounded-input bg-accent text-accent-ink flex items-center justify-center border-[2px] border-border"
          style={{ boxShadow: '0 2px 0 var(--border)' }}
        >
          <GameController weight="bold" size={18} />
        </span>
        Gamify
      </Link>
      <Link
        to="/"
        className="ml-auto flex items-center gap-1.5 text-sm font-bold text-text hover:text-accent-ink no-underline px-3.5 py-1.5 rounded-pill
                   border-[2px] border-border bg-surface-2 hover:bg-secondary transition-colors"
      >
        <HouseSimple weight="bold" size={16} />
        All games
      </Link>
    </header>
  );
}
