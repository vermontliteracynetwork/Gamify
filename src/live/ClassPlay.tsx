import { useContext } from 'react';
import { t } from '../i18n';
import { ChoicePicked } from '../games/SetupWizard';
import { ChoiceRow, Slider } from '../ui/fields';
import ClassModeIcon, { CLASS_MODE_COLORS } from './ClassModeIcon';
import { Check } from '@phosphor-icons/react';
import Title from '../ui/Title';

// How the class plays, chosen in the setup menus before the lobby opens
// (teacher, 2026-10-31): compete on a leaderboard or work together toward a
// class goal, and when the game ends. The lobby can still change it.
export interface ClassPlay { mode: 'compete' | 'together'; end: 'teacher' | 'right' | 'minutes'; n: number; goal: number }
export const DEFAULT_CLASS_PLAY: ClassPlay = { mode: 'compete', end: 'teacher', n: 10, goal: 50 };

export function classPlayQuery(v: ClassPlay): string {
  const q = new URLSearchParams({ mode: v.mode });
  if (v.mode === 'together') q.set('goal', String(v.goal));
  else if (v.end !== 'teacher') q.set('end', `${v.end}:${v.n}`);
  return q.toString();
}

// The lobby reads the choices back from the address.
export function readClassPlay(search: string): { endAt?: { right?: number; minutes?: number }; goal?: number } {
  const q = new URLSearchParams(search);
  const [kind, n] = (q.get('end') ?? '').split(':');
  const num = Number(n);
  return {
    endAt: kind === 'right' && num > 0 ? { right: num } : kind === 'minutes' && num > 0 ? { minutes: num } : undefined,
    goal: Number(q.get('goal')) > 0 ? Number(q.get('goal')) : undefined,
  };
}

// `unit`: what the class counts. Right answers, or a game's own count (Googler's googly eyes).
export default function ClassPlayOptions({ value, onChange, unit = 'right' }: { value: ClassPlay; onChange: (v: ClassPlay) => void; unit?: 'right' | 'eyes' }) {
  const eyes = unit === 'eyes';
  const set = (p: Partial<ClassPlay>) => onChange({ ...value, ...p });
  // Starts unpicked in setup (teacher, 2026-11-24): the cards first, the rest after a tap.
  const picked = useContext(ChoicePicked);
  const modes = ['together', 'compete'] as const;
  return (
    // Universal views 8 (approved /brand, 2026-11-25): two big cards like the
    // ways to play, Cooperative in Kelly and Mint, Competitive in Pink and
    // Blush (New direction rule 11), straight on the ground; "The game ends"
    // (or the class goal) shows in its own card only after a pick.
    <div className="grid gap-[clamp(1.25rem,4vh,2.25rem)] justify-items-center">
      <div role="radiogroup" aria-label={t('classPlay.style')} className="grid gap-[clamp(1rem,2.5vw,2rem)] justify-center w-full"
        style={{ gridTemplateColumns: 'repeat(2, min(26rem, 44vh, calc((100% - 2rem) / 2)))' }}>
        {modes.map((m) => {
          const on = picked && value.mode === m;
          return (
            <button key={m} type="button" role="radio" aria-checked={on} onClick={() => set({ mode: m })}
              aria-label={`${t(`live.mode.${m}`)}: ${t(m === 'together' ? 'live.mode.togetherHint' : 'live.mode.competeHint')}`}
              className={`group relative aspect-[34/24] min-h-[9rem] rounded-[1.5rem] border-[3px] border-border flex flex-col bg-surface text-center motion-safe:transition-transform motion-safe:hover:-translate-y-1 ${on ? 'ring-4 ring-border ring-offset-4 ring-offset-paper -translate-y-1.5' : ''}`}
              style={{ boxShadow: on ? '0 10px 0 var(--ink)' : '0 5px 0 var(--ink)' }}>
              <span className="flex-1 min-h-0 grid place-items-center rounded-t-[1.3rem] border-b-[3px] border-border" style={{ background: CLASS_MODE_COLORS[m] }} aria-hidden="true">
                <span className="motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:transition-transform"><ClassModeIcon mode={m} size={44} /></span>
              </span>
              <span className="px-3 py-[clamp(0.4rem,1.4vh,0.9rem)] grid gap-1 justify-items-center">
                <span className="title-bubble leading-none text-[clamp(1.35rem,3.6vh,2.1rem)]"><Title text={t(`live.mode.${m}`)} /></span>
                <span className="font-semibold text-sm leading-snug text-balance">{t(m === 'together' ? 'live.mode.togetherHint' : 'live.mode.competeHint')}</span>
              </span>
              {on && <span className="absolute -top-3.5 -right-3.5 w-10 h-10 rounded-full bg-kelly border-[3px] border-border flex items-center justify-center motion-safe:animate-[pop_0.3s_ease-out]" aria-hidden="true"><Check weight="bold" size={20} /></span>}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="w-full max-w-2xl px-[clamp(1rem,3vw,2rem)] py-[clamp(0.75rem,2vh,1.25rem)] grid gap-4 justify-items-stretch rounded-[1.5rem] border-[3px] border-border bg-surface" style={{ boxShadow: '0 5px 0 var(--ink)' }}>
          {value.mode === 'together' ? (
            <Slider label={t(eyes ? 'gg.live.goalLabel' : 'live.goalLabel')} hint={t(eyes ? 'gg.live.goalHint' : 'classPlay.goalHint')} min={10} max={300} value={value.goal} onChange={(goal) => set({ goal })} />
          ) : (
            <>
              <ChoiceRow label={t('classPlay.ends')} value={value.end} onChange={(end) => set({ end, n: end === 'minutes' ? 5 : 10 })}
                options={[{ value: 'teacher', label: t('live.end.teacher') }, { value: 'right', label: t(eyes ? 'gg.live.endRight' : 'live.end.right') }, { value: 'minutes', label: t('live.end.minutes') }]} />
              {value.end === 'right' && <Slider label={t(eyes ? 'gg.live.endRightN' : 'live.end.rightN')} min={1} max={500} value={value.n} onChange={(n) => set({ n })} />}
              {value.end === 'minutes' && <Slider label={t('live.end.minutesN')} min={1} max={30} value={value.n} onChange={(n) => set({ n })} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
