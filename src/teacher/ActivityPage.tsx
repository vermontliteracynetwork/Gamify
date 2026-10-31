import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Broadcast, CalendarCheck, DeviceTablet, LockSimple, Play, ProjectorScreen, QrCode, SquaresFour, Sword, UsersThree } from '@phosphor-icons/react';
import { canPlayGame, TIERS } from '../config';
import { data, newId } from '../data';
import { makeGameCode, makeLobbyCode, type GameCode, type LobbyPick } from '../data/gameCodes';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import SetPicker from '../games/SetPicker';
import { t } from '../i18n';
import { UpgradeButton } from '../billing/Upgrade';
import { Button, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { Choices, CodeBox } from './HostDialog';

// Create an activity (teacher, 2026-10-31): question sets, games and
// assignments come together as one "Activity". Step by step: who it is for,
// the game, how they play (big screen with teams, a class lobby on their own
// devices, a code to play solo, pairs, or homework by a date), the question
// set, then the code or the game itself.
type How = 'screen' | 'lobby' | 'code' | 'pairs' | 'homework' | 'each' | 'board';
const HOWS: { id: How; icon: typeof Play; mode?: 'share' | 'live' | 'solo' | 'versus' }[] = [
  { id: 'screen', icon: ProjectorScreen, mode: 'share' },
  { id: 'lobby', icon: Broadcast, mode: 'live' },
  { id: 'code', icon: DeviceTablet, mode: 'solo' },
  { id: 'pairs', icon: Sword, mode: 'versus' },
  { id: 'homework', icon: CalendarCheck, mode: 'solo' },
  // Pro with a class (teacher, 2026-10-31): a game for each student or group,
  // or a choice board of games students pick from.
  { id: 'each', icon: UsersThree, mode: 'solo' },
  { id: 'board', icon: SquaresFour, mode: 'solo' },
];
// The teacher's order (2026-10-31): who, how, the game, the questions, start.
const STEPS = ['who', 'how', 'game', 'set', 'go'] as const;

export default function ActivityPage() {
  const tier = useTier();
  const navigate = useNavigate();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { value: mine = [] } = useMySets();
  const sets = [...mine, ...LIBRARY];
  const [step, setStep] = useState(0);
  const [classId, setClassId] = useState('');
  const [gameId, setGameId] = useState('');
  const [how, setHow] = useState<How | ''>('');
  const [teams, setTeams] = useState<'teacher' | 'random' | 'class'>('teacher');
  const [together, setTogether] = useState<'compete' | 'together'>('compete');
  const [setId, setSetId] = useState<string[]>([]);
  const [board, setBoard] = useState<string[]>([]);
  // How long they play, and a score that ends the game (teacher, 2026-10-31).
  const [minutes, setMinutes] = useState(0);
  const [goal, setGoal] = useState(0);
  const [plan, setPlan] = useState<Record<string, LobbyPick>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const { value: students = [] } = useAsync(() => (classId ? data.listStudents(classId) : Promise.resolve([])), [classId]);
  const [code, setCode] = useState<GameCode | null>(null);
  const [status, setStatus] = useState('');
  const today = new Date().toLocaleDateString('en-CA');
  const days = TIERS[tier].homeworkDaysAhead;
  const lastDue = Number.isFinite(days) ? new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA') : undefined;
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA'));
  const game = GAMES.find((g) => g.id === gameId);
  const set = sets.find((s) => s.id === setId[0]);
  const pro = tier === 'pro';
  const hows = HOWS.filter((h) => (h.id === 'each' || h.id === 'board' ? !!classId : true) && GAMES.some((g) => g.modes.includes(h.mode!)));
  const fits = (g: (typeof GAMES)[number]) => !how || g.modes.includes(HOWS.find((h) => h.id === how)!.mode!);
  const ready = [true, !!how && (how !== 'each' && how !== 'board' || pro), how === 'board' ? board.length > 1 : !!game, !!set, true][step];
  const showClasses = TIERS[tier].hasClasses && classes.length > 0;

  async function finish() {
    if ((!game && how !== 'board') || !set) return;
    const shared = how === 'each' || how === 'board';
    const limits = { ...(minutes ? (shared ? { endAt: Date.now() + minutes * 60000 } : { minutes }) : {}), ...(goal ? { goal } : {}) };
    if (how === 'board') { setCode(await makeLobbyCode({ classId, plan: {}, board: { gameIds: board, setId: set.id } }, limits)); return; }
    if (!game) return;
    if (how === 'screen') { navigate(`/games/${game.id}?set=${set.id}&teams=${teams}`); return; }
    if (how === 'each') { setCode(await makeLobbyCode({ classId, all: { gameId: game.id, setId: set.id }, plan }, limits)); return; }
    if (how === 'lobby') { navigate(`/teacher/live/${(await makeGameCode(game.id, set.id, 'live')).code}?mode=${together}`); return; }
    const made = await makeGameCode(game.id, set.id, how === 'pairs' ? 'versus' : 'play', how === 'homework' ? due : undefined, limits);
    if (how === 'homework' && classId) {
      await data.saveAssignment({ id: newId('asg'), classroomId: classId, setId: set.id, starred: false, endsOn: due });
    }
    setCode(made);
  }

  const card = (on: boolean) => `rounded-input border-[2.5px] text-left bg-surface ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`;
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8">
      <TeacherNav startOpen={false} />
      <PageHeader title={t('activity.title')} subtitle={t('activity.sub')} />
      <ol className="flex flex-wrap gap-2 list-none p-0 m-0 mb-4" aria-label={t('activity.steps')}>
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}
            className={`min-h-10 px-4 rounded-pill border-[2px] font-bold text-sm flex items-center gap-2 ${i === step ? 'bg-accent border-border' : i < step ? 'bg-surface border-border' : 'bg-surface-2 border-border-soft text-muted'}`}>
            <span className="tabular-nums">{i + 1}</span>{t(`activity.step.${s}`)}
          </li>
        ))}
      </ol>
      <Panel className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{t(`activity.q.${STEPS[step]}`)}</h2>
          <div className="flex gap-2">
            {step > 0 && <Button onClick={() => { setStep(step - 1); setCode(null); }}><ArrowLeft weight="bold" size={18} />{t('activity.back')}</Button>}
            {step < STEPS.length - 1 && <Button variant="primary" disabled={!ready} onClick={() => setStep(step + 1)}>{t('activity.next')}<ArrowRight weight="bold" size={18} /></Button>}
          </div>
        </div>

        {STEPS[step] === 'who' && (
          <div role="radiogroup" aria-label={t('activity.q.who')} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button type="button" role="radio" aria-checked={classId === ''} onClick={() => setClassId('')} className={`${card(classId === '')} p-4 grid gap-1`}>
              <span className="font-bold text-lg">{t('activity.anyone')}</span><span className="text-sm font-semibold text-muted">{t('activity.anyoneHint')}</span>
            </button>
            {showClasses && classes.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={classId === c.id} onClick={() => setClassId(c.id)} className={`${card(classId === c.id)} p-4 grid gap-1`}>
                <span className="font-bold text-lg flex items-center gap-2"><UsersThree weight="bold" size={20} />{c.name}</span><span className="text-sm font-semibold text-muted">{t('activity.classHint')}</span>
              </button>
            ))}
            {!TIERS[tier].hasClasses && <div className="flex flex-wrap items-center gap-2 p-2"><p className="text-sm font-bold">{t('activity.classesPlus')}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
          </div>
        )}

        {STEPS[step] === 'game' && (
          <div role={how === 'board' ? 'group' : 'radiogroup'} aria-label={t(how === 'board' ? 'activity.boardPick' : 'activity.q.game')} className="grid gap-3">
            {how === 'board' && <p className="font-bold">{t('activity.boardPick')}</p>}
            {how === 'each' && <p className="font-bold">{t('activity.eachPick')}</p>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GAMES.filter(fits).map((g) => {
                const open = canPlayGame(tier, g.id);
                const on = how === 'board' ? board.includes(g.id) : gameId === g.id;
                return (
                  <button key={g.id} type="button" role={how === 'board' ? 'checkbox' : 'radio'} aria-checked={on} disabled={!open}
                    onClick={() => how === 'board' ? setBoard(on ? board.filter((x) => x !== g.id) : [...board, g.id]) : setGameId(g.id)}
                    className={`${card(on)} overflow-hidden disabled:opacity-60`}>
                    <span className="relative block"><GameCover gameId={g.id} className="aspect-[16/10]" />{!open && <LockSimple weight="fill" size={28} className="absolute top-2 right-2" />}</span>
                    <span className="p-2 grid gap-1"><span className="font-display text-lg">{g.name}</span><span className="flex flex-wrap gap-1">{g.modes.map((m) => <ModeBadge key={m} mode={m} />)}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {STEPS[step] === 'how' && (
          <div className="grid gap-4">
            <div role="radiogroup" aria-label={t('activity.q.how')} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hows.map(({ id, icon: Icon }) => (
                <button key={id} type="button" role="radio" aria-checked={how === id} onClick={() => { setHow(id); setGameId(''); setBoard([]); }}
                  className={`min-h-20 p-3 rounded-input border-[2.5px] text-left grid grid-cols-[auto_1fr] gap-x-3 items-center ${how === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                  <Icon weight="fill" size={30} aria-hidden="true" className="row-span-2" />
                  <span className="font-display text-lg leading-tight flex items-center gap-2">{t(`activity.how.${id}`)}{(id === 'each' || id === 'board') && !pro && <LockSimple weight="fill" size={18} aria-label={t('activity.proOnly')} />}</span>
                  <span className="text-sm font-semibold text-muted leading-snug">{t(`activity.how.${id}Hint`)}</span>
                </button>
              ))}
            </div>
            {(how === 'each' || how === 'board') && !pro && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.proOnly')}</p><UpgradeButton suggest="pro" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'screen' && <Choices label={t('host.teams')} value={teams} onChange={setTeams} options={(['teacher', 'random', 'class'] as const).map((k) => ({ id: k, title: t(`host.teams.${k}`), hint: t(`host.teams.${k}Hint`) }))} />}
            {how === 'lobby' && <Choices label={t('live.howPlay')} value={together} onChange={setTogether} options={(['compete', 'together'] as const).map((k) => ({ id: k, title: t(`live.mode.${k}`), hint: t(`live.mode.${k}Hint`) }))} />}
            {(how === 'code' || how === 'homework' || how === 'each' || how === 'board') && (
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1 font-bold">{t(how === 'each' || how === 'board' ? 'activity.endsIn' : 'activity.playFor')}
                  <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface">
                    {[0, 5, 10, 15, 20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{m ? t('activity.minutes', { count: m }) : t('activity.noLimit')}</option>)}
                  </select>
                  <span className="text-sm font-semibold text-muted">{t('activity.clockHint')}</span>
                </label>
                <label className="grid gap-1 font-bold">{t('activity.goal')}
                  <input type="number" min={0} step={10} value={goal || ''} placeholder={t('activity.goalNone')} onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface" />
                  <span className="text-sm font-semibold text-muted">{t('activity.goalHint')}</span>
                </label>
              </div>
            )}
            {how === 'homework' && (
              <label className="flex flex-wrap items-center gap-2 font-bold">{t('host.due')}
                <input type="date" value={due} min={today} max={lastDue} onChange={(e) => setDue(e.target.value)} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface" />
                {lastDue && <span className="text-sm font-semibold text-muted">{t('host.dueLimit', { days })}</span>}
              </label>
            )}
          </div>
        )}

        {STEPS[step] === 'set' && <SetPicker sets={sets} value={setId} onChange={setSetId} />}

        {STEPS[step] === 'go' && (game || how === 'board') && set && (
          <div className="grid gap-4">
            <dl className="grid sm:grid-cols-4 gap-3 m-0">
              {[[t('activity.step.who'), classes.find((c) => c.id === classId)?.name ?? t('activity.anyone')], [t('activity.step.game'), how === 'board' ? board.map((id) => GAMES.find((g) => g.id === id)?.name).join(', ') : game?.name ?? ''], [t('activity.step.how'), how ? t(`activity.how.${how}`) : ''], [t('activity.step.set'), set.name]].map(([k, v]) => (
                <div key={k} className="rounded-input border-[2px] border-border-soft p-3"><dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt><dd className="m-0 font-bold">{v}</dd></div>
              ))}
            </dl>
            {how === 'each' && game && !code && (
              <div className="grid gap-2">
                <p className="font-bold">{t('activity.eachPlan')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label={t('activity.groupGame')} id="group-game" className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface" defaultValue={game.id}>
                    {GAMES.filter((g) => g.modes.includes('solo') && canPlayGame(tier, g.id)).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select aria-label={t('activity.groupSet')} id="group-set" className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface max-w-64" defaultValue={set.id}>
                    {sets.map((x) => <option key={x.id} value={x.id}>{x.name || t('sets.untitled')}</option>)}
                  </select>
                  <Button disabled={picked.length === 0} onClick={() => {
                    const g = (document.getElementById('group-game') as HTMLSelectElement).value;
                    const st = (document.getElementById('group-set') as HTMLSelectElement).value;
                    setPlan({ ...plan, ...Object.fromEntries(picked.map((id) => [id, { gameId: g, setId: st }])) });
                    setPicked([]);
                  }}>{t('activity.applyPicked', { count: picked.length })}</Button>
                </div>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 list-none p-0 m-0">
                  {students.map((st) => {
                    const mine = plan[st.id];
                    const on = picked.includes(st.id);
                    return (
                      <li key={st.id}>
                        <button type="button" role="checkbox" aria-checked={on} onClick={() => setPicked(on ? picked.filter((x) => x !== st.id) : [...picked, st.id])}
                          className={`w-full min-h-14 px-3 py-2 rounded-input border-[2px] text-left grid ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                          <span className="font-bold">{st.name}</span>
                          <span className="text-sm font-semibold text-muted">{mine ? `${GAMES.find((g) => g.id === mine.gameId)?.name} · ${sets.find((x) => x.id === mine.setId)?.name ?? ''}` : t('activity.classPick', { game: game.name })}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {code ? <CodeBox code={code} setName={set.name} onCopied={() => setStatus(t('host.copied'))} onShow={how === 'code' ? () => navigate(`/show/${code.code}`) : undefined} />
              : <Button variant="primary" className="justify-self-start min-h-14 px-7 text-lg" onClick={() => void finish()}>
                  {how === 'screen' ? <Play weight="fill" size={20} /> : how === 'lobby' ? <Broadcast weight="bold" size={20} /> : <QrCode weight="bold" size={20} />}{t(`activity.go.${how || 'code'}`)}
                </Button>}
            <p role="status" aria-live="polite" className="font-bold min-h-6">{status}</p>
          </div>
        )}
      </Panel>
    </main>
  );
}
