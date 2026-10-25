import { useEffect, useState } from 'react';
import { openLink, type LiveLink, type LiveState } from './protocol';

// A student's place in a live game, kept per tab (like the Arcade session).
export interface LiveSession { code: string; pid: string; name: string }
const KEY = 'gamify:live';
const EVENT = 'gamify-live';
export function getLive(): LiveSession | null {
  try { const raw = sessionStorage.getItem(KEY); return raw ? (JSON.parse(raw) as LiveSession) : null; } catch { return null; }
}
export function setLive(s: LiveSession | null) {
  try { if (s) sessionStorage.setItem(KEY, JSON.stringify(s)); else sessionStorage.removeItem(KEY); sessionStorage.removeItem('gamify:live-tally'); } catch { /* this tab only */ }
  tally = { round: 0, answered: 0, right: 0 };
  window.dispatchEvent(new Event(EVENT));
}

let link: LiveLink | null = null;
let linkCode = '';
function linkFor(code: string): LiveLink {
  if (!link || linkCode !== code) { link?.close(); link = openLink(code); linkCode = code; }
  return link;
}

// Every answer in any game reports here; it reaches the host only during a live game.
const TALLY = 'gamify:live-tally';
type Tally = { round: number; answered: number; right: number };
let tally: Tally = (() => { try { return JSON.parse(sessionStorage.getItem(TALLY) ?? '') as Tally; } catch { return { round: 0, answered: 0, right: 0 }; } })();
const saveTally = () => { try { sessionStorage.setItem(TALLY, JSON.stringify(tally)); } catch { /* this tab only */ } };
function startRound(round: number) { if (tally.round !== round) { tally = { round, answered: 0, right: 0 }; saveTally(); } }
export function liveAsked() {
  const s = getLive();
  if (s) linkFor(s.code).send({ t: 'progress', pid: s.pid, ...tally, askedAt: Date.now() });
}
export function liveAnswered(right: boolean) {
  const s = getLive();
  if (!s) return;
  tally = { ...tally, answered: tally.answered + 1, right: tally.right + (right ? 1 : 0) };
  saveTally();
  linkFor(s.code).send({ t: 'progress', pid: s.pid, ...tally, askedAt: null });
}

// The student's view of the room: the host's latest state, asked for on open.
export function useLiveRoom() {
  const [session, setS] = useState(getLive);
  const [state, setState] = useState<LiveState | null>(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => { const on = () => setS(getLive()); window.addEventListener(EVENT, on); return () => window.removeEventListener(EVENT, on); }, []);
  useEffect(() => {
    if (!session) return;
    const l = linkFor(session.code);
    const off = l.listen((m) => {
      if (m.t === 'state') { startRound(m.state.round); setState(m.state); }
      if (m.t === 'closed' && m.pid === session.pid) setClosed(true);
    });
    l.send({ t: 'join', pid: session.pid, name: session.name });
    l.send({ t: 'hello', pid: session.pid });
    const beat = window.setInterval(() => l.send({ t: 'hello', pid: session.pid }), 4000);
    return () => { off(); window.clearInterval(beat); };
  }, [session]);
  const me = state?.players.find((p) => p.pid === session?.pid);
  return { session, state, me, closed };
}
