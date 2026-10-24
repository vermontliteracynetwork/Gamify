import { useEffect, useState } from 'react';
import { DiceFive, Minus, Play, Plus } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { rollName } from './nameDice';
import { TeamBadge } from './TeamBadge';
import type { CpuLevel, TurnPlayer } from './turns';
import Title from '../ui/Title';

interface Slot { name: string; kind: 'team' | 'student' | 'cpu' }

// Team or player setup for Share and Versus. Names come from the silly name
// dice by default; the teacher's device can also type a name.
// Used on its own (with a Start button) or as a setup page (onChange only).
export default function TeamSetup({ mode, min, max, onStart, onChange, embedded = false }: {
  mode: 'share' | 'versus'; min: number; max: number;
  onStart?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  onChange?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  embedded?: boolean;
}) {
  const human: Slot['kind'] = mode === 'share' ? 'team' : 'student';
  const [slots, setSlots] = useState<Slot[]>(() => {
    const first = rollName();
    return [{ name: first, kind: human }, { name: rollName(Math.random, [first]), kind: human }].slice(0, Math.max(min, 2));
  });
  const [opponent, setOpponent] = useState<'cpu' | 'teacher'>('cpu');
  const [level, setLevel] = useState<CpuLevel>('medium');

  const names = () => slots.map((s) => s.name);
  const resize = (n: number) => setSlots((cur) => {
    const next = cur.slice(0, n);
    while (next.length < n) next.push({ name: rollName(Math.random, next.map((s) => s.name)), kind: human });
    return next;
  });
  const solo = mode === 'share' && slots.length === 1;
  const hasCpu = solo ? opponent === 'cpu' : slots.some((s) => s.kind === 'cpu');

  function build(): TurnPlayer[] {
    const players: TurnPlayer[] = slots.map((s, i) => ({ id: `p${i}`, name: s.kind === 'cpu' ? t('teams.computer') : s.name, kind: s.kind, colorIndex: i, score: 0 }));
    if (solo) players.push({ id: 'p-other', name: opponent === 'cpu' ? t('teams.computer') : t('teams.teacher'), kind: opponent, colorIndex: 9, score: 0 });
    return players;
  }
  function start() { onStart?.(build(), level); }
  useEffect(() => { onChange?.(build(), level); }, [slots, opponent, level]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={embedded ? 'grid gap-5' : 'bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-5 max-w-2xl mx-auto'} style={embedded ? undefined : { boxShadow: 'var(--shadow-sticker-lg)' }}>
      {!embedded && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={mode === 'share' ? t('teams.title') : t('teams.players')} /></h1>}

      <div className="flex items-center gap-3">
        <span className="font-bold">{mode === 'share' ? t('teams.count') : t('teams.playerCount')}</span>
        <button type="button" aria-label={t('teams.less')} disabled={slots.length <= min} onClick={() => resize(slots.length - 1)}
          className="w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Minus weight="bold" size={22} /></button>
        <span className="font-display text-3xl font-bold w-10 text-center tabular-nums" aria-live="polite">{slots.length}</span>
        <button type="button" aria-label={t('teams.more')} disabled={slots.length >= max} onClick={() => resize(slots.length + 1)}
          className="w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Plus weight="bold" size={22} /></button>
      </div>

      <ol className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
        {slots.map((s, i) => (
          <li key={i} className="flex items-center gap-2 rounded-input border-[2px] border-border-soft p-2">
            <TeamBadge colorIndex={i} />
            {s.kind === 'cpu' ? (
              <span className="flex-1 font-bold">{t('teams.computer')}</span>
            ) : (
              <input id={`slot-${i}`} value={s.name} aria-label={t('teams.name', { n: i + 1 })} maxLength={24}
                onChange={(e) => setSlots((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="flex-1 min-w-0 min-h-11 px-2 rounded-input border-[2px] border-border-soft font-bold" />
            )}
            {s.kind !== 'cpu' && (
              <button type="button" aria-label={t('teams.roll', { name: s.name })}
                onClick={() => setSlots((cur) => cur.map((x, j) => (j === i ? { ...x, name: rollName(Math.random, names()) } : x)))}
                className="w-11 h-11 rounded-full border-[2px] border-border bg-accent flex items-center justify-center"><DiceFive weight="fill" size={22} /></button>
            )}
            {mode === 'versus' && i > 0 && (
              <button type="button" onClick={() => setSlots((cur) => cur.map((x, j) => (j === i ? { ...x, kind: x.kind === 'cpu' ? 'student' : 'cpu' } : x)))}
                className="min-h-11 px-3 rounded-pill border-[2px] border-border bg-surface-2 font-bold text-sm">
                {s.kind === 'cpu' ? t('teams.cpu') : t('teams.human')}
              </button>
            )}
          </li>
        ))}
      </ol>

      {solo && (
        <Choice label={t('teams.opponent')} value={opponent} options={[['cpu', 'teams.vsCpu'], ['teacher', 'teams.vsTeacher']]} onChange={setOpponent} />
      )}
      {hasCpu && <Choice label={t('teams.level')} value={level} options={[['easy', 'opt.easy'], ['medium', 'opt.medium'], ['hard', 'opt.hard']]} onChange={setLevel} />}

      {onStart && <button type="button" onClick={start} disabled={slots.some((s) => s.kind !== 'cpu' && !s.name.trim())}
        className="justify-self-center min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl font-bold inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
        style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <Play weight="fill" size={28} />{t('teams.start')}
      </button>}
    </section>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, StringKey][]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map(([v, key]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={`min-h-12 px-5 rounded-pill border-[2px] font-bold ${value === v ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(key)}</button>
        ))}
      </div>
    </div>
  );
}
