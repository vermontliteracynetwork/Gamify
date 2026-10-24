import React from 'react';
import { Link } from 'react-router-dom';
import { HouseSimple } from '@phosphor-icons/react';

// Persistent top nav on every screen -- the original build had none once you
// left Home, which was the single biggest cause of "navigation is difficult":
// there was no way back to the game list from inside a game.
export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-surface border-b-[2.5px] border-border">
      <Link to="/" className="flex items-center active:scale-95 motion-safe:transition-transform" aria-label="Gamify home">
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-9 w-auto" draggable="false" />
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
