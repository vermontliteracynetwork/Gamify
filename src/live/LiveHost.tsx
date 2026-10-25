import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, Crown, LockSimple, LockSimpleOpen, Pause, PencilSimple, Play, Stop, Trash, UsersThree, Warning } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { findGameCode, type GameCode } from '../data/gameCodes';
import { useTier } from '../data/hooks';
import { getGame } from '../games/registry';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { Button, buttonClasses, Panel, Tabs } from '../ui/kit';
import Title from '../ui/Title';
import { LimitNote } from '../billing/Upgrade';
import { logLiveEvent } from './events';
import { openLink, ranked, reduceHost, type LiveLink, type LivePlayer, type LiveState } from './protocol';

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
  const [board, setBoard] = useState<'leaders' | 'goal'>('leaders');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<LiveState>({ code: game.code, gameId: game.gameId, setId: game.setId, phase: 'lobby', players: [], locks: {}, roomLocked: false, at: Date.now(), round: 1 });
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
      if (m.t === 'state' || m.t === 'closed') return;
      if (m.t === 'hello') { setState((s) => { l.send({ t: 'state', state: s }); return s; }); return; }
      setState((s) => {
        if (m.t === 'join' && s.roomLocked && !s.players.some((p) => p.pid === m.pid)) l.send({ t: 'closed', pid: m.pid });
        return reduceHost(s, m, approveRef.current);
      });
    });
    return () => { off(); l.close(); };
  }, [game.code]);
  // Every change goes out to every student at once.
  useEffect(() => { link.current?.send({ t: 'state', state }); }, [state]);

  const update = (fn: (s: LiveState) => LiveState) => setState((s) => ({ ...fn(s), at: Date.now() }));
  const setPlayer = (pid: string, patch: Partial<LivePlayer>) => update((s) => ({ ...s, players: s.players.map((p) => (p.pid === pid ? { ...p, ...patch } : p)) }));
  const inRoom = state.players.filter((p) => p.status === 'in');
  const pending = state.players.filter((p) => p.status === 'pending');
  const leaders = useMemo(() => ranked(state.players), [state.players]);
  const goal = Math.max(10, inRoom.length * 10);
  const classRight = inRoom.reduce((n, p) => n + p.right, 0);
  const allLocked = state.locks.all !== undefined;
  function lock(pid: string, on: boolean) {
    const who = pid === 'all' ? t('live.everyone') : state.players.find((p) => p.pid === pid)?.name ?? '';
    void logLiveEvent({ at: new Date().toISOString(), code: game.code, gameId: game.gameId, kind: on ? 'lock' : 'unlock', who, message: on ? message.trim() || undefined : undefined });
    update((s) => { const locks = { ...s.locks }; if (on) locks[pid] = message.trim(); else delete locks[pid]; if (pid === 'all' && !on) return { ...s, locks: {} }; return { ...s, locks }; });
  }
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
                    {p.status === 'pending' && <Button variant="primary" onClick={() => setPlayer(p.pid, { status: 'in' })}><Check weight="bold" size={16} />{t('live.letIn', { name: p.name })}</Button>}
                    <button type="button" onClick={() => setEditing(p.pid)} aria-label={t('live.rename', { name: p.name })} className="w-10 h-10 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><PencilSimple weight="bold" size={16} /></button>
                    <button type="button" onClick={() => setPlayer(p.pid, { status: 'removed' })} aria-label={t('live.remove', { name: p.name })} className="w-10 h-10 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={16} /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {state.players.length === 0 && <p className="font-semibold text-muted">{t('live.empty')}</p>}
            <Button variant="primary" className="min-h-14 text-lg" disabled={inRoom.length === 0} onClick={() => update((s) => ({ ...s, phase: 'play' }))}><Play weight="fill" size={20} />{t('live.start', { count: inRoom.length })}</Button>
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
                <Tabs label={t('live.boards')} value={board} onChange={setBoard} options={[{ id: 'leaders', label: t('live.board.leaders') }, { id: 'goal', label: t('live.board.goal') }]} />
              </div>
              {board === 'leaders' ? (
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
          <h2 className="font-display text-4xl"><Title text={t('live.podium')} /></h2>
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
