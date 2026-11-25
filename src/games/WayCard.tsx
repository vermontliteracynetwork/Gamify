import type { PlayMode } from '../data/types';
import { MODE_BRIGHT, MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The way-to-play card (teacher, 2026-11-06: "a big picture band for each way
// to play, small text under it"), shared with the read-only cards on Home
// (owner, 2026-11-25: "match the design thats on the game menu selection").
// Universal views 2a (approved 2026-11-25): the way's pastel band with its
// icon on a round bright badge (New direction rule 12).
export const WAY_CARD = 'group relative rounded-[1.5rem] border-[3px] border-border text-left flex flex-col bg-surface motion-safe:transition-transform motion-safe:hover:-translate-y-1';
export const WAY_SHADOW = '0 5px 0 var(--ink)';
export function WayScene({ mode, className = '' }: { mode: PlayMode; className?: string }) {
  const Icon = MODE_ICONS[mode];
  return (
    <span className={`relative grid place-items-center border-b-[3px] border-border rounded-t-[1.3rem] ${className}`} style={{ background: MODE_COLORS[mode] }} aria-hidden="true">
      <span className="h-[62%] aspect-square rounded-full border-[3px] border-border grid place-items-center motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:transition-transform"
        style={{ background: MODE_BRIGHT[mode], boxShadow: '0 4px 0 var(--ink)' }}>
        <Icon weight="bold" className="w-[62%] h-[62%]" />
      </span>
    </span>
  );
}
