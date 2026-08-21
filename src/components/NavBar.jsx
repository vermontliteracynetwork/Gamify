import React from 'react';
import { Link } from 'react-router-dom';
import { HouseSimple, GameController } from '@phosphor-icons/react';

// Persistent top nav on every screen -- the original build had none once you
// left Home, which was the single biggest cause of "navigation is difficult":
// there was no way back to the game list from inside a game.
export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-bg-elevated/90 backdrop-blur border-b border-border-soft">
      <Link
        to="/"
        className="flex items-center gap-2 text-text no-underline font-display text-lg font-bold tracking-tight transition-transform active:scale-95"
      >
        <span className="w-8 h-8 rounded-input bg-accent text-accent-ink flex items-center justify-center">
          <GameController weight="bold" size={18} />
        </span>
        Gamify
      </Link>
      <Link
        to="/"
        className="ml-auto flex items-center gap-1.5 text-sm text-muted hover:text-text no-underline px-3 py-1.5 rounded-pill hover:bg-surface-hover transition-colors"
      >
        <HouseSimple weight="bold" size={16} />
        All games
      </Link>
    </header>
  );
}
