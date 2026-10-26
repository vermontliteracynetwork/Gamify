import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle, Crown, HourglassMedium, LockSimple, Pause, Prohibit, Star } from '@phosphor-icons/react';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';
import { ranked, routeFor, starColor, type LiveState } from './protocol';
import { setLive, useLiveRoom } from './session';

// The student's waiting room for a live game: waiting to be let in, then
// waiting for the start, then straight into the game.
export default function LiveLobby() {
  const { session, state, me, closed } = useLiveRoom();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const playing = state && me?.status === 'in' && (state.phase === 'play' || state.phase === 'paused');
  useEffect(() => {
    if (!playing || !me) return;
    const r = routeFor(state, me.pid);
    navigate(`/games/${r.gameId}?set=${r.setId}${r.pair ? `&pair=${r.pair.code}&seat=${r.pair.seat}` : ''}`, { replace: true });
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps
  const box = 'max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center';
  if (!session) return <main className={box}><p className="font-bold text-lg">{t('live.noSession')}</p><Link to="/join" className={buttonClasses('primary')}>{t('live.toJoin')}</Link></main>;
  if (closed) return <main className={box}><Prohibit weight="fill" size={64} aria-hidden="true" /><h1 className="title-bubble text-4xl"><Title text={t('live.closed')} /></h1><p className="font-bold">{t('live.closedText')}</p></main>;
  const status = !state ? 'finding' : !me ? 'finding' : me.status === 'removed' ? 'removed' : me.status === 'pending' ? 'pending' : 'in';
  return (
    <main className={box}>
      <motion.p key={session.name} initial={reduce ? false : { scale: 0.8 }} animate={{ scale: 1 }} className="font-display text-4xl">{session.name}</motion.p>
      <div className="bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-3 justify-items-center w-full" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} role="status" aria-live="polite">
        {status === 'in' ? <CheckCircle weight="fill" size={64} color="#1f7a45" aria-hidden="true" /> : status === 'removed' ? <Prohibit weight="fill" size={64} aria-hidden="true" /> : (
          <motion.span animate={reduce ? undefined : { rotate: [0, 180, 180, 360] }} transition={{ repeat: Infinity, duration: 2.4 }}><HourglassMedium weight="fill" size={64} aria-hidden="true" /></motion.span>
        )}
        <h1 className="font-display text-3xl"><Title text={t(`live.${status}`)} /></h1>
        <p className="font-bold">{t(`live.${status}Text`)}</p>
        {status === 'in' && state && me && skyColor(state, me.pid) && (
          <p className="flex items-center gap-2 font-display text-2xl"><Star weight="fill" size={44} color={skyColor(state, me.pid)} className="drop-shadow-[0_0_1px_#000]" aria-hidden="true" />{t('live.yourColor')}</p>
        )}
      </div>
    </main>
  );
}

// Over any game while a student is in a live game: the teacher's lock with
// its message, pause, being taken out, and the podium at the end.
export function LiveOverlay() {
  const { session, state, me } = useLiveRoom();
  const navigate = useNavigate();
  const path = useLocation().pathname;
  // Play again sends everyone back to the waiting room.
  useEffect(() => { if (session && state?.phase === 'lobby' && path.startsWith('/games/')) navigate(`/live/${session.code}`, { replace: true }); }, [state?.phase, path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { if (state && me) sessionStorage.setItem('gamify:live-color', skyColor(state, me.pid) ?? ''); } catch { /* this tab only */ } }, [state, me]);
  if (!session || !state || !me) return null;
  const lockMsg = state.locks[me.pid] ?? state.locks.all;
  const shell = 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55';
  const panel = 'bg-surface border-[3px] border-border rounded-panel p-8 grid gap-4 justify-items-center text-center max-w-lg w-full';
  if (state.phase === 'ended') {
    const top = ranked(state.players).slice(0, 3);
    const mine = ranked(state.players).findIndex((p) => p.pid === me.pid) + 1;
    return (
      <div className={shell} role="dialog" aria-modal="true" aria-label={t('live.endTitle')}>
        <DialogFocus />
        <div className={panel} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <h2 className="font-display text-4xl"><Title text={t('live.endTitle')} /></h2>
          {state.mode === 'together' ? (
            <p className="font-display text-2xl">{t('live.togetherEnd', { right: state.players.filter((p) => p.status === 'in').reduce((n, p) => n + p.right, 0), goal: state.goal ?? 0, mine: me.right })}</p>
          ) : <>
          <ol className="grid gap-2 list-none p-0 m-0 w-full">{top.map((p, i) => <li key={p.pid} className={`flex items-center gap-3 rounded-input border-[2px] border-border p-3 font-bold text-lg ${p.pid === me.pid ? 'bg-accent' : 'bg-surface-2'}`}>{i === 0 ? <Crown weight="fill" size={26} color="#c98a00" aria-hidden="true" /> : <span className="w-[26px] font-display">{i + 1}</span>}<span className="flex-1 text-left">{p.name}</span><span>{t('live.rightCount', { count: p.right })}</span></li>)}</ol>
          <p className="font-display text-2xl">{t('live.you', { count: me.right, place: mine })}</p>
          </>}
          <button type="button" onClick={() => { setLive(null); navigate('/join'); }} className={buttonClasses('primary', 'min-h-14 px-8 text-lg')}>{t('live.done')}</button>
        </div>
      </div>
    );
  }
  if (me.status === 'removed') {
    return <div className={shell} role="dialog" aria-modal="true" aria-label={t('live.removed')}><DialogFocus /><div className={panel}><Prohibit weight="fill" size={64} aria-hidden="true" /><h2 className="font-display text-3xl"><Title text={t('live.removed')} /></h2><p className="font-bold">{t('live.removedText')}</p></div></div>;
  }
  if (lockMsg !== undefined) {
    return <div className={shell} role="dialog" aria-modal="true" aria-label={t('live.locked')}><DialogFocus /><div className={panel} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}><LockSimple weight="fill" size={64} aria-hidden="true" /><h2 className="font-display text-3xl"><Title text={t('live.locked')} /></h2>{lockMsg && <p className="font-display text-2xl" role="status">{lockMsg}</p>}</div></div>;
  }
  if (state.phase === 'paused') {
    return <div className={shell} role="dialog" aria-modal="true" aria-label={t('live.paused')}><DialogFocus /><div className={panel} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}><Pause weight="fill" size={64} aria-hidden="true" /><h2 className="font-display text-3xl"><Title text={t('live.paused')} /></h2><p className="font-bold">{t('live.pausedText')}</p></div></div>;
  }
  return null;
}

// In Question Tracker's compete mode every student has a star color.
function skyColor(state: LiveState, pid: string): string | undefined {
  return state.gameId === 'star-quiz' && state.mode !== 'together' ? starColor(state.players, pid) : undefined;
}
export const liveStarColor = () => { try { return sessionStorage.getItem('gamify:live-color') || undefined; } catch { return undefined; } };
