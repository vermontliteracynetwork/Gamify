import type { PlayMode } from '../data/types';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The way-to-play card (teacher, 2026-11-06: "a big picture band for each way
// to play, small text under it"), shared with the read-only cards on Home
// (owner, 2026-11-25: "match the design thats on the game menu selection").
export const WAY_CARD = 'group relative rounded-panel border-bold border-border overflow-hidden text-left flex flex-col bg-surface motion-safe:transition-transform motion-safe:hover:-translate-y-1';
export const WAY_SHADOW = '0 3px 0 rgba(0,0,0,0.85)';
export function WayScene({ mode, className = '' }: { mode: PlayMode; className?: string }) {
  const Icon = MODE_ICONS[mode];
  return (
    <span className={`relative flex items-center justify-center border-b-[2.5px] border-border overflow-hidden ${className}`} style={{ background: MODE_COLORS[mode] }} aria-hidden="true">
      <Icon weight="fill" className="w-[38%] h-[60%] motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:transition-transform" />
      <Icon weight="fill" size={28} className="absolute left-[8%] bottom-[10%] opacity-20 rotate-12" />
      <Icon weight="fill" size={22} className="absolute right-[10%] top-[12%] opacity-20 -rotate-12" />
    </span>
  );
}
