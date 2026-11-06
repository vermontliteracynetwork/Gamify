import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DiceFive, Minus, Play, Plus, UsersThree, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { rollName } from './nameDice';
import { balancedTeams, randomTeams } from './teamMaker';
import { TEAM_ICONS, TeamBadge } from './TeamBadge';
import type { CpuLevel, TurnPlayer } from './turns';
import Title from '../ui/Title';
import { useSignedIn } from '../auth/session';
import { useSession } from '../student/session';

// `icon` is the team picture (and color) picked from the theme's team icons.
interface Slot { name: string; kind: 'team' | 'student' | 'cpu'; icon?: number; character?: number }
export interface Character { id: string; name: string; image: string }

// Team or player setup for Share and Versus. Names come from the silly name
// dice by default; the teacher's device can also type a name.
// Used on its own (with a Start button) or as a setup page (onChange only).
export default function TeamSetup({ mode, min, max, onStart, onChange, embedded = false, characters }: {
  mode: 'share' | 'versus'; min: number; max: number;
  // Characters to pick from (Board Game animals, teacher 2026-10-31), in place of team icons.
  characters?: Character[];
  onStart?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  onChange?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  embedded?: boolean;
}) {
  const human: Slot['kind'] = mode === 'share' ? 'team' : 'student';
  // Play or share passes how teams are made (?teams=teacher|random|class).
  const how = mode === 'share' ? new URLSearchParams(useLocation().search).get('teams') : null;
  // A student alone on their own device (a class lobby or choice board)
  // plays as themself against the computer (teacher, 2026-10-31).
  const session = useSession();
  const { teacher } = useSignedIn();
  const alone = mode === 'versus' && !!session && !teacher;
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (alone) return [{ name: session.name, kind: human }, { name: t('teams.computer'), kind: 'cpu' }];
    const first = rollName();
    return [{ name: first, kind: human }, { name: rollName(Math.random, [first]), kind: human }].slice(0, how === 'class' && min <= 1 ? 1 : Math.max(min, 2));
  });
  const [opponent, setOpponent] = useState<'cpu' | 'teacher'>('cpu');
  const [members, setMembers] = useState<string[][]>([]);
  const [level, setLevel] = useState<CpuLevel>('medium');
  const [picking, setPicking] = useState<number | null>(null);
  const iconOf = (i: number) => slots[i]?.icon ?? i;
  // Each player starts with a different character, picked at random; tap it to choose another.
  const [deal] = useState(() => (characters ? characters.map((_, k) => k).sort(() => Math.random() - 0.5) : []));
  const charOf = (i: number) => slots[i]?.character ?? deal[i % Math.max(1, deal.length)] ?? 0;
  function pickCharacter(i: number, c: number) {
    setSlots((cur) => {
      const other = cur.findIndex((_x, j) => j !== i && charOf(j) === c);
      return cur.map((x, j) => (j === i ? { ...x, character: c } : j === other ? { ...x, character: charOf(i) } : x));
    });
    setPicking(null);
  }
  // Picking a picture another team has trades the two.
  function pickIcon(i: number, icon: number) {
    setSlots((cur) => {
      const other = cur.findIndex((x, j) => j !== i && (x.icon ?? j) === icon);
      return cur.map((x, j) => (j === i ? { ...x, icon } : j === other ? { ...x, icon: cur[i].icon ?? i } : x));
    });
    setPicking(null);
  }

  const names = () => slots.map((s) => s.name);
  const resize = (n: number) => setSlots((cur) => {
    const next = cur.slice(0, n);
    while (next.length < n) next.push({ name: rollName(Math.random, next.map((s) => s.name)), kind: human });
    return next;
  });
  const solo = mode === 'share' && slots.length === 1;
  const hasCpu = solo ? opponent === 'cpu' : slots.some((s) => s.kind === 'cpu');

  function build(): TurnPlayer[] {
    const players: TurnPlayer[] = slots.map((s, i) => ({ id: `p${i}`, name: s.kind === 'cpu' ? t('teams.computer') : s.name, kind: s.kind, colorIndex: s.icon ?? i, score: 0, ...(members[i]?.length ? { members: members[i] } : {}), ...(characters?.length ? { art: characters[charOf(i)].image } : {}) }));
    const free = [9, ...TEAM_ICONS.keys()].find((k) => !players.some((p) => p.colorIndex === k)) ?? 9;
    const freeChar = characters?.length ? characters[deal.find((k) => !slots.some((_s, j) => charOf(j) === k)) ?? 0].image : undefined;
    if (solo) players.push({ id: 'p-other', name: opponent === 'cpu' ? t('teams.computer') : t('teams.teacher'), kind: opponent, colorIndex: free, score: 0, ...(freeChar ? { art: freeChar } : {}) });
    return players;
  }
  function start() { onStart?.(build(), level); }
  useEffect(() => { onChange?.(build(), level); }, [slots, opponent, level, members]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={embedded ? 'grid gap-5' : 'bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-5 max-w-2xl mx-auto'} style={embedded ? undefined : { boxShadow: 'var(--shadow-sticker-lg)' }}>
      {!embedded && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={mode === 'share' ? t('teams.title') : t('teams.players')} /></h1>}

      {/* A game with a fixed number of players (Four in a Row: always 2) shows no count (teacher, 2026-10-31). */}
      {min !== max && <div className="flex items-center gap-2 text-base">
        <span className="font-bold">{mode === 'share' ? t('teams.count') : t('teams.playerCount')}</span>
        <button type="button" aria-label={t('teams.less')} disabled={slots.length <= min} onClick={() => resize(slots.length - 1)}
          className="w-10 h-10 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Minus weight="bold" size={18} /></button>
        <span className="font-display text-2xl font-bold w-8 text-center tabular-nums" aria-live="polite">{slots.length}</span>
        <button type="button" aria-label={t('teams.more')} disabled={slots.length >= max} onClick={() => resize(slots.length + 1)}
          className="w-10 h-10 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Plus weight="bold" size={18} /></button>
        {mode === 'share' && !solo && <ClassTeams teams={slots.length} names={names()} icons={slots.map((_s, i) => iconOf(i))} autoRandom={how === 'random'} onChange={setMembers} />}
      </div>}

      {/* Characters (Board Game animals) show as player cards: the animal big,
          no circle around it, the name under it (teacher, 2026-11-01). */}
      {/* Versus players are big cards too (teacher, 2026-11-06). */}
      <ol className={`grid items-start list-none p-0 m-0 ${characters?.length ? 'gap-2 grid-cols-2 lg:grid-cols-3' : mode === 'versus' ? 'gap-5 grid-cols-2 w-full max-w-3xl mx-auto' : 'gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
        {slots.map((s, i) => (
          <li key={i} className={true
            ? `flex flex-wrap items-center justify-center gap-2 rounded-panel border-[2.5px] border-border bg-surface p-3 ${mode === 'versus' ? 'min-h-[min(18rem,40vh)] content-center p-5' : ''}`
            : 'flex flex-wrap items-center gap-2 rounded-input border-[2px] border-border-soft p-2'}
            style={true ? { boxShadow: 'var(--shadow-sticker)' } : undefined}>
            <button type="button" aria-label={characters?.length ? t('teams.pickCharacter', { name: s.name }) : t('teams.pickIcon', { name: s.name })} aria-expanded={picking === i} aria-haspopup="true"
              onClick={() => setPicking(picking === i ? null : i)} className={`${true ? 'basis-full flex justify-center' : 'rounded-full p-0.5 -m-0.5'} motion-safe:hover:scale-110 motion-safe:transition-transform`}>
              {characters?.length
                ? <img src={characters[charOf(i)].image} alt="" className="w-[min(6.5rem,14vh)] aspect-square object-contain drop-shadow-[0_4px_0_rgba(0,0,0,0.18)]" />
                : <TeamBadge colorIndex={iconOf(i)} size={mode === 'versus' ? 128 : 84} />}
            </button>
            {picking === i && characters?.length ? (
              // A pop-up box of big animal tiles, so the setup page never scrolls (teacher, 2026-10-31).
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={() => setPicking(null)}>
                <div role="dialog" aria-modal="true" aria-label={t('teams.pickCharacter', { name: s.name })} onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl bg-surface border-[3px] border-border rounded-panel p-4 sm:p-5 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setPicking(null); }}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-bold">{t('teams.pickCharacter', { name: s.name })}</h3>
                    <button type="button" autoFocus onClick={() => setPicking(null)} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
                  </div>
                  <div role="group" aria-label={t('teams.pickCharacter', { name: s.name })} className="grid grid-cols-5 gap-2">
                    {characters.map((c, k) => {
                      const owner = slots.findIndex((_x, j) => charOf(j) === k);
                      return (
                        <button key={c.id} type="button" aria-pressed={owner === i} title={c.name}
                          aria-label={owner >= 0 && owner !== i ? t('teams.characterTaken', { animal: c.name, name: slots[owner].name }) : c.name}
                          onClick={() => pickCharacter(i, k)}
                          className={`grid justify-items-center rounded-input p-1 border-[3px] ${owner === i ? 'border-border bg-accent' : 'border-transparent bg-surface-2'} ${owner >= 0 && owner !== i ? 'opacity-45' : ''} motion-safe:hover:scale-105 motion-safe:transition-transform`}>
                          <img src={c.image} alt="" className="w-[min(4.5rem,12vh)] aspect-square object-contain" />
                          <span className="text-xs font-bold leading-tight">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : picking === i && (
              // Every team picture in a full view; pick one to go back (teacher, 2026-11-06).
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={() => setPicking(null)}>
              <div role="dialog" aria-modal="true" aria-label={t('teams.pickIcon', { name: s.name })} onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl bg-surface border-[3px] border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
                onKeyDown={(e) => { if (e.key === 'Escape') setPicking(null); }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold">{t('teams.pickIcon', { name: s.name })}</h3>
                  <button type="button" autoFocus onClick={() => setPicking(null)} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
                </div>
              <div role="group" aria-label={t('teams.pickIcon', { name: s.name })} className="grid grid-cols-5 justify-items-center gap-3">
                {TEAM_ICONS.map((_, k) => {
                  const owner = slots.findIndex((_x, j) => iconOf(j) === k);
                  return (
                    <button key={k} type="button" aria-pressed={owner === i}
                      aria-label={owner >= 0 && owner !== i ? t('teams.iconTaken', { n: k + 1, name: slots[owner].name }) : t('teams.iconN', { n: k + 1 })}
                      onClick={() => pickIcon(i, k)}
                      className={`rounded-full p-1.5 border-[3px] ${owner === i ? 'border-border bg-accent' : 'border-transparent'} ${owner >= 0 && owner !== i ? 'opacity-50' : ''} motion-safe:hover:scale-105 motion-safe:transition-transform`}>
                      <TeamBadge colorIndex={k} size={96} />
                    </button>
                  );
                })}
              </div>
              </div>
              </div>
            )}
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

// Optional: put students from a class list on the teams (random, balanced
// by how often they get questions right, or hand-picked), and save the
// arrangement to use again.
function ClassTeams({ teams, names, icons, autoRandom = false, onChange }: { teams: number; names: string[]; icons: number[]; autoRandom?: boolean; onChange: (m: string[][]) => void }) {
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [classId, setClassId] = useState('');
  const { value: students = [] } = useAsync<Student[]>(async () => (classId ? data.listStudents(classId) : []), [classId]);
  const { value: saved = [], reload } = useAsync(async () => (classId ? (await data.getSetting<SavedTeams[]>(`team-sets:${classId}`)) ?? [] : []), [classId]);
  const [groups, setGroups] = useState<string[][]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
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
  // Random teams: the first student list, mixed as soon as it loads.
  useEffect(() => { if (autoRandom && !classId && classes.length) setClassId(classes[0].id); }, [autoRandom, classes.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoRandom && students.length && groups.length === 0) void make('random'); }, [autoRandom, students.length, teams]); // eslint-disable-line react-hooks/exhaustive-deps
  if (classes.length === 0) return null;
  const unplaced = students.filter((s) => !groups.flat().includes(s.id));

  // A small button by the team count opens a full page for putting students
  // on teams, by hand or automatically (teacher, 2026-11-06). The page stays
  // mounted while closed, so picks are kept.
  return (
    <>
    <button type="button" onClick={() => setOpen(true)} className="ml-auto min-h-9 px-3 rounded-pill border-[2px] border-border bg-surface font-bold text-sm inline-flex items-center gap-1.5 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform">
      <UsersThree weight="bold" size={16} aria-hidden="true" />{t('teams.fromClassBtn')}{groups.flat().length > 0 && <span className="rounded-pill bg-accent border border-border px-1.5 text-xs">{groups.flat().length}</span>}
    </button>
    <div className={open ? 'fixed inset-0 z-50 bg-surface overflow-y-auto' : 'hidden'} role="dialog" aria-modal="true" aria-label={t('teams.fromClass')}>
    <div className="max-w-5xl mx-auto px-6 py-6 grid gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold flex-1">{t('teams.fromClass')}</h2>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-6 rounded-pill border-[2.5px] border-border bg-accent font-display text-lg font-bold" style={{ boxShadow: '0 3px 0 #000' }}>{t('teams.done')}</button>
      </div>
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
                <span className="flex items-center gap-2 font-bold"><TeamBadge colorIndex={icons[i] ?? i} size={28} />{names[i]}</span>
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
    </div>
    </>
  );
}

interface SavedTeams { name: string; groups: string[][] }
