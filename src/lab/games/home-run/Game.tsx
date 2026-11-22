import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Baseball, CheckCircle, HandTap, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { pace } from '../../../engine/pace';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { CROSS, cpuSwing, HIT_NAMES, inningOver, openBase, swingResult, type Hit } from './rules';

// Home Run Derby (Game Lab, inspired by classroom quiz-board baseball games):
// a right answer brings a pitch; the batter taps as the ball crosses the
// plate. Good timing (and a little luck) makes a single, double, triple or a
// home run; runners hop around the bases and every run fills a seat in the
// stands with the team's color. A wrong answer or a whiff is an out; three
// outs (or five pitches) end the inning.

const ART = '/lab/home-run';
const POWERS: LabPower[] = [
  { id: 'giant', name: 'Giant Bat', desc: 'Your bat grows huge. Hits are easier this pitch.', enter: 'zoom', art: <Art kind="giant" /> },
  { id: 'slow', name: 'Slow Pitch', desc: 'The next pitch floats in nice and slow.', enter: 'drop', art: <Art kind="slow" /> },
  { id: 'rally', name: 'Rally Cap', desc: 'Caps inside out! Your next hit goes one base farther.', enter: 'spin', art: <Art kind="rally" /> },
  { id: 'fireworks', name: 'Fireworks', desc: 'Every run counts double for the rest of this inning.', enter: 'zoom', art: <Art kind="fireworks" /> },
  { id: 'pinch', name: 'Pinch Runner', desc: 'A speedy runner zooms onto a base for you.', enter: 'wiggle', art: <Art kind="pinch" /> },
  { id: 'stretch', name: 'Seventh-inning Stretch', desc: 'Everybody stretches! You get one extra out this inning.', enter: 'drop', art: <Art kind="stretch" /> },
  { id: 'gum', name: 'Bubble Gum Ball', desc: 'Pop! The pitch is a bubble gum ball that bounces in all wiggly.', silly: true, art: <Art kind="gum" /> },
  { id: 'sneeze', name: 'Sneezy Pitcher', desc: 'Achoo! The pitcher sneezes and the pitch zooms in fast.', silly: true, art: <Art kind="sneeze" /> },
];

// The field, seen from behind home plate (viewBox 160 x 100).
const HOME = { x: 80, y: 88 };
const BASES = [HOME, { x: 121, y: 66 }, { x: 80, y: 49 }, { x: 39, y: 66 }, HOME];
const MOUND = { x: 80, y: 64 };
const FIELDERS = [
  { x: 114, y: 59, s: 0.95 }, { x: 98, y: 50, s: 0.9 }, { x: 62, y: 50, s: 0.9 }, { x: 46, y: 59, s: 0.95 },
  { x: 34, y: 41, s: 0.8 }, { x: 80, y: 36, s: 0.75 }, { x: 126, y: 41, s: 0.8 },
];
const SKINS = ['#f1c7a0', '#d9a37a', '#a8724e', '#7a4f33', '#f6d6b8'];
const NEUTRAL = ['#e9eefe', '#cdd5f7', '#f4e7c8', '#d8e8df', '#efd9e4'];
const depth = (y: number) => 0.62 + ((y - 30) / 60) * 0.55;

interface Runner { key: number; at: number; color: string }
interface Fan { x: number; y: number; skin: string; color: string | null }
interface Flight { key: number; pts: { x: number; y: number; s: number }[]; ground: { x: number; y: number }[]; dur: number }
interface Pitch { u: number; kind: 'normal' | 'slow' | 'gum' | 'fast'; glow: boolean }

function makeFans(): Fan[] {
  const out: Fan[] = [];
  [13, 18.5, 24].forEach((y, row) => {
    for (let x = 4 + (row % 2) * 2.2; x < 157; x += 4.4) {
      if (x > 56 && x < 104 && y < 22) continue;
      out.push({ x, y, skin: SKINS[Math.floor(Math.random() * SKINS.length)], color: Math.random() < 0.38 ? NEUTRAL[Math.floor(Math.random() * NEUTRAL.length)] : null });
    }
  });
  return out;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const P = pace(ctx.settings) / 1.6;
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms * P));
  const [runners, setRunners] = useState<Runner[]>([]);
  const runnersRef = useRef<Runner[]>([]);
  const putRunners = (r: Runner[]) => { runnersRef.current = r; setRunners(r); };
  const [outs, setOuts] = useState(0);
  const [maxOuts, setMaxOuts] = useState(3);
  const [pitches, setPitches] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'windup' | 'pitch' | 'busy'>('wait');
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [swingKey, setSwingKey] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [chase, setChase] = useState<{ i: number; x: number; y: number; catch?: boolean } | null>(null);
  const [fans, setFans] = useState<Fan[]>(makeFans);
  const [stretching, setStretching] = useState(false);
  const [wave, setWave] = useState(0);
  const [fireworks, setFireworks] = useState<{ key: number; x: number; y: number; color: string; delay: number }[]>([]);
  const [fx, setFx] = useState({ giant: false, rally: false, slowShow: 0, stretch: 0, bubble: 0, sneeze: 0, pinch: 0, twice: false });
  const [popText, setPopText] = useState<{ key: number; text: string; x: number; y: number } | null>(null);
  const swingRef = useRef<number | null>(null);
  const live = useRef(0);
  const keyN = useRef(1);
  const mods = useRef({ fireworks: false, rally: false });
  const outsRef = useRef(0), maxRef = useRef(3), pitchesRef = useRef(0);
  const myColor = TEAM_COLORS[ctx.player.colorIndex % TEAM_COLORS.length];

  // One inning per turn: questions until three outs or five pitches.
  useEffect(() => {
    const id = ++live.current;
    void inning(id);
    return () => { live.current++; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  const alive = (id: number) => live.current === id;

  function held() {
    const x = c.current, list: LabPower[] = [];
    if (mods.current.fireworks) list.push(POWERS[3]);
    if (mods.current.rally) list.push(POWERS[2]);
    if (maxRef.current > 3) list.push(POWERS[5]);
    x.setHeld(x.player.id, list);
  }

  function status() {
    c.current.setStatus(
      <span className="flex items-center justify-center gap-2" aria-label={`${outsRef.current} of ${maxRef.current} outs`}>
        <span className="text-sm uppercase tracking-wider text-muted">Outs</span>
        {Array.from({ length: maxRef.current }, (_, i) => <span key={i} className="w-5 h-5 rounded-full border-std border-border" style={{ background: i < outsRef.current ? '#ef7d96' : '#fbfcf8' }} />)}
      </span>,
    );
  }

  async function inning(id: number) {
    outsRef.current = 0; maxRef.current = 3; pitchesRef.current = 0;
    mods.current = { fireworks: false, rally: false };
    setOuts(0); setMaxOuts(3); setPitches(0); putRunners([]); setFlight(null); setChase(null);
    setFx((f) => ({ ...f, giant: false, rally: false, twice: false }));
    setPhase('wait'); held(); status();
    await wait(500);
    while (alive(id)) {
      setPhase('wait');
      const ok = await c.current.ask();
      if (!alive(id)) return;
      pitchesRef.current += 1; setPitches(pitchesRef.current);
      if (!ok) {
        c.current.sfx.wrong();
        await out('Strike!');
      } else {
        const p = await c.current.power(0.4, (pw) => pw.id !== 'pinch' || openBase(runnersRef.current.map((r) => r.at)) !== null);
        if (!alive(id)) return;
        const kind = await usePower(p);
        if (!alive(id)) return;
        await atBat(id, kind, p?.id === 'giant');
        if (!alive(id)) return;
      }
      if (inningOver(outsRef.current, maxRef.current, pitchesRef.current)) break;
      await wait(450);
    }
    if (!alive(id)) return;
    setPhase('busy');
    c.current.say(outsRef.current >= maxRef.current ? 'Three outs!' : 'Inning over!', 'big');
    c.current.sfx.whistle();
    await wait(1700);
    if (!alive(id)) return;
    c.current.setHeld(c.current.player.id, []);
    c.current.next();
  }

  async function out(text: string) {
    outsRef.current += 1; setOuts(outsRef.current); status();
    c.current.say(outsRef.current >= maxRef.current ? 'Out!' : text, 'oops');
    await wait(1100);
  }

  // A power-up does its own thing on the field before the pitch.
  async function usePower(p: LabPower | null): Promise<Pitch['kind']> {
    const x = c.current;
    if (!p) return 'normal';
    switch (p.id) {
      case 'giant': setFx((f) => ({ ...f, giant: true })); x.sfx.boing(); await wait(700); return 'normal';
      case 'slow': setFx((f) => ({ ...f, slowShow: f.slowShow + 1 })); x.sfx.slideDown(); await wait(1100); return 'slow';
      case 'rally': mods.current.rally = true; setFx((f) => ({ ...f, rally: true })); setWave((w) => w + 1); x.sfx.cheer(); held(); await wait(1200); return 'normal';
      case 'fireworks': mods.current.fireworks = true; setFx((f) => ({ ...f, twice: true })); boom(5); held(); await wait(1500); return 'normal';
      case 'stretch': maxRef.current += 1; setMaxOuts(maxRef.current); setFx((f) => ({ ...f, stretch: f.stretch + 1 })); setStretching(true); window.setTimeout(() => setStretching(false), 1500); setWave((w) => w + 1); x.sfx.slideUp(); window.setTimeout(() => c.current.sfx.whistle(), 500); held(); status(); await wait(1600); return 'normal';
      case 'pinch': {
        const b = openBase(runnersRef.current.map((r) => r.at));
        if (b !== null) { putRunners([...runnersRef.current, { key: keyN.current++, at: b, color: TEAM_COLORS[x.player.colorIndex % TEAM_COLORS.length] }]); setFx((f) => ({ ...f, pinch: f.pinch + 1 })); x.sfx.whoosh(); }
        await wait(1200); return 'normal';
      }
      case 'gum': setFx((f) => ({ ...f, bubble: f.bubble + 1 })); window.setTimeout(() => playClip(`${ART}/gum-pop.mp3`, c.current.settings), 900); await wait(1300); return 'gum';
      case 'sneeze': setFx((f) => ({ ...f, sneeze: f.sneeze + 1 })); x.sfx.oops(); await wait(1200); return 'fast';
      default: return 'normal';
    }
  }

  function boom(n: number) {
    const list = Array.from({ length: n }, (_, i) => ({ key: keyN.current++, x: 15 + Math.random() * 130, y: 6 + Math.random() * 16, color: ['#fdfd94', '#ef7d96', '#8fe3a0', '#b4c4fb', '#f5a08c'][i % 5], delay: i * 0.22 }));
    setFireworks((f) => [...f, ...list]);
    list.forEach((fw) => window.setTimeout(() => c.current.sfx.pop(), fw.delay * 1000 + 300));
    window.setTimeout(() => setFireworks((f) => f.filter((x) => !list.includes(x))), 2600 + n * 220);
  }

  // The pitch: the ball flies from the mound to the plate; the batter taps.
  function throwPitch(kind: Pitch['kind'], giant: boolean): Promise<number | null> {
    return new Promise((resolve) => {
      const base = (kind === 'slow' ? 2300 : kind === 'fast' ? 950 : kind === 'gum' ? 1650 : 1350) * (0.92 + Math.random() * 0.16) * Math.max(1, P * 0.85);
      const start = performance.now();
      const crossAt = start + base * CROSS;
      const win = 270 * (giant ? 1.7 : 1);
      swingRef.current = null;
      const x = c.current;
      x.sfx.whoosh();
      if (x.cpu) {
        const plan = cpuSwing(x.cpuRight());
        if (plan !== null) window.setTimeout(() => swing(), Math.max(0, crossAt - start + (Math.random() < 0.5 ? -plan : plan)));
      }
      let done = false;
      const step = () => {
        if (done) return;
        const now = performance.now();
        const u = Math.min(1, (now - start) / base);
        setPitch({ u, kind, glow: Math.abs(now - crossAt) < win * 0.5 });
        const sw = swingRef.current;
        if (sw !== null && Math.abs(sw - crossAt) <= win && now >= crossAt - 4) { done = true; resolve(Math.abs(sw - crossAt)); return; }
        if (u >= 1) { done = true; resolve(sw !== null ? Math.abs(sw - crossAt) + win : null); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function swing() {
    if (phaseRef.current !== 'pitch' || swingRef.current !== null) return;
    swingRef.current = performance.now();
    setSwingKey((k) => k + 1);
    c.current.sfx.swish();
  }

  // Space or Enter swings too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && phaseRef.current === 'pitch' && !c.current.cpu) { e.preventDefault(); swing(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function atBat(id: number, kind: Pitch['kind'], giant: boolean) {
    setPhase('windup');
    await wait(1000);
    if (!alive(id)) return;
    setPhase('pitch');
    const err = await throwPitch(kind, giant);
    if (!alive(id)) return;
    setPhase('busy');
    const r = swingResult(err, { giant, rally: mods.current.rally });
    setFx((f) => ({ ...f, giant: false }));
    if (r.hit === 0) {
      c.current.sfx.thud();
      await wait(350);
      setPitch(null);
      await out(err === null ? 'Strike!' : 'Whiff! Strike!');
      return;
    }
    // Crack! The ball flies.
    c.current.sfx.kick(); c.current.sfx.bump();
    if (mods.current.rally) { mods.current.rally = false; setFx((f) => ({ ...f, rally: false })); held(); }
    setPitch(null);
    await hitFlight(r.hit, r.caught);
    if (!alive(id)) return;
    if (r.caught) {
      c.current.sfx.boing();
      await out('Caught! Out!');
      setChase(null);
      return;
    }
    c.current.say(HIT_NAMES[r.hit], r.hit === 4 ? 'big' : 'good');
    setWave((w) => w + 1);
    if (r.hit >= 2) playClip(`${ART}/clap.mp3`, c.current.settings, 0.5);
    if (r.hit === 4) { playClip(`${ART}/celebrate.mp3`, c.current.settings); boom(7); c.current.burst(0.5, 0.25, 'big'); }
    await runBases(id, r.hit);
    setChase(null);
  }

  async function hitFlight(hit: Hit, caught: boolean) {
    const side = Math.random() < 0.5 ? -1 : 1;
    let land: { x: number; y: number }; let h: number;
    let fielder = -1;
    if (caught) { fielder = 4 + Math.floor(Math.random() * 3); const f = FIELDERS[fielder]; land = { x: f.x, y: f.y - 6 }; h = 30; }
    else if (hit === 1) { land = { x: 58 + Math.random() * 44, y: 44 + Math.random() * 5 }; h = 16; }
    else if (hit === 2) { land = { x: 80 + side * (24 + Math.random() * 14), y: 37 + Math.random() * 4 }; h = 24; }
    else if (hit === 3) { land = { x: 80 + side * (52 + Math.random() * 14), y: 41 + Math.random() * 3 }; h = 28; }
    else { land = { x: 30 + Math.random() * 100, y: 12 + Math.random() * 8 }; h = 48; }
    const start = { x: HOME.x + 2, y: HOME.y - 6 };
    const N = 16;
    const pts = [], ground = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, arc = 4 * t * (1 - t);
      const gx = start.x + (land.x - start.x) * t, gy = start.y + (land.y - start.y) * t;
      ground.push({ x: gx, y: gy + (hit === 4 ? 0 : 3) });
      pts.push({ x: gx, y: gy - h * arc, s: (1.25 - 0.6 * t) * (1 + 0.5 * arc) });
    }
    const dur = (hit === 4 ? 1.9 : caught ? 1.6 : 1.25) * P;
    setFlight({ key: keyN.current++, pts, ground, dur });
    // The nearest fielder chases it (on a home run they just watch it go).
    if (hit < 4) {
      if (fielder < 0) { let best = 0, d = 1e9; FIELDERS.forEach((f, i) => { const dd = (f.x - land.x) ** 2 + (f.y - land.y) ** 2; if (dd < d) { d = dd; best = i; } }); fielder = best; }
      const f = FIELDERS[fielder];
      setChase({ i: fielder, x: caught ? 0 : land.x - f.x, y: caught ? 0 : land.y + 2 - f.y, catch: caught });
    }
    await wait(dur * 1000 / P + 120);
    if (caught) c.current.sfx.thud();
    else if (hit < 4) c.current.sfx.thud();
    if (hit === 4) setFlight(null);
  }

  async function runBases(id: number, n: number) {
    const color = TEAM_COLORS[c.current.player.colorIndex % TEAM_COLORS.length];
    let list = [...runnersRef.current, { key: keyN.current++, at: 0, color }];
    putRunners(list);
    await wait(200);
    for (let s = 0; s < n; s++) {
      if (!alive(id)) return;
      list = list.map((r) => ({ ...r, at: r.at + 1 }));
      putRunners(list);
      c.current.sfx.jump();
      await wait(480);
      const home = list.filter((r) => r.at >= 4);
      if (home.length) {
        list = list.filter((r) => r.at < 4);
        for (const _ of home) score(color);
        await wait(250);
        putRunners(list);
      }
    }
    setFlight(null);
  }

  function score(color: string) {
    const x = c.current;
    const pts = mods.current.fireworks ? 2 : 1;
    x.points(pts); x.sfx.coin();
    setPopText({ key: keyN.current++, text: pts > 1 ? '+2' : '+1', x: HOME.x, y: HOME.y - 14 });
    // Two more fans in the team's color take their seats.
    setFans((list) => {
      const open = list.map((f, i) => (f.color ? -1 : i)).filter((i) => i >= 0);
      if (!open.length) return list.map((f, i) => (i % 9 === keyN.current % 9 ? { ...f, color } : f));
      const pick = open.sort(() => Math.random() - 0.5).slice(0, 2);
      return list.map((f, i) => (pick.includes(i) ? { ...f, color } : f));
    });
  }

  const still = ctx.still;
  const canSwing = phase === 'pitch' && !ctx.cpu;
  const ballPos = pitch ? pitchPos(pitch) : null;

  return (
    <div className="absolute inset-0 grid place-items-center">
      <style>{CSS}</style>
      <div className="relative lab-fit rounded-[1.4rem] border-heavy border-border overflow-hidden" style={{ ['--ar' as string]: 1.6, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' }}>
        <svg viewBox="0 0 160 100" className="absolute inset-0 w-full h-full" role="img" aria-label="Baseball field">
          <FieldArt />
          {/* The stands: every run seats two fans in the team's color. */}
          <g key={`w${wave}`} className={still ? '' : 'hr-wave'}>
            {fans.map((f, i) => <FanArt key={`${i}-${f.color}`} f={f} rally={fx.rally} still={still} />)}
          </g>
          <BoardSign outs={outs} maxOuts={maxOuts} pitches={pitches} color={myColor} twice={fx.twice} />
          {/* Fireworks over the stands. */}
          {fireworks.map((fw) => <Firework key={`fw${fw.key}`} x={fw.x} y={fw.y} color={fw.color} delay={fw.delay} still={still} />)}
          {/* Fielders, a little silly: they sway, chase and stretch. */}
          {FIELDERS.map((f, i) => (
            <motion.g key={i} initial={false} animate={chase?.i === i ? { x: chase.x, y: chase.catch ? [0, -4, 0] : chase.y } : { x: 0, y: 0 }} transition={{ duration: 0.9 * P, ease: 'easeOut' }}>
              <g transform={`translate(${f.x} ${f.y})`}>
                <motion.g key={fx.stretch} animate={still || !fx.stretch ? undefined : { scaleY: [1, 1.35, 1.35, 1], rotate: [0, -6, 6, 0] }} transition={{ duration: 1.4 }} style={{ originY: 1 }}>
                  <g className={still ? '' : 'hr-sway'} style={{ animationDelay: `${i * 0.3}s` }}><Kid shirt="#fbfcf8" cap="#ef7d96" skin={SKINS[i % SKINS.length]} s={f.s} glove arms={stretching ? 'up' : 'down'} /></g>
                </motion.g>
              </g>
            </motion.g>
          ))}
          {/* Runners on the bases, hopping from base to base. */}
          <AnimatePresence>
            {runners.map((r) => {
              const b = BASES[Math.min(4, r.at)];
              return (
                <motion.g key={r.key} initial={still ? false : fx.pinch && r.at > 0 ? { x: 150, y: 80, opacity: 0 } : { x: b.x, y: b.y, opacity: 0 }}
                  animate={{ x: b.x - 2, y: b.y, opacity: 1 }} exit={{ opacity: 0, scale: 1.6, y: b.y - 10 }} transition={{ duration: 0.45 * P, ease: 'easeInOut' }}>
                  <motion.g key={r.at} animate={still ? undefined : { y: [0, -3.5, 0] }} transition={{ duration: 0.45 * P }}>
                    <Kid shirt={r.color} cap="#241c3d" skin={SKINS[r.key % SKINS.length]} s={depth(b.y) * 1.05} run />
                  </motion.g>
                </motion.g>
              );
            })}
          </AnimatePresence>
          {/* The pitcher on the mound. */}
          <g transform={`translate(${MOUND.x} ${MOUND.y})`}>
            <motion.g key={fx.sneeze} animate={still || !fx.sneeze ? undefined : { x: [0, -1, 1.5, -1.5, 0], rotate: [0, -8, 10, 0] }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Kid shirt="#fbfcf8" cap="#ef7d96" skin="#d9a37a" s={1.05} glove pitcher={phase === 'windup' && !still} />
            </motion.g>
            <AnimatePresence>
              {fx.bubble > 0 && phase !== 'pitch' && (
                <motion.circle key={`b${fx.bubble}`} cx="0" cy="-10" r="5" fill="#ff9ccf" stroke="#000" strokeWidth="0.4" fillOpacity="0.85" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1.6] }} exit={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.9 }} />
              )}
            </AnimatePresence>
          </g>
          <AnimatePresence>
            {fx.slowShow > 0 && phase === 'busy' && (
              <motion.image key={`s${fx.slowShow}`} href={`${ART}/stopwatch.webp`} x={MOUND.x - 9} y={MOUND.y - 34} width="18" height="18" initial={{ scale: 0, rotate: -90, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ opacity: 0, y: MOUND.y - 44 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} />
            )}
          </AnimatePresence>
          <SneezeCloud n={fx.sneeze} show={phase === 'busy' || phase === 'wait'} />
          {/* The strike zone at the plate glows when it is time to swing. */}
          <ellipse cx={HOME.x} cy={HOME.y - 2} rx={pitch?.glow ? 6.5 : 5.5} ry={pitch?.glow ? 3.2 : 2.6} fill={pitch?.glow ? '#fdfd94' : 'none'} fillOpacity="0.55" stroke={phase === 'pitch' ? '#fdfd94' : 'transparent'} strokeWidth="0.8" strokeDasharray={pitch?.glow ? undefined : '1.5 1'} />
          {/* The catcher's mitt peeking in at the bottom. */}
          <g transform={`translate(${HOME.x} 99)`}><ellipse rx="7" ry="5" fill="#a0603a" stroke="#000" strokeWidth="0.6" /><path d="M-4 -2 Q0 -5 4 -2" stroke="#6b3b20" strokeWidth="0.8" fill="none" /></g>
          {/* The pitch. */}
          {pitch && ballPos && (
            <g>
              {pitch.kind === 'slow' && [0.05, 0.1, 0.15].map((d) => { const g = pitchPos({ ...pitch, u: Math.max(0, pitch.u - d) }); return <circle key={d} cx={g.x} cy={g.y} r={2 * g.s} fill="#b4c4fb" opacity={0.5 - d * 2} />; })}
              <ellipse cx={ballPos.x} cy={ballPos.gy + 1} rx={2 * ballPos.s} ry={0.7 * ballPos.s} fill="#000" opacity="0.2" />
              {pitch.kind === 'gum'
                ? <g transform={`translate(${ballPos.x} ${ballPos.y}) scale(${ballPos.s})`}><circle r="2.3" fill="#ff8fc8" stroke="#000" strokeWidth="0.4" /><circle cx="-0.7" cy="-0.8" r="0.7" fill="#fff" opacity="0.8" /></g>
                : <image href={`${ART}/baseball.webp`} x={ballPos.x - 2.2 * ballPos.s} y={ballPos.y - 2.2 * ballPos.s} width={4.4 * ballPos.s} height={4.4 * ballPos.s} />}
            </g>
          )}
          {/* The batter: the team's own color, bat ready. */}
          <g transform={`translate(${HOME.x - 10} ${HOME.y + 2})`}>
            <Kid shirt={myColor} cap="#241c3d" skin={SKINS[ctx.player.colorIndex % SKINS.length]} s={1.75} />
            <g transform="translate(-3.5 -11)">
              <motion.g key={swingKey} initial={false} animate={swingKey && !still ? { rotate: [-115, 20, 150, 150, -115] } : { rotate: -115 }} transition={{ duration: 1.1, times: [0, 0.16, 0.32, 0.8, 1] }}>
                <circle r="26" fill="none" />
                <motion.g animate={{ scale: fx.giant ? 1.7 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 9 }}>
                  <circle r="15" fill="none" />
                  <path d="M0 -0.8 L13 -1.6 Q14.6 0 13 1.6 L0 0.8 Z" fill={fx.giant ? '#f6c544' : '#c98a4f'} stroke="#000" strokeWidth="0.5" />
                  <rect x="-1" y="-0.9" width="2" height="1.8" rx="0.6" fill="#241c3d" />
                </motion.g>
              </motion.g>
            </g>
          </g>
          {/* The hit ball and its shadow. */}
          {flight && (
            <g key={flight.key}>
              <motion.ellipse rx="1.8" ry="0.6" fill="#000" opacity="0.22" initial={{ x: flight.ground[0].x, y: flight.ground[0].y }} animate={{ x: flight.ground.map((p) => p.x), y: flight.ground.map((p) => p.y) }} transition={{ duration: flight.dur, ease: 'linear' }} />
              <motion.g initial={{ x: flight.pts[0].x, y: flight.pts[0].y }} animate={{ x: flight.pts.map((p) => p.x), y: flight.pts.map((p) => p.y), scale: flight.pts.map((p) => p.s), rotate: 720 }} transition={{ duration: flight.dur, ease: 'linear' }}>
                <image href={`${ART}/baseball.webp`} x="-2.2" y="-2.2" width="4.4" height="4.4" />
              </motion.g>
            </g>
          )}
          <AnimatePresence>
            {popText && (
              <motion.text key={popText.key} x={popText.x} y={popText.y} textAnchor="middle" className="font-display" fontSize="9" fill="#fdfd94" stroke="#000" strokeWidth="0.9" paintOrder="stroke"
                initial={{ opacity: 0, y: popText.y + 4 }} animate={{ opacity: [0, 1, 1, 0], y: popText.y - 8 }} transition={{ duration: 1.3 }} onAnimationComplete={() => setPopText(null)}>{popText.text}</motion.text>
            )}
          </AnimatePresence>
        </svg>
        {/* Tap anywhere to swing, or the big bat button. */}
        <button type="button" aria-label="Swing" disabled={!canSwing} onClick={swing} className="absolute inset-0 w-full h-full bg-transparent disabled:cursor-default cursor-pointer" />
        <AnimatePresence>
          {(phase === 'pitch' || phase === 'windup') && !ctx.cpu && (
            <motion.div className="absolute right-[3%] bottom-[5%] pointer-events-none grid justify-items-center gap-1" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <motion.span className="w-[clamp(3.5rem,9cqw,6rem)] aspect-square rounded-full border-heavy border-border grid place-items-center" style={{ background: phase === 'pitch' ? '#fdfd94' : '#fbfcf8', boxShadow: '0 5px 0 #000' }}
                animate={still ? undefined : { scale: [1, 1.08, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                <HandTap weight="fill" className="w-1/2 h-1/2" />
              </motion.span>
              <span className="font-display text-[clamp(1.1rem,2.6cqw,1.8rem)] text-white leading-none" style={{ WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}>Swing!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Where the pitch is: down the middle, bigger as it comes. The bubble gum
// ball wiggles and bounces but still crosses the plate on time.
function pitchPos(p: Pitch) {
  const u = p.u;
  const t = u / CROSS;
  let x = MOUND.x;
  let gy = MOUND.y - 4 + (HOME.y - 2 - (MOUND.y - 4)) * t;
  let y = gy;
  if (p.kind === 'gum') { x += Math.sin(u * 16) * 5 * (1 - u * 0.8); y -= Math.abs(Math.sin(u * Math.PI * 3)) * 7; }
  if (gy > 97) gy = 97;
  y = Math.min(y, 98);
  return { x, y, gy, s: 0.55 + u * 1.05 };
}

const CSS = `
.hr-sway { animation: hr-sway 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes hr-sway { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg) translateY(-0.4px); } }
.hr-wave > g { animation: hr-wave 1.4s ease-in-out 1 both; }
@keyframes hr-wave { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-2.6px); } }
html[data-motion="still"] .hr-sway, html[data-motion="still"] .hr-wave > g { animation: none; }
`;

// A little ballplayer, drawn at the feet.
function Kid({ shirt, cap, skin, s = 1, glove, arms = 'down', run, pitcher }: { shirt: string; cap: string; skin: string; s?: number; glove?: boolean; arms?: 'up' | 'down'; run?: boolean; pitcher?: boolean }) {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cy="0.2" rx="2.6" ry="0.7" fill="#000" opacity="0.2" />
      <path d={run ? 'M-1.4 0 L-0.6 -3.6 M1.8 -0.6 L0.8 -3.6' : 'M-1.3 0 L-0.9 -3.6 M1.3 0 L0.9 -3.6'} stroke="#241c3d" strokeWidth="1.3" strokeLinecap="round" />
      {arms === 'up'
        ? <path d="M-2.4 -7.6 L-3.6 -12 M2.4 -7.6 L3.6 -12" stroke={skin} strokeWidth="1.1" strokeLinecap="round" />
        : <path d="M-2.4 -7.6 L-3.4 -4.6 M2.4 -7.6 L3.4 -4.6" stroke={skin} strokeWidth="1.1" strokeLinecap="round" />}
      <rect x="-2.6" y="-8.6" width="5.2" height="5.4" rx="1.8" fill={shirt} stroke="#000" strokeWidth="0.45" />
      {glove && arms === 'down' && <circle cx="-3.6" cy="-4.4" r="1.3" fill="#a0603a" stroke="#000" strokeWidth="0.35" />}
      {pitcher && (
        <g transform="translate(2.4 -7.6)">
          <motion.g animate={{ rotate: [0, -160, -200, 20] }} transition={{ duration: 1, times: [0, 0.5, 0.75, 1] }}>
            <circle r="4" fill="none" />
            <path d="M0 0 L2.6 -2.4" stroke={skin} strokeWidth="1.2" strokeLinecap="round" /><circle cx="2.8" cy="-2.6" r="0.9" fill="#fff" stroke="#000" strokeWidth="0.3" />
          </motion.g>
        </g>
      )}
      <circle cy="-10.8" r="2.5" fill={skin} stroke="#000" strokeWidth="0.45" />
      <circle cx="-0.8" cy="-10.7" r="0.33" fill="#000" /><circle cx="0.8" cy="-10.7" r="0.33" fill="#000" />
      <path d="M-0.7 -9.6 Q0 -9.1 0.7 -9.6" stroke="#000" strokeWidth="0.3" fill="none" strokeLinecap="round" />
      <path d="M-2.5 -11.3 a2.5 2.5 0 0 1 5 0 z" fill={cap} stroke="#000" strokeWidth="0.4" />
      <path d="M-0.2 -11.4 h3.4" stroke={cap} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

function FanArt({ f, rally, still }: { f: Fan; rally: boolean; still: boolean }) {
  if (!f.color) return <rect x={f.x - 1.5} y={f.y - 1} width="3" height="2.6" rx="0.8" fill="#8d96e0" stroke="#5b63b5" strokeWidth="0.3" />;
  return (
    <g style={{ animationDelay: `${f.x * 0.009}s` }}><motion.g initial={still ? false : { scale: 0, y: -4 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 10 }}>
      <path d={`M${f.x - 1.9} ${f.y + 1.8} q0 -2.4 1.9 -2.4 q1.9 0 1.9 2.4 z`} fill={f.color} stroke="#000" strokeWidth="0.3" />
      <circle cx={f.x} cy={f.y - 1.4} r="1.3" fill={f.skin} stroke="#000" strokeWidth="0.3" />
      {rally && <path d={`M${f.x - 1.2} ${f.y - 2.4} L${f.x} ${f.y - 4.4} L${f.x + 1.2} ${f.y - 2.4} z`} fill="#ef7d96" stroke="#000" strokeWidth="0.25" />}
    </motion.g></g>
  );
}

// The board in the stands: outs and pitches left as lights.
function BoardSign({ outs, maxOuts, pitches, color, twice }: { outs: number; maxOuts: number; pitches: number; color: string; twice: boolean }) {
  return (
    <g>
      <rect x="58" y="1.5" width="44" height="19" rx="2" fill="#241c3d" stroke="#000" strokeWidth="0.6" />
      <rect x="60" y="3.2" width="9" height="9" rx="1.5" fill={color} stroke="#fdfd94" strokeWidth="0.5" />
      <path d="M61.6 10 Q61.6 4.6 64.5 4.6 Q67.4 4.6 67.4 9 L68.4 9.6 L61.6 10 Z" fill="#241c3d" /><circle cx="63.4" cy="7.6" r="0.8" fill={color} />
      <text x="72" y="7.6" fontSize="3.1" fill="#fdfd94" fontWeight="700" letterSpacing="0.2">OUTS</text>
      {Array.from({ length: maxOuts }, (_, i) => <circle key={i} cx={73 + i * 4.2} cy="10.6" r="1.5" fill={i < outs ? '#ef7d96' : '#3a3160'} stroke="#000" strokeWidth="0.3" />)}
      <text x="72" y="15.6" fontSize="3.1" fill="#fdfd94" fontWeight="700" letterSpacing="0.2">PITCHES</text>
      {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={73 + i * 4.2} cy="18.4" r="1.3" fill={i < 5 - pitches ? '#fbfcf8' : '#3a3160'} stroke="#000" strokeWidth="0.3" />)}
      {twice && <text x="64.5" y="18.4" fontSize="4" textAnchor="middle" fill="#fdfd94" fontWeight="800">2x</text>}
    </g>
  );
}

function SneezeCloud({ n, show }: { n: number; show: boolean }) {
  return (
    <AnimatePresence>
      {n > 0 && show && (
        <motion.g key={`z${n}`} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.1, 1, 1] }} transition={{ duration: 1.3 }}>
          <path d={`M${MOUND.x - 12} ${MOUND.y - 16} q-3 -6 3 -7 q2 -5 8 -2 q5 -3 8 2 q6 1 3 7 z`} fill="#fbfcf8" stroke="#000" strokeWidth="0.5" />
          <text x={MOUND.x} y={MOUND.y - 18.5} fontSize="4.2" textAnchor="middle" fontWeight="800" fill="#241c3d">Achoo!</text>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function Firework({ x, y, color, delay, still }: { x: number; y: number; color: string; delay: number; still: boolean }) {
  if (still) return <circle cx={x} cy={y} r="4" fill={color} opacity="0.8" />;
  return (
    <g>
      <motion.line x1={x} x2={x} y1={y + 30} y2={y + 30} stroke={color} strokeWidth="0.6" initial={{ opacity: 0 }} animate={{ y2: [y + 30, y], opacity: [0, 1, 0] }} transition={{ duration: 0.4, delay }} />
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1, 1.15], opacity: [0, 1, 0] }} transition={{ duration: 1.3, delay: delay + 0.35, times: [0, 0.35, 1] }}>
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={x + Math.cos(a) * 2} y1={y + Math.sin(a) * 2} x2={x + Math.cos(a) * 7} y2={y + Math.sin(a) * 7} stroke={color} strokeWidth="0.9" strokeLinecap="round" />; })}
        <circle cx={x} cy={y} r="1.4" fill="#fff" />
      </motion.g>
    </g>
  );
}

// The ballpark: sky, light towers, stands, the outfield wall, striped grass,
// the infield dirt, bases and the mound.
function FieldArt() {
  return useMemo(() => (
    <g>
      <defs>
        <linearGradient id="hr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd3ff" /><stop offset="1" stopColor="#d9eeff" /></linearGradient>
        <linearGradient id="hr-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fae4e" /><stop offset="1" stopColor="#3f8f3a" /></linearGradient>
        <radialGradient id="hr-dirt" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stopColor="#e7b47a" /><stop offset="1" stopColor="#c98f57" /></radialGradient>
      </defs>
      <rect width="160" height="100" fill="url(#hr-grass)" />
      {/* Mowing stripes fanning out from home plate. */}
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M80 92 L${-40 + i * 30} 30 L${-25 + i * 30} 30 Z`} fill="#fff" opacity={i % 2 ? 0.07 : 0} />)}
      <path d="M0 0 H160 V43 Q80 22 0 43 Z" fill="#2f6b4f" />
      <rect width="160" height="8" fill="url(#hr-sky)" />
      {[[10, '#fdfd94'], [150, '#fdfd94']].map(([x]) => (
        <g key={x as number}><rect x={(x as number) - 0.6} y="1" width="1.2" height="9" fill="#5b5f7a" /><rect x={(x as number) - 4} y="0.4" width="8" height="3" rx="0.6" fill="#fbfcf8" stroke="#000" strokeWidth="0.4" />{[-2.6, -0.9, 0.8, 2.5].map((d) => <circle key={d} cx={(x as number) + d} cy="1.9" r="0.6" fill="#fdfd94" />)}</g>
      ))}
      {/* Tiered rows of seats. */}
      {[10.5, 16, 21.5].map((y, i) => <rect key={y} x="0" y={y + 2.6} width="160" height="3" fill={['#6b74c9', '#7d86d6', '#8f98e2'][i]} />)}
      <rect x="0" y="27" width="160" height="1.2" fill="#fdfd94" />
      <path d="M0 43 Q80 22 160 43" stroke="#fdfd94" strokeWidth="1.2" fill="none" />
      {/* Pennants on the wall. */}
      {[18, 36, 124, 142].map((x, i) => <path key={x} d={`M${x} ${31 + (i % 2)} l4 2 l-4 2 z`} fill={['#ef7d96', '#fdfd94', '#8fe3a0', '#f5a08c'][i]} stroke="#000" strokeWidth="0.3" />)}
      {/* Foul lines. */}
      <path d="M80 88 L0 45 M80 88 L160 45" stroke="#fbfcf8" strokeWidth="0.7" />
      {/* Infield dirt, grass and bases. */}
      <path d="M80 40 Q108 50 133 66 Q108 84 80 97 Q52 84 27 66 Q52 50 80 40 Z" fill="url(#hr-dirt)" stroke="#a8743f" strokeWidth="0.4" />
      <path d="M80 53 L111 66 L80 82 L49 66 Z" fill="#56a447" stroke="#3f8f3a" strokeWidth="0.4" />
      <path d="M80 88 L121 66 L80 49 L39 66 Z" fill="none" stroke="#fbfcf8" strokeWidth="0.5" opacity="0.8" />
      <ellipse cx="80" cy="65" rx="6" ry="2.8" fill="#d9a066" stroke="#a8743f" strokeWidth="0.4" />
      <rect x="78.4" y="64.3" width="3.2" height="0.8" fill="#fbfcf8" />
      {BASES.slice(1, 4).map((b, i) => <rect key={i} x={b.x - 1.8} y={b.y - 1.8} width="3.6" height="3.6" fill="#fbfcf8" stroke="#000" strokeWidth="0.4" transform={`rotate(45 ${b.x} ${b.y}) scale(1 1)`} />)}
      <path d="M77 87 h6 v1.6 l-3 1.8 l-3 -1.8 z" fill="#fbfcf8" stroke="#000" strokeWidth="0.4" />
      <path d="M68 85 h6 v6 h-6 z M86 85 h6 v6 h-6 z" fill="none" stroke="#fbfcf8" strokeWidth="0.4" opacity="0.8" />
      {/* Dugouts. */}
      <path d="M134 76 h24 v8 h-24 z" fill="#241c3d" stroke="#000" strokeWidth="0.5" /><path d="M134 76 h24 v2 h-24 z" fill="#ef7d96" />
      <path d="M2 76 h24 v8 h-24 z" fill="#241c3d" stroke="#000" strokeWidth="0.5" /><path d="M2 76 h24 v2 h-24 z" fill="#b4c4fb" />
    </g>
  ), []);
}

// Classic power-up pictures, drawn in code (the stopwatch is her pack's).
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'giant' && <>{ring('#fdfd94')}<path d="M24 78 L70 20 Q80 14 84 24 L36 84 Z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><rect x="18" y="74" width="16" height="10" rx="3" transform="rotate(-50 26 79)" fill="#241c3d" /></>}
      {kind === 'slow' && <>{ring('#b4c4fb')}<image href={`${ART}/stopwatch.webp`} x="16" y="14" width="68" height="68" /></>}
      {kind === 'rally' && <>{ring('#8fe3a0')}<path d="M22 66 Q22 30 50 30 Q78 30 78 66 Z" fill="#ef7d96" stroke="#000" strokeWidth="4" transform="rotate(180 50 56)" /><path d="M46 80 h30" stroke="#ef7d96" strokeWidth="8" strokeLinecap="round" transform="rotate(180 50 56)" /><circle cx="50" cy="82" r="4" fill="#000" transform="rotate(180 50 56)" /></>}
      {kind === 'fireworks' && <>{ring('#241c3d')}{[[50, 42, '#fdfd94'], [32, 62, '#ef7d96'], [68, 64, '#8fe3a0']].map(([x, y, col]) => <g key={col as string}>{Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={(x as number) + Math.cos(a) * 4} y1={(y as number) + Math.sin(a) * 4} x2={(x as number) + Math.cos(a) * 14} y2={(y as number) + Math.sin(a) * 14} stroke={col as string} strokeWidth="4" strokeLinecap="round" />; })}</g>)}<text x="50" y="92" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff">2x</text></>}
      {kind === 'pinch' && <>{ring('#f5a08c')}<path d="M14 40 h22 M10 54 h20 M16 68 h18" stroke="#000" strokeWidth="4" strokeLinecap="round" /><circle cx="62" cy="30" r="10" fill="#f1c7a0" stroke="#000" strokeWidth="4" /><path d="M50 44 h22 l4 20 h-30 z" fill="#5cc3a0" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M52 64 l-8 16 M70 64 l10 14" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'stretch' && <>{ring('#fdfd94')}<circle cx="50" cy="34" r="10" fill="#d9a37a" stroke="#000" strokeWidth="4" /><path d="M40 48 h20 v22 h-20 z" fill="#b4c4fb" stroke="#000" strokeWidth="4" /><path d="M40 50 L24 18 M60 50 L76 18 M44 70 l-4 16 M56 70 l4 16" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'gum' && <>{ring('#ffd6ec')}<circle cx="50" cy="48" r="28" fill="#ff8fc8" stroke="#000" strokeWidth="4" /><circle cx="40" cy="38" r="7" fill="#fff" opacity="0.8" /><path d="M24 80 q8 -8 16 0 t16 0 t16 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'sneeze' && <>{ring('#e9eefe')}<circle cx="44" cy="52" r="22" fill="#f1c7a0" stroke="#000" strokeWidth="4" /><path d="M34 46 l6 3 M50 46 l-6 3" stroke="#000" strokeWidth="4" strokeLinecap="round" /><ellipse cx="44" cy="62" rx="6" ry="4" fill="#000" /><circle cx="76" cy="40" r="5" fill="#7fd6e3" stroke="#000" strokeWidth="3" /><circle cx="82" cy="58" r="4" fill="#7fd6e3" stroke="#000" strokeWidth="3" /><circle cx="74" cy="72" r="3" fill="#7fd6e3" stroke="#000" strokeWidth="3" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#4f9f45" />
      <path d="M0 0 H100 V22 Q50 8 0 22 Z" fill="#2f6b4f" />
      <rect width="100" height="5" fill="#9fd3ff" />
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={3 + i * 4.1} cy={9 + (i % 2) * 3} r="1.4" fill={['#f6c544', '#5cc3a0', '#ef7d96', '#e9eefe'][i % 4]} stroke="#000" strokeWidth="0.3" />)}
      <path d="M0 22 Q50 8 100 22" stroke="#fdfd94" strokeWidth="1" fill="none" />
      <path d="M50 24 Q68 30 84 40 Q68 52 50 60 Q32 52 16 40 Q32 30 50 24 Z" fill="#d9a066" stroke="#000" strokeWidth="0.5" />
      <path d="M50 32 L70 40 L50 50 L30 40 Z" fill="#56a447" />
      {[[76, 40], [50, 30], [24, 40]].map(([x, y]) => <rect key={x} x={x - 1.4} y={y - 1.4} width="2.8" height="2.8" fill="#fff" stroke="#000" strokeWidth="0.3" transform={`rotate(45 ${x} ${y})`} />)}
      {[0, 1, 2, 3].map((i) => { return <g key={i}>{Array.from({ length: 10 }, (_, k) => { const t = (k / 10) * Math.PI * 2; return <line key={k} x1={70 + i * 7 + Math.cos(t) * 1.5} y1={6 + (i % 2) * 6 + Math.sin(t) * 1.5} x2={70 + i * 7 + Math.cos(t) * 4.5} y2={6 + (i % 2) * 6 + Math.sin(t) * 4.5} stroke={['#fdfd94', '#ef7d96', '#8fe3a0', '#fff'][i]} strokeWidth="0.7" strokeLinecap="round" />; })}</g>; })}
      <g transform="translate(42 58) scale(1.6)">
        <path d="M-1.3 0 L-0.9 -3.6 M1.3 0 L0.9 -3.6" stroke="#241c3d" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="-2.6" y="-8.6" width="5.2" height="5.4" rx="1.8" fill="#f6c544" stroke="#000" strokeWidth="0.45" />
        <circle cy="-10.8" r="2.5" fill="#d9a37a" stroke="#000" strokeWidth="0.45" />
        <path d="M-2.5 -11.3 a2.5 2.5 0 0 1 5 0 z" fill="#241c3d" />
        <path d="M2.6 -7 L14 -14" stroke="#c98a4f" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <image href={`${ART}/baseball.webp`} x="58" y="26" width="9" height="9" />
      <path d="M50 54 Q55 40 61 31" stroke="#fff" strokeWidth="0.6" strokeDasharray="1.2 1" fill="none" />
    </svg>
  );
}

const def: LabDef = {
  id: 'home-run',
  name: 'Home Run Derby',
  description: 'Answer right to get a pitch. Tap as the ball crosses the plate to hit it out of the park.',
  ways: ['teams', 'solo'],
  minTeams: 1,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to get a pitch' },
    { icon: <HandTap weight="fill" />, text: 'Tap when the ball reaches the plate' },
    { icon: <Baseball weight="fill" />, text: 'Run the bases to score' },
    { icon: <Trophy weight="fill" />, text: 'Most runs wins' },
  ],
  rounds: { label: 'Innings', min: 1, max: 9, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #c8e6ff 0%, #8ec8f5 55%, #5f9fd8 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the ballpark' },
    { id: 'field', label: 'Field', hint: 'The grass, the infield dirt, the bases and the mound' },
    { id: 'stands', label: 'Stands', hint: 'The seats, the light towers and the board with the outs' },
    { id: 'fan', label: 'Fan', hint: 'A fan in the stands (wears the team color)' },
    { id: 'batter', label: 'Batter', hint: 'The player at the plate (wears the team color)' },
    { id: 'bat', label: 'Bat', hint: 'The bat, drawn pointing right' },
    { id: 'pitcher', label: 'Pitcher', hint: 'The player on the mound' },
    { id: 'fielder', label: 'Fielder', hint: 'The players out in the field' },
    { id: 'runner', label: 'Runner', hint: 'A runner on the bases' },
    { id: 'ball', label: 'Ball', hint: 'The baseball, round' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
