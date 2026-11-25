import { useContext } from 'react';
import { Check } from '@phosphor-icons/react';
import { ChoicePicked } from './SetupWizard';
import type { PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { WAY_CARD, WAY_SHADOW, WayScene } from './WayCard';
import Title from '../ui/Title';
import { ChoiceRow } from '../ui/fields';

// The first setup step when a game can be played more than one way (teacher,
// 2026-10-31): big cards for each way, saying whether it runs on one screen
// or on every student's own device.
export default function WayToPlay({ modes: given, value, onChange }: { modes: PlayMode[]; value: PlayMode; onChange: (m: PlayMode) => void }) {
  // No Versus category (teacher, 2026-11-23): a game's Versus shows as Solo
  // (one player against the computer) when it has no Solo of its own, and is
  // left out when it has one; Share already covers two players on one screen.
  const modes = given.filter((m) => m !== 'versus' || !given.includes('solo'));
  const look = (m: PlayMode): PlayMode => (m === 'versus' ? 'solo' : m);
  const picked = useContext(ChoicePicked);
  // Former Versus games show under Solo (teacher, 2026-11-23): when a game has
  // both, Solo asks one more thing after it is tapped, alone or against the
  // computer, so the computer opponent is never lost.
  const both = given.includes('versus') && given.includes('solo');
  const soloOn = picked && (value === 'solo' || value === 'versus');
  return (
    // Every way fits side by side, no scrolling (teacher, 2026-10-31).
    // Square cards in the middle of the box (teacher, 2026-11-18).
    <div className="way-cards grid gap-6">
    <div role="radiogroup" aria-label={t('way.title')} className="grid gap-5 justify-center" style={{ gridTemplateColumns: `repeat(${modes.length}, min(18rem, 40vh, calc((100% - ${(modes.length - 1) * 1.25}rem) / ${modes.length})))` }}>
      {modes.map((m) => {
        const on = picked && (value === m || (both && m === 'solo' && value === 'versus'));
        return (
          // A big picture band for each way to play, small text under it (teacher, 2026-11-06).
          <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onChange(m)}
            aria-label={`${t(`mode.${look(m)}` as StringKey)}: ${m === 'versus' ? 'Play against the computer' : t(`mode.${m}.hint` as StringKey)}`}
            className={`${WAY_CARD} aspect-square ${on ? 'ring-4 ring-border ring-offset-4 ring-offset-paper -translate-y-1.5' : ''}`}
            style={{ boxShadow: on ? '0 10px 0 var(--ink)' : WAY_SHADOW }}>
            <WayScene mode={look(m)} className="flex-1 min-h-0" />
            {/* The name reads big; the line under it shows on hover with a mouse
                (teacher, 2026-11-24). Touch screens have no hover, so there it
                shows under the picked card only (iPad-first rule). */}
            <span className="px-3 py-2 grid gap-0.5 content-center justify-items-center text-center min-h-[30%]">
              <span className={`title-bubble leading-none text-[clamp(1.5rem,4.4vh,2.5rem)] [@media(hover:hover)]:group-hover:text-[clamp(1.2rem,3.3vh,1.9rem)] ${on ? '[@media(hover:none)]:text-[clamp(1.2rem,3.3vh,1.9rem)]' : ''}`}><Title text={t(`mode.${look(m)}` as StringKey)} /></span>
              <span className={`font-semibold text-sm leading-snug [@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:block [@media(hover:hover)]:group-focus-visible:block ${on ? '' : '[@media(hover:none)]:hidden'}`}>{m === 'versus' ? 'Play against the computer' : t(`mode.${m}.hint` as StringKey)}</span>
            </span>
            {on && <span className="absolute -top-3.5 -right-3.5 w-10 h-10 rounded-full bg-kelly border-[3px] border-border flex items-center justify-center motion-safe:animate-[pop_0.3s_ease-out]" aria-hidden="true"><Check weight="bold" size={18} /></span>}
          </button>
        );
      })}
    </div>
    {both && soloOn && (
      <div className="justify-self-center"><ChoiceRow label={t('way.soloWho')} value={value === 'versus' ? 'versus' : 'solo'} onChange={(m) => onChange(m)}
        options={[{ value: 'solo', label: t('way.soloAlone') }, { value: 'versus', label: t('way.soloComputer') }]} /></div>
    )}
    </div>
  );
}
