import { useEffect, useMemo, useRef, useState } from 'react';
import { readClassPlay } from './ClassPlay';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Check, Crown, Star as StarIcon, LockSimple, LockSimpleOpen, Pause, PencilSimple, Play, Stop, Trash, UsersThree, Warning, GearSix, SlidersHorizontal } from '@phosphor-icons/react';
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
import { LimitNote } from '../billing/Upgrade';
import { logLiveEvent } from './events';
import { openLink, ranked, reduceHost, starColor, type LiveLink, type LivePlayer, type LiveState } from './protocol';
import Sky from '../games/practice/Sky';
import { ThemedPage, useGameTheme } from '../theme/useGameTheme';
import { pieceImage } from '../theme/library';

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
  // Play or share passes compete or together (?mode=).
  const search = useLocation().search;
  const startMode = new URLSearchParams(search).get('mode') === 'together' ? 'together' : 'compete';
  // The setup menus pass when it ends and the class goal too (2026-10-31).
  const startPlay = readClassPlay(search);
  // Question Tracker shows the class sky (teacher, 2026-10-26).
  const skyGame = game.gameId === 'star-quiz';
  const { theme: skyTheme } = useGameTheme('star-quiz');
  // The big-screen look (Theme Builder, Big screen); the teacher picks it here.
  const screen = useGameTheme('big-screen');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [setOpen, setSetOpen] = useState(false);
  const [monOpen, setMonOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<LiveState>({ code: game.code, gameId: game.gameId, setId: game.setId, phase: 'lobby', players: [], locks: {}, roomLocked: false, at: Date.now(), round: 1, mode: startMode, ...(startPlay.endAt ? { endAt: startPlay.endAt } : {}), ...(startPlay.goal ? { goal: startPlay.goal } : {}) });
  const link = useRef<LiveLink>();
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
  // A student's question set: the class set first, called Default, then the rest (teacher, 2026-11-06).
  const SetSelect = ({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) => (
    <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value)} className="min-h-10 max-w-56 px-2 rounded-input border-[2px] border-border font-bold text-sm bg-surface">
      <option value={state.setId}>{t('live.defaultSet')}</option>
      {allSets.filter((x) => x.id !== state.setId).map((x) => <option key={x.id} value={x.id}>{x.name || t('sets.untitled')}</option>)}
    </select>
  );

  return (
    <ThemedPage theme={screen.theme}>
    <main className={`stage-text max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 pb-4 gap-4 ${state.phase === 'ended' ? 'grid' : 'flex flex-col overflow-hidden'}`} style={state.phase === 'ended' ? undefined : { height: 'calc(100dvh - 4rem)' }}>
      <div className={`flex flex-wrap items-center gap-2 ${state.phase === 'play' || state.phase === 'paused' ? 'invisible' : ''}`}>
        <h1 className="font-display text-3xl flex-1 min-w-48"><Title text={t('live.hostTitle', { game: gameName })} /></h1>
        {state.phase === 'lobby' && (
          <button type="button" onClick={() => setSetOpen(true)} aria-label={t('live.settings')} data-tip={t('live.settings')}
            className="w-11 h-11 rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center motion-safe:hover:rotate-45 motion-safe:transition-transform" style={{ boxShadow: '0 3px 0 #000' }}><GearSix weight="bold" size={22} /></button>
        )}
      </div>

      {state.phase === 'lobby' && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 min-h-0 flex-1">
          <Panel className="grid gap-3 justify-items-center content-center text-center min-h-0">
            <p className="font-display text-2xl">{t('show.goTo', { host: window.location.host })}</p>
            <p className="font-display text-7xl tracking-[0.15em]" aria-label={t('host.codeIs', { code: game.code })}>{game.code}</p>
            <div className="flex items-center justify-center gap-3">
              {pieceImage(screen.theme, 'mascot') && <img src={pieceImage(screen.theme, 'mascot')} alt="" className="w-32 h-32 object-contain motion-safe:animate-[bounce_2.4s_ease-in-out_infinite]" />}
              {qr && <img src={qr} alt={t('show.qr')} className="w-48 h-48 rounded-input border-[3px] border-border" />}
            </div>
            {screen.themes.length > 1 && (
              <label className="flex flex-wrap items-center justify-center gap-2 font-bold text-sm">{t('live.screenLook')}
                <select value={screen.theme.id} onChange={(e) => screen.choose(e.target.value)} className="min-h-11 px-2 rounded-input border-[2px] border-border font-bold bg-surface">
                  {screen.themes.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
                </select>
              </label>
            )}
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
                  <Button variant="primary" onClick={() => update((s) => ({ ...s, players: s.players.map((p) => (p.status === 'pending' ? { ...p, status: 'in' } : p)) }))}><Check weight="bold" size={18} />{t('live.letAllIn')}</Button>
                </div>
              </div>
            )}
            <ul className="grid gap-2 list-none p-0 m-0 content-start flex-1 min-h-0 overflow-y-auto" aria-label={t('live.players')}>
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
                      <SetSelect value={assignOf(p.pid).setId ?? state.setId} label={t('live.setFor', { name: p.name })} onChange={(v) => setAssign(p.pid, { setId: v })} />
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
        // The big screen fills the whole window (teacher, 2026-11-06): the sky
        // (or board) edge to edge, the goal small along the bottom, the
        // leaderboard in the top right, and the teacher's tools behind small
        // buttons, so nothing covers the stars.
        <div className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-hidden" style={skyGame ? undefined : { background: 'var(--stage-bg, var(--color-bg))' }}>
          {skyGame ? (
            <Sky theme={skyTheme} still={settings.motion === 'still'} height="100%" bleed bottomGap={14}
              hole={state.mode === 'together' ? null : { l: 74, t: 0, r: 100, b: 48 }}
              filled={state.mode === 'together' ? Math.min(classRight, goal) : skyOrder.length}
              total={state.mode === 'together' ? goal : Math.max(skyOrder.length, (state.endAt?.right ?? 10) * Math.max(1, inRoom.length))}
              colors={state.mode === 'together' ? undefined : skyOrder.map((pid) => starColor(state.players, pid))}
              label={state.mode === 'together' ? t('live.goalText', { right: classRight, goal }) : t('live.skyLabel', { count: skyOrder.length })} />
          ) : state.mode !== 'together' && (
            <ol className="absolute inset-x-0 top-20 bottom-24 mx-auto max-w-4xl px-6 grid gap-3 content-center list-none m-0" aria-label={t('live.board.leaders')}>
              {leaders.slice(0, 10).map((p, i) => (
                <motion.li key={p.pid} layout={!reduce} className="grid grid-cols-[3rem_minmax(8rem,16rem)_1fr_4rem] items-center gap-3 stage-text">
                  <span className="font-display text-3xl text-center">{i === 0 ? <Crown weight="fill" size={28} color="#c98a00" aria-label="1" /> : i + 1}</span>
                  <span className="font-bold text-2xl truncate">{p.name}</span>
                  <span className="h-10 rounded-pill bg-surface-2 border-[2px] border-border overflow-hidden"><motion.span className="block h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${leaders[0].right ? (p.right / leaders[0].right) * 100 : 0}%` }} /></span>
                  <span className="font-display text-3xl text-right">{p.right}</span>
                </motion.li>
              ))}
            </ol>
          )}

          {/* Teacher tools: small, top left, with hover text. */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <button type="button" onClick={() => setMonOpen((o) => !o)} aria-expanded={monOpen} aria-label={t('live.view.monitor')} data-tip={t('live.view.monitor')} className={TOOL}><SlidersHorizontal weight="bold" size={20} /></button>
            <button type="button" onClick={() => update((s) => ({ ...s, phase: s.phase === 'paused' ? 'play' : 'paused' }))} aria-label={state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')} data-tip={state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')} className={TOOL}>{state.phase === 'paused' ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}</button>
            <button type="button" onClick={() => setConfirmEnd(true)} aria-label={t('live.end')} data-tip={t('live.end')} className={TOOL}><Stop weight="fill" size={18} /></button>
            {timeLeft !== null && <span className="ml-1 px-3 min-h-10 inline-flex items-center rounded-pill bg-surface border-[2px] border-border font-display text-xl tabular-nums" aria-label={t('live.timeLeft', { time: clock(timeLeft) })}>{clock(timeLeft)}</span>}
          </div>
          {monOpen && (
            <div className="absolute top-16 left-3 z-20 w-[min(26rem,calc(100vw-1.5rem))] max-h-[calc(100%-5rem)] overflow-y-auto bg-surface border-[2.5px] border-border rounded-panel p-3 text-[var(--text)]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} role="dialog" aria-label={t('live.view.monitor')}>
              {!canMonitor ? <LimitNote>{t('live.monitorPlan')}</LimitNote> : (
            <div className="grid gap-3">
              <p className="text-sm font-bold">{t('live.monitorNote')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={80} placeholder={t('live.messagePlaceholder')} aria-label={t('live.message')} className="flex-1 min-w-48 min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
                {TEMPLATES.map((k) => <button key={k} type="button" onClick={() => setMessage(t(k))} className="min-h-10 px-3 rounded-pill border-[2px] border-border-soft bg-surface font-bold text-sm">{t(k)}</button>)}
                <Button variant="primary" onClick={() => lock('all', !allLocked)}>{allLocked ? <LockSimpleOpen weight="bold" size={18} /> : <LockSimple weight="fill" size={18} />}{allLocked ? t('live.unlockAll') : t('live.lockAll')}</Button>
              </div>
              <ul className="grid gap-2 list-none p-0 m-0" aria-label={t('live.players')}>
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
                      {paid && <SetSelect value={assignOf(p.pid).setId ?? state.setId} label={t('live.setFor', { name: p.name })} onChange={(v) => setAssign(p.pid, { setId: v })} />}
                      <p className="text-sm font-semibold text-muted">{onQ === null ? t('live.between') : t('live.onQuestion', { s: onQ })}</p>
                      {(stuck || low) && <p className="text-sm font-bold flex items-center gap-1"><Warning weight="fill" size={16} aria-hidden="true" />{stuck ? t('live.stuck') : t('live.guessing')}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
              )}
            </div>
          )}

          {confirmEnd && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label={t('live.endConfirm')}>
              <DialogFocus onClose={() => setConfirmEnd(false)} />
              <div className="bg-surface border-[3px] border-border rounded-panel p-6 grid gap-4 justify-items-center text-center max-w-sm w-full text-[var(--text)]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
                <p className="font-display text-2xl">{t('live.endConfirm')}</p>
                <p className="font-bold text-sm">{t('live.endConfirmHint')}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setConfirmEnd(false)}>{t('live.keepPlaying')}</Button>
                  <Button variant="danger" onClick={() => { setConfirmEnd(false); end(); }}><Stop weight="fill" size={18} />{t('live.end')}</Button>
                </div>
              </div>
            </div>
          )}
          {state.phase === 'paused' && <p className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-display text-xl bg-accent border-[2px] border-border rounded-pill px-4 py-1" role="status">{t('live.pausedHost')}</p>}

          {/* Compete: a small leaderboard in the top right, in the corner the stars leave free. */}
          {state.mode !== 'together' && skyGame && (
            <ol className="absolute top-3 right-3 z-10 w-[min(22%,18rem)] grid gap-1.5 list-none m-0 p-2 rounded-panel bg-surface/90 border-[2px] border-border" aria-label={t('live.board.leaders')}>
              {leaders.slice(0, 8).map((p, i) => (
                <motion.li key={p.pid} layout={!reduce} className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-5 text-center font-display">{i + 1}</span>
                  <StarIcon weight="fill" size={18} color={starColor(state.players, p.pid)} className="drop-shadow-[0_0_1px_#000] shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-display tabular-nums">{p.right}</span>
                </motion.li>
              ))}
            </ol>
          )}

          {/* The goal, small and centered along the bottom. */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[min(36rem,calc(100%-2rem))] grid gap-1 justify-items-center px-4 py-2 rounded-panel bg-surface/90 border-[2px] border-border">
            {state.mode === 'together' ? (
              <>
                <p className="font-display text-lg">{t('live.goalText', { right: classRight, goal })}</p>
                <div className="w-full h-3 rounded-pill bg-surface-2 border-[2px] border-border overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(classRight, goal)} aria-label={t('live.board.goal')}>
                  <motion.div className="h-full bg-[#7dd3a8]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (classRight / goal) * 100)}%` }} transition={{ duration: reduce ? 0 : 0.6 }} />
                </div>
              </>
            ) : (
              <p className="font-display text-lg">{state.endAt?.right ? t('live.firstTo', { n: state.endAt.right }) : t('live.lateCode', { code: game.code })}</p>
            )}
          </div>
        </div>
      )}

      {state.phase === 'ended' && (
        <Panel className="grid gap-4 justify-items-center text-center">
          <h2 className="font-display text-4xl"><Title text={state.mode === 'together' ? t('live.togetherTitle') : t('live.podium')} /></h2>
          {state.mode === 'together' ? <p className="font-display text-3xl">{t(classRight >= goal ? 'live.togetherMet' : 'live.goalText', { right: classRight, goal })}</p> : (
          <div className="flex items-end justify-center gap-3 w-full max-w-xl">
            {[1, 0, 2].map((i) => leaders.at(i) && (
              <motion.div key={leaders.at(i)!.pid} initial={reduce ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: reduce ? 0 : 0.2 + (2 - i) * 0.25 }} className="flex-1 grid gap-2 justify-items-center">
                {i === 0 && (pieceImage(screen.theme, 'trophy') ? <img src={pieceImage(screen.theme, 'trophy')} alt="" className="h-20 object-contain" /> : <Crown weight="fill" size={40} color="#c98a00" aria-hidden="true" />)}
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
      {/* Lobby settings open in their own full view, so the projected lobby
          never scrolls (teacher, 2026-11-06). */}
      {setOpen && (
        <div className="fixed inset-0 z-50 bg-surface overflow-y-auto" role="dialog" aria-modal="true" aria-label={t('live.settings')}>
          <DialogFocus onClose={() => setSetOpen(false)} />
          <div className="max-w-4xl mx-auto px-6 py-6 grid gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl flex-1"><Title text={t('live.howPlay')} /></h2>
              <button type="button" onClick={() => setSetOpen(false)} className="min-h-11 px-5 rounded-pill border-[2.5px] border-border bg-accent font-bold inline-flex items-center gap-1.5" style={{ boxShadow: '0 3px 0 #000' }}><Check weight="bold" size={18} />{t('teams.done')}</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('live.howPlay')}>
              {(['compete', 'together'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={(state.mode ?? 'compete') === m} onClick={() => { update((s) => ({ ...s, mode: m })); }}
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
                      <input type="number" min={1} max={500} value={state.endAt.right} onChange={(e) => update((s) => ({ ...s, endAt: { right: Math.max(1, Math.min(500, Number(e.target.value) || 1)) } }))} className="w-20 min-h-11 px-2 rounded-input border-[2px] border-border font-bold" />
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
            <label className="inline-flex items-center gap-2 font-bold min-h-11"><input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="w-5 h-5" />{t('live.approveNames')}</label>
          </div>
        </div>
      )}
    </main>
    </ThemedPage>
  );
}

const TOOL = 'w-11 h-11 rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center text-[var(--text)]';
const clock = (ms: number) => { const sec = Math.ceil(ms / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
