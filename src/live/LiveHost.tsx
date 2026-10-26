import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, Crown, Star as StarIcon, LockSimple, LockSimpleOpen, Pause, PencilSimple, Play, Stop, Trash, UsersThree, Warning } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { GAMES } from '../games/registry';
import { LIBRARY } from '../data/library';
import { useMySets } from '../data/hooks';
import type { QuestionSet } from '../data/types';
import { UpgradeButton } from '../billing/Upgrade';
import { Plus as PlusIcon } from '@phosphor-icons/react';
import { findGameCode, type GameCode } from '../data/gameCodes';
import { useTier } from '../data/hooks';
import { getGame } from '../games/registry';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { Button, buttonClasses, Panel, Tabs } from '../ui/kit';
import Title from '../ui/Title';
import { LimitNote } from '../billing/Upgrade';
import { logLiveEvent } from './events';
import { openLink, ranked, reduceHost, starColor, type LiveLink, type LivePlayer, type LiveState } from './protocol';
import Sky from '../games/practice/Sky';
import { useGameTheme } from '../theme/useGameTheme';

const TEMPLATES = ['live.tpl.eyes', 'live.tpl.wait', 'live.tpl.break', 'live.tpl.great'] as const;
const STUCK_MS = 60_000;

// The teacher's live game screen (development plan Stage 6): a lobby with
// name approval, rename, remove and a room lock; then a big-screen view
// (leaderboard or class goal, names and scores only) and a private monitor
// (who is stuck, Lock with a private message, Plus and Pro); pause all; and
// a podium at the end.
export default function LiveHost() {
  const { code = '' } = useParams();
  const [game, setGame] = useState<GameCode | null | undefined>(undefined);
  useEffect(() => { void findGameCode(code).then((g) => setGame(g?.live ? g : null)); }, [code]);
  if (game === undefined) return null;
  if (!game) return <main className="max-w-lg mx-auto px-4 pt-14 grid gap-4 justify-items-center text-center"><p className="font-bold text-lg">{t('live.noRoom')}</p><Link to="/teacher/sets" className={buttonClasses('primary')}>{t('live.toSets')}</Link></main>;
  return <Room game={game} />;
}

function Room({ game }: { game: GameCode }) {
  const tier = useTier();
  const canMonitor = TIERS[tier].liveMonitorAndLock;
  const reduce = useReducedMotion();
  const { settings } = useSettings();
  const [approve, setApprove] = useState(true);
  const [view, setView] = useState<'screen' | 'monitor'>('screen');
  // Play or share passes compete or together (?mode=).
  const startMode = new URLSearchParams(useLocation().search).get('mode') === 'together' ? 'together' : 'compete';
  // Question Tracker shows the class sky (teacher, 2026-10-26).
  const skyGame = game.gameId === 'star-quiz';
  const [board, setBoard] = useState<'leaders' | 'goal' | 'sky'>(skyGame ? 'sky' : startMode === 'together' ? 'goal' : 'leaders');
  const { theme: skyTheme } = useGameTheme('star-quiz');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<LiveState>({ code: game.code, gameId: game.gameId, setId: game.setId, phase: 'lobby', players: [], locks: {}, roomLocked: false, at: Date.now(), round: 1, mode: startMode });
  const link = useRef<LiveLink>();
  const approveRef = useRef(approve);
  approveRef.current = approve;
  const joinUrl = `${window.location.origin}/join/${game.code}`;

  useEffect(() => { void QRCode.toDataURL(joinUrl, { margin: 1, width: 360, color: { dark: '#000000', light: '#fbfcf8' } }).then(setQr); }, [joinUrl]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    const l = openLink(game.code);
    link.current = l;
    const off = l.listen((m) => {
      if (m.t === 'state' || m.t === 'closed' || m.t === 'sets') return;
      if (m.t === 'hello') { setState((s) => { l.send({ t: 'state', state: s }); l.send({ t: 'sets', sets: setsFor(s) }); return s; }); return; }
      setState((s) => {
        if (m.t === 'join' && s.roomLocked && !s.players.some((p) => p.pid === m.pid)) l.send({ t: 'closed', pid: m.pid });
        return reduceHost(s, m, approveRef.current);
      });
    });
    return () => { off(); l.close(); };
  }, [game.code]);
  // Every change goes out to every student at once; the question sets in use
  // go out when they change (each student's own set, teacher 2026-10-26).
  useEffect(() => { link.current?.send({ t: 'state', state }); }, [state]);
  const { value: mine = [] } = useMySets();
  const allSets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const allSetsRef = useRef<QuestionSet[]>(allSets);
  allSetsRef.current = allSets;
  function setsFor(s: LiveState): QuestionSet[] {
    const ids = new Set([s.setId, ...Object.values(s.assign ?? {}).map((a) => a.setId).filter((x): x is string => !!x)]);
    return allSetsRef.current.filter((x) => ids.has(x.id));
  }
  const setKey = [state.setId, ...Object.values(state.assign ?? {}).map((a) => a.setId ?? '')].join('|');
  useEffect(() => { link.current?.send({ t: 'sets', sets: setsFor(state) }); }, [setKey, allSets]); // eslint-disable-line react-hooks/exhaustive-deps
  // Groups, a game per group and a set per student: Plus, Homeschool and Pro.
  const paid = tier !== 'free';
  const groups = state.groups ?? [{ gameId: state.gameId }];
  const playable = GAMES.filter((g) => g.modes.some((m) => m === 'solo' || m === 'live' || m === 'versus'));
  const assignOf = (pid: string) => state.assign?.[pid] ?? {};
  const setAssign = (pid: string, patch: { group?: number; setId?: string }) => update((s) => ({ ...s, assign: { ...s.assign, [pid]: { ...s.assign?.[pid], ...patch } } }));

  const update = (fn: (s: LiveState) => LiveState) => setState((s) => ({ ...fn(s), at: Date.now() }));
  const setPlayer = (pid: string, patch: Partial<LivePlayer>) => update((s) => ({ ...s, players: s.players.map((p) => (p.pid === pid ? { ...p, ...patch } : p)) }));
  const inRoom = state.players.filter((p) => p.status === 'in');
  const pending = state.players.filter((p) => p.status === 'pending');
  const leaders = useMemo(() => ranked(state.players), [state.players]);
  const goal = state.goal ?? Math.max(10, inRoom.length * 10);
  const classRight = inRoom.reduce((n, p) => n + p.right, 0);
  const allLocked = state.locks.all !== undefined;
  function lock(pid: string, on: boolean) {
    const who = pid === 'all' ? t('live.everyone') : state.players.find((p) => p.pid === pid)?.name ?? '';
    void logLiveEvent({ at: new Date().toISOString(), code: game.code, gameId: game.gameId, kind: on ? 'lock' : 'unlock', who, message: on ? message.trim() || undefined : undefined });
    update((s) => { const locks = { ...s.locks }; if (on) locks[pid] = message.trim(); else delete locks[pid]; if (pid === 'all' && !on) return { ...s, locks: {} }; return { ...s, locks }; });
  }
  // The class sky's stars in the order they were earned, so a new star
  // never moves an old one.
  const seen = useRef<Record<string, number>>({});
  const [skyOrder, setSkyOrder] = useState<string[]>([]);
  useEffect(() => {
    const add: string[] = [];
    let reset = false;
    for (const p of state.players) {
      const was = seen.current[p.pid] ?? 0;
      if (p.right < was) reset = true;
      for (let k = was; k < p.right; k++) add.push(p.pid);
      seen.current[p.pid] = p.right;
    }
    if (reset) { setSkyOrder(state.players.flatMap((p) => Array.from({ length: p.right }, () => p.pid))); return; }
    if (add.length) setSkyOrder((o) => [...o, ...add]);
  }, [state.players]);
  // Compete ends on its own at the teacher's number of right answers or time.
  const timeLeft = state.endAt?.minutes && state.startedAt && state.phase !== 'ended' ? Math.max(0, state.startedAt + state.endAt.minutes * 60000 - now) : null;
  useEffect(() => {
    if (state.phase !== 'play' || state.mode === 'together') return;
    if ((state.endAt?.right && leaders[0]?.right >= state.endAt.right) || timeLeft === 0) end();
  }); // eslint-disable-line react-hooks/exhaustive-deps
  function end() {
    update((s) => ({ ...s, phase: 'ended', locks: {} }));
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, disableForReducedMotion: true });
  }
  const gameName = getGame(game.gameId)?.name ?? game.gameId;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/teacher/sets" className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t('live.back')}</Link>
        <h1 className="font-display text-3xl flex-1 min-w-48"><Title text={t('live.hostTitle', { game: gameName })} /></h1>
        {state.phase !== 'lobby' && state.phase !== 'ended' && (
          <>
            <Button onClick={() => update((s) => ({ ...s, phase: s.phase === 'paused' ? 'play' : 'paused' }))}>{state.phase === 'paused' ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}{state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')}</Button>
            <Button variant="danger" onClick={end}><Stop weight="fill" size={18} />{t('live.end')}</Button>
          </>
        )}
      </div>

      {state.phase === 'lobby' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 items-start">
          <Panel className="grid gap-3 justify-items-center text-center">
            <p className="font-display text-2xl">{t('show.goTo', { host: window.location.host })}</p>
            <p className="font-display text-7xl tracking-[0.15em]" aria-label={t('host.codeIs', { code: game.code })}>{game.code}</p>
            {qr && <img src={qr} alt={t('show.qr')} className="w-48 h-48 rounded-input border-[3px] border-border" />}
            <p className="font-bold">{t('live.joined', { count: inRoom.length })}</p>
          </Panel>
          <Panel className="grid gap-3 lg:col-span-2 lg:order-last">
            <h2 className="font-display text-2xl"><Title text={t('live.howPlay')} /></h2>
            <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('live.howPlay')}>
              {(['compete', 'together'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={(state.mode ?? 'compete') === m} onClick={() => { update((s) => ({ ...s, mode: m })); setBoard(skyGame ? 'sky' : m === 'compete' ? 'leaders' : 'goal'); }}
                  className={`min-h-16 px-4 rounded-input border-[2px] text-left grid ${(state.mode ?? 'compete') === m ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                  <span className="font-bold">{t(`live.mode.${m}`)}</span><span className="text-sm font-semibold text-muted">{t(`live.mode.${m}Hint`)}</span>
                </button>
              ))}
            </div>
            {(state.mode ?? 'compete') === 'compete' && (
              <div className="grid gap-1.5">
                <span className="font-bold">{t('live.endWhen')}</span>
                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t('live.endWhen')}>
                  {(['teacher', 'right', 'minutes'] as const).map((k) => {
                    const on = k === 'teacher' ? !state.endAt?.right && !state.endAt?.minutes : !!state.endAt?.[k];
                    return (
                      <button key={k} type="button" role="radio" aria-checked={on}
                        onClick={() => update((s) => ({ ...s, endAt: k === 'teacher' ? undefined : k === 'right' ? { right: 10 } : { minutes: 5 } }))}
                        className={`min-h-11 px-4 rounded-pill border-[2px] font-bold ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`live.end.${k}`)}</button>
                    );
                  })}
                  {state.endAt?.right !== undefined && (
                    <label className="flex items-center gap-2 font-bold">{t('live.end.rightN')}
                      <input type="number" min={1} max={200} value={state.endAt.right} onChange={(e) => update((s) => ({ ...s, endAt: { right: Math.max(1, Math.min(200, Number(e.target.value) || 1)) } }))} className="w-20 min-h-11 px-2 rounded-input border-[2px] border-border font-bold" />
                    </label>
                  )}
                  {state.endAt?.minutes !== undefined && (
                    <label className="flex items-center gap-2 font-bold">{t('live.end.minutesN')}
                      <input type="number" min={1} max={60} value={state.endAt.minutes} onChange={(e) => update((s) => ({ ...s, endAt: { minutes: Math.max(1, Math.min(60, Number(e.target.value) || 1)) } }))} className="w-20 min-h-11 px-2 rounded-input border-[2px] border-border font-bold" />
                    </label>
                  )}
                </div>
              </div>
            )}
            {state.mode === 'together' && (
              <label className="flex flex-wrap items-center gap-2 font-bold">{t('live.goalLabel')}
                <input type="number" min={5} max={999} value={goal} onChange={(e) => update((s) => ({ ...s, goal: Math.max(5, Math.min(999, Number(e.target.value) || 5)) }))} className="w-24 min-h-11 px-2 rounded-input border-[2px] border-border font-bold" />
              </label>
            )}
            <h3 className="font-bold text-lg">{t('live.groups')}</h3>
            {!paid && <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{t('live.groupsPlan')}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {groups.map((g, i) => (
                <label key={i} className="grid gap-1 font-bold text-sm rounded-input border-[2px] border-border-soft p-2">{t('live.groupN', { n: i + 1 })}
                  <select value={g.gameId} disabled={!paid} aria-label={t('live.groupGame', { n: i + 1 })} onChange={(e) => update((s) => ({ ...s, groups: groups.map((x, j) => (j === i ? { gameId: e.target.value } : x)) }))} className="min-h-11 px-2 rounded-input border-[2px] border-border font-bold bg-surface">
                    {playable.map((x) => <option key={x.id} value={x.id}>{x.name}{x.id === 'four-in-a-row' ? ` (${t('live.pairs')})` : ''}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {paid && <Button className="justify-self-start" disabled={groups.length >= 8} onClick={() => update((s) => ({ ...s, groups: [...groups, { gameId: s.gameId }] }))}><PlusIcon weight="bold" size={18} />{t('live.addGroup')}</Button>}
            <p className="text-sm font-semibold text-muted">{t('live.groupsHint')}</p>
          </Panel>
          <Panel className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 font-bold min-h-11"><input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="w-5 h-5" />{t('live.approveNames')}</label>
              <Button onClick={() => update((s) => ({ ...s, roomLocked: !s.roomLocked }))}>{state.roomLocked ? <LockSimple weight="fill" size={18} /> : <LockSimpleOpen weight="bold" size={18} />}{state.roomLocked ? t('live.roomLocked') : t('live.lockRoom')}</Button>
            </div>
            {pending.length > 0 && (
              <div className="grid gap-2">
                <p className="font-bold">{t('live.waiting', { count: pending.length })}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => update((s) => ({ ...s, players: s.players.map((p) => (p.status === 'pending' ? { ...p, status: 'in' } : p)) }))}><Check weight="bold" size={18} />{t('live.letAllIn')}</Button>
                </div>
              </div>
            )}
            <ul className="grid gap-2 list-none p-0 m-0" aria-label={t('live.players')}>
              <AnimatePresence initial={false}>
                {state.players.filter((p) => p.status !== 'removed').map((p) => (
                  <motion.li key={p.pid} layout={!reduce} initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={`flex flex-wrap items-center gap-2 rounded-input border-[2px] p-2 ${p.status === 'pending' ? 'border-border bg-accent/40' : 'border-border-soft'}`}>
                    {editing === p.pid
                      ? <input autoFocus defaultValue={p.name} maxLength={24} aria-label={t('live.renameTo', { name: p.name })} onBlur={(e) => { setPlayer(p.pid, { name: e.target.value.trim() || p.name }); setEditing(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} className="flex-1 min-h-10 px-2 rounded-input border-[2px] border-border font-bold" />
                      : <span className="flex-1 font-bold min-w-32">{p.name}</span>}
                    {paid && p.status === 'in' && groups.length > 1 && (
                      <select value={assignOf(p.pid).group ?? 0} aria-label={t('live.groupFor', { name: p.name })} onChange={(e) => setAssign(p.pid, { group: Number(e.target.value) })} className="min-h-10 px-2 rounded-input border-[2px] border-border font-bold bg-surface text-sm">
                        {groups.map((_, i) => <option key={i} value={i}>{t('live.groupN', { n: i + 1 })}</option>)}
                      </select>
                    )}
                    {paid && p.status === 'in' && (
                      <select value={assignOf(p.pid).setId ?? state.setId} aria-label={t('live.setFor', { name: p.name })} onChange={(e) => setAssign(p.pid, { setId: e.target.value })} className="min-h-10 px-2 rounded-input border-[2px] border-border font-bold bg-surface text-sm max-w-52">
                        {allSets.map((x) => <option key={x.id} value={x.id}>{x.name || t('sets.untitled')}</option>)}
                      </select>
                    )}
                    {p.status === 'pending' && <Button variant="primary" onClick={() => setPlayer(p.pid, { status: 'in' })}><Check weight="bold" size={16} />{t('live.letIn', { name: p.name })}</Button>}
                    <button type="button" onClick={() => setEditing(p.pid)} aria-label={t('live.rename', { name: p.name })} className="w-10 h-10 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><PencilSimple weight="bold" size={16} /></button>
                    <button type="button" onClick={() => setPlayer(p.pid, { status: 'removed' })} aria-label={t('live.remove', { name: p.name })} className="w-10 h-10 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={16} /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {state.players.length === 0 && <p className="font-semibold text-muted">{t('live.empty')}</p>}
            <Button variant="primary" className="min-h-14 text-lg" disabled={inRoom.length === 0} onClick={() => update((s) => ({ ...s, phase: 'play', startedAt: Date.now() }))}><Play weight="fill" size={20} />{t('live.start', { count: inRoom.length })}</Button>
          </Panel>
        </div>
      )}

      {(state.phase === 'play' || state.phase === 'paused') && (
        <>
          <Tabs label={t('live.views')} value={view} onChange={setView} options={[{ id: 'screen', label: t('live.view.screen') }, { id: 'monitor', label: t('live.view.monitor') }]} />
          {state.phase === 'paused' && <p className="font-display text-2xl bg-accent border-[2px] border-border rounded-input p-3 text-center" role="status">{t('live.pausedHost')}</p>}
          {view === 'screen' ? (
            <Panel className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold flex-1">{t('live.screenNote', { code: game.code })}</p>
                {timeLeft !== null && <p className="font-display text-3xl tabular-nums" aria-label={t('live.timeLeft', { time: clock(timeLeft) })}>{clock(timeLeft)}</p>}
                <Tabs label={t('live.boards')} value={board} onChange={setBoard} options={[...(skyGame ? [{ id: 'sky' as const, label: t('live.board.sky') }] : []), { id: 'leaders', label: t('live.board.leaders') }, { id: 'goal', label: t('live.board.goal') }]} />
              </div>
              {board === 'sky' ? (
                <div className="grid gap-2">
                  {state.mode === 'together'
                    ? <p className="font-display text-2xl text-center">{t('live.goalText', { right: classRight, goal })}</p>
                    : (
                      <ul className="flex flex-wrap justify-center gap-2 list-none p-0 m-0" aria-label={t('live.starColors')}>
                        {leaders.map((p) => (
                          <li key={p.pid} className="flex items-center gap-1.5 rounded-pill border-[2px] border-border bg-surface px-3 py-1 font-bold">
                            <StarIcon weight="fill" size={22} color={starColor(state.players, p.pid)} className="drop-shadow-[0_0_1px_#000]" aria-hidden="true" />{p.name} <span className="font-display">{p.right}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  <Sky theme={skyTheme} still={settings.motion === 'still'} height="max(220px, calc(100dvh - 520px))"
                    filled={state.mode === 'together' ? Math.min(classRight, goal) : skyOrder.length}
                    total={state.mode === 'together' ? goal : Math.max(skyOrder.length, (state.endAt?.right ?? 10) * Math.max(1, inRoom.length))}
                    colors={state.mode === 'together' ? undefined : skyOrder.map((pid) => starColor(state.players, pid))}
                    label={state.mode === 'together' ? t('live.goalText', { right: classRight, goal }) : t('live.skyLabel', { count: skyOrder.length })} />
                </div>
              ) : board === 'leaders' ? (
                <ol className="grid gap-2 list-none p-0 m-0" aria-label={t('live.board.leaders')}>
                  {leaders.slice(0, 10).map((p, i) => (
                    <motion.li key={p.pid} layout={!reduce} className="grid grid-cols-[2.5rem_minmax(8rem,14rem)_1fr_3rem] items-center gap-2">
                      <span className="font-display text-2xl text-center">{i === 0 ? <Crown weight="fill" size={28} color="#c98a00" aria-label="1" /> : i + 1}</span>
                      <span className="font-bold text-lg truncate">{p.name}</span>
                      <span className="h-8 rounded-pill bg-surface-2 border-[2px] border-border overflow-hidden"><motion.span className="block h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${leaders[0].right ? (p.right / leaders[0].right) * 100 : 0}%` }} transition={{ duration: reduce ? 0 : 0.5 }} /></span>
                      <span className="font-display text-2xl text-right">{p.right}</span>
                    </motion.li>
                  ))}
                </ol>
              ) : (
                <div className="grid gap-3 justify-items-center text-center py-4">
                  <p className="font-display text-3xl">{t('live.goalText', { right: classRight, goal })}</p>
                  <div className="w-full h-12 rounded-pill bg-surface-2 border-[3px] border-border overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(classRight, goal)} aria-label={t('live.board.goal')}>
                    <motion.div className="h-full bg-[#7dd3a8]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (classRight / goal) * 100)}%` }} transition={{ duration: reduce ? 0 : 0.6 }} />
                  </div>
                </div>
              )}
            </Panel>
          ) : !canMonitor ? <LimitNote>{t('live.monitorPlan')}</LimitNote> : (
            <Panel className="grid gap-3">
              <p className="text-sm font-bold">{t('live.monitorNote')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={80} placeholder={t('live.messagePlaceholder')} aria-label={t('live.message')} className="flex-1 min-w-48 min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
                {TEMPLATES.map((k) => <button key={k} type="button" onClick={() => setMessage(t(k))} className="min-h-10 px-3 rounded-pill border-[2px] border-border-soft bg-surface font-bold text-sm">{t(k)}</button>)}
                <Button variant="primary" onClick={() => lock('all', !allLocked)}>{allLocked ? <LockSimpleOpen weight="bold" size={18} /> : <LockSimple weight="fill" size={18} />}{allLocked ? t('live.unlockAll') : t('live.lockAll')}</Button>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0" aria-label={t('live.players')}>
                {inRoom.map((p) => {
                  const locked = state.locks[p.pid] !== undefined || allLocked;
                  const onQ = p.askedAt ? Math.round((now - p.askedAt) / 1000) : null;
                  const stuck = p.askedAt !== null && now - p.askedAt > STUCK_MS;
                  const low = p.answered >= 4 && p.right / p.answered < 0.5;
                  return (
                    <li key={p.pid} className={`rounded-input border-[2.5px] p-3 grid gap-1 ${stuck || low ? 'border-border bg-[#ffe3dc]' : 'border-border-soft bg-surface'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl flex-1 truncate">{p.name}</span>
                        <button type="button" onClick={() => lock(p.pid, state.locks[p.pid] === undefined)} aria-pressed={locked} aria-label={t(locked ? 'live.unlockOne' : 'live.lockOne', { name: p.name })} className={`w-10 h-10 rounded-full border-[2px] border-border flex items-center justify-center ${locked ? 'bg-accent' : 'bg-surface'}`}>{locked ? <LockSimple weight="fill" size={18} /> : <LockSimpleOpen weight="bold" size={18} />}</button>
                      </div>
                      <p className="text-sm font-semibold">{t('live.tile', { right: p.right, answered: p.answered })}</p>
                      <p className="text-sm font-semibold text-muted">{onQ === null ? t('live.between') : t('live.onQuestion', { s: onQ })}</p>
                      {(stuck || low) && <p className="text-sm font-bold flex items-center gap-1"><Warning weight="fill" size={16} aria-hidden="true" />{stuck ? t('live.stuck') : t('live.guessing')}</p>}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </>
      )}

      {state.phase === 'ended' && (
        <Panel className="grid gap-4 justify-items-center text-center">
          <h2 className="font-display text-4xl"><Title text={state.mode === 'together' ? t('live.togetherTitle') : t('live.podium')} /></h2>
          {state.mode === 'together' ? <p className="font-display text-3xl">{t(classRight >= goal ? 'live.togetherMet' : 'live.goalText', { right: classRight, goal })}</p> : (
          <div className="flex items-end justify-center gap-3 w-full max-w-xl">
            {[1, 0, 2].map((i) => leaders.at(i) && (
              <motion.div key={leaders.at(i)!.pid} initial={reduce ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: reduce ? 0 : 0.2 + (2 - i) * 0.25 }} className="flex-1 grid gap-2 justify-items-center">
                {i === 0 && <Crown weight="fill" size={40} color="#c98a00" aria-hidden="true" />}
                <span className="font-display text-xl truncate max-w-full">{leaders.at(i)!.name}</span>
                <span className={`w-full rounded-t-panel border-[3px] border-border flex items-start justify-center pt-2 font-display text-3xl ${i === 0 ? 'h-40 bg-accent' : i === 1 ? 'h-28 bg-[#cfe0ff]' : 'h-20 bg-[#ffd9cf]'}`}>{i + 1}</span>
                <span className="font-bold">{t('live.rightCount', { count: leaders.at(i)!.right })}</span>
              </motion.div>
            ))}
          </div>
          )}
          <p className="font-bold flex items-center gap-2"><UsersThree weight="fill" size={20} aria-hidden="true" />{t('live.classTotal', { right: classRight, count: inRoom.length })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => update((s) => ({ ...s, phase: 'lobby', round: s.round + 1, players: s.players.map((p) => ({ ...p, answered: 0, right: 0, askedAt: null })) }))}>{t('live.again')}</Button>
            <Link to="/teacher/reports" className={buttonClasses('secondary')}>{t('live.reports')}</Link>
          </div>
        </Panel>
      )}
    </main>
  );
}

const clock = (ms: number) => { const sec = Math.ceil(ms / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
