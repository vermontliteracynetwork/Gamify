import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretLeft, CaretRight, Crosshair, Rocket, SpeakerHigh, Trophy } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import { speakQuestion } from '../../../engine/feedback';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { cpuTarget, H, hits, LANDED_Y, rightPoints, SHIP_Y, shuffleSlots, slotX, sweep, W, wrap } from './rules';

// Pixel Blaster (Game Lab, classic arcade): a vintage 8-bit shooter. Goofy
// pixel aliens carry the answers and creep down the screen; the question
// shows on top. Slide the ship and blast the alien with the right answer.
// Each team flies a short burst on its turn; the computer flies its own.

const BURST = 40; // seconds a turn lasts
const P = 5; // one art pixel

// ---- Pixel art (Classic theme; each piece is its own small sprite) ----
type Sprite = { rows: string[]; eyes: [number, number][] };
const ALIENS: Sprite[] = [
  { rows: ['...K....K...', '....K..K....', '...XXXXXX...', '..XXXXXXXX..', '.XWWXXXXWWX.', '.XWWXXXXWWX.', '.XXXXXXXXXX.', '.XXXKKKKXXX.', '..XXXPPXXX..', '..X.X..X.X..'], eyes: [[2, 4], [8, 4]] },
  { rows: ['....XXXX....', '..XXXXXXXX..', '.XXXWWWWXXX.', 'XXXXWWWWXXXX', 'XXXXWWWWXXXX', 'XXXXXXXXXXXX', '.XXKKKKKKXX.', '.XXXKPPKXXX.', 'X.X.X..X.X.X', '.X..X..X..X.'], eyes: [[5, 2]] },
  { rows: ['.K........K.', '.XK......KX.', '..XXXXXXXX..', '.XXXXXXXXXX.', 'XWWXXXXXXWWX', 'XWWXXXXXXWWX', 'XXXXXXXXXXXX', 'XXXKKKKKKXXX', '.XXXPPPPXXX.', '..XX....XX..'], eyes: [[1, 4], [9, 4]] },
];
const BUDDY = ['..XXXX..', '.XXXXXX.', 'XWWXXWWX', 'XWKXXWKX', 'XXXXXXXX', '.XKKKKX.', '.X.XX.X.', 'X..XX..X'];
const SHIP = ['......W......', '.....WCW.....', '....WCCCW....', '...XXWWWXX...', '..XXXXXXXXX..', '.XXDXXXXXDXX.', 'XXDDXXXXXDDXX', 'XX..YY.YY..XX'];
const UFO = ['....WWWW....', '..WCCCCCCW..', '.XXXXXXXXXX.', 'XYXXYXXYXXYX', '.XXXXXXXXXX.', '...X....X...'];
const BODY = [['#8fe3a0', '#4fb36a'], ['#ef7d96', '#c4506c'], ['#fdfd94', '#d8c94e'], ['#b4c4fb', '#7488e0'], ['#f5a08c', '#cf6f58'], ['#7fd6e3', '#3fa6b8']];

function drawSprite(g: CanvasRenderingContext2D, rows: string[], x: number, y: number, p: number, pal: Record<string, string>, outline = true) {
  if (outline) {
    g.fillStyle = '#000';
    for (let r = 0; r < rows.length; r++) for (let k = 0; k < rows[r].length; k++) if (rows[r][k] !== '.') g.fillRect(x + k * p - 2, y + r * p - 2, p + 4, p + 4);
  }
  for (let r = 0; r < rows.length; r++) for (let k = 0; k < rows[r].length; k++) {
    const ch = rows[r][k];
    if (ch === '.') continue;
    g.fillStyle = pal[ch] ?? '#fff';
    g.fillRect(x + k * p, y + r * p, p, p);
  }
}

// Power-up pictures: chunky pixel icons drawn as SVG squares.
function PixelIcon({ rows, pal, bg }: { rows: string[]; pal: Record<string, string>; bg: string }) {
  const n = rows.length, m = rows[0].length, s = 70 / Math.max(n, m), ox = 15 + (70 - m * s) / 2, oy = 15 + (70 - n * s) / 2;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="5" y="5" width="90" height="90" rx="10" fill={bg} stroke="#000" strokeWidth="5" />
      {rows.flatMap((row, r) => [...row].map((ch, k) => (ch === '.' ? null : <rect key={`${r}-${k}`} x={ox + k * s} y={oy + r * s} width={s + 0.4} height={s + 0.4} fill={pal[ch] ?? '#000'} />)))}
    </svg>
  );
}
const K = '#000', Wh = '#fff';
const ICONS: Record<string, { rows: string[]; pal: Record<string, string>; bg: string }> = {
  triple: { rows: ['Y...Y...Y', 'Y...Y...Y', '.Y..Y..Y.', '.Y..Y..Y.', '..Y.Y.Y..', '...KKK...', '..KRRRK..', '.KRRRRRK.', 'KRR.R.RRK'], pal: { Y: '#fdfd94', K, R: '#ef7d96' }, bg: '#241c3d' },
  laser: { rows: ['..WYW..', '..WYW..', '..WYW..', '..WYW..', '..WYW..', '.KKKKK.', 'KRRRRRK', 'KR.R.RK'], pal: { W: Wh, Y: '#fdfd94', K, R: '#ef7d96' }, bg: '#3b2a7a' },
  shield: { rows: ['..CCCCC..', '.C.....C.', 'C...W...C', 'C..WRW..C', 'C.WRRRW.C', 'C.RRRRR.C', '.C.....C.', '..CCCCC..'], pal: { C: '#7fd6e3', W: Wh, R: '#ef7d96' }, bg: '#241c3d' },
  slow: { rows: ['..KKKKK..', '.KWWWWWK.', 'KWWWKWWWK', 'KWWWKWWWK', 'KWWWKKKWK', 'KWWWWWWWK', '.KWWWWWK.', '..KKKKK..'], pal: { K, W: '#b4c4fb' }, bg: '#7fd6e3' },
  saucer: { rows: UFO, pal: { W: Wh, C: '#7fd6e3', X: '#b4c4fb', Y: '#fdfd94' }, bg: '#241c3d' },
  time: { rows: ['..YYYYY..', '.Y..K..Y.', 'Y...K...Y', 'Y...KK..Y', 'Y.......Y', '.Y.....Y.', '..YYYYY..', '...Y.Y...'], pal: { Y: '#fdfd94', K: '#fff' }, bg: '#ef7d96' },
  rapid: { rows: ['Y.Y.Y.Y', 'Y.Y.Y.Y', 'Y.Y.Y.Y', '.......', '..KKK..', '.KRRRK.', 'KRRRRRK'], pal: { Y: '#fdfd94', K, R: '#8fe3a0' }, bg: '#241c3d' },
  disco: { rows: ['...K...', '..PYB..', '.YBPYB.', 'PYBPYBP', '.BPYBP.', '..YBP..', '...K...'], pal: { K, P: '#ef7d96', Y: '#fdfd94', B: '#7fd6e3' }, bg: '#3b2a7a' },
  wiggle: { rows: ['R.......R', '.R.....R.', '..WCCCW..', '.XXXXXXX.', 'XXDXXXDXX', '.R.....R.', 'R.......R'], pal: { R: '#fdfd94', W: Wh, C: '#7fd6e3', X: '#f5a08c', D: '#cf6f58' }, bg: '#8fe3a0' },
};

const POWERS: LabPower[] = [
  { id: 'triple', name: 'Triple Shot', desc: 'Three bolts fly out with every shot for a while.', enter: 'zoom', art: <PixelIcon {...ICONS.triple} /> },
  { id: 'laser', name: 'Mega Laser', desc: 'A giant laser finds the right alien for you.', enter: 'spin', art: <PixelIcon {...ICONS.laser} /> },
  { id: 'shield', name: 'Bubble Shield', desc: 'A bubble blocks the next three goo blobs.', enter: 'drop', art: <PixelIcon {...ICONS.shield} /> },
  { id: 'slow', name: 'Slow Time', desc: 'The aliens move in slow motion for a while.', enter: 'zoom', art: <PixelIcon {...ICONS.slow} /> },
  { id: 'saucer', name: 'Bonus Saucer', desc: 'A gold saucer zooms across the top. Blast it for 5 points.', enter: 'drop', art: <PixelIcon {...ICONS.saucer} /> },
  { id: 'time', name: 'Extra Time', desc: 'Ten more seconds on the clock.', enter: 'spin', art: <PixelIcon {...ICONS.time} /> },
  { id: 'rapid', name: 'Rapid Fire', desc: 'Shoot as fast as you can tap for a while.', enter: 'zoom', art: <PixelIcon {...ICONS.rapid} /> },
  { id: 'disco', name: 'Disco Aliens', desc: 'Whoops! The aliens dance and swap places.', silly: true, art: <PixelIcon {...ICONS.disco} /> },
  { id: 'wiggle', name: 'Wiggle Ship', desc: 'Whoops! Your ship gets the wiggles for a bit.', silly: true, art: <PixelIcon {...ICONS.wiggle} /> },
];

// ---- The world ----
interface Alien { k: number; slot: number; text: string; lines: string[]; right: boolean; x: number; alive: boolean; hurt: number; kind: number; color: number; enter: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; s: number }
interface Float { x: number; y: number; text: string; life: number; color: string }
interface World {
  t: number; left: number; score: number; combo: number;
  shipX: number; shipVX: number; stun: number; target: number | null; fireQueued: boolean; cool: number; flame: number;
  q: MultipleChoiceQuestion | null; missed: boolean; aliens: Alien[]; buddies: { x: number; y: number; alive: boolean; kind: number }[];
  fx: number; fy: number; dir: number; exit: number; waveIn: number; nextGoo: number;
  bolts: { x: number; y: number; vx: number }[]; goo: { x: number; y: number }[]; parts: Part[]; floats: Float[];
  saucer: { x: number; dir: number } | null; laser: { t: number; x: number } | null; laserPending: boolean; discoPending: boolean;
  fxT: Record<'triple' | 'rapid' | 'slow' | 'wiggle' | 'disco', number>; shield: number; shake: number; flash: number;
  cpuAim: number; cpuWait: number; over: boolean;
}
const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 1 + Math.floor(Math.random() * 3) }));

function newWorld(): World {
  return {
    t: 0, left: BURST, score: 0, combo: 0, shipX: W / 2, shipVX: 0, stun: 0, target: null, fireQueued: false, cool: 0, flame: 0,
    q: null, missed: false, aliens: [], buddies: [], fx: W / 2, fy: 130, dir: 1, exit: 0, waveIn: 0, nextGoo: 2.5,
    bolts: [], goo: [], parts: [], floats: [], saucer: null, laser: null, laserPending: false, discoPending: false,
    fxT: { triple: 0, rapid: 0, slow: 0, wiggle: 0, disco: 0 }, shield: 0, shake: 0, flash: 0, cpuAim: 0, cpuWait: 0.8, over: false,
  };
}

type Phase = 'ready' | 'play' | 'over';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newWorld());
  const paused = useRef(false);
  const keys = useRef({ l: false, r: false });
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready'); phaseRef.current = phase;
  const [q, setQ] = useState<MultipleChoiceQuestion | null>(null);
  const [left, setLeft] = useState(BURST);
  const [scoreNow, setScoreNow] = useState(0);

  // A new turn: the high-score screen, then PRESS START.
  useEffect(() => {
    world.current = newWorld();
    setPhase('ready'); setQ(null); setLeft(BURST); setScoreNow(0);
    c.current.setHeld(c.current.player.id, []);
    c.current.setStatus(null);
    if (!c.current.cpu) return;
    const id = window.setTimeout(() => start(), 2200);
    return () => window.clearTimeout(id);
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    if (phaseRef.current !== 'ready') return;
    const x = c.current;
    world.current = newWorld();
    newWave(world.current);
    x.sfx.slideUp();
    [0, 4, 7, 12].forEach((s, i) => window.setTimeout(() => c.current.sfx.blip(s), 120 + i * 90));
    x.say('Blast off!', 'big');
    setPhase('play');
  }

  function newWave(w: World) {
    const x = c.current;
    const qn = x.draw();
    const n = qn.choices.length;
    const shift = Math.floor(Math.random() * BODY.length);
    w.q = qn; w.missed = false; w.exit = 0; w.waveIn = 0;
    w.fx = W / 2; w.fy = 145; w.dir = Math.random() < 0.5 ? 1 : -1;
    w.aliens = qn.choices.map((t, k) => ({ k, slot: k, text: t, lines: wrap(t, n > 3 ? 11 : 14).slice(0, 3), right: k === qn.correctIndex, x: slotX(k, n, W / 2), alive: true, hurt: 0, kind: (k + shift) % ALIENS.length, color: (k + shift) % BODY.length, enter: -k * 0.12 }));
    w.buddies = Array.from({ length: 7 }, (_, i) => ({ x: 90 + i * 90, y: 0, alive: Math.random() < 0.85, kind: i % BODY.length }));
    w.cpuAim = cpuTarget(n, qn.correctIndex, x.cpuRight());
    w.cpuWait = 1 + Math.random() * 1.2;
    setQ(qn);
    x.sfx.whoosh();
  }

  function held(w: World) {
    const x = c.current;
    const on = POWERS.filter((p) => (p.id === 'shield' ? w.shield > 0 : (w.fxT as Record<string, number>)[p.id] > 0));
    x.setHeld(x.player.id, on);
  }

  function burstAt(w: World, px: number, py: number, colors: string[], n = 26, speed = 260) {
    const many = c.current.still ? Math.ceil(n / 3) : n;
    for (let i = 0; i < many; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
      w.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.5 + Math.random() * 0.6, color: colors[i % colors.length], s: P * (1 + Math.floor(Math.random() * 2)) });
    }
  }

  function apply(p: LabPower | null) {
    const w = world.current, x = c.current;
    if (!p) return;
    switch (p.id) {
      case 'triple': w.fxT.triple = 10; x.sfx.build(); break;
      case 'rapid': w.fxT.rapid = 8; x.sfx.zap(); break;
      case 'slow': w.fxT.slow = 10; x.sfx.freeze(); break;
      case 'shield': w.shield = 3; x.sfx.boing(); break;
      case 'saucer': w.saucer = { x: -70, dir: 1 }; [0, 3, 0, 3, 7].forEach((s, i) => window.setTimeout(() => c.current.sfx.blip(s + 12), i * 110)); break;
      case 'time': w.left += 10; w.floats.push({ x: W - 90, y: 60, text: '+10s', life: 0, color: '#fdfd94' }); [0, 1, 2].forEach((i) => window.setTimeout(() => c.current.sfx.tick(), i * 140)); break;
      case 'laser': w.laserPending = true; x.sfx.slideUp(); break;
      case 'disco': w.discoPending = true; [0, 2, 4, 7, 9, 7, 4].forEach((s, i) => window.setTimeout(() => c.current.sfx.note(s), i * 120)); break;
      case 'wiggle': w.fxT.wiggle = 6; x.sfx.boing(); break;
    }
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    held(w);
  }

  async function waveCleared() {
    const w = world.current;
    paused.current = true;
    const p = await c.current.power(0.4);
    paused.current = false;
    if (w !== world.current || w.over) return;
    apply(p);
    newWave(w);
  }

  function fire(w: World) {
    const x = c.current;
    if (w.cool > 0 || w.stun > 0) return;
    w.cool = w.fxT.rapid > 0 ? 0.09 : 0.34;
    w.bolts.push({ x: w.shipX, y: SHIP_Y - 26, vx: 0 });
    if (w.fxT.triple > 0) { w.bolts.push({ x: w.shipX - 12, y: SHIP_Y - 20, vx: -150 }); w.bolts.push({ x: w.shipX + 12, y: SHIP_Y - 20, vx: 150 }); }
    x.sfx.blip(12 + Math.floor(Math.random() * 3));
    w.flame = 0.12;
  }

  function landed(w: World) {
    const x = c.current;
    if (w.q && !w.missed && !x.cpu) x.log(w.q, false);
    w.missed = true; w.combo = 0;
    x.say('They landed!', 'oops'); x.sfx.oops();
    w.shake = 0.5;
    w.aliens.forEach((a) => { if (a.alive) burstAt(w, a.x, w.fy, ['#8fe3a0', '#fff'], 8, 160); });
    newWave(w);
  }

  // ---- One step of play ----
  function update(w: World, dt: number) {
    const x = c.current;
    w.t += dt;
    w.left -= dt;
    for (const k of Object.keys(w.fxT) as (keyof World['fxT'])[]) if (w.fxT[k] > 0) { w.fxT[k] -= dt; if (w.fxT[k] <= 0) { w.fxT[k] = 0; held(w); } }
    w.cool = Math.max(0, w.cool - dt); w.stun = Math.max(0, w.stun - dt); w.shake = Math.max(0, w.shake - dt); w.flash = Math.max(0, w.flash - dt); w.flame = Math.max(0, w.flame - dt);
    const n = w.aliens.length;
    const slow = w.fxT.slow > 0 ? 0.45 : 1;

    // The ship: keys, held buttons, a tap target or the computer.
    let want = 0;
    if (x.cpu) {
      const a = w.aliens.find((al) => al.k === w.cpuAim && al.alive) ?? w.aliens.find((al) => al.alive);
      w.cpuWait -= dt;
      if (a && w.exit === 0 && w.waveIn >= 1) {
        const d = a.x - w.shipX;
        want = Math.abs(d) > 8 ? Math.sign(d) : 0;
        if (Math.abs(d) < 14 && w.cpuWait <= 0) { fire(w); w.cpuWait = 0.7 + Math.random() * 0.6; }
      } else if (w.saucer) want = Math.sign(w.saucer.x - w.shipX);
    } else if (w.target !== null) {
      const d = w.target - w.shipX;
      want = Math.abs(d) > 6 ? Math.sign(d) : 0;
      if (!want) { if (w.fireQueued) fire(w); w.fireQueued = false; w.target = null; }
    } else want = (keys.current.r ? 1 : 0) - (keys.current.l ? 1 : 0);
    const speed = w.target !== null ? 560 : 430;
    w.shipVX += ((w.stun > 0 ? 0 : want * speed) - w.shipVX) * Math.min(1, dt * 12);
    if (w.fxT.wiggle > 0) w.shipVX += Math.sin(w.t * 9) * 900 * dt;
    w.shipX = Math.max(40, Math.min(W - 40, w.shipX + w.shipVX * dt));

    // The formation flies in, sweeps side to side and steps down.
    if (w.waveIn < 1) {
      w.waveIn = Math.min(1, w.waveIn + dt * 1.1);
      for (const a of w.aliens) a.enter = Math.min(1, a.enter + dt * 1.25);
      if (w.waveIn >= 1) {
        if (w.discoPending) { w.discoPending = false; w.fxT.disco = 3.5; const o = shuffleSlots(n); w.aliens.forEach((a, i) => { a.slot = o[i]; }); held(w); }
        if (w.laserPending) { w.laserPending = false; const a = w.aliens.find((al) => al.right); if (a) w.laser = { t: 1.1, x: a.x }; }
      }
    } else if (w.exit === 0) {
      const sw = sweep(n);
      w.fx += w.dir * 46 * slow * dt;
      w.fy += 5.5 * slow * dt;
      if (w.fx > W / 2 + sw) { w.fx = W / 2 + sw; w.dir = -1; w.fy += 16; x.sfx.thud(); }
      if (w.fx < W / 2 - sw) { w.fx = W / 2 - sw; w.dir = 1; w.fy += 16; x.sfx.thud(); }
      if (w.fy >= LANDED_Y) { landed(w); return; }
      w.nextGoo -= dt * slow;
      if (w.nextGoo <= 0) {
        const live = w.aliens.filter((a) => a.alive);
        const a = live[Math.floor(Math.random() * live.length)];
        if (a) w.goo.push({ x: a.x, y: w.fy + 30 });
        w.nextGoo = 2.2 + Math.random() * 1.8;
      }
    } else {
      w.exit += dt;
      if (w.exit > 0.9 && w.exit - dt <= 0.9) void waveCleared();
    }
    for (const a of w.aliens) {
      const tx = slotX(a.slot, n, w.fx);
      a.x += (tx - a.x) * Math.min(1, dt * (w.fxT.disco > 0 ? 4 : 14));
      a.hurt = Math.max(0, a.hurt - dt);
    }
    w.buddies.forEach((b, i) => { b.x = 90 + i * 90 + (w.fx - W / 2) * 0.6; b.y = w.fy - 70; });

    // The laser sweeps down on the right alien.
    if (w.laser) {
      w.laser.t -= dt;
      const a = w.aliens.find((al) => al.right && al.alive);
      if (a) { w.laser.x = a.x; w.shipX += (a.x - w.shipX) * Math.min(1, dt * 10); }
      if (w.laser.t <= 0.5 && a) zapRight(w, a, true);
      if (w.laser.t <= 0) w.laser = null;
    }

    // The saucer.
    if (w.saucer) {
      w.saucer.x += w.saucer.dir * 170 * dt;
      if (w.saucer.x > W + 80) w.saucer = null;
    }

    // Bolts.
    for (const b of w.bolts) { b.y -= 640 * dt; b.x += b.vx * dt; }
    for (const b of w.bolts) {
      if (b.y < -20) continue;
      if (w.saucer && Math.abs(b.x - w.saucer.x) < 40 && Math.abs(b.y - 62) < 22) {
        burstAt(w, w.saucer.x, 62, ['#fdfd94', '#fff', '#f5a08c'], 34, 300);
        w.floats.push({ x: w.saucer.x, y: 70, text: '+5', life: 0, color: '#fdfd94' });
        x.points(5); w.score += 5; x.sfx.coin(); w.shake = 0.3; w.saucer = null; b.y = -99; continue;
      }
      if (w.exit > 0 || w.waveIn < 1) continue;
      const hit = w.aliens.find((a) => a.alive && hits(a.x, w.fy, b.x, b.y));
      if (hit) {
        b.y = -99;
        if (hit.right) zapRight(w, hit, false);
        else if (hit.hurt <= 0) {
          hit.hurt = 1.1;
          if (w.q && !w.missed && !x.cpu) x.log(w.q, false);
          w.missed = true; w.combo = 0;
          if (w.score > 0) { x.points(-1); w.score -= 1; }
          w.floats.push({ x: hit.x, y: w.fy - 30, text: 'NOPE!', life: 0, color: '#ffd2c2' });
          x.sfx.boing();
        }
        continue;
      }
      const bud = w.buddies.find((bd) => bd.alive && Math.abs(bd.x - b.x) < 24 && Math.abs(bd.y - b.y) < 22);
      if (bud) {
        bud.alive = false; b.y = -99;
        burstAt(w, bud.x, bud.y, [BODY[bud.kind][0], '#fff'], 14, 200);
        w.floats.push({ x: bud.x, y: bud.y, text: '+1', life: 0, color: '#fff' });
        x.points(1); w.score += 1; x.sfx.pop();
      }
    }
    w.bolts = w.bolts.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);

    // Goo blobs: a stun, never a hurt.
    for (const g of w.goo) g.y += 170 * slow * dt;
    for (const g of w.goo) {
      if (g.y > SHIP_Y - 18 && g.y < SHIP_Y + 18 && Math.abs(g.x - w.shipX) < 34) {
        g.y = H + 99;
        if (w.shield > 0) { w.shield -= 1; burstAt(w, g.x, SHIP_Y - 20, ['#7fd6e3', '#fff'], 14, 180); x.sfx.boing(); held(w); }
        else { w.stun = 0.9; w.floats.push({ x: w.shipX, y: SHIP_Y - 50, text: 'SPLAT!', life: 0, color: '#8fe3a0' }); x.sfx.splash(); burstAt(w, g.x, SHIP_Y - 10, ['#8fe3a0', '#4fb36a'], 12, 140); }
      }
    }
    w.goo = w.goo.filter((g) => g.y < H + 20);

    for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 0.99; }
    w.parts = w.parts.filter((p) => p.life < p.max);
    for (const f of w.floats) { f.life += dt; f.y -= 40 * dt; }
    w.floats = w.floats.filter((f) => f.life < 1.1);

    if (w.left <= 0 && !w.over) endBurst(w);
  }

  function zapRight(w: World, a: Alien, byLaser: boolean) {
    const x = c.current;
    a.alive = false;
    if (w.q && !w.missed && !byLaser && !x.cpu) x.log(w.q, true);
    const pts = rightPoints(w.combo);
    w.combo += 1;
    x.points(pts); w.score += pts;
    burstAt(w, a.x, w.fy, [BODY[a.color][0], BODY[a.color][1], '#fff', '#fdfd94'], 46, 340);
    w.floats.push({ x: a.x, y: w.fy - 30, text: `+${pts}`, life: 0, color: '#fdfd94' });
    w.shake = 0.35; w.flash = 0.12; w.exit = 0.0001;
    x.sfx.zap(); window.setTimeout(() => c.current.sfx.coin(), 90);
    if (w.combo >= 3) x.say(`Combo x${w.combo}!`, 'good');
  }

  function endBurst(w: World) {
    const x = c.current;
    w.over = true; w.left = 0;
    setPhase('over');
    x.sfx.whistle(); x.say('Time!', 'big');
    x.setHeld(x.player.id, []);
    window.setTimeout(() => { if (world.current === w) c.current.next(); }, 2600);
  }

  // ---- Drawing ----
  function draw(g: CanvasRenderingContext2D, w: World) {
    const still = c.current.still;
    g.save();
    if (w.shake > 0 && !still) g.translate((Math.random() - 0.5) * 10 * w.shake, (Math.random() - 0.5) * 10 * w.shake);
    // Deep space, a pixel planet, drifting stars and a pixel moonscape.
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#120c2e'); sky.addColorStop(0.7, '#2a1f5c'); sky.addColorStop(1, '#3b2a7a');
    g.fillStyle = sky; g.fillRect(-20, -20, W + 40, H + 40);
    for (const s of stars) {
      const y = still ? s.y : (s.y + w.t * 14 * s.z + performance.now() * 0.004 * s.z) % H;
      g.fillStyle = s.z === 3 ? '#fff' : s.z === 2 ? '#b4c4fb' : '#6b5fb0';
      g.fillRect(Math.round(s.x / 2) * 2, Math.round(y / 2) * 2, s.z === 3 ? 3 : 2, s.z === 3 ? 3 : 2);
    }
    g.fillStyle = '#000'; g.beginPath(); g.arc(96, 400, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f5a08c'; g.beginPath(); g.arc(96, 400, 42, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#cf6f58'; for (const [cx, cy, r] of [[80, 388, 8], [112, 414, 6], [104, 378, 4]]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#fdfd94'; g.lineWidth = 5; g.beginPath(); g.ellipse(96, 402, 70, 14, -0.25, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    g.fillStyle = '#241c3d';
    for (let i = 0; i < W; i += 20) { const hh = 14 + ((i * 37) % 23); g.fillRect(i, H - hh, 20, hh); }
    g.fillStyle = '#4b3c8f'; for (let i = 0; i < W; i += 20) { const hh = 14 + ((i * 37) % 23); g.fillRect(i, H - hh, 20, 4); }

    // Buddies (no answer, a bonus point each).
    for (const b of w.buddies) if (b.alive && w.waveIn > 0.6) {
      const bob = still ? 0 : Math.sin(w.t * 4 + b.x) * 2;
      drawSprite(g, BUDDY, b.x - 16, b.y - 16 + bob + (1 - Math.min(1, w.waveIn)) * -200, 4, { X: BODY[b.kind][0], W: '#fff', K: '#000' });
    }

    // Answer aliens with their signs.
    const n = w.aliens.length;
    for (const a of w.aliens) {
      if (!a.alive) continue;
      const e = Math.max(0, a.enter);
      const ease = 1 - Math.pow(1 - e, 3);
      let ay = w.fy - (1 - ease) * 420;
      let ax = a.x;
      if (w.exit > 0) { ay -= w.exit * w.exit * 900; ax += Math.sin(w.exit * 12 + a.k) * 30; }
      const frame = Math.floor((w.t + a.k * 0.3) * 3) % 2;
      const sp = ALIENS[a.kind];
      const rows = frame ? sp.rows : [...sp.rows.slice(0, -1), sp.rows[sp.rows.length - 1].split('').reverse().join('')];
      const disco = w.fxT.disco > 0;
      const col = disco ? BODY[(a.color + Math.floor(w.t * 8)) % BODY.length] : BODY[a.color];
      const wob = still ? 0 : Math.sin(w.t * 5 + a.k) * 2 + (a.hurt > 0 ? Math.sin(w.t * 50) * 4 : 0);
      const sx = ax - 30 + wob, sy = ay - 34 + (disco && !still ? Math.abs(Math.sin(w.t * 10 + a.k)) * -14 : 0);
      drawSprite(g, rows, sx, sy, P, { X: a.hurt > 0 ? '#ff8a8a' : col[0], K: '#241c3d', W: '#fff', P: '#ef7d96' });
      // Pupils follow the ship.
      g.fillStyle = '#000';
      const look = Math.max(-1, Math.min(1, (w.shipX - ax) / 200));
      for (const [ex, ey] of sp.eyes) g.fillRect(sx + (ex + (sp.eyes.length === 1 ? 1 : 0)) * P + 1 + look * 3, sy + (ey + 1) * P - 1, sp.eyes.length === 1 ? P * 2 - 2 : P, P);
      // The answer sign.
      const lines = a.lines;
      const fs = lines.length > 2 ? 16 : lines.length > 1 ? 18 : 21;
      g.font = `bold ${fs}px "Inclusive Sans", system-ui, sans-serif`;
      const tw = Math.min(n > 3 ? 136 : 160, Math.max(70, ...lines.map((l) => g.measureText(l).width + 22)));
      const th = lines.length * (fs + 3) + 12;
      const bx = ax - tw / 2 + wob * 0.5, by = ay + 20;
      g.fillStyle = '#000'; g.fillRect(bx - 3, by - 3, tw + 6, th + 6);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(bx + 3, by + th + 3, tw, 5);
      g.fillStyle = a.hurt > 0 ? '#ffd2c2' : '#fbfcf8'; g.fillRect(bx, by, tw, th);
      g.fillStyle = '#241c3d'; g.textAlign = 'center'; g.textBaseline = 'top';
      lines.forEach((l, i) => g.fillText(l, ax + wob * 0.5, by + 7 + i * (fs + 3), tw - 10));
    }

    // Goo, bolts, saucer, laser.
    for (const gb of w.goo) {
      const f = Math.floor(w.t * 8) % 2;
      drawSprite(g, f ? ['.XX.', 'XXXX', 'XXXX', '.X.X'] : ['.XX.', 'XXXX', 'XXXX', 'X.X.'], gb.x - 8, gb.y - 8, 4, { X: '#8fe3a0' });
    }
    for (const b of w.bolts) {
      g.fillStyle = 'rgba(253,253,148,0.35)'; g.fillRect(b.x - 5, b.y - 4, 10, 22);
      g.fillStyle = '#fdfd94'; g.fillRect(b.x - 2, b.y, 5, 16);
      g.fillStyle = '#fff'; g.fillRect(b.x - 1, b.y, 2, 6);
    }
    if (w.saucer) {
      drawSprite(g, UFO, w.saucer.x - 30, 45 + Math.sin(w.t * 6) * 4, P, { W: '#fff', C: '#7fd6e3', X: '#f6c544', Y: Math.floor(w.t * 8) % 2 ? '#fdfd94' : '#ef7d96' });
    }
    if (w.laser) {
      const k = Math.min(1, (1.1 - w.laser.t) * 4), wd = 10 + 30 * k + Math.sin(w.t * 40) * 4;
      g.fillStyle = 'rgba(253,253,148,0.45)'; g.fillRect(w.laser.x - wd, 0, wd * 2, SHIP_Y - 20);
      g.fillStyle = '#fff'; g.fillRect(w.laser.x - wd * 0.35, 0, wd * 0.7, SHIP_Y - 20);
    }

    // The ship (green and drippy when gooed, a bubble when shielded).
    const tilt = Math.max(-1, Math.min(1, w.shipVX / 430));
    const shipCol = w.stun > 0 ? { X: '#8fe3a0', D: '#4fb36a' } : { X: '#ef7d96', D: '#c4506c' };
    {
      const fl = 6 + (Math.floor(w.t * 20) % 2) * 5 + (w.flame > 0 ? 6 : 0);
      g.fillStyle = '#fdfd94'; g.fillRect(w.shipX - 14 - tilt * 2, SHIP_Y + 16, 8, fl); g.fillRect(w.shipX + 6 - tilt * 2, SHIP_Y + 16, 8, fl);
      g.fillStyle = '#f5a08c'; g.fillRect(w.shipX - 12 - tilt * 2, SHIP_Y + 16, 4, fl * 0.6); g.fillRect(w.shipX + 8 - tilt * 2, SHIP_Y + 16, 4, fl * 0.6);
    }
    drawSprite(g, SHIP, w.shipX - 32, SHIP_Y - 24 + (w.flame > 0 ? 3 : 0), P, { ...shipCol, W: '#fff', C: '#7fd6e3', Y: '#fdfd94' });
    if (w.fxT.triple > 0) { g.fillStyle = '#fdfd94'; g.fillRect(w.shipX - 40, SHIP_Y - 8, 8, 14); g.fillRect(w.shipX + 32, SHIP_Y - 8, 8, 14); }
    if (w.shield > 0) {
      g.strokeStyle = `rgba(127,214,227,${0.7 + Math.sin(w.t * 6) * 0.2})`; g.lineWidth = 5;
      g.beginPath(); g.ellipse(w.shipX, SHIP_Y, 50 + Math.sin(w.t * 5) * 3, 40 + Math.cos(w.t * 5) * 3, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(w.shipX - 30, SHIP_Y - 30, 8, 8);
    }

    for (const p of w.parts) { g.globalAlpha = Math.max(0, 1 - p.life / p.max); g.fillStyle = p.color; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of w.floats) {
      g.globalAlpha = Math.max(0, 1 - f.life / 1.1);
      g.font = 'bold 26px ui-monospace, Menlo, monospace';
      g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.color; g.fillText(f.text, f.x, f.y);
    }
    g.globalAlpha = 1;

    // HUD: score and a chunky time bar.
    g.font = 'bold 22px ui-monospace, Menlo, monospace'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText(`SCORE ${String(w.score).padStart(4, '0')}`, 18, 14);
    g.fillStyle = '#fdfd94'; g.fillText(`SCORE ${String(w.score).padStart(4, '0')}`, 16, 12);
    const blocks = 20, on = Math.ceil((Math.max(0, w.left) / BURST) * blocks);
    for (let i = 0; i < blocks; i++) {
      g.fillStyle = '#000'; g.fillRect(W - 20 - (blocks - i) * 11 - 1, 13, 10, 18);
      g.fillStyle = i < on ? (w.left < 8 ? (Math.floor(w.t * 4) % 2 ? '#ef7d96' : '#fdfd94') : '#8fe3a0') : '#3b2a7a';
      g.fillRect(W - 20 - (blocks - i) * 11 + 1, 15, 6, 14);
    }
    if (w.flash > 0) { g.fillStyle = `rgba(255,255,255,${w.flash * 3})`; g.fillRect(0, 0, W, H); }
    if (w.fxT.slow > 0) { g.fillStyle = 'rgba(127,214,227,0.10)'; g.fillRect(0, 0, W, H); }
    g.restore();
  }

  // The game loop (also draws the idle starfield before PRESS START).
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const g = cv.getContext('2d'); if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    let raf = 0, last = performance.now(), tick = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const w = world.current;
      if (phaseRef.current === 'play' && !paused.current && !w.over) update(w, dt);
      else if (phaseRef.current !== 'play') { w.t += dt; for (const p of w.parts) { p.life += dt; } }
      draw(g, w);
      tick += dt;
      if (tick > 0.2) { tick = 0; setLeft(Math.max(0, Math.ceil(w.left))); setScoreNow(w.score); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: arrows or A/D to slide, space or up to fire, Enter to start.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('[role="dialog"]')) return;
      if (c.current.cpu) return;
      const k = e.key;
      if (phaseRef.current === 'ready' && (k === ' ' || k === 'Enter')) { e.preventDefault(); start(); return; }
      if (phaseRef.current !== 'play' || paused.current) return;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.current.l = true; world.current.target = null; e.preventDefault(); }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.current.r = true; world.current.target = null; e.preventDefault(); }
      if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); fire(world.current); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.l = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.r = false;
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap the screen: the ship slides under that spot and fires.
  function tapField(e: RPointerEvent<HTMLCanvasElement>) {
    if (c.current.cpu || phaseRef.current !== 'play' || paused.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const lx = ((e.clientX - r.left) / r.width) * W;
    world.current.target = Math.max(40, Math.min(W - 40, lx));
    world.current.fireQueued = true;
  }
  const hold = (side: 'l' | 'r', on: boolean) => { keys.current[side] = on; if (on) world.current.target = null; };

  const playing = phase === 'play' && !ctx.cpu;
  const ranked = [...ctx.turns.players].sort((a, b) => b.score - a.score);
  return (
    <div className="absolute inset-0 flex flex-col gap-2">
      {/* The question bar on top of the cabinet. */}
      <div className="shrink-0 min-h-[3.4rem] rounded-panel border-heavy border-border bg-[#241c3d] text-[#fbfcf8] px-4 py-2 flex items-center gap-3" style={{ boxShadow: '0 4px 0 #000' }} aria-live="polite">
        {q && phase !== 'ready' ? (
          <>
            <button type="button" onClick={() => speakQuestion(q, ctx.settings)} aria-label="Listen to the question" className="shrink-0 w-11 h-11 rounded-full border-bold border-border bg-accent text-ink grid place-items-center motion-safe:hover:scale-110 motion-safe:transition-transform"><SpeakerHigh weight="fill" size={22} color="#241c3d" /></button>
            <AnimatePresence mode="wait">
              <motion.p key={q.id} className="m-0 font-bold text-[clamp(1rem,2.4cqw,1.6rem)] leading-tight text-balance" initial={ctx.still ? false : { y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>{q.prompt}</motion.p>
            </AnimatePresence>
          </>
        ) : <p className="m-0 font-mono font-bold text-[#fdfd94] tracking-widest text-xl">GET READY</p>}
      </div>

      <div className="flex-1 min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
        <div className="lab-fit relative rounded-[1.4rem] border-heavy border-border bg-[#0b0820] p-[1.2%]" style={{ '--ar': W / H, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(10,6,30,0.45), inset 0 0 0 4px #3b2a7a' } as CSSProperties}>
          <div className="relative w-full h-full rounded-[1rem] overflow-hidden">
            <canvas ref={canvas} width={W * 2} height={H * 2} onPointerDown={tapField} className={`block w-full h-full touch-none ${playing ? 'cursor-crosshair' : ''}`} aria-label="Pixel Blaster screen: tap an alien to blast it" />
            {/* CRT scanlines and a soft glass glow. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 4px)', mixBlendMode: 'multiply' }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 60%, rgba(0,0,0,0.55) 100%)' }} />
            <AnimatePresence>
              {phase !== 'play' && (
                <motion.div className="absolute inset-0 grid place-items-center p-[4%]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid justify-items-center gap-[2cqh] text-center font-mono">
                    <motion.p className="m-0 font-bold tracking-[0.2em] text-[#fdfd94] text-[clamp(1.4rem,6cqw,3.4rem)] leading-none" style={{ textShadow: '4px 4px 0 #ef7d96, 8px 8px 0 #000' }}
                      animate={ctx.still ? undefined : { scale: [1, 1.04, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>HIGH SCORES</motion.p>
                    <ol className="list-none m-0 p-0 grid gap-1.5 min-w-[60%]">
                      {ranked.slice(0, 6).map((p, i) => (
                        <motion.li key={p.id} className={`flex items-center gap-3 px-3 py-1 text-[clamp(0.9rem,2.6cqw,1.5rem)] font-bold ${p.id === ctx.player.id ? 'text-[#8fe3a0]' : 'text-[#fbfcf8]'}`} initial={ctx.still ? false : { x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.12 }}>
                          <span className="w-8 text-left">{i + 1}.</span><TeamBadge colorIndex={p.colorIndex} size={30} /><span className="flex-1 text-left">{p.name}</span><span>{String(p.score).padStart(4, '0')}</span>
                        </motion.li>
                      ))}
                    </ol>
                    {phase === 'ready' ? (
                      <motion.button type="button" onClick={start} disabled={ctx.cpu} className="mt-[1cqh] min-h-14 px-6 rounded-xl border-heavy border-border bg-[#fdfd94] text-[#241c3d] font-mono font-bold tracking-widest text-[clamp(1.1rem,3.4cqw,2rem)] inline-flex items-center gap-3 motion-safe:hover:scale-105 motion-safe:transition-transform disabled:opacity-90"
                        style={{ boxShadow: '0 6px 0 #000' }} animate={ctx.still ? undefined : { opacity: [1, 0.55, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                        <TeamBadge colorIndex={ctx.player.colorIndex} size={36} />{ctx.cpu ? 'COMPUTER READY' : 'PRESS START'}
                      </motion.button>
                    ) : <p className="m-0 font-bold tracking-widest text-[#ef7d96] text-[clamp(1rem,3cqw,1.8rem)]">GAME OVER</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Big buttons for touch screens (keys work too). */}
      <div className="shrink-0 flex items-center justify-center gap-3">
        <PadButton label="Slide left" disabled={!playing} onHold={(on) => hold('l', on)}><CaretLeft weight="bold" size={30} /></PadButton>
        <button type="button" disabled={!playing} onPointerDown={() => fire(world.current)} aria-label="Fire"
          className="min-h-14 min-w-[9rem] px-5 rounded-panel border-heavy border-border bg-[#ef7d96] font-mono font-bold text-xl tracking-widest inline-flex items-center justify-center gap-2 motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-50" style={{ boxShadow: '0 5px 0 #000' }}>
          <Crosshair weight="bold" size={26} />FIRE
        </button>
        <PadButton label="Slide right" disabled={!playing} onHold={(on) => hold('r', on)}><CaretRight weight="bold" size={30} /></PadButton>
        <span className="hidden xl:inline font-bold text-[#fbfcf8] text-sm ml-2" style={{ textShadow: '0 1px 0 #000' }}>{phase === 'play' ? `${left}s` : ''}{scoreNow ? ` · ${scoreNow}` : ''}</span>
      </div>
    </div>
  );
}

function PadButton({ label, disabled, onHold, children }: { label: string; disabled: boolean; onHold: (on: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onHold(true); }} onPointerUp={() => onHold(false)} onPointerCancel={() => onHold(false)} onLostPointerCapture={() => onHold(false)}
      className="min-h-14 min-w-[5.5rem] rounded-panel border-heavy border-border bg-[#b4c4fb] inline-flex items-center justify-center touch-none motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-50" style={{ boxShadow: '0 5px 0 #000' }}>
      {children}
    </button>
  );
}

function Cover() {
  const px = (rows: string[], x: number, y: number, s: number, pal: Record<string, string>) =>
    rows.flatMap((row, r) => [...row].map((ch, k) => (ch === '.' ? null : <rect key={`${x}-${y}-${r}-${k}`} x={x + k * s} y={y + r * s} width={s + 0.05} height={s + 0.05} fill={pal[ch] ?? '#000'} />)));
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" style={{ background: 'linear-gradient(#120c2e, #3b2a7a)' }}>
      {Array.from({ length: 40 }, (_, i) => <rect key={i} x={(i * 37) % 100} y={(i * 23) % 50} width="0.6" height="0.6" fill={i % 3 ? '#b4c4fb' : '#fff'} />)}
      <circle cx="86" cy="12" r="6" fill="#f5a08c" stroke="#000" strokeWidth="0.6" />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          {px(ALIENS[k % 3].rows, 12 + k * 21, 12 + (k % 2) * 2, 0.8, { X: BODY[k][0], K: '#241c3d', W: '#fff', P: '#ef7d96' })}
          <rect x={10 + k * 21} y={22 + (k % 2) * 2} width="14" height="5" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" />
        </g>
      ))}
      <rect x="49.5" y="30" width="1" height="5" fill="#fdfd94" />
      {px(SHIP, 44.8, 48, 0.8, { X: '#ef7d96', D: '#c4506c', W: '#fff', C: '#7fd6e3', Y: '#fdfd94' })}
      {[[30, 26], [33, 24], [28, 23], [35, 27]].map(([x, y], i) => <rect key={i} x={x} y={y} width="1.4" height="1.4" fill={i % 2 ? '#fdfd94' : '#8fe3a0'} />)}
      <rect x="0" y="58" width="100" height="4" fill="#241c3d" />
      <rect x="0" y="0" width="100" height="62" fill="url(#scan)" />
      <defs><pattern id="scan" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="0.4" fill="rgba(0,0,0,0.25)" /></pattern></defs>
    </svg>
  );
}

const def: LabDef = {
  id: 'pixel-blaster',
  name: 'Pixel Blaster',
  description: 'A retro space shooter. Goofy aliens carry the answers. Blast the one that is right!',
  ways: ['solo', 'teams'],
  how: [
    { icon: <Rocket weight="fill" />, text: 'Slide your ship' },
    { icon: <Crosshair weight="fill" />, text: 'Blast the alien with the right answer' },
    { icon: <Trophy weight="fill" />, text: 'Beat the high score' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #5a4aa8 0%, #3b2a7a 55%, #241c3d 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Space', hint: 'The starry sky behind the aliens' },
    { id: 'ship', label: 'Ship', hint: 'The player ship at the bottom' },
    { id: 'alien-1', label: 'Alien 1', hint: 'An answer alien' },
    { id: 'alien-2', label: 'Alien 2', hint: 'An answer alien' },
    { id: 'alien-3', label: 'Alien 3', hint: 'An answer alien' },
    { id: 'buddy', label: 'Little alien', hint: 'The small bonus aliens in the back row' },
    { id: 'sign', label: 'Answer sign', hint: 'The sign each alien carries' },
    { id: 'bolt', label: 'Bolt', hint: 'What the ship shoots' },
    { id: 'goo', label: 'Goo blob', hint: 'What the aliens drop' },
    { id: 'saucer', label: 'Bonus saucer', hint: 'The saucer that zooms across the top' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
