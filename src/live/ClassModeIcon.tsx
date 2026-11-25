import { Heart, Lightning, UsersThree } from '@phosphor-icons/react';

// The two ways a class plays Live (teacher, 2026-11-24): Cooperative wears
// people with a heart, Competitive wears people with a versus spark, drawn
// like the ways-to-play icons so they read as the same family.
// New direction rule 11 (approved 2026-11-25): Cooperative is Kelly and Mint,
// Competitive is Pink punch and Blush; the bright fills the round badge, the
// pastel is the card around it.
export const CLASS_MODE_COLORS = { together: 'var(--mint)', compete: 'var(--blush)' } as const;
export const CLASS_MODE_BRIGHT = { together: 'var(--kelly)', compete: 'var(--pink-punch)' } as const;

export default function ClassModeIcon({ mode, size = 28 }: { mode: 'together' | 'compete'; size?: number }) {
  const Badge = mode === 'together' ? Heart : Lightning;
  return (
    <span aria-hidden="true" className="relative inline-flex shrink-0 items-center justify-center rounded-full border-std border-border"
      style={{ width: size * 1.6, height: size * 1.6, background: CLASS_MODE_BRIGHT[mode] }}>
      <UsersThree weight="bold" size={size} />
      <span className="absolute -right-1 -top-1 rounded-full border-std border-border bg-surface inline-flex items-center justify-center" style={{ width: size * 0.75, height: size * 0.75 }}>
        <Badge weight="fill" size={size * 0.45} color={mode === 'together' ? 'var(--pink-punch)' : 'var(--ink)'} />
      </span>
    </span>
  );
}
