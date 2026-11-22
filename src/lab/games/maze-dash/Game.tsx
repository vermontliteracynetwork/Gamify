import { useEffect, useRef, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { ArrowFatDown, ArrowFatLeft, ArrowFatRight, ArrowFatUp, CheckCircle, Cloud as CloudIcon, PersonSimpleRun, Timer } from '@phosphor-icons/react';
import type { LabCtx, LabDef } from '../../types';
import { ArcadeFrame, StarJar, arcadePowers, clip, labelSize, useArcade, type Arcade } from '../balloon-pop/arcade';
import { TEAM_COLORS } from '../../../engine/turns';
import { canGo, dealZones, dirTo, ghostDir, makeMaze, path, step, zoneOf, type Dir, type Maze } from './rules';

// Maze Dash (Game Lab, inspired by the classic maze-chase arcade game): a
// hedge maze with an answer room in each corner. Steer the little runner
// (arrow keys, a swipe, the arrow pad, or tap a room to run there) into the
// room with the right answer while silly cloud friends wander after you.
// A cloud bump sends you back to the start (it never hurts).

const POWERS = arcadePowers('maze-dash', {
  slow: { name: 'Slow-mo', desc: 'The clouds wander slowly for a while.' },
  magnet: { name: 'Magnet', desc: 'For two questions the magnet pulls the silly clouds away from you.' },
  shield: { name: 'Shield', desc: 'The next cloud bump does not send you back.' },
  double: { name: 'Double Points', desc: 'Every right room scores two for a while.' },
  time: { name: 'Extra Time', desc: 'Five more seconds on the clock.' },
  freeze: { name: 'Freeze', desc: 'The clouds freeze into ice cubes.' },
  giant: { name: 'Giant Mode', desc: 'You grow huge and the clouds run away.' },
  flip: { name: 'Upside Down', desc: 'Whoops! The maze flips over. Arrows still go where they point.' },
});

const FLY = 0.7;
const ROOM = ['#fdfd94', '#f5a08c', '#8fe3a0', '#b4c4fb'];
const PUFF = ['#ffd6e0', '#d6f5ff', '#fff3b0'];
interface Mover { at: number; to: number | null; t: number; dir: Dir; came: Dir | null }
interface Runner extends Mover { queued: Dir | null; goal: number | null; inv: number; steps: number; fly?: { c: number; r: number; t: number } }
interface Cloud extends Mover { home: number; color: string; hop: number }

function layout(W: number) {
  const wide = W >= 118;
  const area = wide ? { x: 2, y: 19, w: W - 31, h: 79 } : { x: 2, y: 19, w: W - 4, h: 61 };
  const rows = 9;
  const cols = Math.max(9, Math.min(19, Math.round(area.w / (area.h / rows))));
  return { wide, area, rows, cols };
}

function Play({ ctx }: { ctx: LabCtx }) {
  const maze = useRef<Maze | null>(null);
  const rooms = useRef<number[]>([-1, -1, -1, -1]);
  const lock = useRef(-1);
  const runner = useRef<Runner>({ at: 0, to: null, t: 0, dir: 1, came: null, queued: null, goal: null, inv: 0, steps: 0 });
  const clouds = useRef<Cloud[]>([]);
  const steps = useRef<{ i: number; t: number; k: number }[]>([]);
  const swipe = useRef<[number, number] | null>(null);
  const world = useRef<HTMLDivElement>(null);
  const L = useRef(layout(160));

  function build(a: Arcade) {
    const l = layout(a.W); L.current = l;
    const m = makeMaze(l.cols, l.rows);
    maze.current = m;
    runner.current = { at: m.start, to: null, t: 0, dir: 1, came: null, queued: null, goal: null, inv: 0, steps: 0 };
    const homes = [Math.floor(l.rows / 2) * l.cols, Math.floor(l.rows / 2) * l.cols + l.cols - 1, Math.floor(l.cols / 2)];
    clouds.current = homes.slice(0, l.cols < 11 ? 2 : 3).map((h, i) => ({ at: h, to: null, t: 0, dir: 0, came: null, home: h, color: PUFF[i], hop: i }));
    steps.current = [];
  }

  const { ar, box, floaters, bits, flash } = useArcade(ctx, {
    onReset: (a) => build(a),
    // Go was tapped: build again only if the box changed shape since.
    onStart: (a) => { const l = layout(a.W); if (!maze.current || l.cols !== maze.current.cols) build(a); },
    onQuestion: (q) => {
      const m = maze.current; if (!m) return;
      const R = runner.current;
      rooms.current = dealZones(q.choices.length, q.correctIndex, zoneOf(m, R.to ?? R.at));
      lock.current = zoneOf(m, R.to ?? R.at);
      R.goal = null;
    },
    step: (dt, real, a) => {
      const m = maze.current; if (!m) return;
      const R = runner.current;
      // The computer picks a room and runs there.
      if (a.ctx.cpu && R.goal === null && a.q) {
        const ok = a.ctx.cpuRight();
        const opts = rooms.current.map((ch, z) => ({ ch, z })).filter(({ ch, z }) => ch >= 0 && z !== lock.current && (ok ? ch === a.q!.correctIndex : ch !== a.q!.correctIndex));
        if (opts.length) R.goal = opts[Math.floor(Math.random() * opts.length)].z;
      }
      moveRunner(m, R, real * 4.6, a);
      const lean = a.on('giant') || a.magnet ? -0.85 : 0.45;
      for (const g of clouds.current) moveCloud(m, g, dt * 2.5, lean);
      // Cloud bumps.
      const [rx, ry] = cellPos(m, R);
      for (const g of clouds.current) {
        const [gx, gy] = cellPos(m, g);
        if (Math.hypot(rx - gx, ry - gy) < 0.6 && a.t > R.inv) {
          const { x, y } = toWorld(rx, ry);
          if (a.on('giant')) { ctx.sfx.pop(); a.bits(x, y, 8, 'puff', ['#fff', g.color]); g.at = g.home; g.to = null; g.t = 0; a.float(x, y, 'Boop!', 'info'); continue; }
          if (a.hurt(x, y)) {
            a.bits(x, y, 10, 'puff', ['#fff', '#e6ecff']); ctx.sfx.slideDown();
            R.fly = { c: rx, r: ry, t: a.t };
            R.at = m.start; R.to = null; R.t = 0; R.goal = null; R.queued = null; R.steps = 0; R.inv = a.t + 1.8;
            lock.current = -1;
          } else R.inv = a.t + 1.2;
        }
      }
    },
  });

  function toWorld(cx: number, cy: number) {
    const l = L.current, m = maze.current!;
    const cs = Math.min(l.area.w / m.cols, l.area.h / m.rows);
    const ox = l.area.x + (l.area.w - cs * m.cols) / 2, oy = l.area.y + (l.area.h - cs * m.rows) / 2;
    return { x: ox + (cx + 0.5) * cs, y: oy + (cy + 0.5) * cs, cs, ox, oy };
  }
  function cellPos(m: Maze, v: Mover): [number, number] {
    const c = v.at % m.cols, r = Math.floor(v.at / m.cols);
    if (v.to === null) return [c, r];
    const c2 = v.to % m.cols, r2 = Math.floor(v.to / m.cols);
    return [c + (c2 - c) * v.t, r + (r2 - r) * v.t];
  }

  function wantDir(m: Maze, R: Runner, at: number): Dir | null {
    if (R.goal !== null) {
      const p = path(m, at, m.zones[R.goal]);
      if (zoneOf(m, at) === R.goal) { R.goal = null; return null; }
      return p.length ? dirTo(m, at, p[0]) : null;
    }
    if (R.queued !== null && canGo(m, at, R.queued)) return R.queued;
    return canGo(m, at, R.dir) && R.steps > 0 ? R.dir : null;
  }
  function moveRunner(m: Maze, R: Runner, d: number, a: Arcade) {
    if (!a.running && !a.cheering) return;
    if (R.fly && a.t - R.fly.t < FLY) return;
    // Turning back mid-cell.
    if (R.to !== null && R.queued !== null && R.goal === null && R.queued === (R.dir + 2) % 4) { [R.at, R.to] = [R.to, R.at]; R.t = 1 - R.t; R.dir = R.queued; }
    let left = d;
    for (let k = 0; k < 3 && left > 0; k++) {
      if (R.to === null) {
        const w = wantDir(m, R, R.at);
        if (w === null) return;
        R.dir = w; R.to = step(m, R.at, w); R.t = 0;
      }
      R.t += left; left = 0;
      if (R.t >= 1) {
        left = R.t - 1; R.at = R.to!; R.to = null; R.t = 0; R.steps += 1;
        arrive(m, R.at, a);
        if (!a.running) return;
      }
    }
  }
  function arrive(m: Maze, at: number, a: Arcade) {
    // Footprints: the last few steps, fading.
    const n = (steps.current[steps.current.length - 1]?.k ?? 0) + 1;
    steps.current = [...steps.current.filter((s) => a.t - s.t < 2.5).slice(-9), { i: at, t: a.t, k: n }];
    if (n % 4 === 0) ctx.sfx.blip(n % 12);
    const z = zoneOf(m, at);
    if (z < 0) { lock.current = -1; return; }
    if (z === lock.current || rooms.current[z] < 0) return;
    lock.current = z;
    const { x, y } = toWorld(at % m.cols, Math.floor(at / m.cols));
    const res = a.answer(rooms.current[z], x, y);
    if (res === 'right') { clip('/lab/maze-dash/zone.mp3', ctx.settings, 0.7); a.bits(x, y, 14, 'confetti', [ROOM[z], '#fff', '#fdfd94']); runner.current.goal = null; }
    else runner.current.goal = null;
  }
  function moveCloud(m: Maze, g: Cloud, d: number, lean: number) {
    if (d <= 0) return;
    if (g.to === null) { const w = ghostDir(m, g.at, g.came, runner.current.at, lean); g.dir = w; g.to = step(m, g.at, w); g.t = 0; }
    g.t += d;
    if (g.t >= 1) { g.at = g.to!; g.came = g.dir; g.to = null; g.t = 0; }
  }

  // Steering: keys, the pad and swipes all queue a direction.
  const go = (d: Dir) => { if (ctx.cpu) return; const R = runner.current; R.queued = (ar.on('flip') ? (d + 2) % 4 : d) as Dir; R.goal = null; if (R.steps === 0) R.steps = 1; };
  const goRef = useRef(go); goRef.current = go;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 };
      if (e.key in map) { e.preventDefault(); goRef.current(map[e.key]); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  function onUp(e: RPointerEvent) {
    const s = swipe.current; swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s[0], dy = e.clientY - s[1];
    if (Math.hypot(dx, dy) < 24) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
  }

  const m = maze.current;
  const l = L.current;
  const giant = ar.on('giant');
  const frozen = ar.on('freeze');
  const padStyle = l.wide ? { right: 'calc(var(--u) * 2)', bottom: 'calc(var(--u) * 4)' } : { right: 'calc(var(--u) * 3)', bottom: 'calc(var(--u) * 2)' };
  const jarStyle = l.wide ? { right: 'calc(var(--u) * 8)', top: 'calc(var(--u) * 27)' } : { left: 'calc(var(--u) * 4)', bottom: 'calc(var(--u) * 1.5)' };
  return (
    <ArcadeFrame ar={ar} box={box} floaters={floaters} bits={bits} flash={flash} label="Maze Dash hedge maze" bg="linear-gradient(#cfe9b8, #a9d98f)"
      hint={<><PersonSimpleRun weight="fill" aria-hidden="true" /> Run to the right answer</>}
      extra={<>
        <StarJar ar={ar} style={jarStyle} />
        {!ctx.cpu && ar.phase === 'play' && <Pad style={padStyle} go={go} />}
      </>}>
      <div ref={world} className="absolute inset-0" onPointerDown={(e) => { swipe.current = [e.clientX, e.clientY]; }} onPointerUp={onUp}>
        {m && <Board m={m} ar={ar} toWorld={toWorld} rooms={rooms.current} steps={steps.current} runner={runner.current} clouds={clouds.current} cellPos={cellPos} giant={giant} frozen={frozen}
          onRoom={(z) => { if (ctx.cpu || !ar.running) return; const R = runner.current; R.goal = z; R.queued = null; }} />}
      </div>
    </ArcadeFrame>
  );
}

function Pad({ style, go }: { style: CSSProperties; go: (d: Dir) => void }) {
  const b = (d: Dir, label: string, Icon: typeof ArrowFatUp, area: string) => (
    <button type="button" aria-label={label} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); go(d); }} onClick={(e) => { if (e.detail === 0) go(d); }}
      className="rounded-2xl border-heavy border-border bg-accent grid place-items-center motion-safe:hover:scale-105 motion-safe:active:scale-90 motion-safe:transition-transform"
      style={{ gridArea: area, boxShadow: '0 4px 0 #000', fontSize: 'max(0.8125rem, calc(var(--u) * 2.6))' }}><span className="grid justify-items-center gap-0.5 font-bold leading-none"><Icon weight="fill" size="1.6em" aria-hidden="true" />{label}</span></button>
  );
  return (
    <div className="absolute z-10 grid gap-1.5" style={{ ...style, width: 'max(10.5rem, calc(var(--u) * 27))', height: 'max(10.5rem, calc(var(--u) * 27))', gridTemplateAreas: '". u ." "l . r" ". d ."', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
      {b(0, 'Up', ArrowFatUp, 'u')}{b(3, 'Left', ArrowFatLeft, 'l')}{b(1, 'Right', ArrowFatRight, 'r')}{b(2, 'Down', ArrowFatDown, 'd')}
    </div>
  );
}

function Board({ m, ar, toWorld, rooms, steps, runner, clouds, cellPos, giant, frozen, onRoom }: {
  m: Maze; ar: Arcade; toWorld: (c: number, r: number) => { x: number; y: number; cs: number; ox: number; oy: number };
  rooms: number[]; steps: { i: number; t: number; k: number }[]; runner: Runner; clouds: Cloud[]; cellPos: (m: Maze, v: Mover) => [number, number]; giant: boolean; frozen: boolean; onRoom: (z: number) => void;
}) {
  const { cs, ox, oy } = toWorld(0, 0);
  const flip = ar.on('flip');
  const pct = (x: number, y: number) => ({ left: `${(x / ar.W) * 100}%`, top: `${y}%` });
  // Walls as one path: a navy outline under a mint hedge.
  let d = '';
  for (let i = 0; i < m.walls.length; i++) {
    const x0 = ox + (i % m.cols) * cs, y0 = oy + Math.floor(i / m.cols) * cs;
    if (m.walls[i] & 1) d += `M${x0} ${y0}h${cs}`;
    if (m.walls[i] & 8) d += `M${x0} ${y0}v${cs}`;
    if (i % m.cols === m.cols - 1 && m.walls[i] & 2) d += `M${x0 + cs} ${y0}v${cs}`;
    if (Math.floor(i / m.cols) === m.rows - 1 && m.walls[i] & 4) d += `M${x0} ${y0 + cs}h${cs}`;
  }
  const right = ar.q ? rooms.indexOf(ar.q.correctIndex) : -1;
  // After a cloud bump the runner tumbles back to the start in an arc.
  let [rc, rr] = cellPos(m, runner);
  const fk = runner.fly ? (ar.t - runner.fly.t) / FLY : 1;
  if (runner.fly && fk < 1) { const e = 1 - (1 - fk) ** 2; rc = runner.fly.c + (rc - runner.fly.c) * e; rr = runner.fly.r + (rr - runner.fly.r) * e - Math.sin(fk * Math.PI) * 2.2; }
  const safe = ar.t < runner.inv;
  const R = toWorld(rc, rr);
  const rs = cs * (giant ? 1.6 : 0.9);
  const moving = runner.to !== null;
  const color = TEAM_COLORS[ar.ctx.player.colorIndex % TEAM_COLORS.length];
  return (
    <>
      <svg viewBox={`0 0 ${ar.W} ${ar.H}`} className="absolute inset-0 w-full h-full pointer-events-none">
        <rect x={ox - 1} y={oy - 1} width={cs * m.cols + 2} height={cs * m.rows + 2} rx="2" fill="#f6efd8" stroke="#241c3d" strokeWidth="0.6" />
        {m.zones.map((z, k) => {
          const c0 = Math.min(...z.map((i) => i % m.cols)), r0 = Math.min(...z.map((i) => Math.floor(i / m.cols)));
          const c1 = Math.max(...z.map((i) => i % m.cols)), r1 = Math.max(...z.map((i) => Math.floor(i / m.cols)));
          return rooms[k] >= 0 && <rect key={k} x={ox + c0 * cs} y={oy + r0 * cs} width={(c1 - c0 + 1) * cs} height={(r1 - r0 + 1) * cs} fill={ROOM[k]} opacity={0.8} />;
        })}
        {steps.map((st) => {
          const p = toWorld(st.i % m.cols, Math.floor(st.i / m.cols));
          const side = st.k % 2 ? 1 : -1;
          return <g key={st.k} opacity={Math.max(0, 0.55 - (ar.t - st.t) * 0.22)} transform={`translate(${p.x + side * cs * 0.12} ${p.y + side * cs * 0.08})`}>
            <ellipse rx={cs * 0.09} ry={cs * 0.11} fill="#a7744a" />
            {[-1, 0, 1].map((k) => <circle key={k} cx={k * cs * 0.07} cy={-cs * 0.15} r={cs * 0.035} fill="#a7744a" />)}
          </g>;
        })}
        <path d={d} stroke="#241c3d" strokeWidth={cs * 0.34} strokeLinecap="round" fill="none" />
        <path d={d} stroke="#5cc37a" strokeWidth={cs * 0.2} strokeLinecap="round" fill="none" />
        <path d={d} stroke="#8fe3a0" strokeWidth={cs * 0.07} strokeLinecap="round" fill="none" transform={`translate(${-cs * 0.03} ${-cs * 0.03})`} />
        {(() => { const s = toWorld(m.start % m.cols, Math.floor(m.start / m.cols)); return <circle cx={s.x} cy={s.y} r={cs * 0.34} fill="none" stroke="#241c3d" strokeWidth={cs * 0.05} strokeDasharray={`${cs * 0.12} ${cs * 0.1}`} />; })()}
      </svg>
      {m.zones.map((z, k) => {
        if (rooms[k] < 0) return null;
        const c0 = Math.min(...z.map((i) => i % m.cols)), r0 = Math.min(...z.map((i) => Math.floor(i / m.cols)));
        const w = (Math.max(...z.map((i) => i % m.cols)) - c0 + 1) * cs, h = (Math.max(...z.map((i) => Math.floor(i / m.cols))) - r0 + 1) * cs;
        const text = ar.q?.choices[rooms[k]] ?? '';
        return (
          <button key={k} type="button" disabled={ar.ctx.cpu || !ar.running} aria-label={`Room: ${text}`} onPointerDown={(e) => { e.stopPropagation(); onRoom(k); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRoom(k); } }}
            className="absolute grid place-items-center p-[3%] disabled:cursor-default focus-visible:outline-4 focus-visible:outline-black rounded-md group"
            style={{ ...pct(ox + c0 * cs + cs * 0.18, oy + r0 * cs + cs * 0.18), width: `calc(var(--u) * ${w - cs * 0.36})`, height: `calc(var(--u) * ${h - cs * 0.36})` }}>
            <span className={`font-bold text-center leading-[1.05] break-words motion-safe:group-hover:scale-105 motion-safe:transition-transform `}
              style={{ fontSize: `calc(var(--u) * ${labelSize(text, w * 0.9, 5)})`, color: '#241c3d', transform: flip ? 'rotate(180deg)' : undefined, textShadow: '0 1px 0 #fff' }}>{text}</span>
          </button>
        );
      })}
      {clouds.map((g, i) => {
        const [gc, gr] = cellPos(m, g);
        const p = toWorld(gc, gr);
        const s = cs * 1.05;
        return (
          <span key={i} className="absolute pointer-events-none" style={{ ...pct(p.x - s / 2, p.y - s / 2 + (ar.ctx.still || frozen ? 0 : Math.sin(ar.t * 6 + g.hop) * cs * 0.06)), width: `calc(var(--u) * ${s})`, height: `calc(var(--u) * ${s})` }}>
            <PuffCloud color={g.color} scared={giant} frozen={frozen} look={g.dir} t={ar.t} still={ar.ctx.still} />
          </span>
        );
      })}
      <span className="absolute pointer-events-none" style={{ ...pct(R.x - rs / 2, R.y - rs / 2), width: `calc(var(--u) * ${rs})`, height: `calc(var(--u) * ${rs})`, transition: 'width .4s, height .4s' }}>
        {(ar.shield || safe) && <span className="absolute -inset-[18%] rounded-full border-4 border-[#7fd6e3] bg-[#7fd6e3]/20" />}
        <span className="absolute inset-0 block" style={{ transform: fk < 1 ? `rotate(${fk * 720}deg)` : undefined }}>
          <RunnerArt color={color} face={runner.dir} hop={moving && !ar.ctx.still ? Math.abs(Math.sin(ar.t * 16)) : 0} />
        </span>
      </span>
    </>
  );
}

// The runner: a little kitten in a hoodie of the player's color, with feet
// that patter and a bounce on every step.
export function RunnerArt({ color, face, hop }: { color: string; face: Dir; hop: number }) {
  const left = face === 3;
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="30" cy="57" rx="14" ry="3" fill="rgba(0,0,0,0.2)" />
      <g transform={`translate(0 ${-hop * 4}) ${left ? 'translate(60 0) scale(-1 1)' : ''}`}>
        <ellipse cx="23" cy={54 + hop * 1.5} rx="5" ry="3.2" fill="#241c3d" /><ellipse cx="37" cy={54 - hop * 1.5} rx="5" ry="3.2" fill="#241c3d" />
        <path d="M17 52 Q15 36 30 35 Q45 36 43 52Z" fill={color} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M43 46 Q52 44 52 36" stroke="#f5a08c" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M14 14 L18 2 L26 11Z M46 14 L42 2 L34 11Z" fill="#f5a08c" stroke="#000" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M17 11 L19 6 L22 10Z M43 11 L41 6 L38 10Z" fill="#ef7d96" />
        <ellipse cx="30" cy="22" rx="17" ry="14" fill="#f5a08c" stroke="#000" strokeWidth="3" />
        <ellipse cx="30" cy="27" rx="9" ry="6" fill="#fbfcf8" />
        <circle cx="24" cy="20" r="2.8" fill="#000" /><circle cx="37" cy="20" r="2.8" fill="#000" />
        <circle cx="25" cy="19" r="1" fill="#fff" /><circle cx="38" cy="19" r="1" fill="#fff" />
        <path d="M29 24 l2 0 -1 1.6z" fill="#ef7d96" stroke="#000" strokeWidth="1" />
        <path d="M27 28 Q30 30 33 28" stroke="#000" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M14 25 h-6 M14 28 h-5 M46 25 h6 M46 28 h5" stroke="#000" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// A silly puffy cloud friend: round bumps on top, a flat round base, googly
// eyes looking where it goes. Scared and blue in Giant Mode, an ice cube
// when frozen.
export function PuffCloud({ color, scared, frozen, look, t, still }: { color: string; scared: boolean; frozen: boolean; look: Dir; t: number; still: boolean }) {
  const lx = [0, 2, 0, -2][look], ly = [-2, 0, 2, 0][look];
  const puff = still || frozen ? 0 : Math.sin(t * 5) * 0.8;
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="30" cy="54" rx="20" ry="3" fill="rgba(0,0,0,0.15)" />
      <path d={`M10 48 Q2 48 3 40 Q4 32 12 32 Q11 ${20 - puff} 22 ${19 - puff} Q28 ${10 - puff} 38 ${15 - puff} Q48 ${14 - puff} 49 25 Q58 27 57 38 Q57 48 49 48 Z`} fill={scared ? '#9fc3ff' : color} stroke="#241c3d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M14 30 Q16 24 22 24" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <circle cx="23" cy="34" r="5.5" fill="#fff" stroke="#241c3d" strokeWidth="2" /><circle cx={23 + lx} cy={34 + ly} r="2.6" fill="#241c3d" />
      <circle cx="37" cy="34" r="5.5" fill="#fff" stroke="#241c3d" strokeWidth="2" /><circle cx={37 + lx} cy={34 + ly} r="2.6" fill="#241c3d" />
      <circle cx="17" cy="42" r="2.6" fill="#ef7d96" opacity="0.6" /><circle cx="43" cy="42" r="2.6" fill="#ef7d96" opacity="0.6" />
      {scared ? <path d="M24 44 q3 -3 6 0 t6 0" stroke="#241c3d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        : <path d="M25 42 Q30 46 35 42" stroke="#241c3d" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      {frozen && <rect x="1" y="8" width="58" height="44" rx="8" fill="rgba(190,235,255,0.55)" stroke="#7fc8f0" strokeWidth="3" />}
      {frozen && <path d="M8 15 l8 0 M8 15 l0 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#cfe9b8, #a9d98f)' }}>
      <rect x="4" y="3" width="70" height="9" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <text x="39" y="9.5" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">Which is a shape?</text>
      <rect x="8" y="15" width="84" height="44" rx="2" fill="#f6efd8" stroke="#241c3d" strokeWidth="0.6" />
      <rect x="8" y="15" width="18" height="11" fill="#fdfd94" /><rect x="74" y="15" width="18" height="11" fill="#f5a08c" /><rect x="8" y="48" width="18" height="11" fill="#8fe3a0" /><rect x="74" y="48" width="18" height="11" fill="#b4c4fb" />
      <text x="17" y="22.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="#241c3d">circle</text><text x="83" y="22.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="#241c3d">red</text>
      <text x="17" y="55.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="#241c3d">jump</text><text x="83" y="55.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="#241c3d">six</text>
      <path d="M26 15v22M26 37h14M40 26v22M54 15v14M54 29h12M66 40v19M74 37h-8M8 37h10M84 26v12" stroke="#241c3d" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M26 15v22M26 37h14M40 26v22M54 15v14M54 29h12M66 40v19M74 37h-8M8 37h10M84 26v12" stroke="#5cc37a" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="47" cy="40" r="3.6" fill="#f6c544" stroke="#000" strokeWidth="0.7" /><circle cx="48.5" cy="39" r="0.8" />
      <path d="M58 46 q-1 -6 4 -7 q5 1 4 7 q-1 1 -2 0 q-1 1 -2 0 q-1 1 -2 0z" fill="#ffd6e0" stroke="#241c3d" strokeWidth="0.6" />
      {[30, 34, 38, 44, 50].map((x) => <circle key={x} cx={x} cy="31" r="0.7" fill="#f6c544" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'maze-dash',
  name: 'Maze Dash',
  description: 'Run the maze to the room with the right answer before the silly clouds bump you.',
  ways: ['solo', 'teams'],
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Read the question at the top' },
    { icon: <ArrowFatRight weight="fill" />, text: 'Steer with the arrows, a swipe, or tap a room' },
    { icon: <CloudIcon weight="fill" />, text: 'Dodge the silly clouds' },
    { icon: <Timer weight="fill" />, text: 'Reach as many right rooms as you can in time' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Garden', hint: 'Around the maze' },
    { id: 'floor', label: 'Maze floor', hint: 'The paths of the maze' },
    { id: 'hedge', label: 'Hedge wall', hint: 'One piece of maze wall' },
    { id: 'rooms', label: 'Answer rooms', hint: 'The four corner rooms (four colors)' },
    { id: 'dot', label: 'Path sparkle', hint: 'The little dots along the paths' },
    { id: 'runner', label: 'Runner', hint: 'The player\'s runner (team color)' },
    { id: 'cloud', label: 'Silly cloud', hint: 'The cloud friends that chase (normal, scared, frozen)' },
    { id: 'pad', label: 'Arrow pad', hint: 'The four arrow buttons' },
    { id: 'jar', label: 'Star jar', hint: 'The jar that fills with stars' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
