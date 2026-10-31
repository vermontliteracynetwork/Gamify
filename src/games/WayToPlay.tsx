import { Check } from '@phosphor-icons/react';
import type { PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The first setup step when a game can be played more than one way (teacher,
// 2026-10-31): big cards for each way, saying whether it runs on one screen
// or on every student's own device.
export default function WayToPlay({ modes, value, onChange }: { modes: PlayMode[]; value: PlayMode; onChange: (m: PlayMode) => void }) {
  return (
    // Every way fits side by side, no scrolling (teacher, 2026-10-31).
    <div role="radiogroup" aria-label={t('way.title')} className={`grid gap-3 ${modes.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {modes.map((m) => {
        const Icon = MODE_ICONS[m];
        const on = value === m;
        return (
          <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onChange(m)}
            className={`relative p-4 rounded-panel border-[2.5px] text-left grid content-start gap-1.5 ${modes.length >= 3 ? 'sm:justify-items-center sm:text-center' : ''} ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}
            style={{ background: on ? MODE_COLORS[m] : 'var(--color-surface)', boxShadow: on ? 'var(--shadow-sticker)' : undefined }}>
            <span className="w-14 h-14 rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center mb-1"><Icon weight="fill" size={30} aria-hidden="true" /></span>
            <span className="font-display text-2xl font-bold leading-tight">{t(`mode.${m}` as StringKey)}</span>
            <span className="font-bold leading-snug">{t(`mode.${m}.hint` as StringKey)}</span>
            <span className="text-sm font-semibold text-muted leading-snug">{t(`way.screens.${m}` as StringKey)}</span>
            {on && <Check weight="bold" size={22} className="absolute top-3 right-3" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
