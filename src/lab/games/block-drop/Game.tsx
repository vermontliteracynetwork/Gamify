import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowArcRight, ArrowDown, ArrowLineDown, Broom, CaretLeft, CaretRight, CheckCircle, Rows, SquaresFour } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { BOMB, bestPlace, cells, clearRows, COLS, dropped, emptyGrid, explode, fits, fullRows, height, LINE_POINTS, merge, move, rotate, ROWS, randomPiece, SHAPES, spawn, squish, type Grid, type Piece } from './rules';

// Block Drop (Game Lab, classic arcade): a falling-block puzzle with round
// candy blocks. Turn and slide the pieces to fill rows; full rows flash and
// burst. Every four rows (or when the stack gets tall) a question: a right
// answer clears the bottom row or lets you pick the next piece. Each team
// keeps its own candy jar and drops for a short burst on its turn.

const RUN_LONG = 45, RUN_SHORT = 25;
const C = 30; // a cell in world pixels
const WX = 214, WY = 20; // the well's corner
const W = 680, H = 640;
const PIECES_NO_CLOCK = 30; // with no clock, a turn is this many pieces
// Gumball spots in the machine's globe, filled from the bottom (one per row cleared).
const BALLS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let y = 330; y > 150 && out.length < 60; y -= 17) for (let x = 30; x <= 160; x += 18) { const dx = x + ((y / 17) % 2 ? 9 : 0) - 95, dy = y - 245; if (Math.hypot(dx, dy) < 70) out.push([95 + dx, y]); }
  return out;
})();
const CANDY = ['#ef7d96', '#8fe3a0', '#fdfd94', '#b4c4fb', '#f5a08c', '#7fd6e3', '#c58ce8'];
const SHADE = ['#c4506c', '#4fb36a', '#d8c94e', '#7488e0', '#cf6f58', '#3fa6b8', '#9a5fc0'];
const IMG = '/lab/block-drop/';

function Icon({ kind }: { kind: string }) {
  const ring = (f: string) => <circle cx="50" cy="50" r="44" fill={f} stroke="#000" strokeWidth="5" />;
  const candy = (x: number, y: number, f: string, s = 16) => <rect key={`${x}-${y}`} x={x} y={y} width={s} height={s} rx="4" fill={f} stroke="#000" strokeWidth="3" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'bomb' && <>{ring('#fdfd94')}<circle cx="46" cy="58" r="22" fill="#241c3d" stroke="#000" strokeWidth="4" /><circle cx="38" cy="50" r="5" fill="#fff" opacity="0.6" /><path d="M58 38q6-10 14-8" stroke="#000" strokeWidth="4" fill="none" /><path d="M74 22l3 7 7 1-6 4 2 7-6-4-6 4 2-7-6-4 7-1z" fill="#ef7d96" stroke="#000" strokeWidth="2" /></>}
      {kind === 'laser' && <>{ring('#241c3d')}{[0, 1, 2, 3].map((i) => candy(18 + i * 16, 60, CANDY[i]))}<rect x="12" y="50" width="76" height="8" rx="4" fill="#fdfd94" stroke="#000" strokeWidth="2" /><circle cx="14" cy="54" r="7" fill="#ef7d96" stroke="#000" strokeWidth="3" /></>}
      {kind === 'slow' && <>{ring('#e9eefe')}<foreignObject x="18" y="18" width="64" height="64"><img src={IMG + 'ice.webp'} alt="" className="w-full h-full object-contain" /></foreignObject></>}
      {kind === 'stick' && <>{ring('#b4c4fb')}{[0, 1, 2, 3].map((i) => candy(42, 14 + i * 18, '#7fd6e3'))}</>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="40" fontWeight="900" fill="#ef7d96" stroke="#000" strokeWidth="3" paintOrder="stroke">x2</text></>}
      {kind === 'squish' && <>{ring('#8fe3a0')}{candy(22, 64, '#ef7d96')}{candy(42, 64, '#fdfd94')}{candy(62, 64, '#b4c4fb')}<path d="M50 20v28M40 38l10 12 10-12" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" /></>}
      {kind === 'time' && <>{ring('#ef7d96')}<foreignObject x="18" y="18" width="64" height="64"><img src={IMG + 'time.webp'} alt="" className="w-full h-full object-contain" /></foreignObject></>}
      {kind === 'mirror' && <>{ring('#f5a08c')}<rect x="30" y="18" width="40" height="58" rx="20" fill="#e9eefe" stroke="#000" strokeWidth="4" /><path d="M40 36l10 10M44 30l14 14" stroke="#fff" strokeWidth="4" strokeLinecap="round" /><path d="M20 84h22M58 84h22M26 78l-6 6 6 6M74 78l6 6-6 6" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'hiccup' && <>{ring('#c58ce8')}{candy(30, 46, '#8fe3a0', 22)}{candy(52, 46, '#8fe3a0', 22)}<circle cx="70" cy="28" r="12" fill="#fff" stroke="#000" strokeWidth="3" /><text x="70" y="33" textAnchor="middle" fontSize="12" fontWeight="900">hic</text></>}
    </svg>
  );
}

const POWERS: LabPower[] = [
  { id: 'bomb', name: 'Bomb Piece', desc: 'Your next piece is a bomb that blasts a hole in the stack.', enter: 'drop', art: <Icon kind="bomb" /> },
  { id: 'laser', name: 'Laser Sweep', desc: 'A laser zaps away the bottom two rows.', enter: 'zoom', art: <Icon kind="laser" /> },
  { id: 'slow', name: 'Slow Time', desc: 'Pieces fall slowly for a while.', enter: 'zoom', art: <Icon kind="slow" /> },
  { id: 'stick', name: 'Stick Shower', desc: 'Your next three pieces are long sticks.', enter: 'drop', art: <Icon kind="stick" /> },
  { id: 'double', name: 'Double Points', desc: 'Rows count double for the rest of this turn.', enter: 'spin', art: <Icon kind="double" /> },
  { id: 'squish', name: 'Gravity Squish', desc: 'Every block drops down to fill the holes.', enter: 'drop', art: <Icon kind="squish" /> },
  { id: 'time', name: 'Extra Time', desc: 'Ten more seconds to drop.', enter: 'spin', art: <Icon kind="time" /> },
  { id: 'mirror', name: 'Mirror Mode', desc: 'Whoops! Pieces turn the other way for a bit.', silly: true, art: <Icon kind="mirror" /> },
  { id: 'hiccup', name: 'Hiccups', desc: 'Whoops! The falling piece hiccups up now and then.', silly: true, art: <Icon kind="hiccup" /> },
];
type Fx = 'slow' | 'double' | 'mirror' | 'hiccup';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; s: number }
interface World {
  grid: Grid; piece: Piece | null; vx: number; vy: number; queue: number[]; forced: number[];
  drop: number; lock: number; left: number; lines: number; sinceQ: number; heightAsked: boolean;
  flash: { rows: number[]; t: number } | null; fall: number[]; parts: Part[]; floats: { x: number; y: number; text: string; life: number }[];
  fx: Record<Fx, number>; shake: number; laser: number; hic: number; soft: boolean; over: boolean; t: number;
  cpuPlan: { rot: number; x: number } | null; cpuWait: number; score: number; runLen: number; pieces: number; turnLines: number;
}
const boards = new Map<string, { grid: Grid; lines: number }>();

function newWorld(id: string): World {
  const saved = boards.get(id);
  return {
    grid: saved?.grid ?? emptyGrid(), piece: null, vx: 0, vy: 0, queue: Array.from({ length: 6 }, () => randomPiece()), forced: [], drop: 0, lock: 0, left: RUN_LONG, lines: saved?.lines ?? 0, sinceQ: 0, heightAsked: false,
    flash: null, fall: Array(ROWS).fill(0), parts: [], floats: [], fx: { slow: 0, double: 0, mirror: 0, hiccup: 0 }, shake: 0, laser: 0, hic: 1.5, soft: false, over: false, t: 0, cpuPlan: null, cpuWait: 0.5, score: 0, runLen: RUN_LONG, pieces: 0, turnLines: 0,
  };
}

type Phase = 'ready' | 'play' | 'over';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  // A new game starts every team with an empty jar.
  useState(() => { boards.clear(); return 0; });
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newWorld(ctx.player.id));
  const paused = useRef(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready'); phaseRef.current = phase;
  const [choice, setChoice] = useState<null | 'main' | 'piece'>(null);
  const [offer, setOffer] = useState<number[]>([]);
  const choiceDone = useRef<(() => void) | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    // Save the last team's jar, then open this team's.
    world.current = newWorld(c.current.player.id);
    setPhase('ready'); setChoice(null); busy.current = false;
    c.current.setHeld(c.current.player.id, []);
    if (!c.current.cpu) return;
    const id = window.setTimeout(() => void start(), 1800);
    return () => window.clearTimeout(id);
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (phaseRef.current !== 'ready' || busy.current) return;
    busy.current = true;
    const x = c.current;
    const ok = await x.ask();
    const w = world.current;
    w.runLen = (ok ? RUN_LONG : RUN_SHORT) * (x.timeScale || 1);
    w.left = w.runLen; w.pieces = 0; w.turnLines = 0;
    if (ok) { x.sfx.right(); x.points(3); x.burst(0.5, 0.45); x.say('Right! +3', 'big'); } else { x.sfx.wrong(); x.say('A short turn!', 'oops'); }
    nextPiece(w);
    setPhase('play');
    busy.current = false;
  }

  function held(w: World) {
    const x = c.current;
    x.setHeld(x.player.id, POWERS.filter((p) => (w.fx[p.id as Fx] ?? 0) > 0 || (p.id === 'bomb' && w.forced.includes(7)) || (p.id === 'stick' && w.forced.includes(0))));
  }

  function nextPiece(w: World) {
    while (w.queue.length < 4) w.queue.push(randomPiece());
    const kind = w.forced.length ? w.forced.shift()! : w.queue.shift()!;
    const p = spawn(kind);
    held(w);
    if (!fits(w.grid, p)) { toppedOut(w); return; }
    w.piece = p; w.vx = p.x; w.vy = p.y - 1.5; w.drop = 0; w.lock = 0; w.cpuPlan = null; w.cpuWait = 0.35;
  }

  function toppedOut(w: World) {
    const x = c.current;
    // A gentle reset: the top half of the jar puffs away, the rest stays.
    const grid = w.grid.map((r) => [...r]);
    for (let y = 0; y < ROWS / 2 + 2; y++) for (let k = 0; k < COLS; k++) if (grid[y][k]) { sparks(w, WX + k * C + C / 2, WY + y * C + C / 2, CANDY[(grid[y][k] - 1) % 7] ?? '#241c3d', 2); grid[y][k] = 0; }
    w.grid = grid; w.shake = 0.4;
    x.sfx.wind(); x.say('Poof! Room to drop', 'oops');
    w.piece = null;
    window.setTimeout(() => { if (world.current === w && !w.over) nextPiece(w); }, 700);
  }

  function sparks(w: World, px: number, py: number, color: string, n: number) {
    const many = c.current.still ? 1 : n;
    for (let i = 0; i < many; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      w.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 0, max: 0.6 + Math.random() * 0.5, color, s: 6 + Math.random() * 6 });
    }
  }

  function lockPiece(w: World) {
    const x = c.current;
    const p = w.piece!;
    w.piece = null;
    w.pieces += 1;
    if (p.kind === 7) {
      const [bx, by] = cells(p)[0];
      w.grid = explode(w.grid, bx, by);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sparks(w, WX + (bx + dx) * C + C / 2, WY + (by + dy) * C + C / 2, ['#241c3d', '#fdfd94', '#ef7d96'][(dx + dy + 3) % 3], 5);
      w.shake = 0.5; x.sfx.crash(); x.say('Boom!', 'big');
    } else {
      w.grid = merge(w.grid, p);
      x.sfx.thud();
    }
    const rows = fullRows(w.grid);
    if (rows.length) {
      w.flash = { rows, t: 0 };
      x.sfx.zap();
      return;
    }
    afterLock(w);
  }

  function finishClear(w: World, rows: number[]) {
    const x = c.current;
    const keep = w.grid.map((_, i) => i).filter((i) => !rows.includes(i));
    for (const r of rows) for (let k = 0; k < COLS; k++) sparks(w, WX + k * C + C / 2, WY + r * C + C / 2, CANDY[(w.grid[r][k] - 1 + 7) % 7] ?? '#fff', 3);
    w.grid = clearRows(w.grid, rows);
    keep.forEach((old, j) => { const now = rows.length + j; w.fall[now] = old - now; });
    const n = rows.length;
    let pts = LINE_POINTS[Math.min(4, n)];
    if (w.fx.double > 0) pts *= 2;
    x.points(pts); w.score += pts;
    w.lines += n; w.sinceQ += n; w.turnLines += n;
    w.floats.push({ x: WX + (COLS * C) / 2, y: WY + rows[0] * C, text: `+${pts}`, life: 0 });
    if (n >= 4) { x.say('Candy crunch!', 'big'); x.burst(0.4, 0.5, 'big'); x.sfx.cheer(); }
    else if (n >= 2) { x.say(`${n} rows!`); x.sfx.coin(); }
    else x.sfx.coin();
    w.shake = 0.15 + n * 0.08;
    afterLock(w);
  }

  function afterLock(w: World) {
    if (w.sinceQ >= 4) { w.sinceQ -= 4; void questionBreak(w, 'Four rows! Question time'); return; }
    if (height(w.grid) >= 15 && !w.heightAsked) { w.heightAsked = true; void questionBreak(w, 'So tall! Question time'); return; }
    if (height(w.grid) < 12) w.heightAsked = false;
    if (c.current.timeScale === 0 && w.pieces >= PIECES_NO_CLOCK) { endTurn(w); return; }
    nextPiece(w);
  }

  // A question break: right = clear the bottom row or pick the next piece,
  // then maybe a power-up.
  async function questionBreak(w: World, text: string) {
    const x = c.current;
    paused.current = true;
    x.say(text, 'good'); x.sfx.bell();
    await new Promise((r) => window.setTimeout(r, 900));
    const ok = await c.current.ask();
    if (w !== world.current) return;
    if (ok) {
      c.current.sfx.right(); c.current.points(3); w.score += 3;
      w.floats.push({ x: WX + (COLS * C) / 2, y: WY + 200, text: '+3', life: 0 });
      offerChoice(w);
      await new Promise<void>((r) => { choiceDone.current = r; });
      const p = await c.current.power(0.45, (pw) => c.current.timeScale !== 0 || pw.id !== 'time');
      if (w !== world.current) return;
      if (p) apply(w, p);
    } else c.current.sfx.wrong();
    paused.current = false;
    if (!w.piece && !w.over) nextPiece(w);
  }

  function offerChoice(w: World) {
    const picks: number[] = []; while (picks.length < 3) { const k = randomPiece(); if (!picks.includes(k)) picks.push(k); }
    setOffer(picks);
    setChoice('main');
    if (c.current.cpu) window.setTimeout(() => { if (world.current === w) pickMain(Math.random() < 0.5 && height(w.grid) > 0 ? 'clear' : 'piece', picks[0]); }, 1400);
  }
  function pickMain(kind: 'clear' | 'piece', cpuPiece?: number) {
    const w = world.current, x = c.current;
    if (kind === 'clear') { clearBottom(w, 1); x.say('Bottom row gone!'); done(); return; }
    if (cpuPiece !== undefined) { pickPiece(cpuPiece); return; }
    x.sfx.tap(); setChoice('piece');
  }
  function pickPiece(k: number) {
    world.current.forced.unshift(k);
    c.current.sfx.build(); done();
  }
  function done() { setChoice(null); const r = choiceDone.current; choiceDone.current = null; r?.(); }

  function clearBottom(w: World, n: number) {
    const x = c.current;
    const rows = Array.from({ length: n }, (_, i) => ROWS - 1 - i).filter((r) => w.grid[r].some(Boolean));
    if (!rows.length) return;
    for (const r of rows) for (let k = 0; k < COLS; k++) if (w.grid[r][k]) sparks(w, WX + k * C + C / 2, WY + r * C + C / 2, CANDY[(w.grid[r][k] - 1) % 7] ?? '#241c3d', 3);
    const keep = w.grid.map((_, i) => i).filter((i) => !rows.includes(i));
    w.grid = clearRows(w.grid, rows);
    keep.forEach((old, j) => { const now = rows.length + j; w.fall[now] = old - now; });
    w.laser = 0.6; w.shake = 0.3;
    x.sfx.zap();
  }

  function apply(w: World, p: LabPower) {
    const x = c.current;
    switch (p.id) {
      case 'bomb': w.forced.unshift(7); x.sfx.chest(); break;
      case 'laser': clearBottom(w, 2); break;
      case 'slow': w.fx.slow = 12; x.sfx.freeze(); break;
      case 'stick': w.forced.push(0, 0, 0); x.sfx.build(); break;
      case 'double': w.fx.double = 999; x.sfx.coin(); break;
      case 'squish': {
        const before = w.grid; w.grid = squish(w.grid);
        // Each column's blocks slide down: animate by rows.
        for (let y = 0; y < ROWS; y++) w.fall[y] = before[y].some(Boolean) || w.grid[y].some(Boolean) ? -0.6 : 0;
        x.sfx.slideDown(); w.shake = 0.3;
        const rows = fullRows(w.grid); if (rows.length) w.flash = { rows, t: 0 };
        break;
      }
      case 'time': w.left += 10; w.runLen = Math.max(w.runLen, w.left); w.floats.push({ x: 430, y: 200, text: '+10s', life: 0 }); x.sfx.tick(); break;
      case 'mirror': w.fx.mirror = 8; x.sfx.whoosh(); break;
      case 'hiccup': w.fx.hiccup = 8; x.sfx.boing(); break;
    }
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    held(w);
  }

  // ---- Controls ----
  function act(a: 'left' | 'right' | 'rot' | 'rotBack' | 'hard' | 'soft' | 'softOff', fromCpu = false) {
    const w = world.current, x = c.current;
    if (a === 'softOff') { w.soft = false; return; }
    if (phaseRef.current !== 'play' || paused.current || !w.piece || w.flash || (x.cpu && !fromCpu)) return;
    const dir = a === 'left' ? -1 : a === 'right' ? 1 : 0;
    // Mirror Mode only turns pieces the other way.
    if (w.fx.mirror > 0 && !fromCpu && (a === 'rot' || a === 'rotBack')) a = a === 'rot' ? 'rotBack' : 'rot';
    if (dir) { const m = move(w.grid, w.piece, dir, 0); if (m) { w.piece = m; x.sfx.tick(); if (w.lock > 0) w.lock = Math.max(0, w.lock - 0.1); } else x.sfx.bump(); }
    if (a === 'rot' || a === 'rotBack') { const r = rotate(w.grid, w.piece, a === 'rot' ? 1 : -1); if (r) { w.piece = r; x.sfx.blip(7); } }
    if (a === 'soft') w.soft = true;
    if (a === 'hard') {
      const d = dropped(w.grid, w.piece);
      const dist = d.y - w.piece.y;
      w.piece = d; w.shake = Math.min(0.3, 0.05 + dist * 0.015);
      for (const [cx] of cells(d)) sparks(w, WX + cx * C + C / 2, WY + Math.max(0, cells(d)[0][1]) * C, '#fbfcf8', 1);
      x.sfx.whoosh();
      lockPiece(w);
    }
  }

  function update(w: World, dt: number) {
    const x = c.current;
    w.t += dt;
    for (const k of Object.keys(w.fx) as Fx[]) if (w.fx[k] > 0 && w.fx[k] < 999) { w.fx[k] -= dt; if (w.fx[k] <= 0) { w.fx[k] = 0; held(w); } }
    w.shake = Math.max(0, w.shake - dt); w.laser = Math.max(0, w.laser - dt);
    for (let i = 0; i < ROWS; i++) w.fall[i] += (0 - w.fall[i]) * Math.min(1, dt * 10);
    for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; }
    w.parts = w.parts.filter((p) => p.life < p.max);
    for (const f of w.floats) { f.life += dt; f.y -= 40 * dt; }
    w.floats = w.floats.filter((f) => f.life < 1.1);
    if (w.flash) { w.flash.t += dt; if (w.flash.t > 0.32) { const rows = w.flash.rows; w.flash = null; finishClear(w, rows); } return; }
    if (x.timeScale > 0) w.left -= dt;
    if (x.timeScale > 0 && w.left <= 0 && !w.over) { endTurn(w); return; }
    const p = w.piece;
    if (!p) return;
    // The computer works out a spot, then turns and slides there step by step.
    if (x.cpu) {
      w.cpuWait -= dt;
      if (!w.cpuPlan) w.cpuPlan = bestPlace(w.grid, p, x.cpuRight());
      if (w.cpuWait <= 0) {
        w.cpuWait = 0.13;
        const plan = w.cpuPlan;
        if (((p.rot % 4) + 4) % 4 !== plan.rot % 4) act('rot', true);
        else if (p.x < plan.x) act('right', true);
        else if (p.x > plan.x) act('left', true);
        else { w.cpuWait = 0.3; act('hard', true); return; }
      }
    }
    const every = (w.fx.slow > 0 ? 1.4 : Math.max(0.4, 0.75 - Math.min(20, w.turnLines) * 0.015)) / (w.soft ? 8 : 1);
    w.drop += dt;
    if (w.fx.hiccup > 0) { w.hic -= dt; if (w.hic <= 0) { w.hic = 1.2 + Math.random(); const up = move(w.grid, p, 0, -1); if (up && up.y >= 0) { w.piece = up; x.sfx.blip(14); w.floats.push({ x: WX + (p.x + 1) * C, y: WY + p.y * C, text: 'hic!', life: 0 }); } } }
    const cur = w.piece!;
    if (w.drop >= every) {
      w.drop = 0;
      const m = move(w.grid, cur, 0, 1);
      if (m) { w.piece = m; if (w.soft) { x.sfx.tick(); } }
    }
    if (w.piece && !move(w.grid, w.piece, 0, 1)) { w.lock += dt; if (w.lock > 0.5) lockPiece(w); } else w.lock = 0;
    if (w.piece) { w.vx += (w.piece.x - w.vx) * Math.min(1, dt * 22); w.vy += (w.piece.y - w.vy) * Math.min(1, dt * 18); }
  }

  function endTurn(w: World) {
    const x = c.current;
    w.over = true; w.piece = null;
    boards.set(x.player.id, { grid: w.grid, lines: w.lines });
    setPhase('over');
    x.sfx.whistle(); x.say('Time!', 'big');
    x.setHeld(x.player.id, []);
    window.setTimeout(() => { if (world.current === w) c.current.next(); }, 2400);
  }

  // ---- Drawing: a candy jar in a sweet shop ----
  function block(g: CanvasRenderingContext2D, px: number, py: number, v: number, alpha = 1, s = C) {
    g.globalAlpha = alpha;
    if (v === BOMB) {
      g.fillStyle = '#241c3d'; g.strokeStyle = '#000'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(px + s / 2, py + s / 2 + 2, s * 0.4, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(px + s * 0.38, py + s * 0.45, 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#000'; g.beginPath(); g.moveTo(px + s * 0.6, py + s * 0.2); g.quadraticCurveTo(px + s * 0.7, py, px + s * 0.85, py + 2); g.stroke();
      g.fillStyle = 'rgba(253,253,148,0.5)'; g.beginPath(); g.arc(px + s * 0.86, py + 2, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ef7d96'; g.beginPath(); g.arc(px + s * 0.86, py + 2, 4, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1; return;
    }
    const i = (v - 1) % 7;
    g.fillStyle = SHADE[i]; g.beginPath(); g.roundRect(px + 1, py + 1, s - 2, s - 2, 8); g.fill();
    g.fillStyle = CANDY[i]; g.beginPath(); g.roundRect(px + 1, py + 1, s - 2, s - 6, 8); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(px + 1, py + 1, s - 2, s - 2, 8); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.ellipse(px + s * 0.34, py + s * 0.3, s * 0.16, s * 0.09, -0.5, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }

  function draw(g: CanvasRenderingContext2D, w: World) {
    const still = c.current.still;
    g.save();
    if (w.shake > 0 && c.current.shake) g.translate((Math.random() - 0.5) * 14 * w.shake, (Math.random() - 0.5) * 14 * w.shake);
    // The sweet shop wall: stripes and a shelf.
    g.fillStyle = '#fbe3ea'; g.fillRect(-20, -20, W + 40, H + 40);
    g.fillStyle = '#f7cfdb'; for (let x = -20; x < W + 20; x += 40) g.fillRect(x, -20, 20, H + 40);
    g.fillStyle = '#d4906d'; g.fillRect(-20, H - 22, W + 40, 30); g.strokeStyle = '#000'; g.lineWidth = 3; g.strokeRect(-20, H - 22, W + 40, 30);
    // The jar.
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.roundRect(WX - 8 + 6, WY - 8 + 8, COLS * C + 16, ROWS * C + 16, 18); g.fill();
    g.fillStyle = '#2c2452'; g.strokeStyle = '#000'; g.lineWidth = 5; g.beginPath(); g.roundRect(WX - 8, WY - 8, COLS * C + 16, ROWS * C + 16, 18); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < ROWS; y++) for (let k = 0; k < COLS; k++) { g.beginPath(); g.arc(WX + k * C + C / 2, WY + y * C + C / 2, 2.5, 0, Math.PI * 2); g.fill(); }
    // Settled candy (rows slide down smoothly after a clear).
    for (let y = 0; y < ROWS; y++) for (let k = 0; k < COLS; k++) {
      const v = w.grid[y][k]; if (!v) continue;
      const flashing = w.flash?.rows.includes(y);
      block(g, WX + k * C, WY + (y + w.fall[y]) * C, v);
      // A full row glows white once (one smooth fade, no flashing).
      if (flashing) { g.fillStyle = `rgba(255,255,255,${Math.min(0.85, w.flash!.t * 3)})`; g.beginPath(); g.roundRect(WX + k * C + 1, WY + y * C + 1, C - 2, C - 2, 8); g.fill(); }
    }
    // The ghost (where it will land) and the falling piece.
    if (w.piece && phaseRef.current === 'play') {
      const d = dropped(w.grid, w.piece);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.setLineDash([5, 4]);
      for (const [gx, gy] of cells(d)) if (gy >= 0) { g.beginPath(); g.roundRect(WX + gx * C + 3, WY + gy * C + 3, C - 6, C - 6, 6); g.stroke(); }
      g.setLineDash([]);
      const ox = (w.vx - w.piece.x) * C, oy = (w.vy - w.piece.y) * C;
      const v = w.piece.kind === 7 ? BOMB : w.piece.kind + 1;
      g.save(); g.beginPath(); g.rect(WX - 4, WY - 4, COLS * C + 8, ROWS * C + 8); g.clip();
      for (const [px, py] of cells(w.piece)) block(g, WX + px * C + ox, WY + py * C + oy, v);
      g.restore();
    }
    // Glass shine on the jar.
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.roundRect(WX + 8, WY + 6, 18, ROWS * C - 12, 9); g.fill();
    if (w.laser > 0) {
      const ly = WY + ROWS * C - (1 - w.laser / 0.6) * 2 * C;
      g.fillStyle = 'rgba(253,253,148,0.55)'; g.fillRect(WX - 8, ly - 10, COLS * C + 16, 20);
      g.fillStyle = '#fff'; g.fillRect(WX - 8, ly - 3, COLS * C + 16, 6);
    }
    if (w.fx.mirror > 0) { g.fillStyle = 'rgba(245,160,140,0.12)'; g.fillRect(WX, WY, COLS * C, ROWS * C); }
    if (w.fx.slow > 0) { g.fillStyle = 'rgba(127,214,227,0.12)'; g.fillRect(WX, WY, COLS * C, ROWS * C); }

    // Side panel: next pieces, rows, time, and the four-row question meter.
    const px = WX + COLS * C + 26;
    panel(g, px, WY - 8, 150, 170);
    label(g, 'Next', px + 75, WY + 14);
    const upcoming = [...w.forced, ...w.queue].slice(0, 2);
    upcoming.forEach((k, i) => mini(g, k, px + 75, WY + 66 + i * 64, i ? 0.55 : 1));
    panel(g, px, WY + 176, 150, 110);
    label(g, 'Rows', px + 75, WY + 198);
    g.font = 'bold 44px "Inclusive Sans", system-ui, sans-serif'; g.fillStyle = '#241c3d'; g.textAlign = 'center'; g.fillText(String(w.lines), px + 75, WY + 248);
    panel(g, px, WY + 296, 150, 92);
    label(g, 'Question', px + 75, WY + 318);
    for (let i = 0; i < 4; i++) { g.fillStyle = i < w.sinceQ ? CANDY[i] : '#e9eefe'; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(px + 16 + i * 31, WY + 340, 26, 26, 7); g.fill(); g.stroke(); }
    panel(g, px, WY + 398, 150, 70);
    const noClock = c.current.timeScale === 0;
    label(g, noClock ? 'Pieces' : 'Time', px + 75, WY + 420);
    const frac = phaseRef.current === 'ready' ? 1 : noClock ? Math.max(0, PIECES_NO_CLOCK - w.pieces) / PIECES_NO_CLOCK : Math.max(0, w.left) / w.runLen;
    g.fillStyle = '#e9eefe'; g.beginPath(); g.roundRect(px + 14, WY + 436, 122, 18, 9); g.fill(); g.stroke();
    g.fillStyle = !noClock && w.left < 8 && phaseRef.current === 'play' ? '#ef7d96' : '#8fe3a0'; g.beginPath(); g.roundRect(px + 16, WY + 438, Math.max(0, 118 * Math.min(1, frac)), 14, 7); g.fill();
    // The gumball machine fills up with a gumball for every row cleared.
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(100, 600, 80, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ef7d96'; g.strokeStyle = '#000'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(40, 600); g.lineTo(58, 340); g.lineTo(132, 340); g.lineTo(150, 600); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c4506c'; g.beginPath(); g.roundRect(36, 330, 118, 26, 10); g.fill(); g.stroke();
    g.fillStyle = '#fbfcf8'; g.beginPath(); g.arc(95, 450, 24, 0, Math.PI * 2); g.fill(); g.stroke();
    g.save(); g.translate(95, 450); g.rotate(still ? 0 : Math.sin(w.t * 1.5) * 0.3); g.fillStyle = '#241c3d'; g.fillRect(-16, -4, 32, 8); g.restore();
    g.fillStyle = '#241c3d'; g.beginPath(); g.roundRect(78, 520, 34, 30, 6); g.fill(); g.stroke();
    g.fillStyle = 'rgba(233,238,254,0.55)'; g.beginPath(); g.arc(95, 245, 82, 0, Math.PI * 2); g.fill(); g.stroke();
    BALLS.slice(0, w.lines).forEach(([bx, by], i) => { g.fillStyle = CANDY[i % 7]; g.beginPath(); g.arc(bx, by + (still ? 0 : Math.sin(w.t * 2 + i) * 0.8), 8, 0, Math.PI * 2); g.fill(); g.lineWidth = 2; g.stroke(); });
    g.lineWidth = 4; g.strokeStyle = '#000'; g.beginPath(); g.arc(95, 245, 82, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(60, 200, 12, 26, 0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c4506c'; g.beginPath(); g.roundRect(80, 152, 30, 14, 6); g.fill(); g.stroke();
    for (const p of w.parts) { g.globalAlpha = Math.max(0, 1 - p.life / p.max); g.fillStyle = p.color; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(p.x, p.y, p.s, p.s, 3); g.fill(); g.stroke(); }
    g.globalAlpha = 1;
    g.font = 'bold 30px "Inclusive Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of w.floats) { g.globalAlpha = Math.max(0, 1 - f.life / 1.1); g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(f.text, f.x, f.y); g.fillStyle = '#fdfd94'; g.fillText(f.text, f.x, f.y); }
    g.globalAlpha = 1;
    g.restore();

    function panel(gg: CanvasRenderingContext2D, x: number, y: number, ww: number, hh: number) {
      gg.fillStyle = 'rgba(0,0,0,0.18)'; gg.beginPath(); gg.roundRect(x + 4, y + 6, ww, hh, 14); gg.fill();
      gg.fillStyle = '#fbfcf8'; gg.strokeStyle = '#000'; gg.lineWidth = 3; gg.beginPath(); gg.roundRect(x, y, ww, hh, 14); gg.fill(); gg.stroke();
    }
    function label(gg: CanvasRenderingContext2D, t: string, x: number, y: number) {
      gg.font = 'bold 23px "Inclusive Sans", system-ui, sans-serif'; gg.fillStyle = '#4a4466'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText(t.toUpperCase(), x, y);
    }
    function mini(gg: CanvasRenderingContext2D, k: number, cx: number, cy: number, a: number) {
      const cs = cells({ kind: k, rot: 0, x: 0, y: 0 });
      const minX = Math.min(...cs.map((q) => q[0])), maxX = Math.max(...cs.map((q) => q[0])), minY = Math.min(...cs.map((q) => q[1])), maxY = Math.max(...cs.map((q) => q[1]));
      const s = 24, ox = cx - ((maxX - minX + 1) * s) / 2, oy = cy - ((maxY - minY + 1) * s) / 2;
      const bob = still ? 0 : Math.sin(w.t * 3) * 2;
      for (const [qx, qy] of cs) block(gg, ox + (qx - minX) * s, oy + (qy - minY) * s + bob, k === 7 ? BOMB : k + 1, a, s);
    }
  }

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const g = cv.getContext('2d'); if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const w = world.current;
      if (phaseRef.current === 'play' && !paused.current && !w.over) update(w, dt);
      else {
        w.t += dt;
        for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; }
        for (let i = 0; i < ROWS; i++) w.fall[i] += (0 - w.fall[i]) * Math.min(1, dt * 10);
      }
      draw(g, w);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('[role="dialog"]') || c.current.cpu) return;
      const k = e.key;
      if (phaseRef.current === 'ready' && (k === ' ' || k === 'Enter')) { e.preventDefault(); void start(); return; }
      const map: Record<string, Parameters<typeof act>[0]> = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'rot', x: 'rot', w: 'rot', z: 'rotBack', ArrowDown: 'soft', s: 'soft', ' ': 'hard' };
      const a = map[k] ?? map[k.toLowerCase()];
      if (!a) return;
      e.preventDefault();
      if (a === 'hard' && e.repeat) return;
      act(a);
    };
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') act('softOff'); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const live = phase === 'play' && !ctx.cpu && !choice;
  return (
    <div className="absolute inset-0 flex flex-col gap-2">
      <div className="flex-1 min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
        <div className="lab-fit relative rounded-[1.2rem] border-heavy border-border overflow-hidden" style={{ '--ar': W / H, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' } as CSSProperties}>
          <canvas ref={canvas} width={W * 2} height={H * 2} className="block w-full h-full touch-none" aria-label="Block Drop candy jar" />
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div className="absolute inset-0 grid place-items-center bg-[rgba(36,28,61,0.3)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.button type="button" onClick={() => void start()} disabled={ctx.cpu} aria-label={ctx.cpu ? 'The computer is getting ready' : 'Start dropping'}
                  className="grid justify-items-center gap-2 rounded-panel border-heavy border-border bg-surface px-8 py-5 motion-safe:hover:scale-105 motion-safe:transition-transform"
                  style={{ boxShadow: '0 8px 0 #000' }} initial={ctx.still ? false : { scale: 0.6, y: -60 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }}>
                  <motion.span animate={ctx.still ? undefined : { y: [0, -10, 0] }} transition={{ duration: 0.9, repeat: Infinity }}><TeamBadge colorIndex={ctx.player.colorIndex} size={80} /></motion.span>
                  <span className="font-display text-[clamp(1.5rem,6cqw,2.4rem)] leading-none inline-flex items-center gap-2"><ArrowLineDown weight="bold" />Drop!</span>
                </motion.button>
              </motion.div>
            )}
            {choice && (
              <motion.div className="absolute inset-0 grid place-items-center bg-[rgba(36,28,61,0.45)] p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="grid gap-3 w-[min(22rem,90%)]" initial={ctx.still ? false : { scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                  {choice === 'main' ? (
                    <>
                      <ChoiceButton onClick={() => pickMain('clear')} disabled={ctx.cpu} bg="#fdfd94" icon={<Broom weight="fill" size={34} />}>Clear the bottom row</ChoiceButton>
                      <ChoiceButton onClick={() => pickMain('piece')} disabled={ctx.cpu} bg="#8fe3a0" icon={<SquaresFour weight="fill" size={34} />}>Pick my next piece</ChoiceButton>
                    </>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {offer.map((k) => (
                        <button key={k} type="button" onClick={() => pickPiece(k)} aria-label="Pick this piece" className="aspect-square rounded-panel border-heavy border-border bg-surface grid place-items-center motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ boxShadow: '0 5px 0 #000' }}>
                          <PieceArt kind={k} />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <Pad label="Slide left" disabled={!live} onPress={() => act('left')} repeat bg="#b4c4fb"><CaretLeft weight="bold" size={24} /><Word>Left</Word></Pad>
        <Pad label="Turn" disabled={!live} onPress={() => act('rot')} bg="#fdfd94"><ArrowArcRight weight="bold" size={24} /><Word>Turn</Word></Pad>
        <Pad label="Slide right" disabled={!live} onPress={() => act('right')} repeat bg="#b4c4fb"><Word>Right</Word><CaretRight weight="bold" size={24} /></Pad>
        <Pad label="Drop faster" disabled={!live} onPress={() => act('soft')} onRelease={() => act('softOff')} bg="#8fe3a0"><ArrowDown weight="bold" size={24} /><Word>Slow drop</Word></Pad>
        <Pad label="Drop now" disabled={!live} onPress={() => act('hard')} bg="#ef7d96"><ArrowLineDown weight="bold" size={24} /><Word>Drop</Word></Pad>
      </div>
    </div>
  );
}

const Word = ({ children }: { children: ReactNode }) => <span className="font-bold text-base leading-none whitespace-nowrap">{children}</span>;

function ChoiceButton({ onClick, disabled, bg, icon, children }: { onClick: () => void; disabled: boolean; bg: string; icon: ReactNode; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="min-h-16 rounded-panel border-heavy border-border px-4 flex items-center gap-3 font-display text-2xl text-left motion-safe:hover:scale-[1.03] motion-safe:transition-transform" style={{ background: bg, boxShadow: '0 6px 0 #000' }}>
      <span className="shrink-0">{icon}</span>{children}
    </button>
  );
}

function PieceArt({ kind }: { kind: number }) {
  const cs = SHAPES[kind];
  const mx = Math.max(...cs.map((p) => p[0])) + 1, my = Math.max(...cs.map((p) => p[1])) + 1, minY = Math.min(...cs.map((p) => p[1]));
  return (
    <svg viewBox="-2 -2 104 104" className="w-[70%] h-[70%]" aria-hidden="true">
      {cs.map(([x, y], i) => <rect key={i} x={(100 - mx * 24) / 2 + x * 24} y={(100 - (my - minY) * 24) / 2 + (y - minY) * 24} width="23" height="23" rx="6" fill={CANDY[kind % 7]} stroke="#000" strokeWidth="3" />)}
    </svg>
  );
}

// A held button repeats like a key (slides keep going).
function Pad({ label, disabled, onPress, onRelease, repeat, children, bg }: { label: string; disabled: boolean; onPress: () => void; onRelease?: () => void; repeat?: boolean; children: ReactNode; bg: string }) {
  const timer = useRef<number | null>(null);
  const stop = () => { if (timer.current) { window.clearTimeout(timer.current); window.clearInterval(timer.current); timer.current = null; } onRelease?.(); };
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPress(); if (repeat) timer.current = window.setTimeout(() => { timer.current = window.setInterval(onPress, 70); }, 220); }}
      onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
      className="min-h-14 min-w-[4.5rem] px-3 gap-1.5 rounded-panel border-heavy border-border inline-flex items-center justify-center touch-none select-none motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-50"
      style={{ boxShadow: '0 5px 0 #000', background: bg }}>
      {children}
    </button>
  );
}

function Cover() {
  const g = [[0, 9, 1], [1, 9, 1], [2, 9, 2], [3, 9, 2], [4, 9, 3], [6, 9, 4], [7, 9, 4], [8, 9, 5], [9, 9, 5], [0, 8, 6], [1, 8, 1], [2, 8, 2], [6, 8, 7], [7, 8, 4], [8, 8, 5], [9, 8, 3], [0, 7, 6], [8, 7, 3], [9, 7, 3]];
  const fall = [[4, 3, 7], [5, 3, 7], [5, 4, 7], [5, 2, 7]];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#fbe3ea" />
      {Array.from({ length: 13 }, (_, i) => <rect key={i} x={i * 8} y="0" width="4" height="62" fill="#f7cfdb" />)}
      <path d="M8 58 L11 36 L21 36 L24 58z" fill="#ef7d96" stroke="#000" strokeWidth="0.8" />
      <circle cx="16" cy="26" r="11" fill="#e9eefe" stroke="#000" strokeWidth="0.8" />
      {[[12, 31], [16, 32], [20, 31], [10, 27], [14, 28], [18, 28], [22, 27], [13, 24], [17, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill={CANDY[i % 7]} stroke="#000" strokeWidth="0.3" />)}
      <rect x="32" y="3" width="36" height="55" rx="4" fill="#2c2452" stroke="#000" strokeWidth="1" />
      {[...g, ...fall].filter(([x]) => x < 8).map(([x, y, k], i) => <rect key={i} x={34 + x * 4} y={12 + y * 4.4} width="3.8" height="4.2" rx="1" fill={CANDY[(k - 1) % 7]} stroke="#000" strokeWidth="0.4" />)}
      <rect x="33.5" y="51.2" width="33" height="1.6" fill="#fff" opacity="0.8" />
      <rect x="0" y="58" width="100" height="4" fill="#d4906d" />
      <rect x="76" y="10" width="18" height="16" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      {[[80, 15], [84, 15], [88, 15], [84, 19]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3.8" height="3.8" rx="1" fill="#c58ce8" stroke="#000" strokeWidth="0.4" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'block-drop',
  name: 'Block Drop',
  description: 'Turn and drop candy blocks to fill rows. Every four rows, a question earns a helping hand.',
  ways: ['solo', 'teams'],
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right for a long turn' },
    { icon: <ArrowArcRight weight="bold" />, text: 'Turn and slide the pieces' },
    { icon: <Rows weight="fill" />, text: "Fill a row to make it burst" },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Sweet shop wall', hint: 'Behind the jar' },
    { id: 'jar', label: 'Candy jar', hint: 'The well the pieces fall into' },
    ...CANDY.map((_, i) => ({ id: `candy-${i + 1}`, label: `Candy block ${i + 1}`, hint: 'One square of a piece' })),
    { id: 'bomb', label: 'Bomb block', hint: 'The Bomb Piece' },
    { id: 'panel', label: 'Side panel', hint: 'Next, Rows, Question and Time boxes' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
