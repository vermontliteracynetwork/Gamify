import { Component, type ReactNode } from 'react';
import { ArrowsClockwise, House, Warning } from '@phosphor-icons/react';

// Something went wrong (Brand Kit More screens, approved 2026-11-24): one calm
// card and one way out, no blame words. "Your game is saved" because games
// keep their progress on the device.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('Gamify caught an error:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-[calc(100dvh-4rem)] grid place-items-center px-4 py-10 text-center">
        <div className="grid justify-items-center gap-5 max-w-xl">
          <span className="w-36 h-36 rounded-full grid place-items-center" style={{ background: 'var(--peach)' }} aria-hidden="true"><Warning weight="bold" size={72} /></span>
          <h1 className="font-display text-5xl sm:text-6xl leading-none">Something went wrong</h1>
          <p className="text-lg font-semibold">Your game is saved. Try again, and if it keeps happening, tell your teacher.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="min-h-14 px-7 rounded-pill border-bold border-border bg-accent font-bold text-lg inline-flex items-center gap-2" style={{ boxShadow: '0 4px 0 var(--color-border)' }}><ArrowsClockwise weight="bold" size={22} />Try again</button>
            <a href="/" className="min-h-14 px-7 rounded-pill border-bold border-border bg-surface font-bold text-lg inline-flex items-center gap-2 no-underline text-text" style={{ boxShadow: '0 4px 0 var(--color-border)' }}><House weight="bold" size={22} />Home</a>
          </div>
        </div>
      </main>
    );
  }
}
