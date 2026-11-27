import { FitInput } from '../ui/FitText';
import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { FooterSlot } from '../games/SetupWizard';
import { useSettings } from '../settings/SettingsContext';
import { useLocation } from 'react-router-dom';
import { DiceFive, Play, Plus, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { nextCpuName } from './cpuNames';
import { rollName } from './nameDice';
import { balancedTeams, randomTeams } from './teamMaker';
import { TEAM_ICONS, TeamBadge } from './TeamBadge';
import { TEAM_PASTELS, type CpuLevel, type TurnPlayer } from './turns';
import Title from '../ui/Title';
import { useSignedIn } from '../auth/session';
import { useSession } from '../student/session';

// `icon` is the team picture (and color) picked from the theme's team icons.
interface Slot { name: string; kind: 'team' | 'student' | 'cpu'; icon?: number; character?: number; key?: number }
// A steady key per card, so a card that leaves or joins animates on its own.
let slotKey = 0;
const keyed = (s: Slot): Slot => ({ ...s, key: ++slotKey });
export interface Character { id: string; name: string; image: string }

// Team or player setup for Share and Versus. Names come from the silly name
// dice by default; the teacher's device can also type a name.
// Used on its own (with a Start button) or as a setup page (onChange only).
export default function TeamSetup({ mode, min, max, onStart, onChange, embedded = false, characters, inOrder = false, vsComputer = false }: {
  mode: 'share' | 'versus'; min: number; max: number;
  // Characters to pick from (Board Game animals, teacher 2026-10-31), in place of team icons.
  characters?: Character[];
  // Start player 1 on the first character, player 2 on the second (a theme's own pair, e.g. Four in a Row Classic).
  inOrder?: boolean;
  onStart?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  onChange?: (players: TurnPlayer[], cpuLevel: CpuLevel) => void;
  embedded?: boolean;
  // Solo against the computer (teacher, 2026-11-23: Versus is shown as Solo): player 2 starts as the computer.
  vsComputer?: boolean;
}) {
  const human: Slot['kind'] = mode === 'share' ? 'team' : 'student';
  // Play or share passes how teams are made (?teams=teacher|random|class).
  const how = mode === 'share' ? new URLSearchParams(useLocation().search).get('teams') : null;
  // A student alone on their own device (a class lobby or choice board)
  // plays as themself against the computer (teacher, 2026-10-31).
  const session = useSession();
  const { teacher } = useSignedIn();
  const alone = mode === 'versus' && !!session && !teacher;
  // The computer's fun name for this game (teacher, 2026-11-24), a new one each game.
  const [cpuName] = useState(nextCpuName);
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (alone) return [{ name: session.name, kind: human }, { name: cpuName, kind: 'cpu' as const }].map(keyed);
    // Against the computer (the Solo way), player 2 is the computer; there is no person/computer switch (owner, 2026-11-27).
    if (vsComputer) return [{ name: rollName(), kind: human }, { name: cpuName, kind: 'cpu' as const }].map(keyed);
    const first = rollName();
    return [{ name: first, kind: human }, { name: rollName(Math.random, [first]), kind: human }].slice(0, how === 'class' && min <= 1 ? 1 : Math.max(min, 2)).map(keyed);
  });
  // Solo plays the computer; Share players are people (owner, 2026-11-27: "remove the person/computer entirely").
  const opponent = 'cpu' as const;
  const [members, setMembers] = useState<string[][]>([]);
  const [level, setLevel] = useState<CpuLevel>('medium');
  const [picking, setPicking] = useState<number | null>(null);
  const iconOf = (i: number) => slots[i]?.icon ?? i;
  // Each player starts with a different character, picked at random; tap it to choose another.
  const [deal] = useState(() => (characters ? (inOrder ? characters.map((_, k) => k) : characters.map((_, k) => k).sort(() => Math.random() - 0.5)) : []));
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
    while (next.length < n) next.push(keyed({ name: rollName(Math.random, next.map((s) => s.name)), kind: human }));
    return next;
  });
  const solo = mode === 'share' && slots.length === 1;
  const hasCpu = solo || slots.some((s) => s.kind === 'cpu');

  function build(): TurnPlayer[] {
    const players: TurnPlayer[] = slots.map((s, i) => ({ id: `p${i}`, name: s.kind === 'cpu' ? cpuName : s.name, kind: s.kind, colorIndex: s.icon ?? i, score: 0, ...(members[i]?.length ? { members: members[i] } : {}), ...(characters?.length ? { art: characters[charOf(i)].image } : {}) }));
    const free = [9, ...TEAM_ICONS.keys()].find((k) => !players.some((p) => p.colorIndex === k)) ?? 9;
    const freeChar = characters?.length ? characters[deal.find((k) => !slots.some((_s, j) => charOf(j) === k)) ?? 0].image : undefined;
    if (solo) players.push({ id: 'p-other', name: cpuName, kind: opponent, colorIndex: free, score: 0, ...(freeChar ? { art: freeChar } : {}) });
    return players;
  }
  function start() { onStart?.(build(), level); }
  useEffect(() => { onChange?.(build(), level); }, [slots, opponent, level, members]); // eslint-disable-line react-hooks/exhaustive-deps

  // Teams (Universal views 6, approved 2026-11-25): no count selector. An
  // Add team button sits between Back and Next (the setup footer), an x on
  // each card takes one away, and the cards sit centered, wrapping onto
  // centered rows; a new card pops in while the others slide over.
  const counted = min !== max;
  const canRemove = counted && slots.length > min;
  const removeAt = (i: number) => setSlots((cur) => (cur.length > min ? cur.filter((_x, j) => j !== i) : cur));
  const footer = useContext(FooterSlot);
  const addBtn = counted && (
    <button type="button" onClick={() => resize(slots.length + 1)} disabled={slots.length >= max} data-testid="add-team"
      className="max-sm:order-3 min-h-12 px-6 rounded-pill border-[3px] border-border bg-white font-bold text-lg inline-flex items-center gap-2 shadow-[0_4px_0_var(--ink)] disabled:opacity-40 disabled:shadow-none active:scale-95 motion-safe:transition-transform">
      <Plus weight="bold" size={20} />{mode === 'share' ? t('teams.add') : t('teams.addPlayer')}
    </button>
  );
  const big = mode === 'versus';

  return (
    <section className={embedded ? 'grid gap-4 content-center' : 'bg-surface border-bold border-border rounded-panel p-5 sm:p-6 grid gap-5 max-w-2xl mx-auto'} style={embedded ? undefined : { boxShadow: 'var(--shadow-sticker-lg)' }}>
      {!embedded && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={mode === 'share' ? t('teams.title') : t('teams.players')} /></h1>}


      {/* Characters (Board Game animals) show as player cards: the animal big,
          no circle around it, the name under it (teacher, 2026-11-01). */}
      {/* Versus players are big cards too (teacher, 2026-11-06). */}
      <ol className={`flex flex-wrap justify-center content-center list-none p-0 m-0 ${big ? 'gap-6' : 'gap-x-[clamp(0.75rem,2vw,1.25rem)] gap-y-5'}`}>
        <AnimatePresence initial={false}>
        {slots.map((s, i) => (
          <motion.li key={s.key ?? i} layout={!still}
            initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={still ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.6, opacity: 0, transition: { duration: 0.18 } }}
            transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 17, layout: { type: 'spring', stiffness: 320, damping: 30 } }}
            className={`group relative grid justify-items-center gap-3 ${big ? 'w-[min(18rem,42vw)]' : 'w-[clamp(8.5rem,calc(50%-0.5rem),13rem)]'}`}>
            {/* The team picture on its own, glowing and bobbing on hover, the name plate
                centered under it (owner, 2026-11-27, her classroom-game reference). Tap the
                picture to pick another. */}
            <div className="relative">
              <motion.button type="button" aria-label={characters?.length ? t('teams.pickCharacter', { name: s.name }) : t('teams.pickIcon', { name: s.name })} aria-expanded={picking === i} aria-haspopup="true"
                onClick={() => setPicking(picking === i ? null : i)}
                whileHover={still ? undefined : { y: [0, -6, 0], rotate: [0, -3, 3, 0], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } }}
                className="rounded-full motion-safe:transition-[filter] duration-200 group-hover:[filter:drop-shadow(0_0_14px_rgba(250,190,55,0.85))_drop-shadow(0_6px_0_rgba(29,26,51,0.25))] [filter:drop-shadow(0_6px_0_rgba(29,26,51,0.2))]">
                {characters?.length
                  ? <img src={characters[charOf(i)].image} alt="" className={`${big ? 'w-[min(9rem,20vh)]' : 'w-[min(6.5rem,14vh)]'} aspect-square object-contain`} />
                  : <TeamBadge colorIndex={iconOf(i)} size={big ? 140 : 96} />}
              </motion.button>
              {s.kind !== 'cpu' && (
                <button type="button" aria-label={t('teams.roll', { name: s.name })}
                  onClick={() => setSlots((cur) => cur.map((x, j) => (j === i ? { ...x, name: rollName(Math.random, names()) } : x)))}
                  className="absolute -left-3 bottom-0 w-10 h-10 rounded-full border-std border-border bg-white flex items-center justify-center active:scale-90 motion-safe:transition-transform" style={{ boxShadow: '0 2px 0 var(--ink)' }}><DiceFive weight="fill" size={20} /></button>
              )}
            </div>
            {canRemove && (
              <button type="button" aria-label={t('teams.remove', { name: s.name })} onClick={() => removeAt(i)}
                className="absolute -top-2 right-0 w-10 h-10 rounded-full border-bold border-border bg-white flex items-center justify-center active:scale-90" style={{ boxShadow: '0 2px 0 var(--ink)' }}><X weight="bold" size={16} /></button>
            )}
            {picking === i && characters?.length ? (
              // A pop-up box of big animal tiles, so the setup page never scrolls (teacher, 2026-10-31).
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={() => setPicking(null)}>
                <div role="dialog" aria-modal="true" aria-label={t('teams.pickCharacter', { name: s.name })} onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl bg-surface border-heavy border-border rounded-panel p-4 sm:p-5 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setPicking(null); }}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-bold text-left">{s.name}</h3>
                    <button type="button" autoFocus onClick={() => setPicking(null)} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-bold border-border bg-white flex items-center justify-center"><X weight="bold" size={20} /></button>
                  </div>
                  <div role="group" aria-label={t('teams.pickCharacter', { name: s.name })} className="grid grid-cols-5 gap-2">
                    {characters.map((c, k) => {
                      const owner = slots.findIndex((_x, j) => charOf(j) === k);
                      return (
                        <button key={c.id} type="button" aria-pressed={owner === i} title={c.name}
                          aria-label={owner >= 0 && owner !== i ? t('teams.characterTaken', { animal: c.name, name: slots[owner].name }) : c.name}
                          onClick={() => pickCharacter(i, k)}
                          className={`grid justify-items-center rounded-input p-1 border-heavy ${owner === i ? 'border-border bg-mint' : 'border-transparent bg-surface-2'} ${owner >= 0 && owner !== i ? 'opacity-45' : ''} motion-safe:hover:scale-105 motion-safe:transition-transform`}>
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
                className="relative w-full max-w-3xl bg-surface border-heavy border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
                onKeyDown={(e) => { if (e.key === 'Escape') setPicking(null); }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold text-left">{s.name}</h3>
                  <button type="button" autoFocus onClick={() => setPicking(null)} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-bold border-border bg-white flex items-center justify-center"><X weight="bold" size={20} /></button>
                </div>
              <div role="group" aria-label={t('teams.pickIcon', { name: s.name })} className="grid grid-cols-5 justify-items-center gap-3">
                {TEAM_ICONS.map((_, k) => {
                  const owner = slots.findIndex((_x, j) => iconOf(j) === k);
                  return (
                    <button key={k} type="button" aria-pressed={owner === i}
                      aria-label={owner >= 0 && owner !== i ? t('teams.iconTaken', { n: k + 1, name: slots[owner].name }) : t('teams.iconN', { n: k + 1 })}
                      onClick={() => pickIcon(i, k)}
                      className={`rounded-full p-1.5 border-heavy ${owner === i ? 'border-border bg-mint' : 'border-transparent'} ${owner >= 0 && owner !== i ? 'opacity-50' : ''} motion-safe:hover:scale-105 motion-safe:transition-transform`}>
                      <TeamBadge colorIndex={k} size={96} />
                    </button>
                  );
                })}
              </div>
              </div>
              </div>
            )}
            <div className="grid gap-2 w-full">
            {s.kind === 'cpu' ? (
              // The computer's level sits where its name would be (teacher, 2026-11-06).
              <select value={level} onChange={(e) => setLevel(e.target.value as CpuLevel)} aria-label={t('teams.level')}
                className="w-full min-w-0 min-h-12 px-3 rounded-[0.9rem] border-[3px] border-border bg-[linear-gradient(180deg,#34305a,#1d1a33)] text-white font-bold text-center shadow-[0_4px_0_rgba(29,26,51,0.35),inset_0_2px_0_rgba(255,255,255,0.15)]">
                {(['easy', 'medium', 'hard'] as const).map((lv) => <option key={lv} value={lv}>{t(`opt.${lv}`)}</option>)}
              </select>
            ) : (
              // The whole card width for the name; FitInput shrinks long names so none is cut off.
              <FitInput id={`slot-${i}`} value={s.name} aria-label={t('teams.name', { n: i + 1 })} maxLength={24}
                onChange={(e) => setSlots((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="w-full min-w-0 min-h-12 px-3 rounded-[0.9rem] border-[3px] border-border bg-[linear-gradient(180deg,#34305a,#1d1a33)] text-white font-bold text-lg text-center shadow-[0_4px_0_rgba(29,26,51,0.35),inset_0_2px_0_rgba(255,255,255,0.15)] placeholder:text-white/60" />
            )}
            {/* Each player on the team as their own card (owner, 2026-11-27). */}
            {members[i]?.length > 0 && <ul className="grid gap-1.5 list-none p-0 m-0">{members[i].map((n) => <li key={n} className="min-h-10 px-3 rounded-[0.75rem] border-std border-border bg-white font-bold text-sm flex items-center gap-2" style={{ boxShadow: '0 2px 0 var(--ink)' }}><span className="w-3 h-3 rounded-full border border-border shrink-0" style={{ background: TEAM_PASTELS[iconOf(i) % TEAM_PASTELS.length] }} />{n}</li>)}</ul>}
            </div>
          </motion.li>
        ))}
        </AnimatePresence>
      </ol>
      {addBtn && (footer && embedded ? createPortal(addBtn, footer) : <div className="flex justify-center">{addBtn}</div>)}
      {/* Students on teams, right under the teams (no separate button or page). */}
      {counted && mode === 'share' && !solo && <ClassTeams teams={slots.length} names={names()} icons={slots.map((_s, i) => iconOf(i))} autoRandom={how === 'random'} onChange={setMembers} />}


      {hasCpu && !slots.some((x) => x.kind === 'cpu') && <Choice label={t('teams.level')} value={level} options={[['easy', 'opt.easy'], ['medium', 'opt.medium'], ['hard', 'opt.hard']]} onChange={setLevel} />}

      {onStart && <button type="button" onClick={start} disabled={slots.some((s) => s.kind !== 'cpu' && !s.name.trim())}
        className="justify-self-center min-h-16 px-10 rounded-pill border-bold border-border bg-accent font-display text-2xl font-bold inline-flex items-center gap-2 active:scale-95 disabled:opacity-40"
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
            className={`min-h-12 px-5 rounded-pill border-std font-bold ${value === v ? 'bg-mint border-border' : 'bg-surface border-border-soft'}`}>{t(key)}</button>
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
    <section aria-label={t('teams.fromClass')} className="grid gap-3 rounded-[1.25rem] border-std border-border bg-white/70 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={t('teams.pickClass')} value={classId} onChange={(e) => { setClassId(e.target.value); apply([]); }} className="min-h-11 px-3 rounded-input border-std border-border bg-surface font-bold">
          <option value="">{t('teams.noClass')}</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {classId && students.length > 0 && <>
          <button type="button" onClick={() => void make('random')} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold">{t('teams.random')}</button>
          <button type="button" onClick={() => void make('balanced')} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold">{t('teams.balanced')}</button>
          {saved.map((sv) => <button key={sv.name} type="button" onClick={() => apply(sv.groups.slice(0, teams))} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold">{sv.name}</button>)}
        </>}
      </div>
      {classId && students.length > 0 && (
        <>
          {unplaced.length > 0 && (
            <div className="grid gap-2">
              <p className="text-sm font-bold text-muted m-0">{t('teams.handPick')}</p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2 list-none p-0 m-0" aria-label={t('teams.unplaced')}>
                {unplaced.map((s) => (
                  <li key={s.id}><button type="button" aria-pressed={held === s.id} onClick={() => setHeld(held === s.id ? null : s.id)}
                    className={`w-full min-h-11 px-3 rounded-[0.75rem] border-std font-bold text-sm text-left ${held === s.id ? 'bg-mint border-border' : 'bg-white border-border-soft'}`} style={{ boxShadow: held === s.id ? '0 2px 0 var(--ink)' : undefined }}>{s.name}</button></li>
                ))}
              </ul>
            </div>
          )}
          {held && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('teams.handPick')}>
              {Array.from({ length: teams }, (_, i) => <button key={i} type="button" onClick={() => tapTeam(i)} className="min-h-11 px-3 rounded-pill border-std border-border bg-white font-bold inline-flex items-center gap-2"><TeamBadge colorIndex={icons[i] ?? i} size={26} />{names[i]}</button>)}
            </div>
          )}
          {groups.flat().length > 0 && (
            <div className="flex flex-wrap gap-2">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={t('teams.saveName')} aria-label={t('teams.saveName')} maxLength={30} className="min-h-11 px-3 rounded-input border-std border-border font-bold" />
              <button type="button" disabled={!saveName.trim()} onClick={async () => {
                const list = [...saved.filter((x) => x.name !== saveName.trim()), { name: saveName.trim(), groups }];
                await data.setSetting(`team-sets:${classId}`, list); setSaveName(''); reload();
              }} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold disabled:opacity-40">{t('teams.save')}</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

interface SavedTeams { name: string; groups: string[][] }
