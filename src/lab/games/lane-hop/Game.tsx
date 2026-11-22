import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, CaretLeft, CaretRight, CaretUp, CheckCircle, Mountains, Rabbit, Star } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { carry, COLS, cpuMove, danger, lane, objX, safeAbove, safeBelow, trainWarn, worldOf, type Lane, type World as WorldName } from './rules';

// Lane Hop (Game Lab, classic arcade): hop up an endless climb of lanes.
// The world changes every section: a meadow with rolling hay bales, a river
// of logs and lily pads, train tracks with a warning bell, ice with sliding
// penguins, and space with drifting asteroids. A right answer earns hops;
// the furthest row wins. Each team climbs its own way up on its turn.

const CELL = 64;
const VCOLS = COLS + 2; // one scenery column each side
const VROWS = 10;
const W = VCOLS * CELL, H = VROWS * CELL;
const HOPS_RIGHT = 6, HOPS_MISS = 2, TURN_TIME = 30;
const HOP_T = 0.17;
const NAMES: Record<WorldName, string> = { meadow: 'Meadow!', river: 'River!', tracks: 'Train tracks!', ice: 'Ice land!', space: 'Space!' };

function Art({ kind }: { kind: string }) {
  const ring = (f: string) => <circle cx="50" cy="50" r="44" fill={f} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'jetpack' && <>{ring('#b4c4fb')}<rect x="32" y="22" width="15" height="40" rx="7" fill="#ef7d96" stroke="#000" strokeWidth="4" /><rect x="53" y="22" width="15" height="40" rx="7" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M35 64q4 16 4 20q4-4 4-20M56 64q4 16 4 20q4-4 4-20" fill="#fdfd94" stroke="#000" strokeWidth="3" /></>}
      {kind === 'shield' && <>{ring('#e9eefe')}<circle cx="50" cy="50" r="28" fill="rgba(127,214,227,0.5)" stroke="#3fa6b8" strokeWidth="5" /><ellipse cx="40" cy="38" rx="8" ry="5" fill="#fff" transform="rotate(-30 40 38)" /></>}
      {kind === 'slow' && <>{ring('#7fd6e3')}<circle cx="50" cy="52" r="26" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><path d="M50 36v16l10 6" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" /><rect x="44" y="18" width="12" height="8" rx="2" fill="#000" /></>}
      {kind === 'super' && <>{ring('#8fe3a0')}<path d="M50 18l18 22H58v14H42V40H32zM50 46l18 22H58v14H42V68H32z" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" /></>}
      {kind === 'freeze' && <>{ring('#d6efff')}<path d="M50 16v68M20 33l60 34M20 67l60-34" stroke="#3fa6b8" strokeWidth="6" strokeLinecap="round" /><path d="M42 22l8 8 8-8M42 78l8-8 8 8" stroke="#3fa6b8" strokeWidth="4" fill="none" /></>}
      {kind === 'extra' && <>{ring('#fdfd94')}<text x="50" y="66" textAnchor="middle" fontSize="40" fontWeight="900" fill="#241c3d">+4</text></>}
      {kind === 'star' && <>{ring('#241c3d')}{[[30, 36, 10], [62, 28, 12], [52, 62, 14], [74, 64, 8]].map(([x, y, r], i) => <path key={i} d={`M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} 0 -${r * 0.55} ${r * 0.45} ${r * 0.2} ${r * 0.75} -${r * 0.65} -${r * 0.4} -${r * 0.65} ${r * 0.4} ${r * 0.2} -${r * 0.75} -${r * 0.55} -${r * 0.45} ${r * 0.7} 0z`} fill="#fdfd94" stroke="#000" strokeWidth="2" />)}</>}
      {kind === 'mirror' && <>{ring('#f5a08c')}<path d="M24 50h52M32 40l-10 10 10 10M68 40l10 10-10 10" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" /><circle cx="50" cy="28" r="8" fill="#fbfcf8" stroke="#000" strokeWidth="3" /></>}
      {kind === 'hiccup' && <>{ring('#c58ce8')}<ellipse cx="46" cy="58" rx="18" ry="16" fill="#f6c544" stroke="#000" strokeWidth="4" /><circle cx="70" cy="30" r="13" fill="#fff" stroke="#000" strokeWidth="3" /><text x="70" y="35" textAnchor="middle" fontSize="12" fontWeight="900">hic</text></>}
    </svg>
  );
}

const POWERS: LabPower[] = [
  { id: 'jetpack', name: 'Jetpack', desc: 'Blast up five rows or more, right over everything.', enter: 'zoom', art: <Art kind="jetpack" /> },
  { id: 'shield', name: 'Bubble Shield', desc: 'A bubble saves you from one bump or splash.', enter: 'drop', art: <Art kind="shield" /> },
  { id: 'slow', name: 'Slow Time', desc: 'Everything moves in slow motion for a while.', enter: 'zoom', art: <Art kind="slow" /> },
  { id: 'super', name: 'Super Hop', desc: 'Every hop up jumps two rows this turn.', enter: 'drop', art: <Art kind="super" /> },
  { id: 'freeze', name: 'Freeze Ray', desc: 'Everything freezes still for a few seconds.', enter: 'spin', art: <Art kind="freeze" /> },
  { id: 'extra', name: 'Extra Hops', desc: 'Four more hops this turn.', enter: 'spin', art: <Art kind="extra" /> },
  { id: 'star', name: 'Star Shower', desc: 'Stars rain down on the rows ahead. Grab them!', enter: 'drop', art: <Art kind="star" /> },
  { id: 'mirror', name: 'Moonwalk', desc: 'Whoops! Left and right swap this turn.', silly: true, art: <Art kind="mirror" /> },
  { id: 'hiccup', name: 'Hiccup Hop', desc: 'Whoops! Your next hop is a hiccup in place.', silly: true, art: <Art kind="hiccup" /> },
];

interface Pos { row: number; col: number; best: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number; star?: boolean }
interface World {
  t: number; sim: number; left: number; hops: number; row: number; col: number; best: number;
  hop: { from: [number, number]; to: [number, number]; t: number; tiny?: boolean } | null; face: number; squash: number;
  cam: number; jet: { from: number; to: number; t: number } | null; dead: number; shield: number;
  fx: { slow: number; freeze: number; super: boolean; mirror: boolean; hiccup: boolean }; parts: Part[]; floats: { x: number; y: number; text: string; life: number }[];
  warned: Set<number>; over: boolean; cpuWait: number; seen: Set<WorldName>;
}
const positions = new Map<string, Pos>();
const collected = new Set<string>();
const bonus = new Set<string>();

function newWorld(id: string): World {
  const p = positions.get(id) ?? { row: 0, col: Math.floor(COLS / 2), best: 0 };
  return {
    t: 0, sim: 0, left: TURN_TIME, hops: 0, row: p.row, col: p.col, best: p.best, hop: null, face: 1, squash: 0, cam: p.row - 2.5, jet: null, dead: 0, shield: 0,
    fx: { slow: 0, freeze: 0, super: false, mirror: false, hiccup: false }, parts: [], floats: [], warned: new Set(), over: false, cpuWait: 0.6, seen: new Set([worldOf(p.row)]),
  };
}
let simClock = 0; // the world keeps one clock so lanes look the same for every team

type Phase = 'ready' | 'play' | 'over';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  useState(() => { positions.clear(); collected.clear(); bonus.clear(); simClock = 0; return 0; });
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newWorld(ctx.player.id));
  const paused = useRef(false);
  const busy = useRef(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready'); phaseRef.current = phase;
  const [hops, setHops] = useState(0);

  useEffect(() => {
    world.current = newWorld(c.current.player.id);
    setPhase('ready'); setHops(0); busy.current = false;
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
    w.hops = ok ? HOPS_RIGHT : HOPS_MISS;
    if (ok) {
      x.sfx.right();
      paused.current = true;
      const p = await c.current.power(0.45);
      paused.current = false;
      if (p) apply(w, p);
    } else { x.sfx.wrong(); x.say('Two hops', 'oops'); }
    setHops(w.hops);
    setPhase('play');
    busy.current = false;
  }

  function held(w: World) {
    const x = c.current;
    x.setHeld(x.player.id, POWERS.filter((p) => (p.id === 'shield' && w.shield > 0) || (p.id === 'super' && w.fx.super) || (p.id === 'mirror' && w.fx.mirror) || (p.id === 'hiccup' && w.fx.hiccup) || (p.id === 'slow' && w.fx.slow > 0) || (p.id === 'freeze' && w.fx.freeze > 0)));
  }

  function apply(w: World, p: LabPower) {
    const x = c.current;
    switch (p.id) {
      case 'jetpack': { const to = safeAbove(w.row + 5); w.jet = { from: w.row, to, t: 0 }; x.sfx.whoosh(); window.setTimeout(() => c.current.sfx.slideUp(), 150); break; }
      case 'shield': w.shield = 1; x.sfx.boing(); break;
      case 'slow': w.fx.slow = 8; x.sfx.freeze(); break;
      case 'super': w.fx.super = true; x.sfx.boing(); break;
      case 'freeze': w.fx.freeze = 5; x.sfx.freeze(); break;
      case 'extra': w.hops += 4; x.sfx.coin(); break;
      case 'star': for (let r = w.row + 1; r <= w.row + 7; r++) bonus.add(`${r}:${Math.floor(Math.random() * COLS)}`); x.sfx.chest(); break;
      case 'mirror': w.fx.mirror = true; x.sfx.whoosh(); break;
      case 'hiccup': w.fx.hiccup = true; x.sfx.boing(); break;
    }
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    held(w);
  }

  function puff(w: World, px: number, py: number, n: number, color: string, star = false, speed = 160) {
    const many = c.current.still ? Math.ceil(n / 3) : n;
    for (let i = 0; i < many; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      w.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.5 + Math.random() * 0.5, color, r: star ? 6 + Math.random() * 4 : 8 + Math.random() * 10, star });
    }
  }
  const sx = (col: number) => (col + 1) * CELL;
  const sy = (w: World, row: number) => H - (row - w.cam + 1) * CELL;

  function hopTo(w: World, dir: 'up' | 'down' | 'left' | 'right') {
    const x = c.current;
    if (w.hop || w.jet || w.dead > 0 || w.hops <= 0 || w.over) return;
    let d = dir;
    if (w.fx.mirror && (d === 'left' || d === 'right')) d = d === 'left' ? 'right' : 'left';
    const col = Math.round(w.col);
    let to: [number, number] = [w.row, col];
    if (w.fx.hiccup) { w.fx.hiccup = false; held(w); w.hops -= 1; setHops(w.hops); w.hop = { from: [w.row, w.col], to: [w.row, w.col], t: 0, tiny: true }; x.sfx.blip(16); w.floats.push({ x: sx(w.col) + 32, y: sy(w, w.row) - 10, text: 'hic!', life: 0 }); return; }
    if (d === 'up') to = [w.row + (w.fx.super ? 2 : 1), col];
    if (d === 'down') { if (w.row <= 0) return; to = [w.row - 1, col]; }
    if (d === 'left') { if (col <= 0) return; to = [w.row, col - 1]; w.face = -1; }
    if (d === 'right') { if (col >= COLS - 1) return; to = [w.row, col + 1]; w.face = 1; }
    w.hop = { from: [w.row, w.col], to, t: 0 };
    w.hops -= 1; setHops(w.hops);
    x.sfx.jump();
  }

  function landed(w: World) {
    const x = c.current;
    w.squash = 1;
    if (w.row > w.best) {
      const gain = w.row - w.best;
      w.best = w.row; x.points(gain);
      w.floats.push({ x: sx(w.col) + 32, y: sy(w, w.row) - 6, text: `+${gain}`, life: 0 });
    }
    const wn = worldOf(w.row);
    if (!w.seen.has(wn)) { w.seen.add(wn); x.say(NAMES[wn], 'big'); x.sfx.bell(); }
    const key = `${w.row}:${Math.round(w.col)}`;
    const l = lane(w.row);
    if (((l.star !== null && l.star === Math.round(w.col)) || bonus.has(key)) && !collected.has(key)) {
      collected.add(key); x.points(2); x.sfx.coin();
      puff(w, sx(w.col) + 32, sy(w, w.row) + 32, 10, '#fdfd94', true, 200);
      w.floats.push({ x: sx(w.col) + 32, y: sy(w, w.row) - 24, text: '+2', life: 0 });
    }
    if (l.kind === 'water' || l.kind === 'pads') x.sfx.splash(); else x.sfx.tick();
  }

  function bumped(w: World, how: 'hit' | 'splash') {
    const x = c.current;
    const l = lane(w.row);
    const px = sx(w.col) + 32, py = sy(w, w.row) + 32;
    if (w.shield > 0) {
      w.shield = 0; held(w);
      puff(w, px, py, 16, '#7fd6e3', false, 220); x.sfx.pop(); x.say('Bubble saved you!');
      const back = w.row > 0 ? w.row - 1 : 0;
      w.hop = { from: [w.row, w.col], to: [safeBelow(back), Math.round(Math.min(COLS - 1, Math.max(0, w.col)))], t: 0 };
      return;
    }
    if (how === 'splash') { x.sfx.splash(); x.say('Splash!', 'oops'); puff(w, px, py, 16, '#fbfcf8', false, 200); }
    else if (l.kind === 'rail') { x.sfx.whistle(); x.sfx.crash(); x.say('Choo choo! Poof!', 'oops'); puff(w, px, py, 22, '#fbfcf8', true, 300); }
    else { x.sfx.crash(); window.setTimeout(() => c.current.sfx.boing(), 120); x.say(l.kind === 'hay' ? 'Hay bonk!' : l.kind === 'ice' ? 'Penguin bump!' : 'Space bonk!', 'oops'); puff(w, px, py, 18, '#fdfd94', true, 240); }
    w.dead = 1.2; w.hops = 0; setHops(0);
  }

  function endTurn(w: World) {
    const x = c.current;
    if (w.over) return;
    w.over = true;
    positions.set(x.player.id, { row: w.row, col: Math.round(Math.min(COLS - 1, Math.max(0, w.col))), best: w.best });
    setPhase('over');
    x.setHeld(x.player.id, []);
    window.setTimeout(() => { if (world.current === w) c.current.next(); }, 1500);
  }

  function update(w: World, dt: number) {
    const x = c.current;
    w.t += dt;
    const scale = w.fx.freeze > 0 ? 0 : w.fx.slow > 0 ? 0.45 : 1;
    const wasF = w.fx.freeze > 0, wasS = w.fx.slow > 0;
    w.fx.freeze = Math.max(0, w.fx.freeze - dt); w.fx.slow = Math.max(0, w.fx.slow - dt);
    if ((wasF && w.fx.freeze === 0) || (wasS && w.fx.slow === 0)) held(w);
    simClock += dt * scale; w.sim = simClock;
    w.left -= dt;
    w.squash *= Math.pow(0.002, dt);
    for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
    w.parts = w.parts.filter((p) => p.life < p.max);
    for (const f of w.floats) { f.life += dt; f.y -= 40 * dt; }
    w.floats = w.floats.filter((f) => f.life < 1.1);

    // Warning bells for trains that are about to come.
    for (let r = Math.floor(w.cam); r < w.cam + VROWS + 1; r++) {
      const l = lane(r);
      if (l.kind !== 'rail') continue;
      const warn = trainWarn(l, w.sim);
      if (warn && !w.warned.has(r)) { w.warned.add(r); if (Math.abs(r - w.row) < 5) x.sfx.bell(); }
      if (!warn) w.warned.delete(r);
    }

    if (w.dead > 0) {
      w.dead -= dt;
      if (w.dead <= 0) { w.row = safeBelow(w.row); w.col = Math.round(Math.min(COLS - 1, Math.max(0, w.col))); w.squash = 1; endTurn(w); }
      return;
    }
    if (w.jet) {
      w.jet.t += dt / 1.1;
      if (!x.still && Math.random() < dt * 40) puff(w, sx(w.col) + 32, sy(w, w.row) + 56, 1, '#fdfd94', false, 80);
      if (w.jet.t >= 1) { w.row = w.jet.to; w.jet = null; landed(w); }
      else w.row = w.jet.from + (w.jet.to - w.jet.from) * (1 - Math.pow(1 - w.jet.t, 3));
      return;
    }
    if (w.hop) {
      w.hop.t += dt / HOP_T;
      if (w.hop.t >= 1) { w.row = w.hop.to[0]; w.col = w.hop.to[1]; const tiny = w.hop.tiny; w.hop = null; if (!tiny) landed(w); }
      else return;
    }
    // Riding a log.
    const l = lane(w.row);
    w.col += carry(l, dt * scale);
    const d = danger(l, w.sim, w.col);
    if (d !== 'ok') { bumped(w, d); return; }

    // The computer hops on its own.
    if (x.cpu && w.hops > 0) {
      w.cpuWait -= dt;
      if (w.cpuWait <= 0) {
        w.cpuWait = 0.45 + Math.random() * 0.3;
        const m = cpuMove(w.row, Math.round(w.col), w.sim, x.cpuRight());
        if (m !== 'wait') hopTo(w, m);
      }
    }
    if ((w.hops <= 0 && !w.hop) || w.left <= 0) { if (w.left <= 0) x.say('Time!', 'big'); endTurn(w); }
  }

  // ---- Drawing ----
  function draw(g: CanvasRenderingContext2D, w: World) {
    const still = c.current.still;
    const targetCam = w.row - 2.5;
    w.cam += (targetCam - w.cam) * 0.1;
    g.fillStyle = '#8fe3a0'; g.fillRect(0, 0, W, H);
    const first = Math.floor(w.cam) - 1;
    for (let r = first; r < first + VROWS + 2; r++) {
      if (r < 0) { drawLaneBg(g, lane(0), sy(w, r)); continue; }
      drawLane(g, lane(r), sy(w, r), w, still);
    }
    // Other teams' best rows (small markers on the left edge).
    for (const p of c.current.turns.players) {
      const pos = positions.get(p.id);
      if (!pos || p.id === c.current.player.id) continue;
      const y = sy(w, pos.best) + 32;
      if (y < -20 || y > H + 20) continue;
      g.fillStyle = TEAM_COLORS[p.colorIndex % TEAM_COLORS.length]; g.strokeStyle = '#000'; g.lineWidth = 3;
      g.beginPath(); g.arc(30, y, 14, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(44, y); g.lineTo(58, y - 6); g.lineTo(58, y + 6); g.closePath(); g.fill(); g.stroke();
    }
    // The hopper.
    let hx = sx(w.col), hy = sy(w, w.row), lift = 0;
    if (w.hop) {
      const k = w.hop.t, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      hx = sx(w.hop.from[1] + (w.hop.to[1] - w.hop.from[1]) * e);
      hy = sy(w, w.hop.from[0] + (w.hop.to[0] - w.hop.from[0]) * e);
      lift = Math.sin(k * Math.PI) * (w.hop.tiny ? 10 : 26);
    }
    if (w.jet) lift = Math.sin(w.jet.t * Math.PI) * 30;
    if (w.dead > 0) {
      g.globalAlpha = Math.max(0, w.dead / 1.2);
      hopper(g, hx + 32, hy + 32 - (1.2 - w.dead) * 40, w, true);
      g.globalAlpha = 1;
    } else hopper(g, hx + 32, hy + 32 - lift, w, false, lift);
    for (const p of w.parts) {
      g.globalAlpha = Math.max(0, 1 - p.life / p.max);
      if (p.star) starShape(g, p.x, p.y, p.r, p.color);
      else { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.r * (0.6 + p.life), 0, Math.PI * 2); g.fill(); }
    }
    g.globalAlpha = 1;
    g.font = 'bold 26px "Inclusive Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of w.floats) { g.globalAlpha = Math.max(0, 1 - f.life / 1.1); g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(f.text, f.x, f.y); g.fillStyle = '#fdfd94'; g.fillText(f.text, f.x, f.y); }
    g.globalAlpha = 1;
    // Scenery columns at the edges are out of bounds.
    g.fillStyle = 'rgba(36,28,61,0.28)'; g.fillRect(0, 0, CELL, H); g.fillRect(W - CELL, 0, CELL, H);
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(CELL, 0); g.lineTo(CELL, H); g.moveTo(W - CELL, 0); g.lineTo(W - CELL, H); g.stroke();
    // Frozen or slow tint.
    if (w.fx.freeze > 0) { g.fillStyle = 'rgba(214,239,255,0.35)'; g.fillRect(0, 0, W, H); }
    else if (w.fx.slow > 0) { g.fillStyle = 'rgba(127,214,227,0.14)'; g.fillRect(0, 0, W, H); }
    // HUD: best row, hops and time.
    g.fillStyle = 'rgba(36,28,61,0.85)'; g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(W - 150, 10, 140, 46, 14); g.fill(); g.stroke();
    g.fillStyle = '#fdfd94'; g.font = 'bold 26px "Inclusive Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(`Row ${w.best}`, W - 80, 34);
    const frac = phaseRef.current === 'play' ? Math.max(0, w.left) / TURN_TIME : 1;
    g.fillStyle = 'rgba(36,28,61,0.85)'; g.beginPath(); g.roundRect(14, 14, 180, 18, 9); g.fill(); g.stroke();
    g.fillStyle = w.left < 8 && phaseRef.current === 'play' ? '#ef7d96' : '#8fe3a0'; g.beginPath(); g.roundRect(17, 17, 174 * frac, 12, 6); g.fill();
  }

  function drawLaneBg(g: CanvasRenderingContext2D, l: Lane, y: number) {
    const base: Record<string, string> = { grass: '#8fe3a0', hay: '#ecd98e', bank: '#9fdc8a', water: '#7fd6e3', pads: '#7fd6e3', gravel: '#d9d4e6', rail: '#c9c3dd', snow: '#f4f7ff', ice: '#d6efff', moon: '#b9b3cc', void: '#241c3d' };
    g.fillStyle = base[l.kind]; g.fillRect(0, y, W, CELL);
  }

  function drawLane(g: CanvasRenderingContext2D, l: Lane, y: number, w: World, still: boolean) {
    drawLaneBg(g, l, y);
    const t = w.sim;
    const seeded = (k: number) => ((l.row * 37 + k * 91) % 97) / 97;
    // Ground details.
    if (l.kind === 'grass' || l.kind === 'bank') {
      g.fillStyle = l.kind === 'grass' ? '#74d38c' : '#86c873';
      for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(seeded(k) * W, y + 12 + seeded(k + 9) * 40, 10, 5, 0, 0, Math.PI * 2); g.fill(); }
      if (l.kind === 'grass') for (let k = 0; k < 3; k++) { const fx = seeded(k + 20) * (W - 40) + 20, fy = y + 14 + seeded(k + 30) * 36; g.fillStyle = ['#ef7d96', '#fdfd94', '#fbfcf8'][k]; g.beginPath(); g.arc(fx, fy, 5, 0, Math.PI * 2); g.fill(); }
    }
    if (l.kind === 'hay') { g.strokeStyle = '#d8c26a'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { const fx = seeded(k) * W; g.beginPath(); g.moveTo(fx, y + 50); g.lineTo(fx + 4, y + 38); g.stroke(); } }
    if (l.kind === 'water' || l.kind === 'pads') {
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3;
      for (let k = 0; k < 4; k++) { const ox = ((seeded(k) * W + (still ? 0 : w.t * 20 * (k % 2 ? 1 : -1))) % W + W) % W; g.beginPath(); g.moveTo(ox, y + 20 + k * 9); g.quadraticCurveTo(ox + 12, y + 14 + k * 9, ox + 24, y + 20 + k * 9); g.stroke(); }
    }
    if (l.kind === 'gravel') { g.fillStyle = '#b9b3cc'; for (let k = 0; k < 16; k++) { g.beginPath(); g.arc(seeded(k) * W, y + 8 + seeded(k + 3) * 48, 3, 0, Math.PI * 2); g.fill(); } }
    if (l.kind === 'rail') {
      g.fillStyle = '#a0603a'; for (let x = 6; x < W; x += 28) g.fillRect(x, y + 10, 12, 44);
      g.fillStyle = '#6b6385'; g.fillRect(0, y + 18, W, 6); g.fillRect(0, y + 40, W, 6);
    }
    if (l.kind === 'snow') { g.fillStyle = '#e1e8fb'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(seeded(k) * W, y + 20 + seeded(k + 5) * 30, 18, 6, 0, 0, Math.PI * 2); g.fill(); } }
    if (l.kind === 'ice') { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { const fx = seeded(k) * W; g.beginPath(); g.moveTo(fx, y + 14); g.lineTo(fx + 18, y + 30); g.lineTo(fx + 8, y + 46); g.stroke(); } }
    if (l.kind === 'moon') { g.fillStyle = '#9d95b5'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(seeded(k) * W, y + 16 + seeded(k + 2) * 32, 12, 6, 0, 0, Math.PI * 2); g.fill(); } }
    if (l.kind === 'void') { for (let k = 0; k < 10; k++) { g.fillStyle = k % 3 ? '#b4c4fb' : '#fff'; g.fillRect(seeded(k) * W, y + seeded(k + 7) * CELL, 2, 2); } }
    // Lane edge line.
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y + CELL - 3, W, 3);

    // Stars to grab.
    for (let col = 0; col < COLS; col++) {
      const key = `${l.row}:${col}`;
      if ((l.star === col || bonus.has(key)) && !collected.has(key)) starShape(g, sx(col) + 32, y + 32 + (still ? 0 : Math.sin(w.t * 4 + col) * 3), 14, '#fdfd94');
    }

    // Moving things.
    for (const o of l.objs) {
      const ox = objX(l, o, t);
      const px = (ox + 1) * CELL, pw = o.len * CELL;
      if (px > W + 20 || px + pw < -20) continue;
      if (l.kind === 'hay') {
        const rot = still ? 0 : (t * l.speed * l.dir * Math.PI * 2) / 3;
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px + 32, y + 56, 26, 6, 0, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(px + 32, y + 30); g.rotate(rot);
        g.fillStyle = '#f6c544'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 25, 0, Math.PI * 2); g.fill(); g.stroke();
        g.strokeStyle = '#c9952a'; g.lineWidth = 3; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(Math.cos(a) * a * 1.9, Math.sin(a) * a * 1.9); g.stroke();
        g.restore();
      } else if (l.kind === 'water') {
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.roundRect(px + 6, y + 14, pw - 8, 44, 20); g.fill();
        g.fillStyle = '#b07a52'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.roundRect(px + 4, y + 10, pw - 8, 42, 20); g.fill(); g.stroke();
        g.strokeStyle = '#8a5a38'; g.lineWidth = 2; for (let k = 1; k < o.len * 2; k++) { g.beginPath(); g.moveTo(px + k * 32, y + 18); g.lineTo(px + k * 32 + 6, y + 44); g.stroke(); }
        g.fillStyle = '#d9a77c'; g.beginPath(); g.ellipse(px + pw - 12, y + 31, 7, 17, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      } else if (l.kind === 'pads') {
        g.fillStyle = '#5fbf78'; g.strokeStyle = '#000'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(px + 32, y + 32); g.arc(px + 32, y + 32, 26, 0.3, Math.PI * 2 - 0.1); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#ef7d96'; g.beginPath(); g.arc(px + 20, y + 22, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      } else if (l.kind === 'rail') {
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(px + 4, y + 52, pw - 8, 8);
        for (let k = 0; k < o.len; k++) {
          const cx = px + k * CELL;
          g.fillStyle = k === (l.dir === 1 ? o.len - 1 : 0) ? '#ef7d96' : '#241c3d';
          g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.roundRect(cx + 2, y + 6, CELL - 4, 50, 10); g.fill(); g.stroke();
          g.fillStyle = '#fdfd94'; g.beginPath(); g.roundRect(cx + 12, y + 14, CELL - 24, 16, 4); g.fill();
        }
      } else if (l.kind === 'ice') {
        const slide = still ? 0 : Math.sin(t * 10) * 2;
        g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(px + 32, y + 50, 26, 6, 0, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(px + 32, y + 34 + slide); g.scale(l.dir, 1);
        g.fillStyle = '#241c3d'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 28, 15, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = '#fbfcf8'; g.beginPath(); g.ellipse(-2, 4, 20, 9, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f6c544'; g.beginPath(); g.moveTo(26, -4); g.lineTo(38, 0); g.lineTo(26, 4); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -6, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(19, -6, 2, 0, Math.PI * 2); g.fill();
        g.restore();
      } else if (l.kind === 'void') {
        const r = o.len > 1 ? 40 : 24;
        g.save(); g.translate(px + pw / 2, y + 32); g.rotate(still ? 0 : t * 0.8 * l.dir);
        g.fillStyle = '#9d95b5'; g.strokeStyle = '#000'; g.lineWidth = 3;
        g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = r * (0.82 + ((k * 7) % 5) * 0.05); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#7b7396'; g.beginPath(); g.arc(-r * 0.3, -r * 0.2, r * 0.2, 0, Math.PI * 2); g.arc(r * 0.3, r * 0.3, r * 0.14, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
    // The warning light at the edge of the tracks.
    if (l.kind === 'rail') {
      const warn = trainWarn(l, t);
      const on = warn && Math.floor(w.t * 6) % 2 === 0;
      g.fillStyle = '#241c3d'; g.fillRect(CELL / 2 - 4, y + 18, 8, 40);
      g.fillStyle = on ? '#ef4b4b' : '#6b6385'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.arc(CELL / 2, y + 16, 12, 0, Math.PI * 2); g.fill(); g.stroke();
      if (on) { g.fillStyle = 'rgba(239,75,75,0.3)'; g.beginPath(); g.arc(CELL / 2, y + 16, 22, 0, Math.PI * 2); g.fill(); }
    }
  }

  function hopper(g: CanvasRenderingContext2D, x: number, y: number, w: World, poof: boolean, lift = 0) {
    const color = TEAM_COLORS[c.current.player.colorIndex % TEAM_COLORS.length];
    const s = w.squash;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x, y + 22 + lift, 18 - lift * 0.2, 6, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(x, y + 20); g.scale(1.35 * (1 + s * 0.25) * w.face, 1.35 * (1 - s * 0.2 + (lift > 4 ? 0.1 : 0)));
    if (w.jet) { g.fillStyle = '#ef7d96'; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(-24, -34, 10, 24, 4); g.fill(); g.stroke(); }
    // Ears.
    g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 3;
    const wob = c.current.still ? 0 : Math.sin(w.t * 8) * 0.1;
    for (const ex of [-7, 7]) { g.save(); g.translate(ex, -30); g.rotate(ex * 0.03 + wob); g.beginPath(); g.ellipse(0, -10, 5.5, 13, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#ffd2c2'; g.beginPath(); g.ellipse(0, -10, 2.5, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = color; g.restore(); }
    g.beginPath(); g.ellipse(0, -14, 17, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#fbfcf8'; g.beginPath(); g.ellipse(3, -9, 9, 8, 0, 0, Math.PI * 2); g.fill();
    if (poof) { g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(3, -22); g.lineTo(9, -16); g.moveTo(9, -22); g.lineTo(3, -16); g.stroke(); }
    else { g.fillStyle = '#000'; g.beginPath(); g.arc(7, -19, 2.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ef7d96'; g.beginPath(); g.arc(14, -13, 2.4, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (w.shield > 0) { g.strokeStyle = 'rgba(63,166,184,0.9)'; g.fillStyle = 'rgba(127,214,227,0.22)'; g.lineWidth = 4; g.beginPath(); g.arc(x, y - lift * 0, 32, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (w.jet && !c.current.still) { g.fillStyle = '#fdfd94'; g.beginPath(); g.moveTo(x - 22 * w.face, y + 12); g.lineTo(x - 18 * w.face, y + 30 + Math.random() * 10); g.lineTo(x - 14 * w.face, y + 12); g.fill(); }
  }

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const g = cv.getContext('2d'); if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const w = world.current;
      if (phaseRef.current === 'play' && !paused.current && !w.over) update(w, dt);
      else { w.t += dt; w.squash *= Math.pow(0.002, dt); for (const p of w.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; } }
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
      if (phaseRef.current !== 'play' || e.repeat) return;
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = { ArrowUp: 'up', w: 'up', ' ': 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
      const m = map[k] ?? map[k.toLowerCase()];
      if (m) { e.preventDefault(); hopTo(world.current, m); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap the field: above the hopper hops up, beside it hops sideways.
  function tapField(e: RPointerEvent<HTMLCanvasElement>) {
    const w = world.current;
    if (c.current.cpu || phaseRef.current !== 'play') return;
    const r = e.currentTarget.getBoundingClientRect();
    const lx = ((e.clientX - r.left) / r.width) * W, ly = ((e.clientY - r.top) / r.height) * H;
    const hx = sx(w.col) + 32, hy = sy(w, w.row) + 32;
    const dx = lx - hx, dy = ly - hy;
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 30) hopTo(w, dx < 0 ? 'left' : 'right');
    else hopTo(w, dy > 30 ? 'down' : 'up');
  }

  const live = phase === 'play' && !ctx.cpu;
  return (
    <div className="absolute inset-0 flex flex-col gap-2">
      <div className="flex-1 min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
        <div className="lab-fit relative rounded-[1.2rem] border-heavy border-border overflow-hidden" style={{ '--ar': W / H, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' } as CSSProperties}>
          <canvas ref={canvas} width={W * 2} height={H * 2} onPointerDown={tapField} className="block w-full h-full touch-none" aria-label="Lane Hop field: tap above your hopper to hop up" />
          {/* Hops left, as little paw prints. */}
          {phase === 'play' && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[2%] flex gap-1 px-3 py-1.5 rounded-full bg-[rgba(36,28,61,0.8)] border-bold border-border" aria-label={`${hops} hops left`}>
              <AnimatePresence>
                {Array.from({ length: hops }, (_, k) => (
                  <motion.span key={`${ctx.taken}-${k}`} className="w-6 h-6 rounded-full border-std border-border bg-[#fdfd94]" initial={ctx.still ? false : { scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, y: -16, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14, delay: k * 0.05 }} />
                ))}
              </AnimatePresence>
              {hops === 0 && <span className="text-[#fbfcf8] font-bold px-1">0</span>}
            </div>
          )}
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div className="absolute inset-0 grid place-items-center bg-[rgba(36,28,61,0.28)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.button type="button" onClick={() => void start()} disabled={ctx.cpu} aria-label={ctx.cpu ? 'The computer is getting ready' : 'Start hopping'}
                  className="grid justify-items-center gap-2 rounded-panel border-heavy border-border bg-surface px-8 py-5 motion-safe:hover:scale-105 motion-safe:transition-transform"
                  style={{ boxShadow: '0 8px 0 #000' }} initial={ctx.still ? false : { scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }}>
                  <motion.span animate={ctx.still ? undefined : { y: [0, -16, 0], scaleY: [1, 1.08, 0.92, 1] }} transition={{ duration: 0.7, repeat: Infinity }}><TeamBadge colorIndex={ctx.player.colorIndex} size={80} /></motion.span>
                  <span className="font-display text-[clamp(1.5rem,5cqw,2.4rem)] leading-none inline-flex items-center gap-2"><Rabbit weight="fill" />Hop!</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-3">
        <Pad label="Hop left" disabled={!live} onPress={() => hopTo(world.current, 'left')} bg="#b4c4fb"><CaretLeft weight="bold" size={28} /></Pad>
        <Pad label="Hop back" disabled={!live} onPress={() => hopTo(world.current, 'down')} bg="#e9eefe"><CaretDown weight="bold" size={24} /></Pad>
        <Pad label="Hop up" disabled={!live} onPress={() => hopTo(world.current, 'up')} bg="#fdfd94" wide><CaretUp weight="bold" size={30} /><span className="font-display text-2xl">Hop</span></Pad>
        <Pad label="Hop right" disabled={!live} onPress={() => hopTo(world.current, 'right')} bg="#b4c4fb"><CaretRight weight="bold" size={28} /></Pad>
      </div>
    </div>
  );
}

function Pad({ label, disabled, onPress, children, bg, wide }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode; bg: string; wide?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onPointerDown={onPress}
      className={`min-h-14 ${wide ? 'min-w-[9rem] px-5 gap-2' : 'min-w-[4.5rem]'} rounded-panel border-heavy border-border inline-flex items-center justify-center touch-none select-none motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-50`}
      style={{ boxShadow: '0 5px 0 #000', background: bg }}>
      {children}
    </button>
  );
}

function starShape(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 2.5;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  g.closePath(); g.fill(); g.stroke();
}

function Cover() {
  const rows: [string, number][] = [['#241c3d', 0], ['#d6efff', 1], ['#c9c3dd', 2], ['#7fd6e3', 3], ['#ecd98e', 4], ['#8fe3a0', 5]];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      {rows.map(([f, i]) => <rect key={i} x="0" y={i * 10.4} width="100" height="10.4" fill={f} />)}
      {[[12, 3], [70, 6], [40, 2]].map(([x, y], i) => <rect key={i} x={x} y={y} width="0.8" height="0.8" fill="#fff" />)}
      <circle cx="58" cy="5" r="3.6" fill="#9d95b5" stroke="#000" strokeWidth="0.5" />
      <ellipse cx="30" cy="15.6" rx="5" ry="2.6" fill="#241c3d" stroke="#000" strokeWidth="0.5" /><ellipse cx="29.6" cy="16.4" rx="3.4" ry="1.4" fill="#fff" />
      <rect x="0" y="23" width="100" height="1.2" fill="#6b6385" /><rect x="0" y="27.2" width="100" height="1.2" fill="#6b6385" />
      <rect x="62" y="21.6" width="30" height="8" rx="2" fill="#241c3d" stroke="#000" strokeWidth="0.5" /><rect x="88" y="21.6" width="8" height="8" rx="2" fill="#ef7d96" stroke="#000" strokeWidth="0.5" />
      <rect x="10" y="32.8" width="22" height="7" rx="3.5" fill="#b07a52" stroke="#000" strokeWidth="0.5" /><rect x="56" y="32.8" width="18" height="7" rx="3.5" fill="#b07a52" stroke="#000" strokeWidth="0.5" />
      <circle cx="44" cy="36.4" r="3.6" fill="#5fbf78" stroke="#000" strokeWidth="0.5" />
      <circle cx="22" cy="46.8" r="4" fill="#f6c544" stroke="#000" strokeWidth="0.5" /><circle cx="76" cy="46.8" r="4" fill="#f6c544" stroke="#000" strokeWidth="0.5" />
      <g transform="translate(50 56)">
        <ellipse cx="-1.6" cy="-7" rx="1.2" ry="3" fill="#f6c544" stroke="#000" strokeWidth="0.45" /><ellipse cx="1.6" cy="-7" rx="1.2" ry="3" fill="#f6c544" stroke="#000" strokeWidth="0.45" />
        <ellipse cx="0" cy="-2" rx="3.6" ry="3.4" fill="#f6c544" stroke="#000" strokeWidth="0.5" /><circle cx="1.2" cy="-3" r="0.6" />
      </g>
    </svg>
  );
}

const def: LabDef = {
  id: 'lane-hop',
  name: 'Lane Hop',
  description: 'Hop up and up through a meadow, a river, train tracks, ice and space. The furthest row wins!',
  ways: ['solo', 'teams'],
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right for six hops' },
    { icon: <Rabbit weight="fill" />, text: 'Hop up and dodge what moves' },
    { icon: <Star weight="fill" />, text: 'Grab stars on the way' },
    { icon: <Mountains weight="fill" />, text: 'The furthest row wins' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 6 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'hopper', label: 'Hopper', hint: 'The player (wears the team color)' },
    { id: 'grass', label: 'Meadow lane', hint: 'A safe grass lane' },
    { id: 'hay', label: 'Hay bale', hint: 'Rolls across the meadow' },
    { id: 'water', label: 'River lane', hint: 'Water you cannot stand in' },
    { id: 'log', label: 'Log', hint: 'Floats down the river; ride it' },
    { id: 'pad', label: 'Lily pad', hint: 'A still spot in the river' },
    { id: 'rail', label: 'Train tracks', hint: 'Where the train runs' },
    { id: 'train', label: 'Train', hint: 'Zooms by after the bell' },
    { id: 'light', label: 'Warning light', hint: 'Blinks before a train' },
    { id: 'ice', label: 'Ice lane', hint: 'Where penguins slide' },
    { id: 'penguin', label: 'Penguin', hint: 'Slides across the ice' },
    { id: 'space', label: 'Space lane', hint: 'Dark sky with stars' },
    { id: 'asteroid', label: 'Asteroid', hint: 'Drifts across space' },
    { id: 'star', label: 'Star', hint: 'A bonus to grab' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
