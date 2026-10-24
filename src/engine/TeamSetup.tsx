import { useEffect, useState } from 'react';
import { DiceFive, Minus, Play, Plus } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { rollName } from './nameDice';
import { balancedTeams, randomTeams } from './teamMaker';
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
  const [members, setMembers] = useState<string[][]>([]);
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
    const players: TurnPlayer[] = slots.map((s, i) => ({ id: `p${i}`, name: s.kind === 'cpu' ? t('teams.computer') : s.name, kind: s.kind, colorIndex: i, score: 0, ...(members[i]?.length ? { members: members[i] } : {}) }));
    if (solo) players.push({ id: 'p-other', name: opponent === 'cpu' ? t('teams.computer') : t('teams.teacher'), kind: opponent, colorIndex: 9, score: 0 });
    return players;
  }
  function start() { onStart?.(build(), level); }
  useEffect(() => { onChange?.(build(), level); }, [slots, opponent, level, members]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {mode === 'share' && !solo && <ClassTeams teams={slots.length} names={names()} onChange={setMembers} />}

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

// Optional: put students from a class list on the teams (random, balanced
// by how often they get questions right, or hand-picked), and save the
// arrangement to use again.
function ClassTeams({ teams, names, onChange }: { teams: number; names: string[]; onChange: (m: string[][]) => void }) {
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [classId, setClassId] = useState('');
  const { value: students = [] } = useAsync<Student[]>(async () => (classId ? data.listStudents(classId) : []), [classId]);
  const { value: saved = [], reload } = useAsync(async () => (classId ? (await data.getSetting<SavedTeams[]>(`team-sets:${classId}`)) ?? [] : []), [classId]);
  const [groups, setGroups] = useState<string[][]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? '';
  function apply(g: string[][]) { setGroups(g); onChange(g.map((ids) => ids.map(nameOf).filter(Boolean))); }
  async function make(how: 'random' | 'balanced') {
    const ids = students.map((s) => s.id);
    if (how === 'random') { apply(randomTeams(ids, teams)); return; }
    const log = await data.listQuestionLog({ classroomId: classId });
    const skill: Record<string, number | undefined> = {};
    for (const id of ids) { const mine = log.filter((e) => e.studentId === id && e.outcome !== 'left'); skill[id] = mine.length ? mine.filter((e) => e.outcome === 'right').length / mine.length : undefined; }
    apply(balancedTeams(ids, teams, skill));
  }
  function tapTeam(i: number) {
    if (!held) return;
    const g = Array.from({ length: teams }, (_, k) => (groups[k] ?? []).filter((x) => x !== held));
    g[i].push(held);
    setHeld(null);
    apply(g);
  }
  if (classes.length === 0) return null;
  const unplaced = students.filter((s) => !groups.flat().includes(s.id));

  return (
    <div className="grid gap-3 rounded-input border-[2px] border-border-soft p-3">
      <span className="font-bold">{t('teams.fromClass')}</span>
      <select aria-label={t('teams.pickClass')} value={classId} onChange={(e) => { setClassId(e.target.value); apply([]); }} className="min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold">
        <option value="">{t('teams.noClass')}</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {classId && students.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void make('random')} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold">{t('teams.random')}</button>
            <button type="button" onClick={() => void make('balanced')} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold">{t('teams.balanced')}</button>
            {saved.map((sv) => (
              <button key={sv.name} type="button" onClick={() => apply(sv.groups.slice(0, teams))} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-accent font-bold">{sv.name}</button>
            ))}
          </div>
          <p className="text-sm font-bold text-muted">{t('teams.handPick')}</p>
          {unplaced.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label={t('teams.unplaced')}>
              {unplaced.map((s) => (
                <button key={s.id} type="button" aria-pressed={held === s.id} onClick={() => setHeld(held === s.id ? null : s.id)}
                  className={`min-h-10 px-3 rounded-pill border-[2px] font-bold text-sm ${held === s.id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{s.name}</button>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            {Array.from({ length: teams }, (_, i) => (
              <div key={i} role="group" aria-label={names[i]} onClick={() => tapTeam(i)} className={`rounded-input border-[2px] p-2 grid gap-1.5 ${held ? 'border-border bg-surface-2 cursor-pointer' : 'border-border-soft'}`}>
                <span className="flex items-center gap-2 font-bold"><TeamBadge colorIndex={i} size={28} />{names[i]}</span>
                <span className="flex flex-wrap gap-1">
                  {(groups[i] ?? []).map((id) => (
                    <button key={id} type="button" aria-pressed={held === id} onClick={(e) => { e.stopPropagation(); setHeld(held === id ? null : id); }}
                      className={`min-h-9 px-2.5 rounded-pill border-[2px] font-bold text-sm ${held === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{nameOf(id)}</button>
                  ))}
                </span>
              </div>
            ))}
          </div>
          {groups.flat().length > 0 && (
            <div className="flex flex-wrap gap-2">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={t('teams.saveName')} aria-label={t('teams.saveName')} maxLength={30} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
              <button type="button" disabled={!saveName.trim()} onClick={async () => {
                const list = [...saved.filter((x) => x.name !== saveName.trim()), { name: saveName.trim(), groups }];
                await data.setSetting(`team-sets:${classId}`, list); setSaveName(''); reload();
              }} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold disabled:opacity-50">{t('teams.save')}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SavedTeams { name: string; groups: string[][] }
