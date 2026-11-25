import ClassModeIcon from './ClassModeIcon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { readClassPlay } from './ClassPlay';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { ArrowCounterClockwise, ChartBar, Check, Crown, Star as StarIcon, LockSimple, LockSimpleOpen, Pause, PencilSimple, Play, Stop, SquaresFour, Trash, UsersThree, GearSix, SlidersHorizontal, X } from '@phosphor-icons/react';
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
import { Button, buttonClasses, Panel } from '../ui/kit';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';
import Dialog from '../ui/Dialog';
import { logLiveEvent } from './events';
import { emptyLog, foldAnswer, openLink, ranked, reduceHost, starColor, type AnswerLog, type LiveLink, type LivePlayer, type LiveState } from './protocol';
import ClassView, { RevealCard } from './ClassView';
import Sky from '../games/practice/Sky';
import { PAPER, RESULT_BTN, SkyBurst, SkyCode, SkyGoalCard, SkyPlaying, SkyResults, skyStar, useBoxPct } from '../games/practice/SkyHud';
import HintButton from '../engine/HintButton';
import { FullScreenButton } from '../settings/SettingsPanel';
import TerritoryStage from '../games/territory/Stage';
import { SideBadge } from '../games/territory/art';
import { balanceTeams, swapTeam } from '../games/territory/logic';
import { ThemedPage, useGameTheme } from '../theme/useGameTheme';
import { pieceImage } from '../theme/library';

const TEMPLATES = ['live.tpl.eyes', 'live.tpl.wait', 'live.tpl.break', 'live.tpl.great'] as const;

// The teacher's live game screen (development plan Stage 6): a lobby with
// name approval, rename, remove and a room lock; then a big-screen view
// (leaderboard or class goal, names and scores only) and a private monitor
// (who is stuck, Lock with a private message, Plus and Pro); pause all; and
// a podium at the end.
export default function LiveHost() {
  const { code = '' } = useParams();
  const [game, setGame] = useState<GameCode | null | undefined>(undefined);
  useEffect(() => { void findGameCode(code).then((g) => setGame(g?.live ? g : null), () => setGame(null)); }, [code]);
  if (game === undefined) return null;
  if (!game) return <main className="max-w-lg mx-auto px-4 pt-14 grid gap-4 justify-items-center text-center"><p className="font-bold text-lg">{t('live.noRoom')}</p><Link to="/teacher/sets" className={buttonClasses('secondary')}>{t('live.toSets')}</Link></main>;
  return <Room game={game} />;
}

function Room({ game }: { game: GameCode }) {
  const tier = useTier();
  const canMonitor = TIERS[tier].liveMonitorAndLock;
  const reduce = useReducedMotion();
  const { settings } = useSettings();
  const [approve, setApprove] = useState(true);
  // Play or share passes compete or together (?mode=).
  const search = useLocation().search;
  const startMode = new URLSearchParams(search).get('mode') === 'together' ? 'together' : 'compete';
  // The setup menus pass when it ends and the class goal too (2026-10-31).
  const startPlay = readClassPlay(search);
  // Question Tracker shows the class sky (teacher, 2026-10-26).
  const skyGame = game.gameId === 'star-quiz';
  const { theme: skyTheme } = useGameTheme('star-quiz');
  // Territory's living room (teacher, 2026-11-24): its own class screen, the
  // teacher's pace and Compete rule, and two teams in Compete.
  const territory = game.gameId === 'territory';
  const { theme: roomTheme } = useGameTheme('territory');
  const startQ = new URLSearchParams(search);
  // The big-screen look (Theme Builder, Big screen); the teacher picks it here.
  const screen = useGameTheme('big-screen');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [setOpen, setSetOpen] = useState(false);
  const [monOpen, setMonOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<LiveState>({ code: game.code, gameId: game.gameId, setId: game.setId, phase: 'lobby', players: [], locks: {}, roomLocked: false, at: Date.now(), round: 1, mode: startMode, ...(startPlay.endAt ? { endAt: startPlay.endAt } : {}), ...(startPlay.goal ? { goal: startPlay.goal } : {}), ...(game.gameId === 'territory' ? { teams: {}, options: { pace: startQ.get('pace') ?? 'slow', rule: startQ.get('rule') ?? 'both' }, goal: startPlay.goal ?? 20 } : {}) });
  const link = useRef<LiveLink>();
  const seenAt = useRef<Record<string, number>>({});
  const [log, setLog] = useState<AnswerLog>(() => emptyLog(1));
  // The answer to one question on the big screen (Live class view, One question).
  const [reveal, setReveal] = useState<string | null>(null);
  // Closing or leaving this page ends the game for everyone, and every
  // student is told and sent back to Join (teacher, 2026-11-06).
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const bye = () => { const s0 = stateRef.current; if (s0.phase !== 'ended' && s0.phase !== 'lobby') link.current?.send({ t: 'state', state: { ...s0, phase: 'ended', closedByTeacher: true, locks: {}, at: Date.now() } }); };
    window.addEventListener('pagehide', bye);
    return () => { window.removeEventListener('pagehide', bye); bye(); };
  }, []);
  const approveRef = useRef(approve);
  approveRef.current = approve;
  const joinUrl = `${window.location.origin}/join/${game.code}`;

  useEffect(() => { void QRCode.toDataURL(joinUrl, { margin: 1, width: 360, color: { dark: '#000000', light: '#ffffff' } }).then(setQr); }, [joinUrl]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    const l = openLink(game.code);
    link.current = l;
    const off = l.listen((m) => {
      if (m.t === 'state' || m.t === 'closed' || m.t === 'sets') return;
      // Private to this device (Live class view): when each student was last
      // heard from, and their answers this round. Never sent to students.
      seenAt.current[m.pid] = Date.now();
      if (m.t === 'progress') setLog((lg) => foldAnswer(lg, m));
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
  const setsInUse = useMemo(() => setsFor(state), [setKey, allSets]); // eslint-disable-line react-hooks/exhaustive-deps
  // Play again starts the private answer log over.
  useEffect(() => { setLog((lg) => (lg.round === state.round ? lg : emptyLog(state.round))); setReveal(null); }, [state.round]);
  const revealed = reveal ? setsInUse.flatMap((x) => x.questions).find((q) => q.id === reveal) : undefined;
  // Groups, a game per group and a set per student: Plus, Homeschool and Pro.
  const paid = tier !== 'free';
  const groups = state.groups ?? [{ gameId: state.gameId }];
  // Games a student plays on their own device: solo, live, or a versus game made for two devices (a Share game's Versus is one screen).
  const playable = GAMES.filter((g) => g.modes.some((m) => m === 'solo' || m === 'live' || (m === 'versus' && !g.modes.includes('share'))));
  const assignOf = (pid: string) => state.assign?.[pid] ?? {};
  const setAssign = (pid: string, patch: { group?: number; setId?: string }) => update((s) => ({ ...s, assign: { ...s.assign, [pid]: { ...s.assign?.[pid], ...patch } } }));

  const update = (fn: (s: LiveState) => LiveState) => setState((s) => ({ ...fn(s), at: Date.now() }));
  const setPlayer = (pid: string, patch: Partial<LivePlayer>) => update((s) => ({ ...s, players: s.players.map((p) => (p.pid === pid ? { ...p, ...patch } : p)) }));
  const inRoom = state.players.filter((p) => p.status === 'in');
  const pending = state.players.filter((p) => p.status === 'pending');
  const leaders = useMemo(() => ranked(state.players), [state.players]);
  const goal = state.goal ?? Math.max(10, inRoom.length * 10);
  const classRight = inRoom.reduce((n, p) => n + p.right, 0);
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
  // Question Tracker's class screen (approved mockup, batch 7): the join code
  // top left, the tools top right, the goal and who is playing in a column on
  // the right that the stars leave free, and a pill for every new star.
  const skyStage = useRef<HTMLDivElement>(null);
  const skyCol = useRef<HTMLDivElement>(null);
  const skyCodeBox = useRef<HTMLDivElement>(null);
  const colPct = useBoxPct(skyStage, skyCol, 12);
  const codePct = useBoxPct(skyStage, skyCodeBox, 10);
  const [starNote, setStarNote] = useState<{ id: number; name: string } | null>(null);
  const starCount = useRef(0);
  useEffect(() => {
    if (skyOrder.length > starCount.current && state.phase === 'play') {
      const name = state.players.find((p) => p.pid === skyOrder[skyOrder.length - 1])?.name;
      if (name) setStarNote({ id: Date.now(), name });
    }
    starCount.current = skyOrder.length;
  }, [skyOrder]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!starNote) return; const id = window.setTimeout(() => setStarNote(null), 2400); return () => window.clearTimeout(id); }, [starNote]);
  // Compete ends on its own at the teacher's number of right answers or time.
  const timeLeft = state.endAt?.minutes && state.startedAt && state.phase !== 'ended' ? Math.max(0, state.startedAt + state.endAt.minutes * 60000 - now) : null;
  useEffect(() => {
    if (state.phase !== 'play' || state.mode === 'together') return;
    if ((state.endAt?.right && leaders[0]?.right >= state.endAt.right) || timeLeft === 0) end();
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Territory Compete: everyone in gets a side, evenly, as they come in.
  const inKey = inRoom.map((p) => p.pid).join('|');
  useEffect(() => {
    if (!territory) return;
    const next = balanceTeams(inRoom.map((p) => p.pid), state.teams);
    if (JSON.stringify(next) !== JSON.stringify(state.teams ?? {})) update((s) => ({ ...s, teams: next }));
  }, [inKey]); // eslint-disable-line react-hooks/exhaustive-deps
  function end() {
    setMonOpen(false);
    setReveal(null);
    update((s) => ({ ...s, phase: 'ended', locks: {} }));
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, disableForReducedMotion: true });
  }
  const gameName = getGame(game.gameId)?.name ?? game.gameId;
  // A student's question set: the class set first, called Default, then the rest (teacher, 2026-11-06).
  const SetSelect = ({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) => (
    <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value)} className="min-h-10 max-w-56 px-2 rounded-input border-std border-border font-bold text-sm bg-surface">
      <option value={state.setId}>{t('live.defaultSet')}</option>
      {allSets.filter((x) => x.id !== state.setId).map((x) => <option key={x.id} value={x.id}>{x.name || t('sets.untitled')}</option>)}
    </select>
  );

  return (
    <ThemedPage theme={screen.theme}>
    <main className={`stage-text max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 pb-4 gap-4 ${state.phase === 'ended' && !skyGame ? 'grid' : 'flex flex-col overflow-hidden'}`} style={state.phase === 'ended' && !skyGame ? undefined : { height: 'calc(100dvh - 4rem)' }}>
      <div className={`flex flex-wrap items-center gap-2 ${state.phase === 'play' || state.phase === 'paused' || (skyGame && state.phase === 'ended') ? 'invisible' : ''}`}>
        <h1 className="font-display text-3xl flex-1 min-w-48"><Title text={t('live.hostTitle', { game: gameName })} /></h1>
        {state.phase === 'lobby' && (
          <button type="button" onClick={() => setSetOpen(true)} aria-label={t('live.settings')} data-tip={t('live.settings')}
            className="w-11 h-11 rounded-full border-bold border-border bg-surface flex items-center justify-center motion-safe:hover:rotate-45 motion-safe:transition-transform" style={{ boxShadow: '0 3px 0 var(--ink)' }}><GearSix weight="bold" size={22} /></button>
        )}
      </div>

      {state.phase === 'lobby' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 min-h-0 flex-1">
          <Panel className="grid gap-3 justify-items-center content-center text-center min-h-0">
            <p className="font-display text-2xl">{t('show.goTo', { host: window.location.host })}</p>
            <p className="font-display text-7xl tracking-[0.15em]" aria-label={t('host.codeIs', { code: game.code })}>{game.code}</p>
            <div className="flex items-center justify-center gap-3">
              {pieceImage(screen.theme, 'mascot') && <img src={pieceImage(screen.theme, 'mascot')} alt="" className="w-32 h-32 object-contain motion-safe:animate-[bounce_2.4s_ease-in-out_infinite]" />}
              {qr && <img src={qr} alt={t('show.qr')} className="w-48 h-48 rounded-input border-heavy border-border" />}
            </div>
          </Panel>
          <Panel className="flex flex-col gap-3 min-h-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-xl flex-1">{t('live.joined', { count: inRoom.length })}</p>
              <Button onClick={() => update((s) => ({ ...s, roomLocked: !s.roomLocked }))}>{state.roomLocked ? <LockSimple weight="fill" size={18} /> : <LockSimpleOpen weight="bold" size={18} />}{state.roomLocked ? t('live.roomLocked') : t('live.lockRoom')}</Button>
            </div>
            {pending.length > 0 && (
              <div className="grid gap-2">
                <p className="font-bold">{t('live.waiting', { count: pending.length })}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="main" onClick={() => update((s) => ({ ...s, players: s.players.map((p) => (p.status === 'pending' ? { ...p, status: 'in' } : p)) }))}><Check weight="bold" size={18} />{t('live.letAllIn')}</Button>
                </div>
              </div>
            )}
            <ul className="grid gap-2 list-none p-0 m-0 content-start flex-1 min-h-0 overflow-y-auto" aria-label={t('live.players')}>
              <AnimatePresence initial={false}>
                {state.players.filter((p) => p.status !== 'removed').map((p) => (
                  <motion.li key={p.pid} layout={!reduce} initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={`flex flex-wrap items-center gap-2 rounded-input border-std p-2 ${p.status === 'pending' ? 'border-border bg-butter' : 'border-border-soft'}`}>
                    {editing === p.pid
                      ? <input autoFocus defaultValue={p.name} maxLength={24} aria-label={t('live.renameTo', { name: p.name })} onBlur={(e) => { setPlayer(p.pid, { name: e.target.value.trim() || p.name }); setEditing(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} className="flex-1 min-h-10 px-2 rounded-input border-std border-border font-bold" />
                      : <span className="flex-1 font-bold min-w-32">{p.name}</span>}
                    {territory && state.mode === 'compete' && p.status === 'in' && state.teams?.[p.pid] && (
                      <button type="button" onClick={() => update((s) => ({ ...s, teams: swapTeam(s.teams ?? {}, p.pid) }))} aria-label={t('territory.swap', { name: p.name })} data-tip={t('territory.swap', { name: p.name })}
                        className="min-h-10 pl-1 pr-3 rounded-pill border-std border-border bg-surface font-bold text-sm inline-flex items-center gap-1.5">
                        <SideBadge side={state.teams[p.pid]} size="2rem" />{t(state.teams[p.pid] === 'defender' ? 'territory.cats' : 'territory.mice')}
                      </button>
                    )}
                    {paid && p.status === 'in' && groups.length > 1 && (
                      <select value={assignOf(p.pid).group ?? 0} aria-label={t('live.groupFor', { name: p.name })} onChange={(e) => setAssign(p.pid, { group: Number(e.target.value) })} className="min-h-10 px-2 rounded-input border-std border-border font-bold bg-surface text-sm">
                        {groups.map((_, i) => <option key={i} value={i}>{t('live.groupN', { n: i + 1 })}</option>)}
                      </select>
                    )}
                    {paid && p.status === 'in' && (
                      <SetSelect value={assignOf(p.pid).setId ?? state.setId} label={t('live.setFor', { name: p.name })} onChange={(v) => setAssign(p.pid, { setId: v })} />
                    )}
                    {p.status === 'pending' && <Button variant="main" onClick={() => setPlayer(p.pid, { status: 'in' })}><Check weight="bold" size={16} />{t('live.letIn', { name: p.name })}</Button>}
                    <button type="button" onClick={() => setEditing(p.pid)} aria-label={t('live.rename', { name: p.name })} className="w-10 h-10 rounded-full border-std border-border bg-surface flex items-center justify-center"><PencilSimple weight="bold" size={16} /></button>
                    <button type="button" onClick={() => setPlayer(p.pid, { status: 'removed' })} aria-label={t('live.remove', { name: p.name })} className="w-10 h-10 rounded-full border-std border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={16} /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {state.players.length === 0 && <p className="font-semibold text-muted">{t('live.empty')}</p>}
            <Button variant="primary" className="min-h-14 text-lg" disabled={inRoom.length === 0} onClick={() => update((s) => ({ ...s, phase: 'play', startedAt: Date.now() }))}><Play weight="fill" size={20} />{t('live.start', { count: inRoom.length })}</Button>
          </Panel>
        </div>
      )}

      {(state.phase === 'play' || state.phase === 'paused' || (skyGame && state.phase === 'ended')) && (
        // The big screen fills the whole window (teacher, 2026-11-06): the sky
        // (or board) edge to edge, the goal small along the bottom, the
        // leaderboard in the top right, and the teacher's tools behind small
        // buttons, so nothing covers the stars.
        <div ref={skyStage} className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-hidden" style={skyGame || territory ? undefined : { background: 'var(--stage-bg, var(--color-bg))' }}>
          {territory ? null : skyGame ? (
            <Sky theme={skyTheme} still={settings.motion === 'still'} height="100%" bleed
              hole={{ l: colPct?.l ?? 72, t: 0, r: 100, b: 100 }} keepOut={codePct ? [codePct] : undefined}
              filled={state.mode === 'together' ? Math.min(classRight, goal) : skyOrder.length}
              total={state.mode === 'together' ? goal : Math.max(skyOrder.length, (state.endAt?.right ?? 10) * Math.max(1, inRoom.length))}
              colors={state.mode === 'together' ? undefined : skyOrder.map((pid) => starColor(state.players, pid))}
              label={state.mode === 'together' ? t('live.goalText', { right: classRight, goal }) : t('live.skyLabel', { count: skyOrder.length })} />
          ) : state.mode !== 'together' && (
            <ol className="absolute inset-x-0 top-20 bottom-24 mx-auto max-w-4xl px-6 grid gap-3 content-center list-none m-0" aria-label={t('live.board.leaders')}>
              {leaders.slice(0, 10).map((p, i) => (
                <motion.li key={p.pid} layout={!reduce} className="grid grid-cols-[3rem_minmax(8rem,16rem)_1fr_4rem] items-center gap-3 stage-text">
                  <span className="font-display text-3xl text-center">{i === 0 ? <Crown weight="fill" size={28} color="var(--lemon)" aria-label="1" /> : i + 1}</span>
                  <span className="font-bold text-2xl truncate">{p.name}</span>
                  <span className="h-10 rounded-pill bg-surface-2 border-std border-border overflow-hidden"><motion.span className="block h-full bg-grape" initial={{ width: 0 }} animate={{ width: `${leaders[0].right ? (p.right / leaders[0].right) * 100 : 0}%` }} /></span>
                  <span className="font-display text-3xl text-right">{p.right}</span>
                </motion.li>
              ))}
            </ol>
          )}

          {/* Question Tracker: the join code top left, as on the mockup. */}
          {skyGame && (
            <div ref={skyCodeBox} className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <SkyCode code={game.code} />
              {timeLeft !== null && state.phase !== 'ended' && <span className="px-3 min-h-12 inline-flex items-center rounded-pill font-display text-2xl tabular-nums" style={{ ...PAPER, borderRadius: 999 }} aria-label={t('live.timeLeft', { time: clock(timeLeft) })}>{clock(timeLeft)}</span>}
            </div>
          )}
          {/* Teacher tools: small, with hover text; top left, or top right
              in the mockup's order on Question Tracker (Hint, monitor, pause,
              full screen, end). */}
          {state.phase !== 'ended' && !monOpen && <div className={`absolute top-3 z-10 flex items-center gap-2 ${skyGame ? 'right-3' : 'left-3'}`}>
            {skyGame && <HintButton gameId="star-quiz" />}
            <button type="button" onClick={() => setMonOpen((o) => !o)} aria-expanded={monOpen} aria-label={t('live.view.monitor')} data-tip={t('live.view.monitor')} className={TOOL}><SlidersHorizontal weight="bold" size={20} /></button>
            <button type="button" onClick={() => update((s) => ({ ...s, phase: s.phase === 'paused' ? 'play' : 'paused' }))} aria-label={state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')} data-tip={state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')} className={TOOL}>{state.phase === 'paused' ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}</button>
            {skyGame && <FullScreenButton small />}
            <button type="button" onClick={() => setConfirmEnd(true)} aria-label={t('live.end')} data-tip={t('live.end')} className={TOOL}>{skyGame ? <X weight="bold" size={20} /> : <Stop weight="fill" size={18} />}</button>
            {timeLeft !== null && !skyGame && <span className="ml-1 px-3 min-h-10 inline-flex items-center rounded-pill bg-surface border-std border-border font-display text-xl tabular-nums" aria-label={t('live.timeLeft', { time: clock(timeLeft) })}>{clock(timeLeft)}</span>}
          </div>}
          {/* The answer to one question, on the big screen: no names, no counts. */}
          {revealed && state.phase !== 'ended' && <RevealCard question={revealed} onClose={() => setReveal(null)} />}
          {/* The teacher's Live class view (approved /brand teacher portal 5
              and 5b): a full private view over the big screen. */}
          {monOpen && state.phase !== 'ended' && (
            <ClassView state={state} gameName={gameName} setName={allSets.find((x) => x.id === state.setId)?.name || t('sets.untitled')} sets={setsInUse} log={log} seenAt={seenAt.current} now={now}
              canMonitor={canMonitor} paid={paid} message={message} setMessage={setMessage} templates={TEMPLATES.map((k) => t(k))} lock={lock}
              onPause={() => update((s) => ({ ...s, phase: s.phase === 'paused' ? 'play' : 'paused' }))} onEnd={() => setConfirmEnd(true)} onClose={() => setMonOpen(false)}
              setSelect={(pl) => <SetSelect value={assignOf(pl.pid).setId ?? state.setId} label={t('live.setFor', { name: pl.name })} onChange={(v) => setAssign(pl.pid, { setId: v })} />}
              timeLeft={timeLeft !== null ? clock(timeLeft) : null} goal={goal} classRight={classRight} reveal={reveal} setReveal={setReveal}
              screenNow={t(revealed ? 'live.cv.onScreen.answer' : state.mode === 'together' && !territory ? 'live.board.goal' : skyGame ? 'live.cv.onScreen.sky' : territory ? 'live.cv.onScreen.room' : 'live.cv.onScreen.board')} />
          )}

          {confirmEnd && (
            <Dialog title={t('live.endConfirm')} sub={t('live.endConfirmHint')} size="sm" center zIndex={80} onClose={() => setConfirmEnd(false)}>
              <div className="flex gap-2">
                <Button onClick={() => setConfirmEnd(false)}>{t('live.keepPlaying')}</Button>
                <Button variant="danger" onClick={() => { setConfirmEnd(false); end(); }}><Stop weight="fill" size={18} />{t('live.end')}</Button>
              </div>
            </Dialog>
          )}
          {state.phase === 'paused' && <p className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-display text-xl bg-butter border-std border-border rounded-pill px-4 py-1" role="status">{t('live.pausedHost')}</p>}

          {/* Question Tracker: the column on the right (approved mockup):
              Cooperative shows the goal card and who is playing; Competitive
              shows the race line and the leaderboard, each name with its
              star color (never color alone: the name is there too). */}
          {skyGame && (
            <div ref={skyCol} className="absolute right-3 top-[4.25rem] z-10 w-[min(15rem,30vw)] grid gap-3 content-start max-h-[calc(100%-5rem)] overflow-hidden">
              {state.mode === 'together' ? (
                <>
                  <SkyGoalCard theme={skyTheme} got={Math.min(classRight, goal)} goal={goal} label={t('live.goalText', { right: Math.min(classRight, goal), goal })} />
                  <SkyPlaying names={inRoom.map((p) => p.name)} />
                </>
              ) : (
                <>
                  <p className="m-0 p-3 font-display text-lg leading-tight text-center" style={PAPER}>{state.endAt?.right ? t('live.firstTo', { n: state.endAt.right }) : t('sky.playing', { count: inRoom.length })}</p>
                  <ol className="grid gap-1.5 list-none m-0 p-3" style={PAPER} aria-label={t('live.board.leaders')}>
                    {leaders.slice(0, 8).map((p, i) => (
                      <motion.li key={p.pid} layout={!reduce} className="flex items-center gap-2 font-bold text-base">
                        <span className="w-5 text-center font-display">{i + 1}</span>
                        <StarIcon weight="fill" size={22} color={starColor(state.players, p.pid)} className="drop-shadow-[0_0_1px_#000] shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="font-score text-xl tabular-nums">{p.right}</span>
                      </motion.li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
          {/* A pill for every new star, bottom left, on the top layer. */}
          <AnimatePresence>
            {skyGame && starNote && state.phase === 'play' && (
              <motion.p key={starNote.id} role="status" className="absolute left-6 bottom-6 z-[60] m-0 pointer-events-none"
                initial={reduce ? false : { y: 30, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: [1.12, 1] }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
                <SkyBurst text={t('sky.classStar', { name: starNote.name })} style={{ background: 'var(--butter)' }} />
              </motion.p>
            )}
          </AnimatePresence>

          {/* The goal, small and centered along the bottom. */}
          {!territory && !skyGame && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[min(36rem,calc(100%-2rem))] grid gap-1 justify-items-center px-4 py-2 rounded-panel bg-surface/90 border-std border-border">
            {state.mode === 'together' ? (
              <>
                <p className="font-display text-lg">{t('live.goalText', { right: classRight, goal })}</p>
                <div className="w-full h-3 rounded-pill bg-surface-2 border-std border-border overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(classRight, goal)} aria-label={t('live.board.goal')}>
                  <motion.div className="h-full bg-[#7dd3a8]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (classRight / goal) * 100)}%` }} transition={{ duration: reduce ? 0 : 0.6 }} />
                </div>
              </>
            ) : (
              <p className="font-display text-lg">{state.endAt?.right ? t('live.firstTo', { n: state.endAt.right }) : t('live.lateCode', { code: game.code })}</p>
            )}
          </div>}
        </div>
      )}

      {territory && state.phase !== 'lobby' && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[29] overflow-hidden">
          <TerritoryStage theme={roomTheme} players={state.players} mode={state.mode === 'together' ? 'together' : 'compete'} teams={state.teams ?? {}}
            pace={(state.options?.pace ?? 'slow') as 'slow' | 'normal' | 'fast'} rule={(state.options?.rule ?? 'both') as 'both' | 'add' | 'chase'} goal={goal} phase={state.phase}
            onSummary={(room) => update((s) => ({ ...s, room }))} onGoal={end} />
        </div>
      )}
      {/* Question Tracker's results box over the class sky (approved mockup). */}
      {state.phase === 'ended' && skyGame && (() => {
        const filled = state.mode === 'together' && classRight >= goal;
        const top = leaders[0]?.right ?? 0;
        const winners = state.mode === 'together' ? [] : leaders.filter((p) => p.right === top && top > 0).slice(0, 3);
        const star = skyStar(skyTheme);
        return (
          <SkyResults
            title={state.mode === 'together' ? (filled ? t('sky.filled') : t('live.togetherTitle')) : t('live.podium')}
            art={state.mode === 'together' || !winners.length
              ? (star ? <img src={star} alt="" className="w-36 h-36 object-contain" draggable={false} /> : <StarIcon weight="fill" size={130} color="var(--lemon)" />)
              : winners.map((p) => <StarIcon key={p.pid} weight="fill" size={winners.length > 1 ? 96 : 130} color={starColor(state.players, p.pid)} style={{ filter: 'drop-shadow(0 3px 0 var(--color-border))' }} />)}
            score={state.mode === 'together' ? t('sky.score', { count: Math.min(classRight, goal) }) : winners.length ? winners.map((p) => p.name).join(', ') : t('sky.score', { count: classRight })}
            actions={<>
              <button type="button" className={`${RESULT_BTN} bg-accent`} style={{ boxShadow: 'var(--shadow-sticker)' }} onClick={() => update((s) => ({ ...s, phase: 'lobby', round: s.round + 1, room: undefined, players: s.players.map((p) => ({ ...p, answered: 0, right: 0, askedAt: null })) }))}><ArrowCounterClockwise weight="bold" size={18} />{t('live.again')}</button>
              <Link to="/teacher/activity" className={`${RESULT_BTN} bg-surface-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}><SquaresFour weight="bold" size={18} />{t('results.arcadeShort')}</Link>
              <Link to="/teacher/reports" className={`${RESULT_BTN} bg-quiz-blue`} style={{ boxShadow: 'var(--shadow-sticker)' }}><ChartBar weight="bold" size={18} />{t('live.reports')}</Link>
            </>}>
            {state.mode !== 'together' && winners.length > 0 && <p className="font-bold">{t('live.rightCount', { count: top })}</p>}
            <p className="font-bold flex items-center gap-2"><UsersThree weight="fill" size={20} aria-hidden="true" />{t('live.classTotal', { right: classRight, count: inRoom.length })}</p>
          </SkyResults>
        );
      })()}
      {state.phase === 'ended' && !skyGame && (
        <div className={territory ? 'fixed inset-0 z-40 grid place-items-center p-4' : 'contents'}>
        <Panel className={`grid gap-4 justify-items-center text-center ${territory ? 'w-[min(35rem,92vw)]' : ''}`}>
          <h2 className="font-display text-4xl uppercase"><Title text={territory ? (state.mode === 'together' ? t('territory.togetherDone', { n: state.room?.caught ?? 0 }) : t(`territory.won.${!state.room || state.room.defenders === state.room.invaders ? 'tie' : state.room.defenders > state.room.invaders ? 'defender' : 'invader'}`)) : state.mode === 'together' ? t('live.togetherTitle') : t('live.podium')} /></h2>
          {territory ? (
            <div className="flex items-center justify-center gap-6">
              {(['defender', 'invader'] as const).map((sd) => (
                <span key={sd} className="grid justify-items-center gap-1"><SideBadge side={sd} look={sd === 'defender' ? 0 : 1} size="4.5rem" /><span className="font-score text-4xl tabular-nums">{sd === 'defender' ? state.room?.defenders ?? 0 : state.room?.invaders ?? 0}</span><span className="font-bold">{t(sd === 'defender' ? 'territory.cats' : 'territory.mice')}</span></span>
              ))}
            </div>
          ) : state.mode === 'together' ? <p className="font-display text-3xl">{t(classRight >= goal ? 'live.togetherMet' : 'live.goalText', { right: classRight, goal })}</p> : (
          <div className="flex items-end justify-center gap-3 w-full max-w-xl">
            {[1, 0, 2].map((i) => leaders.at(i) && (
              <motion.div key={leaders.at(i)!.pid} initial={reduce ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: reduce ? 0 : 0.2 + (2 - i) * 0.25 }} className="flex-1 grid gap-2 justify-items-center">
                {i === 0 && (pieceImage(screen.theme, 'trophy') ? <img src={pieceImage(screen.theme, 'trophy')} alt="" className="h-20 object-contain" /> : <Crown weight="fill" size={40} color="var(--lemon)" aria-hidden="true" />)}
                <span className="font-display text-xl truncate max-w-full">{leaders.at(i)!.name}</span>
                <span className={`w-full rounded-t-panel border-heavy border-border flex items-start justify-center pt-2 font-display text-3xl ${i === 0 ? 'h-40 bg-butter' : i === 1 ? 'h-28 bg-blue-crystal' : 'h-20 bg-peach'}`}>{i + 1}</span>
                <span className="font-bold">{t('live.rightCount', { count: leaders.at(i)!.right })}</span>
              </motion.div>
            ))}
          </div>
          )}
          <p className="font-bold flex items-center gap-2"><UsersThree weight="fill" size={20} aria-hidden="true" />{t('live.classTotal', { right: classRight, count: inRoom.length })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => update((s) => ({ ...s, phase: 'lobby', round: s.round + 1, room: undefined, players: s.players.map((p) => ({ ...p, answered: 0, right: 0, askedAt: null })) }))}>{t('live.again')}</Button>
            <Link to="/teacher/reports" className={buttonClasses('secondary')}>{t('live.reports')}</Link>
          </div>
        </Panel>
        </div>
      )}
      {/* Lobby settings open in their own full view, so the projected lobby
          never scrolls (teacher, 2026-11-06). */}
      {setOpen && (
        <div className="fixed inset-0 z-50 bg-surface overflow-y-auto" role="dialog" aria-modal="true" aria-label={t('live.settings')}>
          <DialogFocus onClose={() => setSetOpen(false)} />
          <div className="max-w-4xl mx-auto px-6 py-6 grid gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl flex-1"><Title text={t('live.howPlay')} /></h2>
              <button type="button" onClick={() => setSetOpen(false)} className="min-h-11 px-5 rounded-pill border-bold border-border bg-grape text-white font-bold inline-flex items-center gap-1.5" style={{ boxShadow: '0 3px 0 var(--grape-deep)' }}><Check weight="bold" size={18} />{t('teams.done')}</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('live.howPlay')}>
              {(['together', 'compete'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={(state.mode ?? 'compete') === m} onClick={() => { update((s) => ({ ...s, mode: m })); }}
                  className={`min-h-16 px-4 rounded-input border-std text-left flex items-center gap-3 ${(state.mode ?? 'compete') === m ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
                  <ClassModeIcon mode={m} /><span className="grid"><span className="font-bold">{t(`live.mode.${m}`)}</span><span className="text-sm font-semibold text-muted">{t(`live.mode.${m}Hint`)}</span></span>
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
                        className={`min-h-11 px-4 rounded-pill border-std font-bold ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>{t(`live.end.${k}`)}</button>
                    );
                  })}
                  {state.endAt?.right !== undefined && (
                    <label className="flex items-center gap-2 font-bold">{t('live.end.rightN')}
                      <input type="number" min={1} max={500} value={state.endAt.right} onChange={(e) => update((s) => ({ ...s, endAt: { right: Math.max(1, Math.min(500, Number(e.target.value) || 1)) } }))} className="w-20 min-h-11 px-2 rounded-input border-std border-border font-bold" />
                    </label>
                  )}
                  {state.endAt?.minutes !== undefined && (
                    <label className="flex items-center gap-2 font-bold">{t('live.end.minutesN')}
                      <input type="number" min={1} max={60} value={state.endAt.minutes} onChange={(e) => update((s) => ({ ...s, endAt: { minutes: Math.max(1, Math.min(60, Number(e.target.value) || 1)) } }))} className="w-20 min-h-11 px-2 rounded-input border-std border-border font-bold" />
                    </label>
                  )}
                </div>
              </div>
            )}
            {state.mode === 'together' && (
              <label className="flex flex-wrap items-center gap-2 font-bold">{t('live.goalLabel')}
                <input type="number" min={5} max={999} value={goal} onChange={(e) => update((s) => ({ ...s, goal: Math.max(5, Math.min(999, Number(e.target.value) || 5)) }))} className="w-24 min-h-11 px-2 rounded-input border-std border-border font-bold" />
              </label>
            )}
            {territory && (
              <div className="grid gap-3">
                {([['pace', ['slow', 'normal', 'fast']], ...(state.mode === 'compete' ? [['rule', ['both', 'add', 'chase']]] : [])] as [string, string[]][]).map(([k, opts]) => (
                  <div key={k} className="grid gap-1.5">
                    <span className="font-bold">{t(`territory.${k}` as 'territory.pace')}</span>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t(`territory.${k}` as 'territory.pace')}>
                      {opts.map((o) => {
                        const on = (state.options?.[k] ?? opts[0]) === o;
                        return <button key={o} type="button" role="radio" aria-checked={on} onClick={() => update((s) => ({ ...s, options: { ...s.options, [k]: o } }))} className={`min-h-11 px-4 rounded-pill border-std font-bold ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>{t(`territory.${k}.${o}` as 'territory.pace.slow')}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <h3 className="font-bold text-lg">{t('live.groups')}</h3>
            {!paid && <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{t('live.groupsPlan')}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {groups.map((g, i) => (
                <label key={i} className="grid gap-1 font-bold text-sm rounded-input border-std border-border-soft p-2">{t('live.groupN', { n: i + 1 })}
                  <select value={g.gameId} disabled={!paid} aria-label={t('live.groupGame', { n: i + 1 })} onChange={(e) => update((s) => ({ ...s, groups: groups.map((x, j) => (j === i ? { gameId: e.target.value } : x)) }))} className="min-h-11 px-2 rounded-input border-std border-border font-bold bg-surface">
                    {playable.map((x) => <option key={x.id} value={x.id}>{x.name}{x.id === 'four-in-a-row' ? ` (${t('live.pairs')})` : ''}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {paid && <Button className="justify-self-start" disabled={groups.length >= 8} onClick={() => update((s) => ({ ...s, groups: [...groups, { gameId: s.gameId }] }))}><PlusIcon weight="bold" size={18} />{t('live.addGroup')}</Button>}
            <p className="text-sm font-semibold text-muted">{t('live.groupsHint')}</p>
            <label className="inline-flex items-center gap-2 font-bold min-h-11"><input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="w-5 h-5" />{t('live.approveNames')}</label>
          </div>
        </div>
      )}
    </main>
    </ThemedPage>
  );
}

const TOOL = 'w-11 h-11 rounded-full border-bold border-border bg-surface flex items-center justify-center text-[var(--text)]';
const clock = (ms: number) => { const sec = Math.ceil(ms / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
