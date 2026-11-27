import ClassModeIcon from '../live/ClassModeIcon';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Broadcast, CalendarCheck, Check, Info, LockSimple, Play, QrCode, SquaresFour, Sword, Television, User, UsersThree } from '@phosphor-icons/react';
import { canPlayGame, TIERS } from '../config';
import { data, newId } from '../data';
import { makeGameCode, makeLobbyCode, type GameCode, type LobbyPick } from '../data/gameCodes';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { GameCover } from '../games/covers';
import { MODE_BRIGHT, ModeDot, shownModes } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import SetPicker from '../games/SetPicker';
import { t } from '../i18n';
import { UpgradeButton } from '../billing/Upgrade';
import { Button, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import Title from '../ui/Title';
import { Choices, CodeBox } from './HostDialog';
import { ChoiceRow } from '../ui/fields';
import { ThemeChoices } from './ClassPage';

// Create an activity (teacher, 2026-10-31): question sets, games and
// assignments come together as one "Activity". Step by step: who it is for,
// the game, how they play (big screen with teams, a class lobby on their own
// devices, a code to play solo, pairs, or homework by a date), the question
// set, then the code or the game itself.
type How = 'screen' | 'lobby' | 'code' | 'pairs' | 'homework' | 'each' | 'board';
const HOWS: { id: How; icon: typeof Play; mode?: 'share' | 'live' | 'solo' | 'versus' }[] = [
  { id: 'screen', icon: Television, mode: 'share' },
  { id: 'lobby', icon: Broadcast, mode: 'live' },
  { id: 'code', icon: User, mode: 'solo' },
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
  // A report's next-step button can fill in the class and the set (?class, ?set).
  const [query] = useSearchParams();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { value: mine = [] } = useMySets();
  const sets = [...mine, ...LIBRARY];
  const [step, setStep] = useState(0);
  const [classId, setClassId] = useState(() => query.get('class') ?? '');
  const [gameId, setGameId] = useState(() => query.get('game') ?? '');
  const [how, setHow] = useState<How | ''>('');
  const [teams, setTeams] = useState<'teacher' | 'random' | 'class'>('teacher');
  const [together, setTogether] = useState<'compete' | 'together'>('compete');
  const [setId, setSetId] = useState<string[]>(() => (query.get('set') ? [query.get('set')!] : []));
  const [board, setBoard] = useState<string[]>([]);
  // Homework choice (owner, 2026-11-27): one game and its look, one game with a
  // few themes students pick from, or any game and any theme (autonomy).
  const [hwChoice, setHwChoice] = useState<'one' | 'themes' | 'any'>('one');
  const [hwThemes, setHwThemes] = useState<string[]>([]);
  const anyGame = how === 'homework' && hwChoice === 'any';
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
  const live = TIERS[tier].liveMode;
  // Plan rules (owner, 2026-11-26): homework and choice boards are Pro; Plus
  // and Homeschool give each student a question set, Pro also a game.
  const lim = TIERS[tier];
  const locked = (id: How) => (id === 'lobby' && !live) || (id === 'homework' && !lim.homework) || (id === 'board' && !pro) || (id === 'each' && !lim.setPerStudent);
  const hows = HOWS.filter((h) => (h.id === 'each' || h.id === 'board' ? !!classId : true) && GAMES.some((g) => g.modes.includes(h.mode!)));
  // A game for each student and the choice board take solo games and
  // two-player games played against the computer (teacher, 2026-10-31).
  const ownDevice = (g: (typeof GAMES)[number]) => g.modes.includes('solo') || g.modes.includes('versus');
  const fits = (g: (typeof GAMES)[number]) => !how || (how === 'each' || how === 'board' ? ownDevice(g) : g.modes.includes(HOWS.find((h) => h.id === how)!.mode!));
  const ready = [true, !!how && !locked(how) && !(how === 'homework' && hwChoice !== 'one' && !classId) && !(how === 'homework' && hwChoice === 'themes' && hwThemes.length < 2), how === 'board' ? board.length > 1 : anyGame || !!game, !!set, true][step];
  const showClasses = TIERS[tier].hasClasses && classes.length > 0;

  async function finish() {
    if ((!game && how !== 'board' && !anyGame) || !set) return;
    const shared = how === 'each' || how === 'board';
    const limits = { ...(minutes ? (shared ? { endAt: Date.now() + minutes * 60000 } : { minutes }) : {}), ...(goal ? { goal } : {}) };
    if (how === 'board') { setCode(await makeLobbyCode({ classId, plan: {}, board: { gameIds: board, setId: set.id } }, limits)); return; }
    // Any game, any theme: a choice board of every game students can play on their own, due like homework.
    if (anyGame) {
      setCode(await makeLobbyCode({ classId, plan: {}, board: { gameIds: GAMES.filter(ownDevice).filter((g) => canPlayGame(tier, g.id)).map((g) => g.id), setId: set.id } }, { ...limits, due }));
      await data.saveAssignment({ id: newId('asg'), classroomId: classId, setId: set.id, starred: false, endsOn: due });
      return;
    }
    if (!game) return;
    if (how === 'screen') { navigate(`/games/${game.id}?set=${set.id}&teams=${teams}`); return; }
    if (how === 'each') { setCode(await makeLobbyCode({ classId, all: { gameId: game.id, setId: set.id }, plan }, limits)); return; }
    if (how === 'lobby') { navigate(`/teacher/live/${(await makeGameCode(game.id, set.id, 'live')).code}?mode=${together}`); return; }
    const made = await makeGameCode(game.id, set.id, how === 'pairs' ? 'versus' : 'play', how === 'homework' ? due : undefined, limits);
    if (how === 'homework' && classId) {
      await data.saveAssignment({ id: newId('asg'), classroomId: classId, setId: set.id, starred: false, endsOn: due, ...(hwChoice === 'themes' && hwThemes.length ? { themeIds: hwThemes } : {}) });
    }
    setCode(made);
  }

  const card = (on: boolean) => `rounded-input border-bold text-left bg-surface ${on ? 'border-border ring-4 ring-border ring-offset-4 ring-offset-paper' : 'border-border-soft'}`;
  // The approved Create an Activity (/brand teacher portal 4, teacher
  // 2026-11-25: "apply the new mockups that are in the brand page to the main
  // site"): a stepper whose done steps show green checks, "Your choices" kept
  // in view with a Change link for each (lower working memory load), and a
  // Start card with the code shown big. Only the teacher's real picks show.
  const className = classes.find((c) => c.id === classId)?.name;
  const choices: { step: number; value: string }[] = [
    { step: 0, value: className ?? t('activity.anyone') },
    { step: 1, value: how ? t(`activity.how.${how}`) : '' },
    { step: 2, value: how === 'board' ? board.map((id) => GAMES.find((g) => g.id === id)?.name).join(', ') : game?.name ?? '' },
    { step: 3, value: set ? `${set.name || t('sets.untitled')}, ${t('activity.questions', { count: set.questions.length })}` : '' },
  ];
  const supported = students.filter((st) => st.accommodations && (st.accommodations.tools?.listen || (st.accommodations.triesPerQuestion ?? 1) > 1 || (st.accommodations.readFirstSeconds ?? 0) > 0));
  const options = [
    how === 'screen' ? t(`host.teams.${teams}`) : '',
    how === 'lobby' ? t(`live.mode.${together}`) : '',
    how === 'code' || how === 'homework' || how === 'each' || how === 'board' ? (minutes ? t('activity.minutes', { count: minutes }) : t('activity.noLimit')) : '',
    goal ? t('activity.opt.goal', { n: goal }) : '',
    how === 'homework' ? t('activity.opt.due', { date: new Date(`${due}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }) : '',
    how === 'each' && Object.keys(plan).length ? t('activity.opt.own', { count: Object.keys(plan).length }) : '',
  ].filter(Boolean);
  const goTo = (i: number) => { setStep(i); setCode(null); };
  const GoIcon = how === 'screen' ? Play : how === 'lobby' ? Broadcast : how === 'homework' ? CalendarCheck : QrCode;
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8">
      <TeacherNav startOpen={false} />
      <PageHeader title={t('activity.title')} />
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] items-start">
        <Panel className="grid gap-3 content-start order-last lg:order-none !p-4">
          <h2 className="font-heading font-bold text-base m-0">{t('activity.choices')}</h2>
          <ol className="list-none m-0 p-0 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {choices.map(({ step: i, value }) => {
              const done = i < step && !!value;
              return (
                <li key={i} className={`rounded-input p-3 grid gap-0.5 ${done ? 'bg-surface-2' : 'bg-surface-2/50'}`}>
                  <span className="flex items-center gap-2 text-sm font-bold text-muted">
                    {done ? <span className="w-5 h-5 rounded-full grid place-items-center bg-kelly text-text border-thin border-border shrink-0"><Check weight="bold" size={12} aria-label={t('start.done')} /></span>
                      : <span className="w-5 h-5 rounded-full grid place-items-center border-std border-border-soft text-xs shrink-0">{i + 1}</span>}
                    {t(`activity.step.${STEPS[i]}`)}
                    {done && <button type="button" onClick={() => goTo(i)} aria-label={t('activity.changeStep', { step: t(`activity.step.${STEPS[i]}`) })} className="ml-auto min-h-8 px-2 -my-1 rounded-pill font-bold text-grape hover:bg-surface underline-offset-2 hover:underline">{t('activity.change')}</button>}
                  </span>
                  <b className={`leading-snug ${done ? '' : 'text-faint font-semibold'}`}>{done ? value : t('activity.notYet')}</b>
                </li>
              );
            })}
          </ol>
          {classId && students.length > 0 && (
            <div className="grid gap-2">
              <b className="text-sm text-muted">{t('activity.whoPlays', { count: students.length })}</b>
              <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">
                {students.slice(0, 12).map((st, i) => (
                  <li key={st.id} className="min-h-8 pl-1 pr-2.5 rounded-pill inline-flex items-center gap-1.5 font-bold text-sm bg-surface-2">
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${AVATAR_BG[i % AVATAR_BG.length]}`} aria-hidden="true">{st.name[0]}</span>{st.name}
                  </li>
                ))}
                {students.length > 12 && <li className="min-h-8 px-2.5 rounded-pill inline-flex items-center font-bold text-sm bg-surface-2">{t('activity.more', { count: students.length - 12 })}</li>}
              </ul>
            </div>
          )}
          {supported.length > 0 && <p className="m-0 rounded-input p-3 text-sm font-semibold leading-snug bg-quiz-blue">{t('activity.supports', { names: supported.map((st) => st.name).join(', ') })}</p>}
        </Panel>

        <div className="grid gap-3 min-w-0">
          <ol className="grid grid-cols-5 gap-2 list-none p-0 m-0" aria-label={t('activity.steps')}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const inner = <>{done ? <span className="w-6 h-6 rounded-full grid place-items-center bg-kelly text-text border-thin border-border shrink-0"><Check weight="bold" size={14} aria-label={t('start.done')} /></span>
                : <span className={`w-6 h-6 rounded-full grid place-items-center text-xs tabular-nums shrink-0 border-std ${i === step ? 'border-border bg-surface' : 'border-border-soft'}`}>{i + 1}</span>}
                <span className="min-w-0">{t(`activity.step.${s}`)}</span></>;
              const look = `w-full min-h-11 px-2 rounded-pill font-bold text-sm flex items-center justify-center gap-2 ${i === step ? 'bg-gold border-std border-border' : done ? 'bg-surface border-std border-transparent' : 'bg-surface/60 border-std border-transparent text-muted'}`;
              return (
                <li key={s} aria-current={i === step ? 'step' : undefined} className="min-w-0">
                  {done ? <button type="button" onClick={() => goTo(i)} className={`${look} hover-pop`}>{inner}</button> : <span className={look}>{inner}</span>}
                </li>
              );
            })}
          </ol>
          <Panel className="grid gap-4 min-w-0">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span>{step > 0 && <Button onClick={() => goTo(step - 1)}><ArrowLeft weight="bold" size={18} />{t('activity.back')}</Button>}</span>
              <h2 className="title-bubble text-2xl sm:text-3xl text-center m-0"><Title text={t(`activity.q.${STEPS[step]}`)} /></h2>
              <span className="justify-self-end">{step < STEPS.length - 1 && <Button variant="primary" disabled={!ready} onClick={() => setStep(step + 1)}>{t('activity.next')}<ArrowRight weight="bold" size={18} /></Button>}</span>
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

        {STEPS[step] === 'game' && anyGame && <Panel><p className="font-bold text-lg m-0">{t('activity.hw.anyNote')}</p></Panel>}
        {STEPS[step] === 'game' && !anyGame && (
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
                    className={`${card(on)} overflow-hidden disabled:opacity-40`}>
                    <span className="relative block"><GameCover gameId={g.id} className="aspect-[16/10]" />{!open && <LockSimple weight="fill" size={28} className="absolute top-2 right-2" />}</span>
                    <span className="p-2 grid gap-1"><span className="font-display text-lg">{g.name}</span>{/* Just the icon in its color, small, in one row (teacher, 2026-11-16). */}
<span className="flex gap-1.5">{shownModes(g.modes).map((m) => <ModeDot key={m} mode={m} small />)}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {STEPS[step] === 'how' && (
          <div className="grid gap-4">
            <div role="radiogroup" aria-label={t('activity.q.how')} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hows.map(({ id, icon: Icon, mode }) => (
                <button key={id} type="button" role="radio" aria-checked={how === id} onClick={() => { setHow(id); setGameId(''); setBoard([]); }}
                  className={`min-h-20 p-3 rounded-input border-bold text-left grid grid-cols-[auto_1fr] gap-x-3 items-center ${how === id ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
                  {/* Icons (rule 7): Phosphor bold, ink on a round badge in the way's color (rule 12). */}
                  <span className="row-span-2 w-12 h-12 rounded-full border-std border-border grid place-items-center" style={{ background: mode ? MODE_BRIGHT[mode] : 'var(--lavender)' }}><Icon weight="bold" size={26} aria-hidden="true" /></span>
                  <span className="font-display text-lg leading-tight flex items-center gap-2">{t(`activity.how.${id}`)}{locked(id) && <LockSimple weight="fill" size={18} aria-label={t(id === 'lobby' ? 'activity.liveOnly' : 'activity.locked')} />}</span>
                  <span className="text-sm font-semibold text-muted leading-snug">{t(`activity.how.${id}Hint`)}</span>
                </button>
              ))}
            </div>
            {how === 'lobby' && !live && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.liveOnly')}</p><UpgradeButton suggest="plus" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'homework' && !lim.homework && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.homeworkPro')}</p><UpgradeButton suggest="pro" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'each' && !lim.setPerStudent && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.eachPlus')}</p><UpgradeButton suggest="plus" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'each' && lim.setPerStudent && !lim.gamePerStudent && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.eachGamePro')}</p><UpgradeButton suggest="pro" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'board' && !pro && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('activity.proOnly')}</p><UpgradeButton suggest="pro" className="min-h-10 px-3 text-sm" /></div>}
            {how === 'screen' && <Choices label={t('host.teams')} value={teams} onChange={setTeams} options={(['teacher', 'random', 'class'] as const).map((k) => ({ id: k, title: t(`host.teams.${k}`), hint: t(`host.teams.${k}Hint`) }))} />}
            {how === 'lobby' && <Choices label={t('live.howPlay')} value={together} onChange={setTogether} options={(['together', 'compete'] as const).map((k) => ({ id: k, title: t(`live.mode.${k}`), hint: t(`live.mode.${k}Hint`), art: <ClassModeIcon mode={k} /> }))} />}
            {(how === 'code' || how === 'homework' || how === 'each' || how === 'board') && (
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1 font-bold">{t(how === 'each' || how === 'board' ? 'activity.endsIn' : 'activity.playFor')}
                  <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="min-h-11 px-3 rounded-input border-std border-border font-bold bg-surface">
                    {[0, 5, 10, 15, 20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{m ? t('activity.minutes', { count: m }) : t('activity.noLimit')}</option>)}
                  </select>
                  <span className="text-sm font-semibold text-muted">{t('activity.clockHint')}</span>
                </label>
                <label className="grid gap-1 font-bold">{t('activity.goal')}
                  <input type="number" min={0} step={10} value={goal || ''} placeholder={t('activity.goalNone')} onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))} className="min-h-11 px-3 rounded-input border-std border-border font-bold bg-surface" />
                  <span className="text-sm font-semibold text-muted">{t('activity.goalHint')}</span>
                </label>
              </div>
            )}
            {how === 'homework' && lim.homework && (
              <div className="grid gap-3">
                <ChoiceRow label={t('activity.hw.choice')} value={hwChoice} onChange={setHwChoice}
                  options={[{ value: 'one', label: t('activity.hw.one') }, { value: 'themes', label: t('activity.hw.themes') }, { value: 'any', label: t('activity.hw.any') }]} />
                {hwChoice !== 'one' && !classId && <p className="text-sm font-bold" role="status">{t('activity.hw.needClass')}</p>}
                {hwChoice === 'themes' && <ThemeChoices value={hwThemes} onChange={setHwThemes} />}
              </div>
            )}
            {how === 'homework' && (
              <label className="flex flex-wrap items-center gap-2 font-bold">{t('host.due')}
                <input type="date" value={due} min={today} max={lastDue} onChange={(e) => setDue(e.target.value)} className="min-h-11 px-3 rounded-input border-std border-border font-bold bg-surface" />
                {lastDue && <span className="text-sm font-semibold text-muted">{t('host.dueLimit', { days })}</span>}
              </label>
            )}
          </div>
        )}

        {STEPS[step] === 'set' && <SetPicker sets={sets} value={setId} onChange={setSetId} />}

        {STEPS[step] === 'go' && (game || how === 'board') && set && (
          <div className="grid gap-4">
            <div className="rounded-panel p-5 sm:p-6 grid justify-items-center text-center gap-3 bg-gamify shadow-[0_0_0_0.2rem_var(--color-surface),0_0_0_0.4rem_var(--color-border)] mx-1">
              <span className="w-14 h-14 rounded-full grid place-items-center bg-surface border-std border-border"><GoIcon weight="bold" size={26} aria-hidden="true" /></span>
              <b className="text-xl">{how ? t(`activity.how.${how}`) : ''}</b>
              <p className="m-0 font-semibold max-w-prose">{how ? t(`activity.how.${how}Hint`) : ''}</p>
              {code ? <CodeBox big code={code} setName={set.name} onCopied={() => setStatus(t('host.copied'))} onShow={how === 'code' ? () => navigate(`/show/${code.code}`) : undefined} />
                : <Button variant={how === 'screen' || how === 'lobby' ? 'go' : 'main'} size="lg" onClick={() => void finish()}><GoIcon weight={how === 'screen' ? 'fill' : 'bold'} size={20} />{t(`activity.go.${how || 'code'}`)}</Button>}
            </div>
            {options.length > 0 && (
              <div className="rounded-input p-4 grid gap-2.5 bg-surface-2">
                <span className="flex items-center gap-2"><b>{t('activity.options')}</b><button type="button" onClick={() => goTo(1)} className="ml-auto min-h-8 px-2 rounded-pill font-bold text-grape hover:bg-surface" aria-label={t('activity.changeStep', { step: t('activity.step.how') })}>{t('activity.change')}</button></span>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-2">{options.map((o) => <li key={o} className="min-h-8 px-3 rounded-pill inline-flex items-center bg-surface font-bold text-sm">{o}</li>)}</ul>
              </div>
            )}
            {how === 'each' && game && !code && (
              <div className="grid gap-2">
                <p className="font-bold">{t('activity.eachPlan')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label={t('activity.groupGame')} id="group-game" disabled={!lim.gamePerStudent} className="min-h-11 px-3 rounded-input border-std border-border font-bold bg-surface disabled:opacity-50" defaultValue={game.id}>
                    {GAMES.filter((g) => ownDevice(g) && canPlayGame(tier, g.id)).map((g) => <option key={g.id} value={g.id}>{g.name}{g.modes.includes('solo') ? '' : ` (${t('activity.vsComputer')})`}</option>)}
                  </select>
                  <select aria-label={t('activity.groupSet')} id="group-set" className="min-h-11 px-3 rounded-input border-std border-border font-bold bg-surface max-w-64" defaultValue={set.id}>
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
                          className={`w-full min-h-14 px-3 py-2 rounded-input border-std text-left grid ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
                          <span className="font-bold">{st.name}</span>
                          <span className="text-sm font-semibold text-muted">{mine ? `${GAMES.find((g) => g.id === mine.gameId)?.name} · ${sets.find((x) => x.id === mine.setId)?.name ?? ''}` : t('activity.classPick', { game: game.name })}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-semibold text-muted">
              {(how === 'lobby' || how === 'screen') && <li className="inline-flex items-center gap-2"><Info weight="bold" size={16} aria-hidden="true" />{t('activity.tip.extend')}</li>}
              <li className="inline-flex items-center gap-2"><Check weight="bold" size={16} aria-hidden="true" />{t(how === 'homework' ? 'activity.tip.due' : how === 'lobby' || how === 'screen' ? 'activity.tip.end' : 'activity.tip.code')}</li>
            </ul>
            <p role="status" aria-live="polite" className="font-bold min-h-6 m-0 text-center">{status}</p>
          </div>
        )}
          </Panel>
        </div>
      </div>
    </main>
  );
}

// Avatar colors for the student chips (palette pastels).
const AVATAR_BG = ['bg-gamify', 'bg-quiz-blue', 'bg-blush', 'bg-butter', 'bg-mint-soft', 'bg-secondary'];
