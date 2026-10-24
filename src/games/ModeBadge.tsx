import { DeviceTablet, ProjectorScreen, User, Users, type Icon } from '@phosphor-icons/react';
import type { PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';

// Every play mode has a name, an icon and a one-line hint, shown on every
// game card and welcome screen so it's always clear how a game is played.
export const MODE_ICONS: Record<PlayMode, Icon> = { live: DeviceTablet, share: ProjectorScreen, solo: User, versus: Users };
export const MODE_COLORS: Record<PlayMode, string> = { live: '#9fd8f0', share: '#fdfd94', solo: '#a3e6b8', versus: '#ed9d75' };

export function ModeBadge({ mode, withHint = false }: { mode: PlayMode; withHint?: boolean }) {
  const Icon = MODE_ICONS[mode];
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border-[2px] border-border px-3 py-1 font-bold text-sm" style={{ background: MODE_COLORS[mode] }}>
      <Icon weight="bold" size={18} aria-hidden="true" />
      <span>{t(`mode.${mode}` as StringKey)}</span>
      {withHint && <span className="font-semibold">· {t(`mode.${mode}.hint` as StringKey)}</span>}
    </span>
  );
}
