import { Check } from '@phosphor-icons/react';
import type { PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The first setup step when a game can be played more than one way (teacher,
// 2026-10-31): big cards for each way, saying whether it runs on one screen
// or on every student's own device.
export default function WayToPlay({ modes: given, value, onChange }: { modes: PlayMode[]; value: PlayMode; onChange: (m: PlayMode) => void }) {
  // No Versus category (teacher, 2026-11-23): a game's Versus shows as Solo
  // (one player against the computer) when it has no Solo of its own, and is
  // left out when it has one; Share already covers two players on one screen.
  const modes = given.filter((m) => m !== 'versus' || !given.includes('solo'));
  const look = (m: PlayMode): PlayMode => (m === 'versus' ? 'solo' : m);
  return (
    // Every way fits side by side, no scrolling (teacher, 2026-10-31).
    // Square cards in the middle of the box (teacher, 2026-11-18).
    <div role="radiogroup" aria-label={t('way.title')} className="grid gap-5 justify-center" style={{ gridTemplateColumns: `repeat(${modes.length}, min(18rem, 40vh, calc((100% - ${(modes.length - 1) * 1.25}rem) / ${modes.length})))` }}>
      {modes.map((m) => {
        const Icon = MODE_ICONS[look(m)];
        const on = value === m;
        return (
          // A big picture band for each way to play, small text under it (teacher, 2026-11-06).
          <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onChange(m)}
            className={`group relative aspect-square rounded-panel border-bold border-border overflow-hidden text-left flex flex-col bg-surface motion-safe:transition-transform motion-safe:hover:-translate-y-1 ${on ? 'ring-4 ring-accent' : ''}`}
            style={{ boxShadow: on ? '0 6px 0 #000' : '0 3px 0 rgba(0,0,0,0.85)' }}>
            <span className="relative flex-1 min-h-0 flex items-center justify-center border-b-[2.5px] border-border overflow-hidden" style={{ background: MODE_COLORS[look(m)] }} aria-hidden="true">
              <Icon weight="fill" className="w-[38%] h-[60%] motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:transition-transform" />
              <Icon weight="fill" size={28} className="absolute left-[8%] bottom-[10%] opacity-20 rotate-12" />
              <Icon weight="fill" size={22} className="absolute right-[10%] top-[12%] opacity-20 -rotate-12" />
            </span>
            {/* The name reads big; the line under it shows on hover with a mouse
                (teacher, 2026-11-24). Touch screens have no hover, so there it
                shows under the picked card only (iPad-first rule). */}
            <span className="px-3 py-2 grid gap-0.5 content-center min-h-[3.75rem]">
              <span className="font-display text-2xl font-bold leading-tight">{t(`mode.${look(m)}` as StringKey)}</span>
              <span className={`font-semibold text-sm leading-snug [@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:block [@media(hover:hover)]:group-focus-visible:block ${on ? '' : '[@media(hover:none)]:hidden'}`}>{m === 'versus' ? 'Play against the computer' : t(`mode.${m}.hint` as StringKey)}</span>
            </span>
            {on && <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-accent border-std border-border flex items-center justify-center motion-safe:animate-[pop_0.3s_ease-out]" aria-hidden="true"><Check weight="bold" size={18} /></span>}
          </button>
        );
      })}
    </div>
  );
}
