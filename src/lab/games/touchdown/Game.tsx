import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Football, HandTap, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { pace } from '../../../engine/pace';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { advanceBall, cpuPlay, FG_POINTS, fieldGoalChance, PLAYS_PER_DRIVE, runPlay, START_YARD, TD_POINTS, type PlayId, type PlayResult } from './rules';

// Touchdown Drive (Game Lab, inspired by classroom quiz-board football
// games): each team drives down a field seen from above. Every right answer
// calls a play: a safe run, a short pass or a long bomb. Reach the end zone
// for a touchdown and an end-zone dance; stall close and kick a field goal.

const ART = '/lab/touchdown';
const POWERS: LabPower[] = [
  { id: 'juke', name: 'Juke Move', desc: 'Zig, zag! This play cannot fail and slips past for extra yards.', enter: 'wiggle', art: <Art kind="juke" /> },
  { id: 'hail', name: 'Hail Mary', desc: 'One giant throw to the end zone. Will it land?', enter: 'drop', art: <Art kind="hail" /> },
  { id: 'turbo', name: 'Turbo Cleats', desc: 'Lightning shoes! This play gains double yards.', enter: 'zoom', art: <Art kind="turbo" /> },
  { id: 'mascot', name: 'Mascot Dance', desc: 'The mascot dances and the crowd goes wild. One extra play.', enter: 'spin', art: <Art kind="mascot" /> },
  { id: 'golden', name: 'Golden Football', desc: 'Two bonus points right now.', enter: 'spin', art: <Art kind="golden" /> },
  { id: 'fumble', name: 'Fumble Wobble', desc: 'Whoops! The ball wobbles loose and bounces back five yards.', silly: true, art: <Art kind="fumble" /> },
  { id: 'sprinkler', name: 'Sprinkler Surprise', desc: 'The sprinklers pop on! Slippery grass halves this play.', silly: true, art: <Art kind="sprinkler" /> },
];

// The field from above (viewBox 180 x 100): goal lines at x 20 and 160.
const yx = (yard: number) => 20 + yard * 1.4;
const MID = 50;
const ACTORS = ['QB', 'RB', 'WR', 'L1', 'L2', 'D1', 'D2', 'D3', 'D4'] as const;
type Actor = typeof ACTORS[number];
type Pt = { x: number; y: number };
type Paths = Record<Actor, Pt[]> & { ball: (Pt & { s: number })[] };
const K = 9;

function formation(x0: number): Record<Actor, Pt> {
  return { QB: { x: x0 - 8, y: MID }, RB: { x: x0 - 15, y: MID + 1 }, WR: { x: x0 - 2, y: 26 }, L1: { x: x0 - 2.6, y: MID - 6.5 }, L2: { x: x0 - 2.6, y: MID + 6.5 }, D1: { x: x0 + 4.4, y: MID - 6.5 }, D2: { x: x0 + 4.4, y: MID + 6.5 }, D3: { x: x0 + 14, y: 34 }, D4: { x: x0 + 16, y: 66 } };
}
const lerp = (a: Pt, b: Pt, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const path = <T extends Pt>(f: (t: number) => T): T[] => Array.from({ length: K }, (_, i) => f(i / (K - 1)));

// Every actor's path for one play.
function playPaths(kind: PlayId | 'hail', r: PlayResult, x0: number, x1: number, juke: boolean): Paths {
  const F = formation(x0);
  const out = {} as Paths;
  const stay = (a: Actor, dx = 0, dy = 0) => path((t) => ({ x: F[a].x + dx * Math.min(1, t * 2), y: F[a].y + dy * Math.min(1, t * 2) }));
  out.L1 = stay('L1', 2.5); out.L2 = stay('L2', 2.5); out.D1 = stay('D1', 1.4, -1); out.D2 = stay('D2', 1.4, 1);
  if (kind === 'run') {
    const hand = { x: x0 - 8, y: MID + 1 };
    out.RB = path((t) => (t < 0.25 ? lerp(F.RB, hand, t / 0.25) : { x: hand.x + (x1 - hand.x) * ((t - 0.25) / 0.75), y: MID + Math.sin(t * Math.PI * 3) * (juke ? 9 : 4) }));
    out.QB = path((t) => ({ x: F.QB.x - t * 3, y: MID - t * 3 }));
    out.WR = path((t) => ({ x: F.WR.x + t * 18, y: 26 + t * 3 }));
    out.ball = out.RB.map((p, i) => (i < 2 ? { ...lerp(F.QB, p, i / 2), s: 1 } : { ...p, s: 1 }));
    out.D3 = path((t) => lerp(F.D3, { x: Math.min(x1 + 2.5, 165), y: MID - 3 }, Math.min(1, t * 1.1)));
    out.D4 = path((t) => lerp(F.D4, { x: Math.min(x1 + 3, 165), y: MID + 3 }, Math.min(1, t * 1.05)));
    return out;
  }
  // A pass: the receiver runs, the ball arcs through the air.
  const throwAt = 0.25, catchAt = 0.62;
  const target = kind === 'hail' ? Math.min(168, x0 + 70) : r.complete ? x0 + (x1 - x0) * 0.75 : x0 + (kind === 'short' ? 16 : 40);
  const catchPt = { x: Math.min(target, 168), y: 30 };
  out.QB = path((t) => ({ x: F.QB.x - Math.min(t, throwAt) * 18, y: MID }));
  out.RB = path((t) => ({ x: F.RB.x + t * 4, y: MID + 1 + t * 10 }));
  out.WR = path((t) => (t < catchAt ? lerp(F.WR, catchPt, t / catchAt) : r.complete ? lerp(catchPt, { x: Math.min(x1, 170), y: 34 }, (t - catchAt) / (1 - catchAt)) : { x: catchPt.x + (t - catchAt) * 6, y: catchPt.y }));
  const qbAt = { x: F.QB.x - throwAt * 18, y: MID };
  const landPt = r.complete ? catchPt : r.picked ? { x: catchPt.x, y: 34 } : { x: catchPt.x + 4, y: 34 };
  out.ball = path((t) => {
    if (t <= throwAt) return { ...lerp(F.QB, qbAt, t / throwAt), s: 1 };
    if (t <= catchAt) { const u = (t - throwAt) / (catchAt - throwAt); return { ...lerp(qbAt, landPt, u), s: 1 + (kind === 'hail' ? 2.4 : kind === 'bomb' ? 1.6 : 0.9) * Math.sin(u * Math.PI) }; }
    if (r.complete) return { ...lerp(catchPt, { x: Math.min(x1, 170), y: 34 }, (t - catchAt) / (1 - catchAt)), s: 1 };
    if (r.picked) return { x: landPt.x - (t - catchAt) * 30, y: 36, s: 1 };
    return { x: landPt.x + (t - catchAt) * 12, y: 34 + Math.abs(Math.sin((t - catchAt) * 12)) * -3, s: 1 };
  });
  out.D3 = path((t) => (r.picked && t > catchAt ? { x: catchPt.x - (t - catchAt) * 30, y: 36 } : lerp(F.D3, { x: catchPt.x + 2, y: 34 }, Math.min(1, t / catchAt))));
  out.D4 = path((t) => lerp(F.D4, { x: Math.min(x1 + 3, 165), y: 40 }, Math.min(1, t)));
  return out;
}

interface Mods { juke: boolean; turbo: boolean; sprinkler: boolean }
const NO_MODS: Mods = { juke: false, turbo: false, sprinkler: false };
type Phase = 'wait' | 'pick' | 'play' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const P = pace(ctx.settings) / 1.6;
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms * P));
  const [phase, setPhase] = useState<Phase>('wait');
  const [yard, setYardState] = useState(START_YARD);
  const yardRef = useRef(START_YARD);
  const setYard = (y: number) => { yardRef.current = y; setYardState(y); };
  const [left, setLeft] = useState(PLAYS_PER_DRIVE);
  const [paths, setPaths] = useState<{ key: number; p: Paths; dur: number } | null>(null);
  const [mods, setModsState] = useState<Mods>(NO_MODS);
  const modsRef = useRef<Mods>(NO_MODS);
  const setMods = (m: Partial<Mods>) => { modsRef.current = { ...modsRef.current, ...m }; setModsState(modsRef.current); };
  const [dance, setDance] = useState(0);
  const [carrier, setCarrier] = useState<Actor>('QB');
  const [mascot, setMascot] = useState(0);
  const [wobble, setWobble] = useState(0);
  const [golden, setGolden] = useState(0);
  const [kick, setKick] = useState<{ key: number; ok: boolean } | null>(null);
  const [cheer, setCheer] = useState(0);
  const [trophies, setTrophies] = useState<Record<string, ('td' | 'fg')[]>>({});
  const input = useRef<((p: PlayId) => void) | null>(null);
  const live = useRef(0);
  const keyN = useRef(1);
  const color = TEAM_COLORS[ctx.player.colorIndex % TEAM_COLORS.length];
  const still = ctx.still;

  useEffect(() => {
    const id = ++live.current;
    void drive(id);
    return () => { live.current++; input.current = null; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps
  const alive = (id: number) => live.current === id;
  const choose = () => new Promise<PlayId>((r) => { input.current = r; });

  async function drive(id: number) {
    setYard(START_YARD); setPaths(null); setCarrier('QB'); setKick(null); setMods(NO_MODS); setPhase('wait');
    let plays = PLAYS_PER_DRIVE;
    setLeft(plays);
    let done: 'td' | 'pick' | null = null;
    await wait(600);
    while (plays > 0 && alive(id)) {
      setPhase('wait'); setMods(NO_MODS);
      const ok = await c.current.ask();
      if (!alive(id)) return;
      plays -= 1; setLeft(plays);
      if (!ok) { c.current.sfx.wrong(); c.current.say('Incomplete!', 'oops'); await wait(1300); continue; }
      const pw = await c.current.power(0.4);
      if (!alive(id)) return;
      const hail = pw?.id === 'hail';
      if (pw) { const extra = await usePower(pw); plays += extra; setLeft(plays); }
      if (!alive(id)) return;
      let kind: PlayId | 'hail' = 'run';
      if (!hail) {
        setPhase('pick');
        if (c.current.cpu) { await wait(1400); kind = cpuPlay(yardRef.current, plays + 1, c.current.cpuRight()); }
        else kind = await choose();
        if (!alive(id)) return;
        c.current.sfx.whistle();
      } else kind = 'hail';
      const res: PlayResult = kind === 'hail'
        ? (Math.random() < 0.5 ? { yards: 100, complete: true, picked: false } : { yards: 0, complete: false, picked: false })
        : runPlay(kind, modsRef.current);
      done = await runIt(id, kind, res);
      if (!alive(id)) return;
      if (done) break;
      await wait(500);
    }
    if (!alive(id)) return;
    setPhase('busy');
    if (!done) {
      const chance = fieldGoalChance(yardRef.current);
      if (chance > 0) {
        c.current.say('Field goal try!', 'good');
        await wait(1200);
        const ok = Math.random() < chance;
        setKick({ key: keyN.current++, ok });
        c.current.sfx.kick();
        await wait(1400);
        if (!alive(id)) return;
        if (ok) { c.current.points(FG_POINTS); trophy('fg'); c.current.say('It is good!', 'big'); c.current.sfx.bell(); c.current.burst(0.85, 0.5); setCheer((n) => n + 1); }
        else { c.current.say('Wide! No good', 'oops'); c.current.sfx.oops(); }
      } else { c.current.say('Drive over!', 'oops'); c.current.sfx.whistle(); }
      await wait(1700);
    }
    if (!alive(id)) return;
    c.current.setHeld(c.current.player.id, []);
    c.current.next();
  }

  function trophy(kind: 'td' | 'fg') {
    const pid = c.current.player.id;
    setTrophies((t) => ({ ...t, [pid]: [...(t[pid] ?? []), kind] }));
  }

  // Each power-up does its own thing on the field. Returns extra plays.
  async function usePower(p: LabPower): Promise<number> {
    const x = c.current;
    // This play's power-up stays listed (a still picture) until the play is over.
    if (p.id !== 'golden' && p.id !== 'fumble' && p.id !== 'mascot') x.setHeld(x.player.id, [p]);
    switch (p.id) {
      case 'juke': setMods({ juke: true }); x.sfx.zap(); break;
      case 'turbo': setMods({ turbo: true }); x.sfx.zap(); window.setTimeout(() => c.current.sfx.whoosh(), 200); break;
      case 'sprinkler': setMods({ sprinkler: true }); x.sfx.splash(); break;
      case 'hail': x.sfx.slideUp(); break;
      case 'golden': setGolden((n) => n + 1); x.points(2); x.sfx.coin(); window.setTimeout(() => c.current.sfx.coin(), 220); x.burst(0.5, 0.45); break;
      case 'mascot': setMascot((n) => n + 1); x.sfx.cheer(); setCheer((n) => n + 1); await wait(1400); return 1;
      case 'fumble': {
        setWobble((n) => n + 1); x.sfx.boing(); window.setTimeout(() => c.current.sfx.boing(), 350);
        await wait(700);
        setYard(Math.max(1, yardRef.current - 5));
        await wait(700);
        return 0;
      }
    }
    await wait(900);
    return 0;
  }

  async function runIt(id: number, kind: PlayId | 'hail', res: PlayResult): Promise<'td' | 'pick' | null> {
    const x = c.current;
    setPhase('play');
    const from = yardRef.current;
    const after = advanceBall(from, res.complete ? res.yards : 0);
    const x0 = yx(from), x1 = yx(after.yard) + (after.td ? 6 : 0);
    const dur = (kind === 'run' ? 1.6 : 2.1) * P;
    setCarrier(kind === 'run' ? 'RB' : 'WR');
    setPaths({ key: keyN.current++, p: playPaths(kind, res, x0, x1, modsRef.current.juke), dur });
    x.sfx.thud();
    if (kind !== 'run') window.setTimeout(() => c.current.sfx.whoosh(), dur * 250);
    await new Promise((r) => window.setTimeout(r, dur * 1000));
    if (!alive(id)) return null;
    if (res.picked) { x.sfx.oops(); x.say('Picked off!', 'oops'); await wait(1600); return 'pick'; }
    if (!res.complete) { x.sfx.thud(); x.say('Incomplete!', 'oops'); await wait(1300); setPaths(null); setCarrier('QB'); return null; }
    if (after.td) {
      setYard(100);
      x.points(TD_POINTS); trophy('td');
      x.say('TOUCHDOWN!', 'big');
      x.sfx.cheer(); playClip(`${ART}/celebrate.mp3`, x.settings);
      setDance((n) => n + 1); setCheer((n) => n + 1);
      x.burst(0.82, 0.4, 'big');
      await wait(2600);
      return 'td';
    }
    x.sfx.crash();
    x.say(res.yards >= 20 ? `Big gain!` : res.yards > 0 ? `+${res.yards} yards` : 'No gain', res.yards >= 20 ? 'big' : 'good');
    if (res.yards >= 15) playClip(`${ART}/clap.mp3`, x.settings, 0.5);
    await wait(900);
    setYard(after.yard);
    setPaths(null); setCarrier('QB');
    return null;
  }

  // Keys 1, 2, 3 call a play.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const m: Record<string, PlayId> = { 1: 'run', 2: 'short', 3: 'bomb' }; if (m[e.key] && !c.current.cpu) input.current?.(m[e.key]); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const F = formation(yx(yard));
  const human = !ctx.cpu;
  const tr = () => ({ duration: paths ? paths.dur : 0.7 * P, ease: 'linear' as const, times: paths ? Array.from({ length: K }, (_, k) => k / (K - 1)) : undefined });

  return (
    <div className="absolute inset-0 grid place-items-center">
      <style>{CSS}</style>
      <div className="relative lab-fit rounded-[1.4rem] border-heavy border-border overflow-hidden" style={{ ['--ar' as string]: 1.8, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' }}>
        <svg viewBox="0 0 180 100" className="absolute inset-0 w-full h-full" role="img" aria-label="Football field">
          <FieldArt />
          <g key={`ch${cheer}`} className={still ? '' : 'td-cheer'}><Crowd /></g>
          {/* The end zone you drive toward wears your team color. */}
          <rect x="160" y="16" width="14" height="68" fill={color} opacity="0.9" />
          <path d="M160 16 h14 v68 h-14 z" fill="url(#td-stripes)" />
          <path d="M160 16 V84" stroke="#fbfcf8" strokeWidth="0.8" />
          <path d="M167 43 l2 4.2 4.6 .6 -3.4 3.2 .9 4.6 -4.1 -2.3 -4.1 2.3 .9 -4.6 -3.4 -3.2 4.6 -.6 z" fill="#fbfcf8" stroke="#000" strokeWidth="0.4" opacity="0.9" />
          {/* Goal posts from above. */}
          <path d="M176 44 V56 M176 50 H179" stroke="#f6c544" strokeWidth="1.2" strokeLinecap="round" />
          {/* The drive so far: a glowing trail in the team color. */}
          <motion.rect initial={false} animate={{ width: Math.max(0, yx(yard) - yx(START_YARD)) }} transition={{ type: 'spring', stiffness: 70, damping: 14 }} x={yx(START_YARD)} y="47" height="6" rx="3" fill={color} opacity="0.55" />
          {/* The line of scrimmage. */}
          <motion.path initial={false} animate={{ x: yx(yard) - 20 }} transition={{ type: 'spring', stiffness: 80, damping: 14 }} d="M20 16 V84" stroke="#6aa9e9" strokeWidth="0.9" opacity="0.9" />
          {/* Sprinklers spray the field. */}
          {mods.sprinkler && !still && [50, 90, 130].map((sx) => (
            <g key={sx}>{[-1, 1].map((d) => <motion.path key={d} d={`M${sx} 50 q${d * 8} -14 ${d * 16} -2`} stroke="#7fd6e3" strokeWidth="1" fill="none" strokeDasharray="1.5 1.5" animate={{ strokeDashoffset: [0, -6] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} />)}<circle cx={sx} cy="50" r="1.2" fill="#5b5f7a" /></g>
          ))}
          {/* The players: your team in your color, the defense in navy. */}
          {ACTORS.map((a) => {
            const pp = paths?.p[a];
            const def = a.startsWith('D');
            const isCarrier = a === carrier && paths;
            return (
              <motion.g key={`${a}-${paths?.key ?? 'f'}`} initial={false} animate={pp ? { x: pp.map((p) => p.x), y: pp.map((p) => p.y) } : { x: F[a].x, y: F[a].y }} transition={pp ? tr() : { type: 'spring', stiffness: 70, damping: 13 }}>
                <motion.g key={`d${dance}`} animate={dance && a === 'WR' || dance && a === 'RB' ? (still ? undefined : { rotate: [0, 360, 360, 720], scale: [1, 1.4, 1, 1.3, 1] }) : undefined} transition={{ duration: 2.2 }}>
                  {isCarrier && mods.turbo && !still && <path d="M-9 -1 l3 0 l-2 2 l4 0" stroke="#f6c544" strokeWidth="0.8" fill="none" className="td-zip" />}
                  <PlayerTop color={def ? '#241c3d' : color} stripe={def ? '#ef7d96' : '#fbfcf8'} flip={def} />
                </motion.g>
              </motion.g>
            );
          })}
          {/* The ball. */}
          <motion.g key={`ball-${paths?.key ?? 'f'}-${wobble}`} initial={false}
            animate={paths ? { x: paths.p.ball.map((p) => p.x), y: paths.p.ball.map((p) => p.y), scale: paths.p.ball.map((p) => p.s), rotate: paths.p.ball.map((_, i) => i * 40) } : wobble && !still ? { x: [F.QB.x + 2, F.QB.x + 5, F.QB.x - 2, F.QB.x + 2], y: [MID, MID - 6, MID + 3, MID], rotate: [0, 200, 380, 720] } : { x: F.QB.x + 2, y: MID, rotate: 0 }}
            transition={paths ? tr() : wobble ? { duration: 1.1 } : { type: 'spring', stiffness: 70, damping: 13 }}>
            <TeamBall />
          </motion.g>
          {/* Field goal kick. */}
          {kick && (
            <motion.g key={kick.key} initial={{ x: yx(yard) - 6, y: MID, scale: 1 }} animate={{ x: [yx(yard) - 6, 150, 178], y: kick.ok ? [MID, MID - 2, MID] : [MID, MID - 8, 30], scale: [1, 2.2, 1.2] }} transition={{ duration: 1.3, ease: 'easeOut' }}>
              <TeamBall />
            </motion.g>
          )}
          {/* The mascot dances on the sideline. */}
          {mascot > 0 && (
            <motion.g key={`m${mascot}`} initial={{ x: 90, y: 110 }} animate={still ? { x: 90, y: 80 } : { x: 90, y: [110, 80, 80, 80, 110], rotate: [0, -20, 20, -20, 0] }} transition={{ duration: 2.4 }}>
              <Mascot />
            </motion.g>
          )}
          {/* A golden football falls from the sky. */}
          {golden > 0 && !still && (
            <motion.g key={`g${golden}`} initial={{ x: 90, y: -20, scale: 2 }} animate={{ y: [-20, 50, 44, 50], scale: [2, 2, 2.4, 0], rotate: [0, 360, 360, 540] }} transition={{ duration: 1.6 }}>
              <ellipse rx="5" ry="3" fill="#f6c544" stroke="#000" strokeWidth="0.5" /><path d="M-2 0 h4 M-1 -0.8 v1.6 M1 -0.8 v1.6" stroke="#fbfcf8" strokeWidth="0.5" />
            </motion.g>
          )}
          {/* Plays left this drive. */}
          <g transform="translate(24 20)">
            {Array.from({ length: Math.max(left, PLAYS_PER_DRIVE) }, (_, i) => (
              <g key={i} transform={`translate(${i * 6} 0)`} opacity={i < left ? 1 : 0.25}><ellipse rx="2.4" ry="1.5" fill="#a0603a" stroke="#000" strokeWidth="0.35" /><path d="M-0.9 0 h1.8" stroke="#fbfcf8" strokeWidth="0.35" /></g>
            ))}
          </g>
        </svg>
        {/* The trophy wall: every touchdown and field goal for each team. */}
        <div className="absolute inset-x-[2%] bottom-[1.2%] h-[12%] flex flex-wrap content-center gap-x-[1%] gap-y-[4%] pointer-events-none" aria-hidden="true">
          {ctx.turns.players.slice(0, 6).map((p) => (
            <div key={p.id} className="h-[45%] min-h-5 flex items-center gap-1 rounded-full bg-[rgba(36,28,61,0.75)] border border-black pl-0.5 pr-2">
              <TeamBadge colorIndex={p.colorIndex} size={16} />
              <AnimatePresence>
                {(trophies[p.id] ?? []).slice(-10).map((t, i) => (
                  <motion.span key={i} initial={still ? false : { scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    className={`inline-block rounded-full border border-black ${t === 'td' ? 'w-[1.1rem] h-[0.7rem]' : 'w-[0.7rem] h-[0.7rem]'}`} style={{ background: t === 'td' ? '#a0603a' : '#f6c544' }} />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {/* Call a play. */}
        <AnimatePresence>
          {phase === 'pick' && (
            <motion.div className="absolute inset-x-0 bottom-[16%] flex justify-center gap-[2.5%] px-[8%]" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
              {(['run', 'short', 'bomb'] as PlayId[]).map((p, i) => (
                <motion.button key={p} type="button" disabled={!human} onClick={() => input.current?.(p)} aria-label={PLAY_NAMES[p]}
                  className="w-[24%] min-h-11 aspect-[1.6] rounded-[1rem] border-heavy border-border bg-surface grid grid-rows-[1fr_auto] justify-items-center p-[2%] disabled:cursor-default motion-safe:hover:scale-[1.06] motion-safe:hover:-translate-y-1 motion-safe:transition-transform"
                  style={{ boxShadow: '0 5px 0 #000' }} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 14 }}>
                  <PlayPic kind={p} />
                  <span className="font-display text-[clamp(0.9rem,2.2cqw,1.6rem)] leading-none">{PLAY_NAMES[p]}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === 'pick' && human && (
            <motion.div className="absolute right-[2%] top-[19%] pointer-events-none" initial={{ scale: 0 }} animate={{ scale: 1, y: still ? 0 : [0, -4, 0] }} exit={{ scale: 0 }} transition={{ y: { duration: 0.9, repeat: Infinity } }}>
              <span className="w-[clamp(2.8rem,6cqw,4.5rem)] aspect-square rounded-full border-heavy border-border grid place-items-center bg-accent" style={{ boxShadow: '0 4px 0 #000' }}><HandTap weight="fill" className="w-1/2 h-1/2" /></span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PLAY_NAMES: Record<PlayId, string> = { run: 'Run', short: 'Short pass', bomb: 'Long bomb' };

const CSS = `
.td-cheer > g { animation: td-cheer 0.45s ease-in-out 4 both; }
.td-cheer > g:nth-child(2n) { animation-delay: 0.12s; }
@keyframes td-cheer { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }
.td-cheer > g { transform-box: fill-box; transform-origin: center; }
.td-zip { animation: td-zip 0.2s linear infinite alternate; }
@keyframes td-zip { from { opacity: 0.4; } to { opacity: 1; } }
html[data-motion="still"] .td-cheer > g, html[data-motion="still"] .td-zip { animation: none; }
`;

// A player seen from above: shoulder pads and a helmet with a stripe.
function PlayerTop({ color, stripe, flip }: { color: string; stripe: string; flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1.6 1.6)' : 'scale(1.6)'}>
      <ellipse cx="0.6" cy="0.8" rx="3.6" ry="2.4" fill="#000" opacity="0.2" />
      <ellipse rx="2.2" ry="3.8" fill={color} stroke="#000" strokeWidth="0.45" />
      <circle r="2.2" fill={color} stroke="#000" strokeWidth="0.45" />
      <path d="M-2 0 H2" stroke={stripe} strokeWidth="0.7" />
      <path d="M1.6 -1.2 Q2.8 0 1.6 1.2" stroke="#fbfcf8" strokeWidth="0.5" fill="none" />
    </g>
  );
}

function TeamBall() {
  return (
    <g>
      <ellipse cx="0.4" cy="0.6" rx="2.6" ry="1.4" fill="#000" opacity="0.2" />
      <ellipse rx="2.6" ry="1.6" fill="#a0603a" stroke="#000" strokeWidth="0.4" />
      <path d="M-1 0 h2 M-0.5 -0.6 v1.2 M0 -0.6 v1.2 M0.5 -0.6 v1.2" stroke="#fbfcf8" strokeWidth="0.3" />
    </g>
  );
}

function Mascot() {
  return (
    <g>
      <ellipse rx="6" ry="7" fill="#8fe3a0" stroke="#000" strokeWidth="0.6" />
      <circle cx="-4" cy="-6" r="2" fill="#8fe3a0" stroke="#000" strokeWidth="0.5" /><circle cx="4" cy="-6" r="2" fill="#8fe3a0" stroke="#000" strokeWidth="0.5" />
      <circle cx="-2" cy="-1.5" r="1.6" fill="#fff" stroke="#000" strokeWidth="0.4" /><circle cx="2" cy="-1.5" r="1.6" fill="#fff" stroke="#000" strokeWidth="0.4" />
      <circle cx="-1.8" cy="-1.3" r="0.7" /><circle cx="2.2" cy="-1.3" r="0.7" />
      <path d="M-2 2.5 Q0 4.6 2 2.5" stroke="#000" strokeWidth="0.5" fill="#ef7d96" />
      <path d="M-6 0 L-10 -5 M6 0 L10 -5" stroke="#000" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

function PlayPic({ kind }: { kind: PlayId }) {
  return (
    <svg viewBox="0 0 60 30" className="w-full h-full" aria-hidden="true">
      <circle cx="8" cy="22" r="4" fill="#fdfd94" stroke="#000" strokeWidth="1.2" />
      {kind === 'run' && <path d="M14 22 Q20 16 26 22 T38 22" stroke="#241c3d" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {kind === 'run' && <path d="M36 17 l6 5 l-6 5" stroke="#241c3d" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'short' && <><path d="M13 20 Q24 4 36 16" stroke="#241c3d" strokeWidth="2.4" fill="none" strokeDasharray="3 2.4" strokeLinecap="round" /><circle cx="38" cy="18" r="3.4" fill="#8fe3a0" stroke="#000" strokeWidth="1.2" /></>}
      {kind === 'bomb' && <><path d="M13 20 Q32 -6 52 14" stroke="#241c3d" strokeWidth="2.4" fill="none" strokeDasharray="3 2.4" strokeLinecap="round" /><circle cx="53" cy="17" r="3.4" fill="#ef7d96" stroke="#000" strokeWidth="1.2" /><path d="M30 2 l1.4 2.8 3 .4 -2.2 2 .6 3 -2.8 -1.5 -2.8 1.5 .6 -3 -2.2 -2 3 -.4 z" fill="#f6c544" stroke="#000" strokeWidth="0.6" /></>}
    </svg>
  );
}

function Crowd() {
  const fans = useMemo(() => {
    const out: { x: number; y: number; c: string }[] = [];
    for (const y of [3, 7, 11, 89, 93, 97]) for (let x = 2 + (y % 2) * 1.5; x < 178; x += 3.2) out.push({ x, y, c: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)] });
    return out;
  }, []);
  return <>{fans.map((f, i) => <g key={i}><circle cx={f.x} cy={f.y} r="1.3" fill={f.c} stroke="#000" strokeWidth="0.25" /></g>)}</>;
}

// The field from above: stands top and bottom, end zones, yard lines and hashes.
function FieldArt() {
  return useMemo(() => (
    <g>
      <defs>
        <pattern id="td-stripes" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="4" fill="#fff" opacity="0.18" /></pattern>
      </defs>
      <rect width="180" height="100" fill="#4d56ad" />
      <rect y="0" width="180" height="14" fill="#5c65bb" />
      <rect y="86" width="180" height="14" fill="#5c65bb" />
      <rect x="0" y="14" width="180" height="72" fill="#3f8f3a" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={20 + i * 14} y="16" width="14" height="68" fill={i % 2 ? '#56a447' : '#4f9f45'} />)}
      <rect x="6" y="16" width="14" height="68" fill="#b4c4fb" opacity="0.85" />
      <path d="M6 16 h14 v68 h-14 z" fill="url(#td-stripes)" />
      <rect x="6" y="16" width="168" height="68" fill="none" stroke="#fbfcf8" strokeWidth="0.9" />
      {Array.from({ length: 21 }, (_, i) => <path key={i} d={`M${20 + i * 7} 16 V84`} stroke="#fbfcf8" strokeWidth={i % 2 ? 0.3 : 0.6} opacity={i % 2 ? 0.7 : 1} />)}
      {Array.from({ length: 99 }, (_, i) => <path key={`h${i}`} d={`M${21.4 + i * 1.4} 42 v1.4 M${21.4 + i * 1.4} 56.6 v1.4 M${21.4 + i * 1.4} 16 v1.2 M${21.4 + i * 1.4} 82.8 v1.2`} stroke="#fbfcf8" strokeWidth="0.25" opacity="0.8" />)}
      <circle cx="90" cy="50" r="7" fill="#fdfd94" fillOpacity="0.3" stroke="#fbfcf8" strokeWidth="0.6" />
      <path d="M90 44.6 l1.6 3.4 3.7 .4 -2.8 2.5 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.8 -2.5 3.7 -.4 z" fill="#fbfcf8" opacity="0.8" />
      <path d="M4 44 V56 M4 50 H1" stroke="#f6c544" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ), []);
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  const ball = (x: number, y: number, r = 1, fill = '#a0603a') => <g transform={`translate(${x} ${y}) scale(${r}) rotate(-30)`}><ellipse rx="22" ry="13" fill={fill} stroke="#000" strokeWidth="4" /><path d="M-9 0 h18 M-5 -5 v10 M0 -5 v10 M5 -5 v10" stroke="#fff" strokeWidth="3" /></g>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'juke' && <>{ring('#8fe3a0')}<path d="M18 74 L36 50 L50 66 L66 34 L82 46" stroke="#000" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" /><path d="M72 26 l14 4 -6 12" stroke="#000" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" /></>}
      {kind === 'hail' && <>{ring('#b4c4fb')}<path d="M16 80 Q50 -10 84 40" stroke="#fbfcf8" strokeWidth="5" strokeDasharray="7 5" fill="none" />{ball(56, 28, 0.9)}{[[24, 30], [80, 70], [70, 20]].map(([x, y]) => <path key={x} d={`M${x} ${y - 6} v12 M${x - 6} ${y} h12`} stroke="#fdfd94" strokeWidth="4" strokeLinecap="round" />)}</>}
      {kind === 'turbo' && <>{ring('#fdfd94')}<path d="M16 66 Q18 50 32 50 L52 54 Q60 44 70 48 L84 62 Q86 72 78 74 L22 76 Q14 74 16 66 Z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><image href={`${ART}/lightning.webp`} x="44" y="8" width="40" height="40" /><path d="M24 76 v6 M38 76 v6 M52 76 v6 M66 76 v6" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'mascot' && <>{ring('#e9eefe')}<ellipse cx="50" cy="56" rx="26" ry="30" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="30" cy="28" r="8" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="70" cy="28" r="8" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="40" cy="48" r="8" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="60" cy="48" r="8" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="41" cy="49" r="3.5" /><circle cx="61" cy="49" r="3.5" /><path d="M38 66 Q50 76 62 66" stroke="#000" strokeWidth="4" fill="#ef7d96" /><path d="M14 40 l10 6 M86 40 l-10 6" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'golden' && <>{ring('#241c3d')}<image href={`${ART}/chest.webp`} x="16" y="40" width="68" height="54" />{ball(50, 32, 0.95, '#f6c544')}</>}
      {kind === 'fumble' && <>{ring('#f5a08c')}{ball(50, 46, 1)}<path d="M18 42 q-6 6 0 12 M82 42 q6 6 0 12 M28 76 q8 -6 16 0 M56 76 q8 -6 16 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'sprinkler' && <>{ring('#8fe3a0')}<rect x="44" y="62" width="12" height="18" rx="3" fill="#5b5f7a" stroke="#000" strokeWidth="4" /><path d="M50 62 Q30 20 14 46 M50 62 Q70 20 86 46 M50 62 Q50 20 50 14" stroke="#7fd6e3" strokeWidth="5" fill="none" strokeDasharray="6 5" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#5c65bb" />
      {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={2 + (i % 30) * 3.4} cy={i < 30 ? 3 : 59} r="1.3" fill={TEAM_COLORS[i % 10]} stroke="#000" strokeWidth="0.2" />)}
      <rect y="7" width="100" height="48" fill="#4f9f45" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={10 + i * 10} y="7" width="10" height="48" fill={i % 2 ? '#56a447' : '#4f9f45'} />)}
      <rect x="2" y="7" width="8" height="48" fill="#b4c4fb" /><rect x="90" y="7" width="8" height="48" fill="#ef7d96" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${10 + i * 10} 7 V55`} stroke="#fff" strokeWidth="0.4" />)}
      <path d="M30 32 Q60 6 88 28" stroke="#fff" strokeWidth="0.6" strokeDasharray="1.4 1" fill="none" />
      {[[28, 32, '#f6c544'], [24, 26, '#f6c544'], [24, 38, '#f6c544'], [36, 30, '#241c3d'], [36, 36, '#241c3d'], [88, 28, '#f6c544']].map(([x, y, f], i) => <g key={i}><ellipse cx={x as number} cy={y as number} rx="1.8" ry="2.8" fill={f as string} stroke="#000" strokeWidth="0.3" /><circle cx={x as number} cy={y as number} r="1.7" fill={f as string} stroke="#000" strokeWidth="0.3" /></g>)}
      <g transform="translate(62 16) rotate(-20)"><ellipse rx="3" ry="1.8" fill="#a0603a" stroke="#000" strokeWidth="0.4" /></g>
    </svg>
  );
}

const def: LabDef = {
  id: 'touchdown',
  name: 'Touchdown Drive',
  description: 'Answer right to call a play. Run, pass or throw it long, and drive the ball into the end zone.',
  ways: ['teams', 'solo'],
  minTeams: 1,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to call a play' },
    { icon: <HandTap weight="fill" />, text: 'Pick run, short pass or long bomb' },
    { icon: <Football weight="fill" />, text: 'Reach the end zone for a touchdown' },
    { icon: <Trophy weight="fill" />, text: 'Most points wins' },
  ],
  rounds: { label: 'Drives', min: 1, max: 8, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the stadium' },
    { id: 'field', label: 'Field', hint: 'The grass, yard lines and end zones, seen from above' },
    { id: 'stands', label: 'Stands', hint: 'The crowd above and below the field' },
    { id: 'player', label: 'Player', hint: 'A player seen from above (wears the team color)' },
    { id: 'defender', label: 'Defender', hint: 'A defender seen from above' },
    { id: 'ball', label: 'Ball', hint: 'The football' },
    { id: 'goalposts', label: 'Goal posts', hint: 'The posts at the end of the field' },
    { id: 'mascot', label: 'Mascot', hint: 'The dancing mascot' },
    { id: 'play-run', label: 'Run card', hint: 'The picture for a run play' },
    { id: 'play-short', label: 'Short pass card', hint: 'The picture for a short pass' },
    { id: 'play-bomb', label: 'Long bomb card', hint: 'The picture for a long bomb' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
