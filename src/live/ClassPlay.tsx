import { t } from '../i18n';
import { ChoiceRow, Slider } from '../ui/fields';

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

export default function ClassPlayOptions({ value, onChange }: { value: ClassPlay; onChange: (v: ClassPlay) => void }) {
  const set = (p: Partial<ClassPlay>) => onChange({ ...value, ...p });
  return (
    <div className="grid gap-5">
      <ChoiceRow label={t('classPlay.style')} value={value.mode} onChange={(mode) => set({ mode })}
        options={[{ value: 'compete', label: `${t('live.mode.compete')}: ${t('live.mode.competeHint')}` }, { value: 'together', label: `${t('live.mode.together')}: ${t('live.mode.togetherHint')}` }]} />
      {value.mode === 'together' ? (
        <Slider label={t('live.goalLabel')} hint={t('classPlay.goalHint')} min={10} max={300} value={value.goal} onChange={(goal) => set({ goal })} />
      ) : (
        <>
          <ChoiceRow label={t('classPlay.ends')} value={value.end} onChange={(end) => set({ end, n: end === 'minutes' ? 5 : 10 })}
            options={[{ value: 'teacher', label: t('live.end.teacher') }, { value: 'right', label: t('live.end.right') }, { value: 'minutes', label: t('live.end.minutes') }]} />
          {value.end === 'right' && <Slider label={t('live.end.rightN')} min={1} max={500} value={value.n} onChange={(n) => set({ n })} />}
          {value.end === 'minutes' && <Slider label={t('live.end.minutesN')} min={1} max={30} value={value.n} onChange={(n) => set({ n })} />}
        </>
      )}
    </div>
  );
}
