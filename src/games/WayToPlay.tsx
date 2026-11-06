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
    <div role="radiogroup" aria-label={t('way.title')} className={`grid gap-4 ${modes.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {modes.map((m) => {
        const Icon = MODE_ICONS[m];
        const on = value === m;
        return (
          // A big picture band for each way to play, small text under it (teacher, 2026-11-06).
          <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onChange(m)}
            className={`group relative rounded-panel border-[2.5px] border-border overflow-hidden text-left grid bg-surface motion-safe:transition-transform motion-safe:hover:-translate-y-1 ${on ? 'ring-4 ring-accent' : ''}`}
            style={{ boxShadow: on ? '0 6px 0 #000' : '0 3px 0 rgba(0,0,0,0.85)' }}>
            <span className="relative h-[clamp(8rem,30vh,18rem)] flex items-center justify-center border-b-[2.5px] border-border overflow-hidden" style={{ background: MODE_COLORS[m] }} aria-hidden="true">
              <Icon weight="fill" className="w-[38%] h-[60%] motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:transition-transform" />
              <Icon weight="fill" size={28} className="absolute left-[8%] bottom-[10%] opacity-20 rotate-12" />
              <Icon weight="fill" size={22} className="absolute right-[10%] top-[12%] opacity-20 -rotate-12" />
            </span>
            <span className="px-3 py-2 grid gap-0.5">
              <span className="font-display text-lg font-bold leading-tight">{t(`mode.${m}` as StringKey)}</span>
              <span className="font-semibold text-sm leading-snug">{t(`mode.${m}.hint` as StringKey)}</span>
              <span className="text-xs font-semibold text-muted leading-snug">{t(`way.screens.${m}` as StringKey)}</span>
            </span>
            {on && <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center motion-safe:animate-[pop_0.3s_ease-out]" aria-hidden="true"><Check weight="bold" size={18} /></span>}
          </button>
        );
      })}
    </div>
  );
}
