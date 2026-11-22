import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimate, type AnimationOptions, type DOMKeyframesDefinition } from 'motion/react';
import { Basketball, Check, CheckCircle, HandTap, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { pace } from '../../../engine/pace';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { AIM_PERIOD, AIM_TOL, aimAt, BALL_R, cpuAim, FLOOR, kindAngle, RELEASE_Y, RIM, simulate, SPOTS, type Flight, type SpotId } from './rules';

// Hoop Shot (Game Lab, inspired by classroom quiz-board basketball games):
// a right answer earns a shot. Pick the close spot (2 points) or the far one
// (3 points), then tap while the swinging arrow glows. The ball flies with
// real weight: swishes, rim rattles, backboard bank shots and rim-outs.
// Each team's banner grows from the rafters as its points climb.

const ART = '/lab/hoop-shot';
const POWERS: LabPower[] = [
  { id: 'hot', name: 'Hot Hand', desc: 'Your ball catches fire. This shot scores double.', enter: 'zoom', art: <Art kind="hot" /> },
  { id: 'giant', name: 'Giant Hoop', desc: 'The hoop grows huge for this shot.', enter: 'zoom', art: <Art kind="giant" /> },
  { id: 'moon', name: 'Moon Ball', desc: 'Low gravity! The ball floats and the arrow swings slowly.', enter: 'drop', art: <Art kind="moon" /> },
  { id: 'dunk', name: 'Slam Dunk', desc: 'Fly up and slam it in for a sure 3 points.', enter: 'drop', art: <Art kind="dunk" /> },
  { id: 'mascot', name: 'Mascot Assist', desc: 'If you miss, the team mascot jumps up and taps it in.', enter: 'spin', art: <Art kind="mascot" /> },
  { id: 'wobbly', name: 'Wobbly Rim', desc: 'Boing! The rim turns to jelly and bounces the ball all over.', silly: true, art: <Art kind="wobbly" /> },
  { id: 'squeaky', name: 'Squeaky Sneakers', desc: 'Squeak squeak! Your feet slip and the arrow swings extra fast.', silly: true, art: <Art kind="squeaky" /> },
];

const FEET = 86;
const KID_S = 1.9;
const SKINS = ['#f1c7a0', '#d9a37a', '#a8724e', '#7a4f33', '#f6d6b8'];
type Phase = 'wait' | 'spot' | 'aim' | 'fly' | 'busy';
interface Mods { hot: boolean; giant: boolean; moon: boolean; mascot: boolean; wobbly: boolean; squeaky: boolean; dunk: boolean }
const NO_MODS: Mods = { hot: false, giant: false, moon: false, mascot: false, wobbly: false, squeaky: false, dunk: false };

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const P = pace(ctx.settings) / 1.6;
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms * P));
  const [phase, setPhase] = useState<Phase>('wait');
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const [spot, setSpot] = useState<SpotId>('two');
  const [shooterX, setShooterX] = useState<number>(SPOTS.two.x);
  const [jump, setJump] = useState(0);
  const [aim, setAim] = useState(55);
  const [onTarget, setOnTarget] = useState(false);
  const [ball, setBall] = useState<{ x: number; y: number; spin: number } | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [mods, setModsState] = useState<Mods>(NO_MODS);
  const modsRef = useRef<Mods>(NO_MODS);
  const setMods = (m: Partial<Mods>) => { modsRef.current = { ...modsRef.current, ...m }; setModsState(modsRef.current); };
  const [net, setNet] = useState(0);
  const [rimHit, setRimHit] = useState(0);
  const [shake, setShake] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [mascotJump, setMascotJump] = useState(0);
  const [dunking, setDunking] = useState(false);
  const [pop, setPop] = useState<{ key: number; text: string } | null>(null);
  const input = useRef<((v: unknown) => void) | null>(null);
  const live = useRef(0);
  const color = TEAM_COLORS[ctx.player.colorIndex % TEAM_COLORS.length];
  const rimR = mods.giant ? 7.4 : 4.6;
  // The on-target window for people (the computer aims by its own level); Giant Hoop widens it.
  const tolFor = (pick: SpotId) => { const t = c.current.timeScale; return AIM_TOL[pick] * (modsRef.current.giant ? 1.6 : 1) * (t === 0 ? 1.25 : Math.max(1, t * 0.85)); };
  const still = ctx.still;

  useEffect(() => {
    const id = ++live.current;
    void turn(id);
    return () => { live.current++; input.current = null; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps
  const alive = (id: number) => live.current === id;
  const ask = <T,>() => new Promise<T>((r) => { input.current = r as (v: unknown) => void; });

  async function turn(id: number) {
    setMods(NO_MODS); setBall(null); setTrail([]); setDunking(false); setPhase('wait');
    setShooterX(SPOTS.two.x);
    const ok = await c.current.ask();
    if (!alive(id)) return;
    if (!ok) { c.current.sfx.wrong(); c.current.say('Oops!', 'oops'); await wait(1300); if (alive(id)) c.current.next(); return; }
    const p = await c.current.power(0.45);
    if (!alive(id)) return;
    await usePower(p);
    if (!alive(id)) return;
    if (modsRef.current.dunk) { await dunk(id); return; }
    // Pick a spot: close for 2, far for 3.
    setPhase('spot');
    let pick: SpotId;
    if (c.current.cpu) {
      await wait(1300);
      const far = { easy: 0.25, medium: 0.45, hard: 0.6 }[c.current.cpuLevel];
      pick = Math.random() < far ? 'three' : 'two';
    } else pick = await ask<SpotId>();
    if (!alive(id)) return;
    setSpot(pick); setPhase('busy');
    c.current.sfx.tap();
    // Dribble over to the spot.
    setShooterX(SPOTS[pick].x);
    for (let i = 0; i < 3; i++) { window.setTimeout(() => alive(id) && c.current.sfx.thud(), i * 260 * P); }
    await wait(900);
    if (!alive(id)) return;
    const ideal = pick === 'two' ? 65 + Math.random() * 6 : 58 + Math.random() * 6;
    const angle = await aimPhase(id, pick, ideal);
    if (!alive(id) || angle === null) return;
    await shoot(id, pick, angle, ideal);
  }

  async function usePower(p: LabPower | null) {
    const x = c.current;
    if (!p) return;
    // The power-up stays listed (a still picture) until this turn ends.
    if (p.id !== 'dunk') x.setHeld(x.player.id, [p]);
    switch (p.id) {
      case 'hot': setMods({ hot: true }); x.sfx.zap(); window.setTimeout(() => c.current.sfx.whoosh(), 250); break;
      case 'giant': setMods({ giant: true }); x.sfx.boing(); break;
      case 'moon': setMods({ moon: true }); x.sfx.slideUp(); break;
      case 'dunk': setMods({ dunk: true }); x.sfx.slideUp(); break;
      case 'mascot': setMods({ mascot: true }); setMascotJump((n) => n + 1); x.sfx.cheer(); break;
      case 'wobbly': setMods({ wobbly: true }); x.sfx.boing(); window.setTimeout(() => c.current.sfx.boing(), 300); break;
      case 'squeaky': setMods({ squeaky: true }); [0, 160, 320].forEach((d) => window.setTimeout(() => c.current.sfx.blip(14 + d / 40), d)); break;
    }
    await wait(900);
  }

  // The arrow swings; tap while it glows.
  function aimPhase(id: number, pick: SpotId, ideal: number): Promise<number | null> {
    setPhase('aim');
    const m = modsRef.current;
    // Close is kinder than far; Moon Ball slows the arrow, Squeaky Sneakers speed it up a little.
    const period = AIM_PERIOD[pick] * (m.moon ? 1.4 : m.squeaky ? 0.8 : 1) * Math.max(1, P * 0.9);
    const tol = tolFor(pick);
    const x = c.current;
    const cpuTarget = x.cpu ? Math.min(79, Math.max(31, cpuAim(ideal, x.cpuRight()))) : null;
    const cpuAfter = performance.now() + 1100 + Math.random() * 1200;
    return new Promise((resolve) => {
      const start = performance.now();
      let done = false;
      input.current = () => { if (!done) { done = true; resolve(current); } };
      let current = 55;
      const step = () => {
        if (done || !alive(id)) { if (!done) resolve(null); return; }
        const now = performance.now();
        current = aimAt((now - start) / 1000, period);
        setAim(current);
        setOnTarget(Math.abs(current - ideal) <= tol);
        if (cpuTarget !== null && now > cpuAfter && (Math.abs(current - cpuTarget) < 1.2 || now > cpuAfter + 5000)) { done = true; resolve(current); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function playFlight(f: Flight, speed = 1): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const fps = 60 * speed;
      let ev = 0;
      const step = () => {
        const t = ((performance.now() - start) / 1000);
        const i = Math.min(f.frames.length - 1, Math.floor(t * fps));
        const fr = f.frames[i];
        setBall({ x: fr.x, y: fr.y, spin: i * 9 });
        if (modsRef.current.hot) setTrail(f.frames.slice(Math.max(0, i - 10), i).filter((_, k) => k % 2 === 0));
        while (ev < f.events.length && f.events[ev].t <= t * speed) {
          const e = f.events[ev++];
          const s = c.current.sfx;
          if (e.kind === 'rim') { s.bump(); setRimHit((n) => n + 1); }
          if (e.kind === 'board') { s.thud(); setShake((n) => n + 1); }
          if (e.kind === 'floor') s.thud();
          if (e.kind === 'in') { s.swish(); setNet((n) => n + 1); }
        }
        if (i >= f.frames.length - 1) { resolve(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  async function shoot(id: number, pick: SpotId, angle: number, ideal: number) {
    setPhase('fly');
    const m = modsRef.current;
    setJump((n) => n + 1);
    c.current.sfx.whoosh();
    const tol = tolFor(pick);
    const shot = { from: { x: SPOTS[pick].x + 2, y: RELEASE_Y }, angle: kindAngle(angle, ideal, tol), ideal, gravity: m.moon ? 36 : 86, rimR };
    let f = simulate(shot, { wobbly: m.wobbly });
    // A glowing arrow always scores (the wobbly rim can still bounce it about).
    if (!f.made && Math.abs(angle - ideal) <= tol) f = simulate({ ...shot, angle: ideal }, { wobbly: false });
    await playFlight(f, 1 / Math.max(1, P * 0.8));
    if (!alive(id)) return;
    setPhase('busy');
    const base = SPOTS[pick].points;
    if (f.made) {
      const pts = base * (m.hot ? 2 : 1);
      score(pts, f.rimHits === 0 ? (pick === 'three' ? 'Swish! Three!' : 'Swish!') : pick === 'three' ? 'Three!' : 'Bucket!');
    } else if (m.mascot) {
      // The mascot jumps up and taps it in.
      setMascotJump((n) => n + 1);
      c.current.sfx.boing();
      setBall({ x: 146, y: 70, spin: 0 });
      await wait(450);
      setBall({ x: RIM.x, y: RIM.y - 6, spin: 200 });
      await wait(450);
      setBall({ x: RIM.x, y: RIM.y + 10, spin: 400 });
      c.current.sfx.swish(); setNet((n) => n + 1);
      score(base, 'Mascot save!');
    } else {
      c.current.sfx.oops();
      c.current.say(f.rimHits > 0 ? 'Rim out!' : 'Air ball!', 'oops');
    }
    await wait(1800);
    if (!alive(id)) return;
    setBall(null); setTrail([]);
    c.current.setHeld(c.current.player.id, []);
    c.current.next();
  }

  async function dunk(id: number) {
    setPhase('busy');
    setShooterX(SPOTS.two.x);
    await wait(300);
    setDunking(true);
    c.current.sfx.whoosh();
    setShooterX(RIM.x - 9);
    await wait(900);
    if (!alive(id)) return;
    setShake((n) => n + 1); setRimHit((n) => n + 1); setNet((n) => n + 1);
    c.current.sfx.crash();
    setBall({ x: RIM.x, y: RIM.y + 6, spin: 0 });
    score(3, 'SLAM DUNK!', 'big');
    await wait(1200);
    setDunking(false);
    setBall({ x: RIM.x + 2, y: FLOOR - BALL_R, spin: 120 });
    await wait(1200);
    if (!alive(id)) return;
    setBall(null);
    c.current.setHeld(c.current.player.id, []);
    c.current.next();
  }

  function score(pts: number, text: string, tone: 'good' | 'big' = pts >= 3 ? 'big' : 'good') {
    const x = c.current;
    x.points(pts);
    x.say(text, tone);
    x.sfx.coin();
    playClip(`${ART}/${pts >= 3 ? 'celebrate' : 'clap'}.mp3`, x.settings, 0.6);
    setCheer((n) => n + 1);
    setPop({ key: Date.now(), text: `+${pts}` });
    x.burst(RIM.x / 160 * 0.85, 0.35, pts >= 3 ? 'big' : 'small');
  }

  // Space or Enter shoots.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (phaseRef.current === 'aim' && !c.current.cpu) { e.preventDefault(); input.current?.(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const top = Math.max(12, ...ctx.turns.players.map((p) => p.score));
  const ballAt = ball ?? (phase === 'wait' || phase === 'spot' || phase === 'aim' || (phase === 'busy' && !dunking) ? { x: shooterX + 2, y: RELEASE_Y, spin: 0 } : null);
  const human = !ctx.cpu;

  return (
    <div className="absolute inset-0 grid place-items-center">
      <style>{CSS}</style>
      <div className="relative lab-fit rounded-[1.4rem] border-heavy border-border overflow-hidden" style={{ ['--ar' as string]: 1.6, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' }}>
        <svg viewBox="0 0 160 100" className="absolute inset-0 w-full h-full" role="img" aria-label="Basketball court">
          <GymArt />
          <g className={still || !cheer ? '' : cheer % 2 ? 'hs-cheer' : 'hs-cheer-b'}><Crowd /></g>
          {/* The hoop: pole, backboard, rim and net. */}
          <Pulse n={shake} off={still || !ctx.shake} run={{ x: [0, 1.2, -1, 0.6, 0] }} transition={{ duration: 0.4 }}>
            <rect x="144" y="30" width="3" height="58" fill="#5b5f7a" stroke="#000" strokeWidth="0.5" />
            <rect x="143" y="62" width="5" height="22" rx="1.5" fill="#ef7d96" stroke="#000" strokeWidth="0.5" />
            <path d="M139 30 h6" stroke="#5b5f7a" strokeWidth="2" />
            <rect x="116" y="16" width="25" height="20" rx="1.2" fill="#fbfcf8" fillOpacity="0.92" stroke="#000" strokeWidth="0.7" />
            <rect x="123" y="25" width="10" height="8" fill="none" stroke="#ef7d96" strokeWidth="0.9" />
          </Pulse>
          <motion.g animate={!still && mods.wobbly ? { rotate: [0, -6, 5, -4, 3, 0], scaleX: [1, 1.08, 0.94, 1.05, 1] } : { rotate: 0, scaleX: 1 }} transition={mods.wobbly ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 }}>
          <Pulse n={rimHit} off={still} run={{ rotate: [0, dunking ? 14 : 3, -2, 0] }} transition={{ duration: 0.45 }}>
            <circle cx={RIM.x} cy={RIM.y} r={rimR + 0.8} fill="none" />
            <path d={`M${RIM.x - rimR} ${RIM.y} A ${rimR} 1.6 0 0 1 ${RIM.x + rimR} ${RIM.y}`} stroke="#c2532c" strokeWidth="0.9" fill="none" />
          </Pulse></motion.g>
          {/* Hot hand flames trailing the ball. */}
          {trail.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={BALL_R * (0.4 + i * 0.12)} fill={i % 2 ? '#f6c544' : '#f39a6b'} opacity={0.25 + i * 0.12} />)}
          {/* The shooter, in the team's color. */}
          <motion.g initial={false} animate={{ x: shooterX, y: dunking ? RIM.y + 18 - FEET : 0 }} transition={dunking ? { duration: 0.8 * P, ease: [0.3, 1.4, 0.5, 1] } : { type: 'spring', stiffness: 60, damping: 14 }}>
            <Pulse n={jump} off={still} run={{ y: [0, -5, 0] }} transition={{ duration: 0.55 }}>
              <g transform={`translate(0 ${FEET})`} className={mods.squeaky && !still ? 'hs-slip' : ''}>
                <Kid shirt={color} skin={SKINS[ctx.player.colorIndex % SKINS.length]} s={KID_S} arms={phase === 'aim' || phase === 'fly' || dunking ? 'up' : 'down'} />
                {mods.squeaky && <path d="M-6 -1.5 l-3.4 -1.6 M-6.4 0.6 l-3.6 0.4 M6 -1.5 l3.4 -1.6 M6.4 0.6 l3.6 0.4" stroke="#241c3d" strokeWidth="0.7" strokeLinecap="round" />}
              </g>
            </Pulse>
          </motion.g>
          {/* The ball. */}
          {ballAt && (
            <g style={{ transform: `translate(${ballAt.x}px, ${ballAt.y}px)`, transition: phase === 'fly' ? 'none' : `transform ${0.45 * P}s cubic-bezier(.3,1.25,.5,1)` }}>
              {mods.hot && <circle r={BALL_R * 1.7} fill="#f39a6b" opacity="0.45" className={still ? '' : 'hs-flame'} />}
              <g transform={`rotate(${ballAt.spin})`}>
                <image href={mods.moon ? `${ART}/moon.webp` : `${ART}/basketball.webp`} x={-BALL_R} y={-BALL_R} width={BALL_R * 2} height={BALL_R * 2} />
              </g>
            </g>
          )}
          {/* The front of the rim and the net, in front of the ball. */}
          <motion.g animate={!still && mods.wobbly ? { rotate: [0, -6, 5, -4, 3, 0], scaleX: [1, 1.08, 0.94, 1.05, 1] } : { rotate: 0, scaleX: 1 }} transition={mods.wobbly ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 }}>
          <Pulse n={rimHit} off={still} run={{ rotate: [0, dunking ? 14 : 3, -2, 0] }} transition={{ duration: 0.45 }}>
            <circle cx={RIM.x} cy={RIM.y} r={rimR + 0.8} fill="none" />
            <Pulse n={net} off={still} run={{ scaleY: [1, 1.4, 0.85, 1.1, 1], skewX: [0, 6, -4, 2, 0] }} transition={{ duration: 0.7 }} style={{ transformOrigin: '50% 0%' }}>
              <NetArt r={rimR} />
            </Pulse>
            <path d={`M${RIM.x - rimR} ${RIM.y} A ${rimR} 1.6 0 0 0 ${RIM.x + rimR} ${RIM.y}`} stroke="#ef6a3a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            {mods.wobbly && <path d={`M${RIM.x - rimR - 1} ${RIM.y - 2.6} q1.2 -1.4 2.4 0 t2.4 0 t2.4 0 t2.4 0 t2.4 0`} stroke="#ff8fc8" strokeWidth="0.8" fill="none" strokeLinecap="round" />}
          </Pulse></motion.g>
          {/* The aim arrow: glows mint when the shot is on target. */}
          {phase === 'aim' && (
            <g transform={`translate(${SPOTS[spot].x + 2} ${RELEASE_Y})`}>
              <path d="M18 0 A 18 18 0 0 0 3.1 -17.7" stroke="#fbfcf8" strokeOpacity="0.55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <g transform={`rotate(${-aim})`}>
                <path d="M3 -1.1 L15 -1.1 L15 -2.8 L20 0 L15 2.8 L15 1.1 L3 1.1 Z" fill={onTarget ? '#8fe3a0' : '#fdfd94'} stroke="#000" strokeWidth={onTarget ? 0.9 : 0.6} strokeLinejoin="round" style={{ filter: onTarget ? 'drop-shadow(0 0 2px #8fe3a0)' : undefined }} />
                {/* A check mark rides the arrow while it is on target (shape, not just color). */}
                {onTarget && <g transform="translate(24 0)"><circle r="3.6" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" /><path d="M-1.7 0 L-0.4 1.4 L1.9 -1.4" stroke="#241c3d" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
              </g>
            </g>
          )}
          {/* The team mascot, courtside. */}
          {mods.mascot && (
            <motion.g initial={{ x: 175, y: 0 }} animate={{ x: 150, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 12 }}>
              <Pulse n={mascotJump} off={still} run={{ y: [0, -14, 0], rotate: [0, -10, 0] }} transition={{ duration: 0.8 }}>
                <Mascot />
              </Pulse>
            </motion.g>
          )}
          <AnimatePresence>
            {pop && (
              <motion.text key={pop.key} x={RIM.x} y={RIM.y - 10} textAnchor="middle" className="font-display" fontSize="10" fill="#fdfd94" stroke="#000" strokeWidth="0.9" paintOrder="stroke"
                initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: 1, y: -8 }} transition={{ duration: 1.4 }} onAnimationComplete={() => setPop(null)}>{pop.text}</motion.text>
            )}
          </AnimatePresence>
        </svg>
        {/* Team banners hang from the rafters and grow with every point. */}
        <div className="absolute left-[3%] top-0 h-full w-[60%] flex items-start gap-[1.2%] pointer-events-none" aria-hidden="true">
          {ctx.turns.players.map((p) => (
            <motion.div key={p.id} className="relative w-[9%] min-w-[1.8rem] border-std border-border border-t-0 rounded-b-[0.4rem] flex items-end justify-center pb-1"
              style={{ background: TEAM_COLORS[p.colorIndex % TEAM_COLORS.length], clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)' }}
              initial={false} animate={{ height: `${10 + 34 * Math.min(1, p.score / top)}%` }} transition={{ type: 'spring', stiffness: 80, damping: 12 }}>
              <span className="mb-[18%]"><TeamBadge colorIndex={p.colorIndex} size={22} /></span>
            </motion.div>
          ))}
        </div>
        {/* The two spots: close for 2 points, far for 3. */}
        {(['two', 'three'] as SpotId[]).map((s) => (
          <AnimatePresence key={s}>
            {phase === 'spot' && (
              <motion.button type="button" disabled={!human} onClick={() => input.current?.(s)} aria-label={s === 'two' ? 'Close spot, 2 points' : 'Far spot, 3 points'}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-heavy border-border grid place-items-center gap-0 disabled:cursor-default motion-safe:hover:scale-110 motion-safe:transition-transform"
                style={{ left: `${(SPOTS[s].x / 160) * 100}%`, top: `${(FEET + 3) / 100 * 100}%`, width: '11%', minWidth: '3.2rem', aspectRatio: '1', background: s === 'two' ? '#fdfd94' : '#8fe3a0', boxShadow: '0 5px 0 #000' }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 13, delay: s === 'two' ? 0 : 0.1 }}>
                <span className="font-display text-[clamp(1.2rem,3cqw,2.2rem)] leading-none">{SPOTS[s].points}</span>
                <span className="flex flex-wrap justify-center gap-[0.1rem] w-[80%]">
                  {Array.from({ length: SPOTS[s].points }, (_, i) => <img key={i} src={`${ART}/basketball.webp`} alt="" className="w-[30%] aspect-square" />)}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        ))}
        {/* Tap anywhere to shoot while the arrow swings. */}
        <button type="button" aria-label="Shoot" disabled={phase !== 'aim' || !human} onClick={() => input.current?.(null)} className={`absolute inset-0 w-full h-full bg-transparent disabled:cursor-default ${phase === 'aim' ? 'cursor-pointer' : 'pointer-events-none'}`} />
        <AnimatePresence>
          {phase === 'aim' && human && (
            <motion.div className="absolute right-[3%] bottom-[4%] pointer-events-none grid justify-items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <motion.span className="w-[clamp(3.5rem,9cqw,6rem)] aspect-square rounded-full border-heavy border-border grid place-items-center" style={{ background: onTarget ? '#8fe3a0' : '#fdfd94', boxShadow: '0 5px 0 #000' }}
                animate={still ? undefined : { scale: onTarget ? 1.12 : 1 }}>
                {onTarget ? <Check weight="bold" className="w-1/2 h-1/2" /> : <HandTap weight="fill" className="w-1/2 h-1/2" />}
              </motion.span>
              <span className="font-display text-[clamp(1.1rem,2.6cqw,1.8rem)] text-white leading-none" style={{ WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}>{onTarget ? 'Now!' : 'Shoot!'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Plays a one-off move on a stable wrapper each time `n` goes up, without
// remounting what is inside (so nothing else replays its entrance).
function Pulse({ n, run, transition, off, style, children }: { n: number; run: DOMKeyframesDefinition; transition?: AnimationOptions; off?: boolean; style?: CSSProperties; children: ReactNode }) {
  const [scope, animate] = useAnimate<SVGGElement>();
  useEffect(() => { if (n && !off && scope.current) void animate(scope.current, run, transition); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  return <g ref={scope} style={{ transformBox: 'fill-box', transformOrigin: 'center', ...style }}>{children}</g>;
}

const CSS = `
.hs-cheer > g { animation: hs-cheer 0.5s ease-in-out 3 both; }
.hs-cheer-b > g { animation: hs-cheer-b 0.5s ease-in-out 3 both; }
@keyframes hs-cheer-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.2px); } }
.hs-cheer > g:nth-child(3n) { animation-delay: 0.12s; }
.hs-cheer > g:nth-child(3n+1) { animation-delay: 0.24s; }
@keyframes hs-cheer { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.2px); } }
.hs-flame { animation: hs-flame 0.18s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes hs-flame { from { transform: scale(0.9); } to { transform: scale(1.15); } }
.hs-slip { animation: hs-slip 0.35s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes hs-slip { from { transform: translateX(-1px) rotate(-4deg); } to { transform: translateX(1px) rotate(4deg); } }
html[data-motion="still"] .hs-cheer > g, html[data-motion="still"] .hs-flame, html[data-motion="still"] .hs-slip { animation: none; }
`;

function NetArt({ r }: { r: number }) {
  const top = Array.from({ length: 7 }, (_, i) => RIM.x - r + (i * 2 * r) / 6);
  const bot = Array.from({ length: 7 }, (_, i) => RIM.x - r * 0.6 + (i * 1.2 * r) / 6);
  return (
    <g stroke="#fbfcf8" strokeWidth="0.45" fill="none" strokeLinecap="round">
      {top.map((x, i) => <path key={i} d={`M${x} ${RIM.y + 0.6} L${bot[i]} ${RIM.y + 9}`} />)}
      {top.slice(0, 6).map((x, i) => <path key={`d${i}`} d={`M${x} ${RIM.y + 0.6} L${bot[i + 1]} ${RIM.y + 9}`} opacity="0.7" />)}
      <path d={`M${RIM.x - r * 0.85} ${RIM.y + 4} Q${RIM.x} ${RIM.y + 5.2} ${RIM.x + r * 0.85} ${RIM.y + 4}`} />
      <path d={`M${bot[0]} ${RIM.y + 9} Q${RIM.x} ${RIM.y + 10} ${bot[6]} ${RIM.y + 9}`} />
    </g>
  );
}

function Kid({ shirt, skin, s = 1, arms = 'down' }: { shirt: string; skin: string; s?: number; arms?: 'up' | 'down' }) {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cy="0.2" rx="3" ry="0.8" fill="#000" opacity="0.2" />
      <path d="M-1.3 0 L-0.9 -3.6 M1.3 0 L0.9 -3.6" stroke={skin} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M-2 -0.1 h1.6 M0.5 -0.1 h1.6" stroke="#fbfcf8" strokeWidth="1" strokeLinecap="round" />
      <rect x="-2.3" y="-4.8" width="4.6" height="2" rx="0.6" fill="#241c3d" />
      {arms === 'up'
        ? <path d="M-2.2 -7.8 L-4.2 -11.6 L-2.4 -14.4 M2.2 -7.8 L4.2 -11.6 L2.6 -14.4" stroke={skin} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : <path d="M-2.4 -7.6 L-3 -4.4 M2.4 -7.6 L3.2 -4.8" stroke={skin} strokeWidth="1.1" strokeLinecap="round" />}
      <path d="M-2.4 -8.8 h4.8 l-0.2 4.4 h-4.4 z" fill={shirt} stroke="#000" strokeWidth="0.45" strokeLinejoin="round" />
      <circle cy="-10.8" r="2.5" fill={skin} stroke="#000" strokeWidth="0.45" />
      <circle cx="-0.8" cy="-10.9" r="0.33" fill="#000" /><circle cx="0.9" cy="-10.9" r="0.33" fill="#000" />
      <path d="M-0.7 -9.7 Q0 -9.1 0.7 -9.7" stroke="#000" strokeWidth="0.3" fill="none" strokeLinecap="round" />
      <path d="M-2.5 -11.8 h5" stroke="#ef7d96" strokeWidth="0.8" />
    </g>
  );
}

function Mascot() {
  return (
    <g transform={`translate(0 ${FEET})`}>
      <ellipse cy="0.5" rx="6" ry="1.2" fill="#000" opacity="0.2" />
      <path d="M-4 0 h3 M1 0 h3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cy="-8" rx="6.5" ry="8" fill="#8fe3a0" stroke="#000" strokeWidth="0.6" />
      <circle cx="-4.5" cy="-15" r="2" fill="#8fe3a0" stroke="#000" strokeWidth="0.5" /><circle cx="4.5" cy="-15" r="2" fill="#8fe3a0" stroke="#000" strokeWidth="0.5" />
      <circle cx="-2.2" cy="-10" r="1.9" fill="#fff" stroke="#000" strokeWidth="0.4" /><circle cx="2.2" cy="-10" r="1.9" fill="#fff" stroke="#000" strokeWidth="0.4" />
      <circle cx="-1.9" cy="-9.7" r="0.8" fill="#000" /><circle cx="2.5" cy="-9.7" r="0.8" fill="#000" />
      <path d="M-2.5 -6 Q0 -3.6 2.5 -6" stroke="#000" strokeWidth="0.5" fill="#ef7d96" />
      <path d="M-6.2 -8 L-9 -12 M6.2 -8 L9 -13" stroke="#000" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

// The fans in the bleachers.
function Crowd() {
  const fans = useMemo(() => {
    const out: { x: number; y: number; c: string; skin: string }[] = [];
    [22, 32, 42].forEach((y, row) => {
      for (let x = 4 + row * 2; x < 112; x += 5.2) out.push({ x, y, c: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)], skin: SKINS[Math.floor(Math.random() * SKINS.length)] });
    });
    return out;
  }, []);
  return (
    <>
      {fans.map((f, i) => (
        <g key={i}>
          <path d={`M${f.x - 2.2} ${f.y + 3} q0 -3 2.2 -3 q2.2 0 2.2 3 z`} fill={f.c} stroke="#000" strokeWidth="0.3" />
          <circle cx={f.x} cy={f.y - 1.6} r="1.6" fill={f.skin} stroke="#000" strokeWidth="0.3" />
        </g>
      ))}
    </>
  );
}

// The gym: rafters, lights, bleachers, a wood floor with the court lines.
function GymArt() {
  return useMemo(() => (
    <g>
      <defs>
        <linearGradient id="hs-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c9d2ff" /><stop offset="1" stopColor="#9aa8f2" /></linearGradient>
        <linearGradient id="hs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3ad6c" /><stop offset="1" stopColor="#f2c88f" /></linearGradient>
        <radialGradient id="hs-shine" cx="0.5" cy="0.4" r="0.5"><stop offset="0" stopColor="#fff" stopOpacity="0.45" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="160" height="58" fill="url(#hs-wall)" />
      {[0, 40, 80, 120].map((x) => <rect key={x} x={x} y="0" width="40" height="4" fill="#241c3d" />)}
      <path d="M0 4 H160" stroke="#000" strokeWidth="0.5" />
      {[30, 80, 130].map((x) => <g key={x}><path d={`M${x} 4 v3`} stroke="#241c3d" strokeWidth="0.6" /><path d={`M${x - 4} 10 q4 -4 8 0 z`} fill="#fbfcf8" stroke="#000" strokeWidth="0.4" /><ellipse cx={x} cy="11" rx="10" ry="2.5" fill="#fdfd94" opacity="0.35" /></g>)}
      {/* Bleachers. */}
      {[24, 34, 44].map((y, i) => <g key={y}><rect x="0" y={y + 2} width="114" height="8" fill={['#6b74c9', '#5c65bb', '#4d56ad'][i]} /><rect x="0" y={y + 2} width="114" height="1.2" fill="#8f98e2" /></g>)}
      <rect x="0" y="54" width="114" height="4" fill="#241c3d" />
      <path d="M114 20 v38" stroke="#000" strokeWidth="0.5" />
      <rect x="114" y="20" width="46" height="38" fill="#b4c4fb" />
      <rect x="118" y="42" width="14" height="12" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" /><path d="M125 48 v-3.6 M125 48 l2.6 1.4" stroke="#241c3d" strokeWidth="0.7" strokeLinecap="round" /><circle cx="125" cy="48" r="4.4" fill="none" stroke="#241c3d" strokeWidth="0.5" />
      {/* The wood floor. */}
      <rect y="58" width="160" height="42" fill="url(#hs-wood)" />
      <path d="M0 58 H160" stroke="#000" strokeWidth="0.6" />
      {[61, 64.5, 68.5, 73, 78, 83.5, 89.5, 96].map((y) => <path key={y} d={`M0 ${y} H160`} stroke="#c9884a" strokeWidth="0.25" opacity="0.7" />)}
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${(i * 23) % 160} ${61 + (i % 7) * 4.3} v3.5`} stroke="#c9884a" strokeWidth="0.25" opacity="0.6" />)}
      <ellipse cx="80" cy="74" rx="70" ry="10" fill="url(#hs-shine)" />
      {/* Court lines: the paint and the far-shot arc. */}
      <path d="M108 61 L152 61 L160 94 L100 94 Z" fill="#ef7d96" fillOpacity="0.75" stroke="#fbfcf8" strokeWidth="0.8" />
      <ellipse cx="104" cy="77.5" rx="6" ry="16.5" fill="none" stroke="#fbfcf8" strokeWidth="0.7" strokeDasharray="2 1.4" />
      <path d="M150 59.5 A 74 22 0 0 0 150 99.5" stroke="#fbfcf8" strokeWidth="0.9" fill="none" />
      {/* Center court and a bench with a ball rack. */}
      <ellipse cx="0" cy="78" rx="16" ry="12" fill="#8fe3a0" fillOpacity="0.55" stroke="#fbfcf8" strokeWidth="0.8" />
      <path d="M0 58 V100" stroke="#fbfcf8" strokeWidth="0.8" />
      <rect x="20" y="62" width="34" height="3" rx="1" fill="#241c3d" stroke="#000" strokeWidth="0.4" /><path d="M23 65 v5 M51 65 v5" stroke="#241c3d" strokeWidth="1.2" />
      <path d="M8 86 h22 M10 86 l2 -10 h18 l2 10" stroke="#5b5f7a" strokeWidth="1" fill="none" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => <image key={i} href={`${ART}/basketball.webp`} x={10.5 + i * 4.6} y="71.8" width="4.6" height="4.6" />)}
      {[0, 1, 2].map((i) => <image key={`b${i}`} href={`${ART}/basketball.webp`} x={13 + i * 4.6} y="80.6" width="4.6" height="4.6" />)}
    </g>
  ), []);
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'hot' && <>{ring('#fdfd94')}<path d="M50 10 C64 28 80 34 74 58 C70 76 30 78 26 58 C22 40 40 34 38 20 C46 28 48 34 50 10 Z" fill="#f39a6b" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><image href={`${ART}/basketball.webp`} x="30" y="40" width="40" height="40" /></>}
      {kind === 'giant' && <>{ring('#b4c4fb')}<rect x="20" y="16" width="60" height="38" rx="4" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><ellipse cx="50" cy="56" rx="28" ry="7" fill="none" stroke="#ef6a3a" strokeWidth="6" /><path d="M26 58 L36 84 M42 60 L46 86 M58 60 L54 86 M74 58 L64 84" stroke="#000" strokeWidth="3" /></>}
      {kind === 'moon' && <>{ring('#241c3d')}<image href={`${ART}/moon.webp`} x="18" y="18" width="64" height="64" />{[[22, 24], [78, 30], [70, 80]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#fdfd94" />)}</>}
      {kind === 'dunk' && <>{ring('#f5a08c')}<ellipse cx="50" cy="34" rx="26" ry="6" fill="none" stroke="#ef6a3a" strokeWidth="6" /><image href={`${ART}/basketball.webp`} x="32" y="22" width="36" height="36" /><path d="M24 40 L36 70 M76 40 L64 70" stroke="#000" strokeWidth="3" /><path d="M20 82 l8 -8 M80 82 l-8 -8 M50 88 v-10" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'mascot' && <>{ring('#e9eefe')}<ellipse cx="50" cy="56" rx="26" ry="30" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="30" cy="28" r="8" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="70" cy="28" r="8" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="40" cy="48" r="8" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="60" cy="48" r="8" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="41" cy="49" r="3.5" /><circle cx="61" cy="49" r="3.5" /><path d="M38 66 Q50 76 62 66" stroke="#000" strokeWidth="4" fill="#ef7d96" /></>}
      {kind === 'wobbly' && <>{ring('#ffd6ec')}<path d="M18 48 Q26 36 34 48 T50 48 T66 48 T82 48" stroke="#ef6a3a" strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M24 54 Q30 70 26 84 M40 54 Q46 72 38 86 M58 54 Q52 72 62 86 M76 54 Q70 70 74 84" stroke="#000" strokeWidth="3" fill="none" /></>}
      {kind === 'squeaky' && <>{ring('#fdfd94')}<path d="M18 62 Q20 46 34 46 L52 50 Q60 40 70 44 L82 58 Q84 68 76 70 L24 72 Q16 70 18 62 Z" fill="#fbfcf8" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M20 72 h58" stroke="#ef7d96" strokeWidth="6" strokeLinecap="round" /><path d="M62 30 l6 -8 M74 34 l8 -6 M50 30 l0 -10" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="36" fill="#b4c4fb" />
      {[10, 18, 26].map((y, i) => <rect key={y} y={y} width="70" height="6" fill={['#6b74c9', '#5c65bb', '#4d56ad'][i]} />)}
      {Array.from({ length: 36 }, (_, i) => <circle key={i} cx={3 + (i % 12) * 5.8} cy={10 + Math.floor(i / 12) * 8} r="1.6" fill={['#f6c544', '#5cc3a0', '#ef7d96', '#f1c7a0'][i % 4]} stroke="#000" strokeWidth="0.3" />)}
      <rect y="36" width="100" height="26" fill="#eab778" />
      <path d="M0 36 H100" stroke="#000" strokeWidth="0.5" />
      <path d="M66 38 L96 38 L100 60 L62 60 Z" fill="#ef7d96" opacity="0.8" />
      <rect x="72" y="8" width="18" height="13" rx="1" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" />
      <rect x="77" y="13" width="7" height="6" fill="none" stroke="#ef7d96" strokeWidth="0.7" />
      <ellipse cx="80" cy="22" rx="4" ry="1.1" fill="none" stroke="#ef6a3a" strokeWidth="0.9" />
      <path d="M76 22 L78 28 M80 22.8 V28.5 M84 22 L82 28" stroke="#fff" strokeWidth="0.4" />
      <path d="M30 40 Q52 -2 79 18" stroke="#fff" strokeWidth="0.6" strokeDasharray="1.4 1" fill="none" />
      <image href={`${ART}/basketball.webp`} x="72" y="12" width="8" height="8" />
      <g transform="translate(28 58) scale(1.6)">
        <path d="M-1.3 0 L-0.9 -3.6 M1.3 0 L0.9 -3.6" stroke="#d9a37a" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M-2.2 -7.8 L-1.4 -13 M2.2 -7.8 L1.6 -13" stroke="#d9a37a" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-2.4 -8.8 h4.8 l-0.2 4.4 h-4.4 z" fill="#5cc3a0" stroke="#000" strokeWidth="0.45" />
        <circle cy="-10.8" r="2.5" fill="#d9a37a" stroke="#000" strokeWidth="0.45" />
      </g>
    </svg>
  );
}

const def: LabDef = {
  id: 'hoop-shot',
  name: 'Hoop Shot',
  description: 'Answer right to take a shot. Pick close or far, then tap when the arrow glows.',
  ways: ['teams', 'solo'],
  minTeams: 1,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to get the ball' },
    { icon: <Basketball weight="fill" />, text: 'Pick close for 2 or far for 3' },
    { icon: <HandTap weight="fill" />, text: 'Tap when the arrow glows' },
    { icon: <Trophy weight="fill" />, text: 'Most points wins' },
  ],
  rounds: { label: 'Shots', min: 3, max: 15, default: 6 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #d6dcff 0%, #a7b3f5 55%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the gym' },
    { id: 'gym', label: 'Gym', hint: 'The wall, the rafters and the bleachers' },
    { id: 'floor', label: 'Floor', hint: 'The wood court with its lines' },
    { id: 'hoop', label: 'Hoop', hint: 'The backboard, the pole and the rim' },
    { id: 'net', label: 'Net', hint: 'The net under the rim' },
    { id: 'shooter', label: 'Shooter', hint: 'The player who shoots (wears the team color)' },
    { id: 'ball', label: 'Ball', hint: 'The basketball, round' },
    { id: 'fan', label: 'Fan', hint: 'A fan in the bleachers' },
    { id: 'banner', label: 'Team banner', hint: 'The banner that grows with a team\'s points' },
    { id: 'mascot', label: 'Mascot', hint: 'The team mascot by the court' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
