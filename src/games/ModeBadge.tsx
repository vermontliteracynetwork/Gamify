import { Broadcast, Television, User, Users, type Icon } from '@phosphor-icons/react';
import type { PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';

// Every play mode has a name, an icon and a one-line hint, shown on every
// game card and welcome screen so it's always clear how a game is played.
// New direction rule 12 (approved 2026-11-25): three ways, each with its own
// palette pair and its one icon (Icons tab): Share is Lemon drop and Butter
// with the television, Live is Sky and Blue crystal with the broadcast, Solo
// is Kelly green and Mint with the one person. MODE_COLORS is the pastel (the
// card or row), MODE_BRIGHT fills the round icon badge.
export const MODE_ICONS: Record<PlayMode, Icon> = { live: Broadcast, share: Television, solo: User, versus: Users };
export const MODE_COLORS: Record<PlayMode, string> = { live: '#bfdff3', share: '#fff1b8', solo: '#c8f0dc', versus: '#ffd9b3' };
export const MODE_BRIGHT: Record<PlayMode, string> = { live: '#4ba3e8', share: '#fabe37', solo: '#22b04a', versus: '#ff9b28' };

// The ways to play people see (teacher, 2026-11-23: "remove versus as a
// category entirely"): Live, Share and Solo. A game's Versus is shown as
// Share (two players on one screen) and Solo (one player against the
// computer); Live means a class screen IN ADDITION TO each student's own.
export const SHOWN_MODES: PlayMode[] = ['live', 'share', 'solo'];
export function shownModes(modes: PlayMode[]): PlayMode[] {
  const set = new Set(modes.flatMap((m) => (m === 'versus' ? ['share', 'solo'] : [m])) as PlayMode[]);
  return SHOWN_MODES.filter((m) => set.has(m));
}

export function ModeBadge({ mode, withHint = false }: { mode: PlayMode; withHint?: boolean }) {
  const Icon = MODE_ICONS[mode];
  return (
    // With its hint (a game's welcome screen), it is a full-width row: icon,
    // name, then the hint in its own column, so a long hint wraps under
    // itself instead of under the name (teacher, 2026-10-31: no weird spacing).
    withHint ? (
      <span className="grid grid-cols-[auto_5.5rem_1fr] items-center gap-x-3 rounded-input border-std border-border px-3 py-2 text-base leading-snug" style={{ background: MODE_COLORS[mode] }}>
        <span className="w-9 h-9 rounded-full border-std border-border grid place-items-center" style={{ background: MODE_BRIGHT[mode] }}><Icon weight="bold" size={20} aria-hidden="true" /></span>
        <span className="font-display font-bold text-lg">{t(`mode.${mode}` as StringKey)}</span>
        <span className="font-semibold">{t(`mode.${mode}.hint` as StringKey)}</span>
      </span>
    ) : (
      <span data-tip={t(`mode.${mode}.hint` as StringKey)} data-tip-bg={MODE_COLORS[mode]} className="inline-flex items-center gap-2 rounded-pill border-std border-border px-3 py-1 font-bold text-sm" style={{ background: MODE_COLORS[mode] }}>
        <Icon weight="bold" size={18} aria-hidden="true" />
        <span>{t(`mode.${mode}` as StringKey)}</span>
      </span>
    )
  );
}

// A way to play as just its icon in a colored circle; the hover text names
// it, in the same color (teacher, 2026-11-06).
export function ModeDot({ mode, small = false }: { mode: PlayMode; small?: boolean }) {
  const Icon = MODE_ICONS[mode];
  return (
    <span data-tip={t(`mode.${mode}`)} data-tip-bg={MODE_COLORS[mode]} role="img" aria-label={t(`mode.${mode}`)}
      className={`${small ? 'w-7 h-7' : 'w-9 h-9'} shrink-0 rounded-full border-std border-border inline-flex items-center justify-center`} style={{ background: MODE_BRIGHT[mode] }}>
      <Icon weight="bold" size={small ? 15 : 18} aria-hidden="true" />
    </span>
  );
}
