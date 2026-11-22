import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowFatUp, CaretLeft, CaretRight, Balloon, Coins, Gift, PersonSimpleRun } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { BASE, cpuInput, GROUND, grumbleTouch, makeLevel, step, T, VH, VW, type Body, type Input, type Level, type Solid } from './rules';

// Jump Quest (Game Lab, classic arcade): a side-scrolling platformer. A
// right answer starts a full run; run and jump across the land, grab coins,
// stomp grumpy grumbles and bump mystery boxes: each one asks a question and
// a right answer pops out a power-up. Reach the balloon gate for a big bonus.

const RUN_LONG = 35, RUN_SHORT = 20;
const IMG = '/lab/jump-quest/';

const img = (src: string) => <img src={IMG + src} alt="" aria-hidden="true" draggable={false} className="w-full h-full object-contain" />;
function Drawn({ kind }: { kind: 'spring' | 'jetpack' | 'bouncy' | 'star' }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={kind === 'bouncy' ? '#f5a08c' : kind === 'jetpack' ? '#b4c4fb' : kind === 'star' ? '#fdfd94' : '#8fe3a0'} stroke="#000" strokeWidth="5" />
      {kind === 'spring' && <><path d="M30 74h40M34 66q16-8 32 0M34 56q16-8 32 0M34 46q16-8 32 0" stroke="#241c3d" strokeWidth="6" fill="none" strokeLinecap="round" /><rect x="28" y="24" width="44" height="14" rx="6" fill="#ef7d96" stroke="#000" strokeWidth="4" /></>}
      {kind === 'jetpack' && <><rect x="30" y="22" width="16" height="40" rx="8" fill="#ef7d96" stroke="#000" strokeWidth="4" /><rect x="54" y="22" width="16" height="40" rx="8" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M34 64q4 14 4 18q4-4 4-18M58 64q4 14 4 18q4-4 4-18" fill="#fdfd94" stroke="#000" strokeWidth="3" /></>}
      {kind === 'bouncy' && <><path d="M26 62h26v14H22q-4 0-4-6t8-8zM56 62h26v14H52q-4 0-4-6t8-8z" fill="#241c3d" stroke="#000" strokeWidth="3" /><path d="M30 60q0-26 10-34M66 60q0-26 10-34" stroke="#fbfcf8" strokeWidth="5" fill="none" /><path d="M24 84q6-6 12 0t12 0M54 84q6-6 12 0t12 0" stroke="#000" strokeWidth="4" fill="none" /></>}
      {kind === 'star' && <path d="M50 16l10 22 24 2-18 16 6 24-22-13-22 13 6-24-18-16 24-2z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" />}
    </svg>
  );
}
const Round = ({ children, bg }: { children: ReactNode; bg: string }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill={bg} stroke="#000" strokeWidth="5" /><foreignObject x="16" y="16" width="68" height="68">{children}</foreignObject></svg>
);

const POWERS: LabPower[] = [
  { id: 'spring', name: 'Super Spring', desc: 'Springy shoes: your jumps go way higher for a while.', enter: 'drop', art: <Drawn kind="spring" /> },
  { id: 'magnet', name: 'Coin Magnet', desc: 'Coins zoom to you for a while.', enter: 'spin', art: <Round bg="#b4c4fb">{img('magnet.webp')}</Round> },
  { id: 'jetpack', name: 'Jetpack', desc: 'Hold jump to fly for a while.', enter: 'zoom', art: <Drawn kind="jetpack" /> },
  { id: 'shield', name: 'Bubble Shield', desc: 'A bubble keeps grumbles from bumping you once.', enter: 'drop', art: <Round bg="#7fd6e3">{img('shield.webp')}</Round> },
  { id: 'slow', name: 'Slow Time', desc: 'Grumbles walk in slow motion for a while.', enter: 'zoom', art: <Round bg="#e9eefe">{img('time.webp')}</Round> },
  { id: 'star', name: 'Star Rush', desc: 'Run super fast and bounce right through grumbles.', enter: 'spin', art: <Drawn kind="star" /> },
  { id: 'double', name: 'Double Coins', desc: 'Every coin counts two for a while.', enter: 'spin', art: <Round bg="#fff6b0">{img('coin.webp')}</Round> },
  { id: 'bouncy', name: 'Bouncy Boots', desc: 'Whoops! You cannot stop bouncing for a bit.', silly: true, art: <Drawn kind="bouncy" /> },
  { id: 'tiny', name: 'Tiny Mode', desc: 'Whoops! You shrink to teeny tiny for a bit.', silly: true, art: <Round bg="#f5a08c">{img('potion.webp')}</Round> },
];
type Fx = 'spring' | 'magnet' | 'jetpack' | 'slow' | 'star' | 'double' | 'bouncy' | 'tiny';
const FX_TIME: Record<Fx, number> = { spring: 12, magnet: 12, jetpack: 7, slow: 10, star: 8, double: 12, bouncy: 7, tiny: 8 };

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number; kind: 'dot' | 'puff' | 'star' }
interface Float { x: number; y: number; text: string; life: number; color: string }
interface World {
  t: number; left: number; lv: Level; b: Body; cam: number; face: number; squash: number; walk: number; blink: number; shield: number;
  fx: Record<Fx, number>; parts: Part[]; floats: Float[]; coins: number; boxes: number; runLen: number; cpuTime: number; stuck: number; lastSafe: number; flag: number; levels: number; over: boolean; asking: boolean;
  popups: { x: number; y: number; vy: number; life: number }[];
}
const newBody = (lv: Level): Body => ({ x: lv.spawn.x, y: lv.spawn.y, w: 30, h: 36, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, jumping: false });
function newWorld(): World {
  const lv = makeLevel();
  return { t: 0, left: RUN_LONG, boxes: 0, runLen: RUN_LONG, cpuTime: 0, stuck: 0, lv, b: newBody(lv), cam: 0, face: 1, squash: 0, walk: 0, blink: 0, shield: 0, fx: { spring: 0, magnet: 0, jetpack: 0, slow: 0, star: 0, double: 0, bouncy: 0, tiny: 0 }, parts: [], floats: [], coins: 0, lastSafe: lv.spawn.x, flag: 0, levels: 0, over: false, asking: false, popups: [] };
}

let coinSheet: HTMLImageElement | null = null;
const clouds = Array.from({ length: 8 }, (_, i) => ({ x: i * 260 + Math.random() * 120, y: 40 + Math.random() * 90, s: 0.7 + Math.random() * 0.6 }));

type Phase = 'ready' | 'run' | 'over';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newWorld());
  const paused = useRef(false);
  const keys = useRef({ l: false, r: false, jump: false, pressed: false });
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready'); phaseRef.current = phase;
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const setBusy = (v: boolean) => { busyRef.current = v; setBusyState(v); };

  useEffect(() => {
    if (!coinSheet) { coinSheet = new Image(); coinSheet.src = IMG + 'coin-spin.webp'; }
  }, []);

  // A new turn: a fresh level and the runner waiting at the start.
  useEffect(() => {
    world.current = newWorld();
    setPhase('ready'); setBusy(false);
    c.current.setHeld(c.current.player.id, []);
    if (!c.current.cpu) return;
    const id = window.setTimeout(() => void start(), 1800);
    return () => window.clearTimeout(id);
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // A question earns the run: right is a long run, a miss a short one.
  async function start() {
    if (phaseRef.current !== 'ready' || busyRef.current) return;
    setBusy(true);
    const x = c.current;
    const ok = await x.ask();
    const w = world.current;
    // The Timers setting stretches the run; with no clock the run lasts to the gate.
    w.runLen = (ok ? RUN_LONG : RUN_SHORT) * (x.timeScale || 1);
    w.left = w.runLen;
    if (ok) { x.sfx.right(); x.points(3); x.burst(0.5, 0.45); w.floats.push({ x: w.b.x + 15, y: w.b.y - 20, text: '+3', life: 0, color: '#fdfd94' }); x.say('Right! Go go go!', 'big'); }
    else { x.sfx.wrong(); x.say(x.timeScale === 0 ? 'Go!' : 'A short run!', 'oops'); }
    setBusy(false);
    setPhase('run');
  }

  const tune = (w: World) => ({
    ...BASE,
    speed: w.fx.star > 0 ? 400 : BASE.speed,
    jump: w.fx.spring > 0 ? 1000 : w.fx.tiny > 0 ? 700 : BASE.jump,
    fly: w.fx.jetpack > 0,
    bouncy: w.fx.bouncy > 0,
  });

  function held(w: World) {
    const x = c.current;
    x.setHeld(x.player.id, POWERS.filter((p) => (p.id === 'shield' ? w.shield > 0 : (w.fx[p.id as Fx] ?? 0) > 0)));
  }

  function puff(w: World, px: number, py: number, n: number, color = '#fff', kind: Part['kind'] = 'puff', speed = 120) {
    const many = c.current.still ? Math.ceil(n / 3) : n;
    for (let i = 0; i < many; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      w.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'star' ? 120 : 30), life: 0, max: 0.4 + Math.random() * 0.5, color, r: kind === 'puff' ? 8 + Math.random() * 10 : 3 + Math.random() * 3, kind });
    }
  }

  function apply(p: LabPower) {
    const w = world.current, x = c.current;
    if (p.id === 'shield') { w.shield = 1; x.sfx.boing(); }
    else w.fx[p.id as Fx] = FX_TIME[p.id as Fx];
    if (p.id === 'magnet') x.sfx.magnet();
    if (p.id === 'jetpack') x.sfx.whoosh();
    if (p.id === 'slow') x.sfx.freeze();
    if (p.id === 'star') x.sfx.power();
    if (p.id === 'double') x.sfx.coin();
    if (p.id === 'spring' || p.id === 'bouncy') x.sfx.boing();
    if (p.id === 'tiny') x.sfx.slideDown();
    puff(w, w.b.x + 15, w.b.y + 10, 24, '#fdfd94', 'star', 220);
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    held(w);
  }

  // A mystery box: a question; a right answer pops out a power-up.
  async function mystery(w: World, s: Solid) {
    const x = c.current;
    s.kind = 'used'; s.bump = 1;
    x.sfx.bump();
    paused.current = true; w.asking = true;
    const ok = await x.ask();
    if (w !== world.current) return;
    if (ok) {
      x.sfx.right(); x.points(3); w.boxes += 1;
      w.floats.push({ x: s.x + s.w / 2, y: s.y - 30, text: '+3', life: 0, color: '#fdfd94' });
      w.popups.push({ x: s.x + s.w / 2, y: s.y, vy: -380, life: 0 });
      const p = await c.current.power(1);
      if (w !== world.current) return;
      if (p) apply(p);
      else { for (let i = 0; i < 6; i++) w.lv.coins.push({ x: s.x + s.w / 2 - 50 + i * 20, y: s.y - 40 - (i % 2) * 20, got: false }); x.say('Coin shower!'); }
    } else { x.sfx.wrong(); w.floats.push({ x: s.x + s.w / 2, y: s.y - 20, text: 'Next time!', life: 0, color: '#ffd2c2' }); }
    w.asking = false; paused.current = false;
    keys.current.jump = false; keys.current.l = false; keys.current.r = false;
  }

  function got(w: World, coin: { x: number; y: number; got: boolean }) {
    const x = c.current;
    coin.got = true;
    const v = w.fx.double > 0 ? 2 : 1;
    w.coins += v; x.points(v);
    x.sfx.coin();
    puff(w, coin.x, coin.y, 6, '#fdfd94', 'star', 140);
    w.floats.push({ x: coin.x, y: coin.y - 10, text: `+${v}`, life: 0, color: '#fdfd94' });
  }

  function update(w: World, dt: number) {
    const x = c.current;
    w.t += dt;
    if (w.flag > 0) {
      w.flag += dt;
      if (w.flag > 2.2 && x.timeScale === 0) { w.flag = 0; finishRun(w); return; }
      if (w.flag > 2.2) { const lv = makeLevel(); w.lv = lv; w.b = newBody(lv); w.cam = 0; w.flag = 0; w.lastSafe = lv.spawn.x; x.sfx.whoosh(); }
      for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
      w.parts = w.parts.filter((p) => p.life < p.max);
      return;
    }
    if (x.timeScale > 0) w.left -= dt;
    for (const k of Object.keys(w.fx) as Fx[]) if (w.fx[k] > 0) { w.fx[k] -= dt; if (w.fx[k] <= 0) { w.fx[k] = 0; held(w); } }
    w.blink = Math.max(0, w.blink - dt);
    const b = w.b;
    const tiny = w.fx.tiny > 0;
    const wantH = tiny ? 22 : 36, wantW = tiny ? 18 : 30;
    if (b.h !== wantH) { b.y += b.h - wantH; b.x += (b.w - wantW) / 2; b.h = wantH; b.w = wantW; }

    let input: Input;
    if (x.cpu) {
      input = cpuInput(b, w.lv);
      // A computer run with no clock still ends: after a minute it is done.
      w.cpuTime += dt;
      if (x.timeScale === 0 && w.cpuTime > 60) { finishRun(w); return; }
      // Stuck at a wall? Back up a step and jump.
      if (Math.abs(b.vx) < 5 && b.onGround && w.cpuTime > 1) { w.stuck += dt; if (w.stuck > 0.6) { input = { dir: -1, jump: true, jumpPressed: true }; w.stuck = 0; } } else w.stuck = 0;
    }
    else input = { dir: (keys.current.r ? 1 : 0) - (keys.current.l ? 1 : 0), jump: keys.current.jump, jumpPressed: keys.current.pressed };
    keys.current.pressed = false;
    if (input.dir) w.face = input.dir;
    const was = b.onGround, vyBefore = b.vy;
    const head = step(b, input, w.lv.solids, dt, tune(w));
    if (b.x < 0) { b.x = 0; b.vx = 0; }
    if (!was && b.onGround) { w.squash = Math.min(1, vyBefore / 900); if (vyBefore > 300) { puff(w, b.x + b.w / 2, b.y + b.h, 6, '#fff', 'puff', 90); x.sfx.thud(); } if (w.fx.bouncy > 0) x.sfx.boing(); }
    if (was && !b.onGround && b.vy < 0) { x.sfx.jump(); w.squash = -0.6; if (tiny) x.sfx.blip(19); }
    w.squash *= Math.pow(0.0005, dt);
    if (b.onGround && Math.abs(b.vx) > 20) { w.walk += dt * Math.abs(b.vx) / 30; if (Math.random() < dt * 8 && !x.still) puff(w, b.x + b.w / 2, b.y + b.h, 1, '#fbfcf8', 'puff', 30); }
    if (b.onGround) { const under = w.lv.solids.find((s) => s.kind === 'ground' && b.x + b.w / 2 > s.x + 20 && b.x + b.w / 2 < s.x + s.w - 20 && Math.abs(s.y - (b.y + b.h)) < 2); if (under) w.lastSafe = b.x; }
    if (w.fx.jetpack > 0 && input.jump && !b.onGround && Math.random() < dt * 30) puff(w, b.x + (w.face > 0 ? 2 : b.w - 2), b.y + b.h - 6, 1, '#fdfd94', 'dot', 60);
    if (w.fx.star > 0 && Math.random() < dt * 30) puff(w, b.x + b.w / 2, b.y + b.h / 2, 1, ['#ef7d96', '#fdfd94', '#8fe3a0', '#7fd6e3'][Math.floor(Math.random() * 4)], 'star', 40);

    // Bumped a box from below.
    if (head) {
      head.bump = 1;
      if (head.kind === 'q') { void mystery(w, head); return; }
      x.sfx.bump();
    }
    for (const s of w.lv.solids) if (s.bump) s.bump = Math.max(0, s.bump - dt * 5);

    // Fell in a gap: a whoops, back to the last safe spot.
    if (b.y > VH - 30) {
      x.sfx.splash(); x.say('Splash!', 'oops');
      puff(w, b.x + b.w / 2, VH - 40, 14, '#fbfcf8', 'dot', 220);
      b.x = w.lastSafe; b.y = GROUND - 120; b.vx = 0; b.vy = 0; w.blink = 1.4;
    }

    // Coins (the magnet pulls them in).
    for (const coin of w.lv.coins) {
      if (coin.got) continue;
      const dx = b.x + b.w / 2 - coin.x, dy = b.y + b.h / 2 - coin.y, d = Math.hypot(dx, dy);
      if (w.fx.magnet > 0 && d < 260) { coin.x += (dx / d) * 520 * dt; coin.y += (dy / d) * 520 * dt; }
      if (d < 26 + (tiny ? 0 : 6)) got(w, coin);
    }

    // Grumbles.
    const slow = w.fx.slow > 0 ? 0.35 : 1;
    for (const g of w.lv.grumbles) {
      if (!g.alive) { g.squash += dt; continue; }
      g.x += g.vx * slow * dt;
      if (g.x < g.min || g.x > g.max) { g.vx *= -1; g.x = Math.max(g.min, Math.min(g.max, g.x)); }
      const hit = grumbleTouch(b, g);
      if (!hit) continue;
      if (hit === 'stomp' || w.fx.star > 0) {
        g.alive = false; g.squash = 0;
        b.vy = hit === 'stomp' ? -520 : b.vy;
        x.points(2); x.sfx.pop(); window.setTimeout(() => c.current.sfx.boing(), 60);
        puff(w, g.x, g.y + 15, 12, '#fff', 'puff', 140);
        w.floats.push({ x: g.x, y: g.y - 10, text: '+2', life: 0, color: '#fff' });
      } else if (w.blink <= 0) {
        if (w.shield > 0) { w.shield = 0; held(w); x.sfx.boing(); puff(w, b.x + 15, b.y + 18, 14, '#7fd6e3', 'dot', 200); }
        else {
          x.sfx.bump(); x.say('Bonk!', 'oops');
          w.floats.push({ x: b.x + 15, y: b.y - 10, text: 'Bonk!', life: 0, color: '#ffd2c2' });
        }
        b.vx = (b.x + b.w / 2 < g.x ? -1 : 1) * 380; b.vy = -420; w.blink = 1.2;
      }
    }

    // The flag at the end.
    if (b.x + b.w > w.lv.flagX && w.flag === 0) {
      w.flag = 0.0001; w.levels += 1;
      // The gate bonus grows with every gift box answered right on the way.
      const bonus = 5 + 3 * w.boxes; w.boxes = 0;
      x.points(bonus); x.sfx.cheer(); x.say(`Balloon gate! +${bonus}`, 'big');
      x.burst(0.5, 0.4, 'big');
      puff(w, w.lv.flagX, GROUND - 160, 40, '#fdfd94', 'star', 300);
    }

    for (const p of w.popups) { p.life += dt; p.y += p.vy * dt; p.vy += 900 * dt; }
    w.popups = w.popups.filter((p) => p.life < 0.8);
    for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'puff' ? -40 : 400) * dt; }
    w.parts = w.parts.filter((p) => p.life < p.max);
    for (const f of w.floats) { f.life += dt; f.y -= 50 * dt; }
    w.floats = w.floats.filter((f) => f.life < 1);

    if (x.timeScale > 0 && w.left <= 0 && !w.over) finishRun(w);
  }

  function finishRun(w: World) {
    const x = c.current;
    if (!w.over) {
      w.over = true;
      setPhase('over');
      x.sfx.whistle(); x.say(x.timeScale === 0 ? `Level done! ${w.coins} coins` : `Time! ${w.coins} coins`, "big");
      x.setHeld(x.player.id, []);
      window.setTimeout(() => { if (world.current === w) c.current.next(); }, 2400);
    }
  }

  // ---- Drawing (Classic: a sunny meadow world) ----
  function draw(g: CanvasRenderingContext2D, w: World) {
    const still = c.current.still;
    const b = w.b;
    const target = Math.max(0, Math.min(w.lv.width - VW, b.x - VW * 0.36));
    w.cam += (target - w.cam) * 0.12;
    const cam = w.cam;
    const sky = g.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, '#9fb2fa'); sky.addColorStop(1, '#e9eefe');
    g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
    // Sun.
    g.fillStyle = '#fdfd94'; g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.arc(680, 70, 34, 0, Math.PI * 2); g.fill(); g.stroke();
    // Clouds drift slowly.
    for (const cl of clouds) {
      const cx = ((cl.x - cam * 0.15 + (still ? 0 : w.t * 8)) % (VW + 300) + VW + 300) % (VW + 300) - 150;
      cloud(g, cx, cl.y, cl.s);
    }
    // Far hills and near hills (parallax).
    hills(g, cam * 0.25, 300, 70, '#8f9ff0', 0.004);
    hills(g, cam * 0.5, 335, 55, '#6cc884', 0.007);

    // Water down in the gaps (fall in: splash, back to safety).
    g.fillStyle = '#7fd6e3'; g.fillRect(0, VH - 46, VW, 46);
    g.strokeStyle = '#fbfcf8'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= VW; x += 8) g.lineTo(x, VH - 46 + Math.sin((x + cam * 0.9) * 0.05 + (still ? 0 : w.t * 3)) * 4);
    g.stroke();
    g.save(); g.translate(-Math.round(cam), 0);
    // The balloon gate at the end: two balloon towers and a ribbon that snaps.
    const fx = w.lv.flagX;
    const cols = ['#ef7d96', '#fdfd94', '#8fe3a0', '#7fd6e3', '#f5a08c', '#c58ce8'];
    for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
      const bx = fx + side * 54 + (still ? 0 : Math.sin(w.t * 2 + k + side) * 2), by = GROUND - 22 - k * 34;
      g.fillStyle = cols[(k + (side > 0 ? 3 : 0)) % 6]; g.strokeStyle = '#000'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(bx, by, 17, 19, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(bx - 6, by - 7, 4, 6, -0.4, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#000'; g.lineWidth = 3; g.fillStyle = '#fdfd94';
    g.beginPath(); g.roundRect(fx - 58, GROUND - 236, 116, 30, 14); g.fill(); g.stroke();
    star(g, fx, GROUND - 221, 11, '#ef7d96');
    if (w.flag === 0) { g.strokeStyle = '#ef7d96'; g.lineWidth = 7; g.beginPath(); g.moveTo(fx - 40, GROUND - 70); g.quadraticCurveTo(fx, GROUND - 60 + (still ? 0 : Math.sin(w.t * 3) * 3), fx + 40, GROUND - 70); g.stroke(); }
    else { const k = Math.min(1, w.flag * 2); g.strokeStyle = '#ef7d96'; g.lineWidth = 7; g.beginPath(); g.moveTo(fx - 40, GROUND - 70); g.lineTo(fx - 40 + 6, GROUND - 70 + 50 * k); g.moveTo(fx + 40, GROUND - 70); g.lineTo(fx + 40 - 6, GROUND - 70 + 50 * k); g.stroke(); }
    // Solids.
    for (const s of w.lv.solids) {
      if (s.x > cam + VW + 50 || s.x + s.w < cam - 50) continue;
      const by = s.y - (s.bump ?? 0) * 14 * Math.sin((s.bump ?? 0) * Math.PI);
      if (s.kind === 'ground') groundTile(g, s, w.lv.solids);
      else if (s.kind === 'cloud') cloud(g, s.x + s.w / 2, by + 14, 0.9, true);
      else boxTile(g, s.x, by, s.w, s.kind, w.t, still);
    }
    // Power-up popping out of a box.
    for (const p of w.popups) { star(g, p.x, p.y - 20, 16 + p.life * 8, '#fdfd94'); }
    // Coins.
    for (const coin of w.lv.coins) {
      if (coin.got || coin.x < cam - 40 || coin.x > cam + VW + 40) continue;
      const f = still ? 0 : Math.floor(w.t * 12 + coin.x * 0.05) % 8;
      const bob = still ? 0 : Math.sin(w.t * 4 + coin.x) * 3;
      if (coinSheet?.complete && coinSheet.naturalWidth) g.drawImage(coinSheet, f * 64, 0, 64, 64, coin.x - 14, coin.y - 14 + bob, 28, 28);
      else { g.fillStyle = '#f6c544'; g.beginPath(); g.arc(coin.x, coin.y + bob, 12, 0, Math.PI * 2); g.fill(); }
    }
    // Grumbles.
    for (const gr of w.lv.grumbles) {
      if (!gr.alive && gr.squash > 0.5) continue;
      grumble(g, gr.x, gr.y, gr.alive ? 0 : gr.squash, w.t, gr.vx, still);
    }
    // The runner.
    g.globalAlpha = w.blink > 0 ? 0.55 : 1;
    hero(g, w, c.current.player.colorIndex, still);
    g.globalAlpha = 1;
    // Particles and floating points.
    for (const p of w.parts) {
      const a = Math.max(0, 1 - p.life / p.max);
      g.globalAlpha = a;
      if (p.kind === 'star') star(g, p.x, p.y, p.r + 2, p.color);
      else { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.kind === 'puff' ? p.r * (0.6 + p.life) : p.r, 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
    g.font = 'bold 24px "Inclusive Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of w.floats) { g.globalAlpha = Math.max(0, 1 - f.life); g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.color; g.fillText(f.text, f.x, f.y); }
    g.globalAlpha = 1;
    g.restore();

    // HUD: coins and the time bar, plus the trip to the flag.
    g.fillStyle = 'rgba(36,28,61,0.85)'; rr(g, 12, 12, 150, 44, 14); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
    if (coinSheet?.complete && coinSheet.naturalWidth) g.drawImage(coinSheet, 0, 0, 64, 64, 20, 18, 32, 32);
    g.fillStyle = '#fdfd94'; g.font = 'bold 26px "Inclusive Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.fillText(`${w.coins}`, 62, 35);
    const total = phaseRef.current === 'ready' || c.current.timeScale === 0 ? 1 : Math.max(0, w.left) / (RUN_LONG * (c.current.timeScale || 1));
    if (c.current.timeScale > 0) {
      g.fillStyle = 'rgba(36,28,61,0.85)'; rr(g, VW - 232, 16, 220, 20, 10); g.fill(); g.stroke();
      g.fillStyle = w.left < 8 && phaseRef.current === 'run' ? '#ef7d96' : '#8fe3a0'; rr(g, VW - 228, 20, Math.max(0, 212 * Math.min(1, total)), 12, 6); g.fill();
    }
    const trip = Math.min(1, b.x / w.lv.flagX);
    g.fillStyle = 'rgba(36,28,61,0.5)'; rr(g, VW / 2 - 120, 22, 240, 8, 4); g.fill();
    g.fillStyle = '#fbfcf8'; g.beginPath(); g.arc(VW / 2 - 120 + 240 * trip, 26, 8, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#ef7d96'; g.beginPath(); g.ellipse(VW / 2 + 128, 22, 8, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (w.fx.slow > 0) { g.fillStyle = 'rgba(127,214,227,0.12)'; g.fillRect(0, 0, VW, VH); }
  }

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const g = cv.getContext('2d'); if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const w = world.current;
      if (phaseRef.current === 'run' && !paused.current && !w.over) update(w, dt);
      else w.t += phaseRef.current === 'ready' && !c.current.still ? dt : 0;
      draw(g, w);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const k = (e: KeyboardEvent, on: boolean) => {
      if ((e.target as HTMLElement)?.closest?.('[role="dialog"]') || c.current.cpu) return;
      const key = e.key;
      if (on && phaseRef.current === 'ready' && (key === ' ' || key === 'Enter')) { e.preventDefault(); void start(); return; }
      if (phaseRef.current !== 'run' || paused.current) return;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') { keys.current.l = on; e.preventDefault(); }
      if (key === 'ArrowRight' || key === 'd' || key === 'D') { keys.current.r = on; e.preventDefault(); }
      if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') { e.preventDefault(); if (on && !e.repeat) keys.current.pressed = true; keys.current.jump = on; }
    };
    const down = (e: KeyboardEvent) => k(e, true), up = (e: KeyboardEvent) => k(e, false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = (on: boolean) => { if (on) keys.current.pressed = true; keys.current.jump = on; };
  const live = phase === 'run' && !ctx.cpu;
  return (
    <div className="absolute inset-0 flex flex-col gap-2">
      <div className="flex-1 min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
        <div className="lab-fit relative rounded-[1.2rem] border-heavy border-border overflow-hidden" style={{ '--ar': VW / VH, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' } as CSSProperties}>
          <canvas ref={canvas} width={VW * 2} height={VH * 2} className="block w-full h-full touch-none" aria-label="Jump Quest level"
            onPointerDown={() => { if (live) jump(true); }} onPointerUp={() => jump(false)} onPointerLeave={() => jump(false)} />
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div className="absolute inset-0 grid place-items-center bg-[rgba(36,28,61,0.25)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.button type="button" onClick={() => void start()} disabled={ctx.cpu || busy} aria-label={ctx.cpu ? 'The computer is getting ready' : 'Start the run'}
                  className="grid justify-items-center gap-2 rounded-panel border-heavy border-border bg-surface px-8 py-5 motion-safe:hover:scale-105 motion-safe:transition-transform"
                  style={{ boxShadow: '0 8px 0 #000' }} initial={ctx.still ? false : { scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                  <motion.span animate={ctx.still ? undefined : { y: [0, -14, 0] }} transition={{ duration: 0.8, repeat: Infinity }}><TeamBadge colorIndex={ctx.player.colorIndex} size={84} /></motion.span>
                  <span className="font-display text-[clamp(1.6rem,4cqw,2.6rem)] leading-none inline-flex items-center gap-2"><PersonSimpleRun weight="fill" />Run!</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-center gap-3">
        <Pad label="Run left" disabled={!live} onHold={(on) => { keys.current.l = on; }} bg="#b4c4fb" wide><CaretLeft weight="bold" size={26} /><span className="font-display text-2xl">Left</span></Pad>
        <Pad label="Run right" disabled={!live} onHold={(on) => { keys.current.r = on; }} bg="#b4c4fb" wide><span className="font-display text-2xl">Right</span><CaretRight weight="bold" size={26} /></Pad>
        <Pad label="Jump" disabled={!live} onHold={jump} bg="#fdfd94" wide><ArrowFatUp weight="fill" size={28} /><span className="font-display text-2xl">Jump</span></Pad>
      </div>
    </div>
  );
}

function Pad({ label, disabled, onHold, children, bg, wide }: { label: string; disabled: boolean; onHold: (on: boolean) => void; children: ReactNode; bg: string; wide?: boolean }) {
  return (
    <button type="button" aria-label={label} disabled={disabled}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onHold(true); }} onPointerUp={() => onHold(false)} onPointerCancel={() => onHold(false)} onLostPointerCapture={() => onHold(false)}
      className={`min-h-14 ${wide ? 'min-w-[8rem] px-4 gap-2' : 'min-w-[5.5rem]'} rounded-panel border-heavy border-border inline-flex items-center justify-center touch-none select-none motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-50`}
      style={{ boxShadow: '0 5px 0 #000', background: bg }}>
      {children}
    </button>
  );
}

// ---- Classic pieces, each a small drawing ----
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
}
function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, solid = false) {
  const puffs: [number, number, number][] = [[-30, 2, 17], [-10, -10, 22], [16, -6, 20], [34, 4, 14], [0, 6, 18]];
  g.fillStyle = solid ? '#000' : 'rgba(36,28,61,0.22)';
  for (const [dx, dy, r] of puffs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, (r + (solid ? 3 : 2)) * s, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fff';
  for (const [dx, dy, r] of puffs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#e9eefe'; g.beginPath(); g.ellipse(x + 2 * s, y + 14 * s, 30 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
}
function hills(g: CanvasRenderingContext2D, off: number, base: number, amp: number, color: string, f: number) {
  g.fillStyle = color; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, VH);
  for (let x = 0; x <= VW; x += 10) g.lineTo(x, base - Math.abs(Math.sin((x + off) * f)) * amp - Math.sin((x + off) * f * 2.3) * 10);
  g.lineTo(VW, VH); g.closePath(); g.fill(); g.stroke();
}
function groundTile(g: CanvasRenderingContext2D, s: Solid, all: Solid[]) {
  const joinL = all.some((o) => o.kind === 'ground' && o !== s && Math.abs(o.x + o.w - s.x) < 1), joinR = all.some((o) => o.kind === 'ground' && o !== s && Math.abs(s.x + s.w - o.x) < 1);
  g.fillStyle = '#e8b08f'; g.fillRect(s.x, s.y, s.w, s.h);
  g.fillStyle = '#d4906d';
  for (let x = s.x + 14; x < s.x + s.w - 6; x += 36) for (let y = s.y + 34; y < VH; y += 30) { g.beginPath(); g.ellipse(x + ((y * 7) % 13), y, 5, 3, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#8fe3a0'; g.beginPath(); g.roundRect(s.x - (joinL ? 0 : 2), s.y - 4, s.w + (joinL ? 0 : 2) + (joinR ? 0 : 2), 18, [joinL ? 0 : 8, joinR ? 0 : 8, joinR ? 0 : 8, joinL ? 0 : 8]); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#6cc884'; for (let x = s.x + 8; x < s.x + s.w - 8; x += 22) { g.beginPath(); g.moveTo(x, s.y + 14); g.lineTo(x + 5, s.y + 6); g.lineTo(x + 10, s.y + 14); g.fill(); }
  g.strokeStyle = '#000'; g.beginPath(); if (!joinL) { g.moveTo(s.x, s.y + 14); g.lineTo(s.x, VH + 10); } if (!joinR) { g.moveTo(s.x + s.w, s.y + 14); g.lineTo(s.x + s.w, VH + 10); } g.stroke();
}
function boxTile(g: CanvasRenderingContext2D, x: number, y: number, w: number, kind: string, t: number, still: boolean) {
  for (let i = 0; i < w; i += T) {
    const bx = x + i;
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.roundRect(bx + 3, y + 5, T - 2, T - 2, 8); g.fill();
    g.fillStyle = kind === 'q' ? '#fdfd94' : kind === 'used' ? '#d9d4e6' : '#fbfcf8';
    g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(bx + 1, y + 1, T - 2, T - 2, 8); g.fill(); g.stroke();
    if (kind === 'q') {
      // A gift box: a ribbon cross, a bow on top and a star on the front.
      g.fillStyle = '#ef7d96'; g.fillRect(bx + T / 2 - 4, y + 2, 8, T - 4); g.fillRect(bx + 2, y + T / 2 - 4, T - 4, 8);
      const s = still ? 1 : 1 + Math.sin(t * 2.5 + bx) * 0.06;
      g.save(); g.translate(bx + T / 2, y); g.scale(s, s);
      g.fillStyle = '#ef7d96'; g.strokeStyle = '#000'; g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(-8, -4, 8, 5, -0.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(8, -4, 8, 5, 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.restore();
      star(g, bx + T / 2, y + T / 2, 9, '#fbfcf8');
    } else if (kind === 'used') {
      g.strokeStyle = '#9d95b5'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + 8, y + 12); g.lineTo(bx + T - 8, y + 12); g.stroke();
    } else {
      g.strokeStyle = '#b4c4fb'; g.lineWidth = 3; g.beginPath(); g.roundRect(bx + 8, y + 8, T - 16, T - 16, 4); g.stroke();
    }
  }
}
function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  g.closePath(); g.fill(); g.stroke();
}
function grumble(g: CanvasRenderingContext2D, x: number, y: number, squash: number, t: number, vx: number, still: boolean) {
  const sq = squash > 0 ? Math.max(0.2, 1 - squash * 3) : 1;
  g.save(); g.translate(x, y + 30); g.scale(1 + (1 - sq) * 0.6, sq);
  const step = still ? 0 : Math.sin(t * 12 + x) * 3;
  g.fillStyle = '#241c3d'; g.fillRect(-12, -6 + step, 9, 6); g.fillRect(4, -6 - step, 9, 6);
  g.fillStyle = '#7c6bd6'; g.strokeStyle = '#000'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, -16, 19, 16, 0, Math.PI, 0); g.lineTo(19, -6); g.lineTo(-19, -6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#b4c4fb'; g.beginPath(); g.ellipse(-6, -24, 6, 3, -0.4, 0, Math.PI * 2); g.fill();
  const look = vx > 0 ? 3 : -3;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-6 + look, -14, 5, 0, Math.PI * 2); g.arc(7 + look, -14, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(-5 + look * 1.3, -13, 2.4, 0, Math.PI * 2); g.arc(8 + look * 1.3, -13, 2.4, 0, Math.PI * 2); g.fill();
  g.lineWidth = 3; g.beginPath(); g.moveTo(-11 + look, -22); g.lineTo(-2 + look, -18); g.moveTo(12 + look, -22); g.lineTo(3 + look, -18); g.stroke();
  g.restore();
}
function hero(g: CanvasRenderingContext2D, w: World, colorIndex: number, still: boolean) {
  const b = w.b;
  const color = TEAM_COLORS[colorIndex % TEAM_COLORS.length];
  const s = w.squash; // + landed (wide), - jumping (tall)
  const sx = 1 + s * 0.35, sy = 1 - s * 0.3;
  const scale = b.h / 36;
  g.save();
  g.translate(b.x + b.w / 2, b.y + b.h);
  g.scale(sx * scale * w.face, sy * scale);
  if (w.fx.star > 0 && !still) { g.shadowColor = '#fdfd94'; g.shadowBlur = 18; }
  // Jetpack.
  if (w.fx.jetpack > 0) { g.fillStyle = '#ef7d96'; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(-22, -32, 10, 22, 4); g.fill(); g.stroke(); }
  // Feet.
  const st = b.onGround && !still ? Math.sin(w.walk * 1.4) * 5 : 3;
  g.fillStyle = '#241c3d';
  g.beginPath(); g.ellipse(-6 + st, -2, 7, 4, 0, 0, Math.PI * 2); g.ellipse(7 - st, -2, 7, 4, 0, 0, Math.PI * 2); g.fill();
  if (w.fx.spring > 0 || w.fx.bouncy > 0) { g.strokeStyle = w.fx.bouncy > 0 ? '#ef7d96' : '#241c3d'; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(-8, -1 + i * 2); g.lineTo(8, 1 + i * 2); } g.stroke(); }
  // Body.
  g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, -19, 15, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(2, -13, 8, 7, 0, 0, Math.PI * 2); g.fill();
  // Scarf, flowing behind.
  const flow = still ? 0 : Math.sin(w.t * 14) * 3 - Math.min(10, Math.abs(b.vx) / 30);
  g.fillStyle = '#ef7d96'; g.beginPath(); g.moveTo(-12, -24); g.quadraticCurveTo(-24, -26 + flow, -30, -20 + flow); g.lineTo(-26, -16 + flow); g.quadraticCurveTo(-18, -20, -10, -19); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(-13, -27, 26, 7, 3); g.fill(); g.stroke();
  // Eyes (they look where you go, wide when falling).
  const wide = b.vy > 200 ? 1.3 : 1;
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(4, -33 + 6, 4.5, 5.5 * wide, 0, 0, Math.PI * 2); g.ellipse(11, -33 + 6, 4, 5 * wide, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 2; g.stroke();
  g.fillStyle = '#000'; g.beginPath(); g.arc(6, -27, 2.2, 0, Math.PI * 2); g.arc(12, -27, 2, 0, Math.PI * 2); g.fill();
  g.shadowBlur = 0;
  g.restore();
  // Bubble shield.
  if (w.shield > 0) {
    g.strokeStyle = 'rgba(127,214,227,0.9)'; g.lineWidth = 4; g.fillStyle = 'rgba(127,214,227,0.18)';
    g.beginPath(); g.arc(b.x + b.w / 2, b.y + b.h / 2, 30 + (still ? 0 : Math.sin(w.t * 5) * 2), 0, Math.PI * 2); g.fill(); g.stroke();
  }
  // Magnet waves.
  if (w.fx.magnet > 0 && !still) {
    g.strokeStyle = 'rgba(239,125,150,0.6)'; g.lineWidth = 3;
    const r = 30 + ((w.t * 80) % 50);
    g.beginPath(); g.arc(b.x + b.w / 2, b.y + b.h / 2, r, 0, Math.PI * 2); g.stroke();
  }
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#9fb2fa, #e9eefe)' }}>
      <circle cx="86" cy="11" r="5" fill="#fdfd94" stroke="#000" strokeWidth="0.6" />
      <path d="M0 42 Q15 30 30 40 T60 38 T100 36 V62 H0z" fill="#8f9ff0" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
      <path d="M0 46 Q20 38 40 45 T80 43 T100 44 V62 H0z" fill="#6cc884" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
      <rect x="-1" y="49" width="40" height="14" fill="#e8b08f" stroke="#000" strokeWidth="0.6" /><rect x="-1" y="48" width="40" height="3.4" rx="1.5" fill="#8fe3a0" stroke="#000" strokeWidth="0.6" />
      <rect x="50" y="49" width="51" height="14" fill="#e8b08f" stroke="#000" strokeWidth="0.6" /><rect x="50" y="48" width="51" height="3.4" rx="1.5" fill="#8fe3a0" stroke="#000" strokeWidth="0.6" />
      {[0, 1, 2].map((i) => <rect key={i} x={22 + i * 6} y="26" width="6" height="6" rx="1.4" fill={i === 1 ? '#fdfd94' : '#fbfcf8'} stroke="#000" strokeWidth="0.6" />)}
      <rect x="30.2" y="26" width="1.6" height="6" fill="#ef7d96" /><rect x="28" y="28.2" width="6" height="1.6" fill="#ef7d96" /><ellipse cx="29.6" cy="25.6" rx="1.6" ry="1" fill="#ef7d96" stroke="#000" strokeWidth="0.3" /><ellipse cx="32.4" cy="25.6" rx="1.6" ry="1" fill="#ef7d96" stroke="#000" strokeWidth="0.3" />
      {[[42, 30], [46, 27], [50, 26], [54, 27]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#f6c544" stroke="#000" strokeWidth="0.4" />)}
      <g transform="translate(38 36) rotate(-8)">
        <ellipse cx="0" cy="0" rx="4.4" ry="4.6" fill="#f6c544" stroke="#000" strokeWidth="0.6" />
        <path d="M-3.5 -1.6 q-4 -1 -6 1.6 l1.4 1 q2 -1.4 4.6 -1z" fill="#ef7d96" stroke="#000" strokeWidth="0.4" />
        <ellipse cx="1.6" cy="-1.8" rx="1.1" ry="1.4" fill="#fff" stroke="#000" strokeWidth="0.3" /><ellipse cx="3.4" cy="-1.8" rx="1" ry="1.3" fill="#fff" stroke="#000" strokeWidth="0.3" />
      </g>
      <g transform="translate(70 44)"><path d="M-5 0 a5 4.5 0 0 1 10 0z" fill="#7c6bd6" stroke="#000" strokeWidth="0.6" /><circle cx="-1.6" cy="-1.6" r="1" fill="#fff" /><circle cx="1.8" cy="-1.6" r="1" fill="#fff" /></g>
<ellipse cx="82" cy="46" rx="2.4" ry="2.7" fill="#ef7d96" stroke="#000" strokeWidth="0.4" /><ellipse cx="82" cy="41" rx="2.4" ry="2.7" fill="#fdfd94" stroke="#000" strokeWidth="0.4" /><ellipse cx="82" cy="36" rx="2.4" ry="2.7" fill="#8fe3a0" stroke="#000" strokeWidth="0.4" /><ellipse cx="82" cy="31" rx="2.4" ry="2.7" fill="#7fd6e3" stroke="#000" strokeWidth="0.4" /><ellipse cx="82" cy="26" rx="2.4" ry="2.7" fill="#f5a08c" stroke="#000" strokeWidth="0.4" /><ellipse cx="82" cy="21" rx="2.4" ry="2.7" fill="#c58ce8" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="46" rx="2.4" ry="2.7" fill="#fdfd94" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="41" rx="2.4" ry="2.7" fill="#8fe3a0" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="36" rx="2.4" ry="2.7" fill="#7fd6e3" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="31" rx="2.4" ry="2.7" fill="#f5a08c" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="26" rx="2.4" ry="2.7" fill="#c58ce8" stroke="#000" strokeWidth="0.4" /><ellipse cx="94" cy="21" rx="2.4" ry="2.7" fill="#ef7d96" stroke="#000" strokeWidth="0.4" />
      <rect x="80" y="17" width="16" height="4" rx="2" fill="#fdfd94" stroke="#000" strokeWidth="0.4" />
    </svg>
  );
}

const def: LabDef = {
  id: 'jump-quest',
  name: 'Jump Quest',
  description: 'Run and jump across the land. Grab coins, bump gift boxes for power-ups, and reach the balloon gate!',
  ways: ['solo', 'teams'],
  how: [
    { icon: <PersonSimpleRun weight="fill" />, text: 'Answer right for a long run' },
    { icon: <Coins weight="fill" />, text: 'Jump for coins' },
    { icon: <Gift weight="fill" />, text: 'Bump a gift box: answer for a power-up' },
    { icon: <Balloon weight="fill" />, text: 'Reach the balloon gate' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Sky and hills', hint: 'Behind the level' },
    { id: 'ground', label: 'Ground', hint: 'The grassy ground' },
    { id: 'block', label: 'Block', hint: 'A plain block to stand on' },
    { id: 'gift', label: 'Gift box', hint: 'Bump it for a question and a power-up' },
    { id: 'cloud', label: 'Cloud', hint: 'A cloud you can stand on' },
    { id: 'coin', label: 'Coin', hint: 'What you collect' },
    { id: 'grumble', label: 'Grumble', hint: 'The grumpy walker you can stomp' },
    { id: 'hero', label: 'Runner', hint: 'The player (wears the team color)' },
    { id: 'gate', label: 'Balloon gate', hint: 'The end of the level' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
