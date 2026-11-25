import type { ReactNode } from 'react';

// An icon on a round pastel badge with an ink ring (/brand New direction
// rule 7: "ink on a round pastel badge, centered by pixel and by eye").
// Decorative: the label beside it says what it is.
export type BadgeColor = 'lavender' | 'butter' | 'mint' | 'blue-crystal' | 'blush' | 'aqua' | 'peach' | 'surface-2';
const BG: Record<BadgeColor, string> = {
  lavender: 'bg-lavender', butter: 'bg-butter', mint: 'bg-mint', 'blue-crystal': 'bg-blue-crystal',
  blush: 'bg-blush', aqua: 'bg-aqua', peach: 'bg-peach', 'surface-2': 'bg-surface-2',
};
export const BADGE_CYCLE: BadgeColor[] = ['lavender', 'butter', 'mint', 'blue-crystal', 'blush', 'aqua', 'peach'];

export default function IconBadge({ color, size = 'md', children }: { color: BadgeColor; size?: 'sm' | 'md' | 'lg'; children: ReactNode }) {
  const s = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  return <span aria-hidden="true" className={`${s} ${BG[color]} shrink-0 rounded-full border-std border-border grid place-items-center text-text`}>{children}</span>;
}
