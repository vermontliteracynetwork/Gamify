import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, HandSwipeRight, Knife, Timer } from '@phosphor-icons/react';
import type { LabCtx, LabDef } from '../../types';
import { ArcadeFrame, ChickenArt, StarJar, arcadePowers, clip, labelSize, pick, rand, squawk, useArcade, worldPoint, type Arcade } from '../balloon-pop/arcade';
import { makeBag } from '../balloon-pop/rules';
import { fly, GRAVITY, segmentHits, toss } from './rules';

// Fruit Fling (Game Lab, inspired by the classic slice-the-fruit arcade
// game): fruits carrying answers are tossed up in arcs. Swipe (or tap) the
// right one: it splits in two halves that tumble down, juice splashes and a
// splat stays on the wall for a moment. Silly rubber chickens fly up too:
// slice one and it squawks in a puff of feathers (it costs nothing).

const POWERS = arcadePowers('fruit-fling', {
  slow: { name: 'Slow-mo', desc: 'Fruit flies in slow motion for a while.' },
  magnet: { name: 'Magnet', desc: 'For two questions the right fruit grows big and floats slowly.' },
  shield: { name: 'Shield', desc: 'Your next wrong slice or chicken costs nothing.' },
  double: { name: 'Double Points', desc: 'Every right slice scores two for a while.' },
  time: { name: 'Extra Time', desc: 'Five more seconds on the clock.' },
  freeze: { name: 'Freeze', desc: 'Every fruit hangs still in the air.' },
  giant: { name: 'Giant Fruit', desc: 'Fruit grows big and easy to slice.' },
  chickens: { name: 'Rubber Chicken Rain', desc: 'Squawk! A flock of rubber chickens flies up with the fruit.' },
});

interface Kind { id: string; skin: string; flesh: string; juice: string; leaf?: boolean }
const FRUITS: Kind[] = [
  { id: 'apple', skin: '#ef5a6f', flesh: '#fff3d6', juice: '#ffd9a0', leaf: true },
  { id: 'orange', skin: '#f7a440', flesh: '#ffc56b', juice: '#ffb347' },
  { id: 'melon', skin: '#5cc37a', flesh: '#ff7f96', juice: '#ff8fa5' },
  { id: 'lemon', skin: '#f6e05e', flesh: '#fff7b0', juice: '#fff080', leaf: true },
  { id: 'plum', skin: '#a77be0', flesh: '#f2c4ff', juice: '#d59cf0' },
  { id: 'peach', skin: '#f5a08c', flesh: '#ffd8a8', juice: '#ffc89a', leaf: true },
];

interface Item { id: number; choice: number; chicken: boolean; x: number; y: number; vx: number; vy: number; rot: number; spin: number; kind: Kind; knock: number }
interface Half { id: number; x: number; y: number; kind: Kind; ang: number }
interface Splat { id: number; x: number; y: number; color: string; r: number }

function Play({ ctx }: { ctx: LabCtx }) {
  const items = useRef<Item[]>([]);
  const bag = useRef<() => number>(() => 0);
  const wave = useRef(0.4);
  const nid = useRef(1);
  const down = useRef(false);
  const swipeWrong = useRef(false);
  const prev = useRef<[number, number] | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number; t: number }[]>([]);
  const [halves, setHalves] = useState<Half[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const world = useRef<HTMLDivElement>(null);
  const cpu = useRef(1.8);

  function launch(a: Arcade, choice: number, chicken: boolean) {
    const peak = rand(30, 52);
    const tt = toss(a.W, peak);
    // Under Freeze new fruit appears already hanging in the air.
    if (a.speed === 0) { tt.y = peak + rand(-4, 8); tt.vy = 0; tt.x += tt.vx * 1.2; }
    items.current.push({ id: nid.current++, choice, chicken, ...tt, rot: rand(-30, 30), spin: rand(-120, 120), kind: pick(FRUITS), knock: -9 });
  }

  const { ar, box, floaters, bits, flash } = useArcade(ctx, {
    onReset: () => { items.current = []; },
    onStart: () => { items.current = []; },
    onQuestion: (q) => {
      bag.current = makeBag(q.choices.length);
      for (const it of items.current) if (!it.chicken) it.choice = -1;
      wave.current = 0.3;
    },
    step: (dt, real, a) => {
      for (const it of items.current) {
        // Fruit from the last question drops away and fades.
        if (it.choice === -1 && !it.chicken) { it.vy = Math.max(it.vy, 30) + 80 * real; it.y += it.vy * real; it.rot += it.spin * real; continue; }
        const right = a.q && it.choice === a.q.correctIndex;
        const g = a.magnet && right && it.vy > 0 ? GRAVITY * 0.25 : GRAVITY;
        const n = fly(it, dt, g);
        it.x = n.x; it.y = n.y; it.vx = n.vx; it.vy = n.vy;
        if (a.magnet && right) it.vy = Math.min(it.vy, 6);
        it.rot += it.spin * dt;
      }
      items.current = items.current.filter((it) => it.y < 118 && it.choice !== -2);
      wave.current -= a.speed === 0 ? real : dt;
      const live = items.current.filter((it) => !it.chicken && it.choice >= 0).length;
      if (wave.current <= 0 && a.q && live < 5) {
        const n = Math.min(a.q.choices.length, live < 1 ? 3 : 2);
        for (let i = 0; i < n; i++) window.setTimeout(() => launch(ar, bag.current(), false), i * 260);
        if (Math.random() < (a.on('chickens') ? 1 : 0.3)) window.setTimeout(() => launch(ar, -1, true), 400);
        if (a.on('chickens')) window.setTimeout(() => launch(ar, -1, true), 650);
        wave.current = a.on('chickens') ? rand(0.9, 1.3) : rand(1.6, 2.3);
      }
      // The computer swipes through a fruit of its choosing.
      if (a.ctx.cpu && a.running && (cpu.current -= real) <= 0) {
        cpu.current = rand(1.2, 2.1);
        const ok = a.ctx.cpuRight();
        const pool = items.current.filter((it) => !it.chicken && it.choice >= 0 && it.y < 85 && (ok ? it.choice === a.q?.correctIndex : it.choice !== a.q?.correctIndex));
        if (pool.length) {
          const it = pick(pool);
          const now = performance.now();
          setTrail([{ x: it.x - 10, y: it.y - 8, t: now }, { x: it.x, y: it.y, t: now }, { x: it.x + 10, y: it.y + 8, t: now }]);
          slice(it, a);
        }
      }
      // Old trail points fade.
      if (trail.length) { const now = performance.now(); if (trail.some((p) => now - p.t > 220)) setTrail((l) => l.filter((p) => now - p.t <= 220)); }
    },
  });

  const radius = (it: Item) => (it.chicken ? 6.5 : 8.5) * (ar.on('giant') ? 1.4 : 1) * (ar.magnet && !it.chicken && it.choice === ar.q?.correctIndex ? 1.25 : 1);

  function slice(it: Item, a: Arcade = ar) {
    if (it.choice === -2 || it.choice === -1 && !it.chicken) return;
    if (it.chicken) {
      squawk(ctx.settings); a.bits(it.x, it.y, 10, 'feather'); a.float(it.x, it.y, 'Squawk!', 'info');
      it.choice = -2;
      return;
    }
    if (a.ctx.cpu && !a.running) return;
    if (a.locked(it.id)) return;
    const res = a.answer(it.choice, it.x, it.y, it.id);
    if (res === 'right') {
      clip('/lab/fruit-fling/slice.mp3', ctx.settings, 0.8);
      ctx.sfx.splash();
      a.bits(it.x, it.y, 14, 'juice', [it.kind.juice, it.kind.flesh, it.kind.skin]);
      const h = { id: it.id, x: it.x, y: it.y, kind: it.kind, ang: rand(-35, 35) };
      setHalves((l) => [...l, h]);
      window.setTimeout(() => setHalves((l) => l.filter((v) => v !== h)), 1500);
      const sp = { id: it.id, x: it.x, y: it.y, color: it.kind.juice, r: rand(9, 13) };
      setSplats((l) => [...l.slice(-5), sp]);
      window.setTimeout(() => setSplats((l) => l.filter((v) => v !== sp)), 3200);
      it.choice = -2;
    } else if (res === 'wrong' || res === 'shielded') {
      it.knock = a.t; it.vy = Math.min(it.vy, 0) - 14; it.vx = -it.vx * 0.6; it.spin = -it.spin * 2;
    }
  }

  function trySlice(x0: number, y0: number, x1: number, y1: number) {
    for (const it of items.current) {
      if (it.choice === -2 || it.choice === -1 && !it.chicken || ar.locked(it.id) || !segmentHits(x0, y0, x1, y1, it.x, it.y, radius(it))) continue;
      // One wrong fruit per swipe at most: a long swipe never boings twice.
      const wrong = !it.chicken && it.choice !== ar.q?.correctIndex;
      if (wrong && swipeWrong.current) continue;
      if (wrong) swipeWrong.current = true;
      slice(it);
      if (!it.chicken) break;
    }
  }
  function pt(e: RPointerEvent): [number, number] | null {
    if (!world.current || !e.clientX && !e.clientY) return null;
    return worldPoint(e, world.current, ar);
  }
  function onDown(e: RPointerEvent) {
    if (ctx.cpu || !ar.running) return;
    down.current = true;
    swipeWrong.current = false;
    const p = pt(e); if (!p) return;
    prev.current = p;
    setTrail([{ x: p[0], y: p[1], t: performance.now() }]);
    trySlice(p[0], p[1], p[0], p[1]);
  }
  function onMove(e: RPointerEvent) {
    if (!down.current || ctx.cpu) return;
    const p = pt(e); if (!p) return;
    if (prev.current) trySlice(prev.current[0], prev.current[1], p[0], p[1]);
    prev.current = p;
    const now = performance.now();
    setTrail((l) => [...l.filter((v) => now - v.t < 220).slice(-10), { x: p[0], y: p[1], t: now }]);
    if (Math.random() < 0.08) ctx.sfx.swish();
  }
  const onUp = () => { down.current = false; prev.current = null; };

  const giant = ar.on('giant') ? 1.4 : 1;
  return (
    <ArcadeFrame ar={ar} box={box} floaters={floaters} bits={bits} flash={flash} label="Fruit Fling orchard" rain={false} bg="linear-gradient(#ffe6c4, #f8d2a2)"
      hint={<><HandSwipeRight weight="fill" aria-hidden="true" /> Swipe the right fruit</>}
      extra={<StarJar ar={ar} style={{ left: 'calc(var(--u) * 2.5)', bottom: 'calc(var(--u) * 3)' }} />}>
      <div ref={world} className="absolute inset-0" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}>
        <Wall />
        {splats.map((s) => (
          <motion.span key={s.id} className="absolute pointer-events-none" style={{ left: `${((s.x - s.r) / ar.W) * 100}%`, top: `${s.y - s.r}%`, width: `calc(var(--u) * ${s.r * 2})`, height: `calc(var(--u) * ${s.r * 2})` }}
            initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 1, opacity: [0.9, 0.7, 0] }} transition={{ duration: 3, times: [0, 0.6, 1] }}>
            <svg viewBox="0 0 40 40" className="w-full h-full"><path d="M20 4 Q25 12 32 8 Q30 16 37 20 Q30 24 33 32 Q25 29 20 37 Q15 29 7 32 Q10 24 3 20 Q10 16 8 8 Q15 12 20 4Z" fill={s.color} /></svg>
          </motion.span>
        ))}
        {items.current.map((it) => {
          const r = radius(it);
          const text = it.chicken || it.choice < 0 ? '' : ar.q?.choices[it.choice] ?? '';
          const rest = ar.locked(it.id);
          const knocked = ar.t - it.knock < 0.4;
          return (
            <button key={it.id} type="button" tabIndex={it.chicken || it.choice < 0 ? -1 : 0} disabled={ctx.cpu || !ar.running}
              aria-label={it.chicken ? 'Rubber chicken' : `Fruit: ${text}`}
              onPointerDown={(e) => { if (!e.clientX && !e.clientY) { e.stopPropagation(); slice(it); } }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); slice(it); } }}
              className="absolute rounded-full focus-visible:outline-4 focus-visible:outline-black disabled:cursor-default"
              style={{ left: `${((it.x - r) / ar.W) * 100}%`, top: `${it.y - r}%`, width: `calc(var(--u) * ${r * 2})`, height: `calc(var(--u) * ${r * 2})`, opacity: it.choice === -1 && !it.chicken ? 0.4 : rest ? 0.45 : 1, transition: 'width .3s, height .3s, opacity .3s' }}>
              <span className="absolute inset-0 block" style={{ transform: `rotate(${it.rot}deg) scale(${knocked ? 0.85 : 1})`, transition: 'transform .1s' }}>
                {it.chicken ? <ChickenArt flat /> : <FruitArt kind={it.kind} />}
              </span>
              {text && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fbfcf8] border-std border-border rounded-xl px-1.5 py-0.5 font-bold text-center leading-[1.05]"
                  style={{ fontSize: `calc(var(--u) * ${labelSize(text, r * 1.9 * giant / giant, 4.6)})`, color: '#241c3d', maxWidth: `calc(var(--u) * ${r * 2.3})`, minWidth: `calc(var(--u) * ${r * 0.9})`, boxShadow: '0 2px 0 #000' }}>{text}</span>
              )}
            </button>
          );
        })}
        <AnimatePresence>
          {halves.map((h) => [-1, 1].map((side) => (
            <motion.span key={`${h.id}${side}`} className="absolute pointer-events-none" style={{ left: `${((h.x - 8.5) / ar.W) * 100}%`, top: `${h.y - 8.5}%`, width: 'calc(var(--u) * 17)', height: 'calc(var(--u) * 17)' }}
              initial={{ x: 0, y: 0, rotate: h.ang, opacity: 1 }} animate={{ x: `${side * 70}%`, y: ['0%', '-20%', '260%'], rotate: h.ang + side * 160, opacity: [1, 1, 0.9] }} transition={{ duration: 1.4, ease: 'easeIn', times: [0, 0.2, 1] }}>
              <HalfArt kind={h.kind} side={side} />
            </motion.span>
          )))}
        </AnimatePresence>
        {trail.length > 1 && (
          <svg viewBox={`0 0 ${ar.W} ${ar.H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline points={trail.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1.5px #241c3d)' }} />
          </svg>
        )}
      </div>
    </ArcadeFrame>
  );
}

// One round fruit: skin, shine, a stalk and sometimes a leaf.
export function FruitArt({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
      {kind.id === 'melon'
        ? <><ellipse cx="50" cy="54" rx="46" ry="40" fill={kind.skin} stroke="#000" strokeWidth="4" />{[30, 50, 70].map((x) => <path key={x} d={`M${x} 16 Q${x + (x - 50) * 0.3} 54 ${x} 92`} stroke="#2f8a4c" strokeWidth="5" fill="none" />)}</>
        : <circle cx="50" cy="54" r="42" fill={kind.skin} stroke="#000" strokeWidth="4" />}
      {kind.id === 'orange' && [[36, 40], [60, 66], [66, 38], [40, 70]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" fill="#000" opacity="0.15" />)}
      <ellipse cx="34" cy="36" rx="9" ry="14" fill="#fff" opacity="0.5" transform="rotate(30 34 36)" />
      <path d="M50 14 Q52 6 58 2" stroke="#5a3a20" strokeWidth="5" fill="none" strokeLinecap="round" />
      {kind.leaf && <path d="M54 8 Q70 0 78 10 Q66 18 54 8Z" fill="#8fe3a0" stroke="#000" strokeWidth="3" strokeLinejoin="round" />}
    </svg>
  );
}
function HalfArt({ kind, side }: { kind: Kind; side: number }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
      <g transform={side > 0 ? 'translate(100 0) scale(-1 1)' : undefined}>
        <path d="M50 12 A42 42 0 0 0 50 96 Z" fill={kind.skin} stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 20 A34 34 0 0 0 50 88 Z" fill={kind.flesh} />
        {kind.id === 'melon' ? [36, 54, 72].map((y) => <ellipse key={y} cx="40" cy={y} rx="2" ry="3.4" fill="#241c3d" />) : <ellipse cx="44" cy="54" rx="3" ry="5" fill="#8a5a2a" />}
        <path d="M50 12 V96" stroke="#000" strokeWidth="4" />
      </g>
    </svg>
  );
}

// The Classic stage: a sunny orchard wall of wooden planks and a striped
// awning, like a fruit stand at a market.
function Wall() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 20} y="0" width="20" height="100" fill={i % 2 ? '#e9b67c' : '#efc08a'} stroke="#c58f5a" strokeWidth="0.6" />)}
        {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={i * 20 + 10} cy={30 + (i % 3) * 22} r="0.9" fill="#a8743f" />)}
        <rect x="0" y="88" width="200" height="12" fill="#a8743f" stroke="#241c3d" strokeWidth="0.8" />
        <rect x="0" y="88" width="200" height="2" fill="#c58f5a" />
      </svg>
      <div className="absolute inset-x-0 top-0 flex" style={{ height: '6%' }}>
        {Array.from({ length: 14 }, (_, i) => <span key={i} className="flex-1 border-b-2 border-border" style={{ background: i % 2 ? '#fbfcf8' : '#ef7d96', borderRadius: '0 0 999px 999px' }} />)}
      </div>
      <div className="absolute" style={{ right: '3%', bottom: '12%', width: '16%', height: '14%' }}>
        <svg viewBox="0 0 80 50" className="w-full h-full"><path d="M4 18 H76 L68 48 H12Z" fill="#c58f5a" stroke="#241c3d" strokeWidth="2.5" /><path d="M8 26 H72 M10 36 H70" stroke="#8a5a2a" strokeWidth="2" />
          {[[18, 14, '#ef5a6f'], [32, 10, '#f7a440'], [46, 14, '#f6e05e'], [60, 11, '#a77be0']].map(([x, y, f]) => <circle key={x as number} cx={x as number} cy={y as number} r="8" fill={f as string} stroke="#241c3d" strokeWidth="2" />)}</svg>
      </div>
    </div>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#ffe6c4, #f3c58f)' }}>
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 10} y="0" width="10" height="62" fill={i % 2 ? '#e9b67c' : '#efc08a'} />)}
      <rect x="4" y="3" width="70" height="9" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <text x="39" y="9.5" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">What is 4 + 4?</text>
      <path d="M14 44 Q40 18 70 26" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g><path d="M30 22 A10 10 0 0 0 30 42Z" fill="#ef5a6f" stroke="#000" strokeWidth="0.7" transform="rotate(-20 30 32)" /><path d="M33 22 A10 10 0 0 1 33 42Z" fill="#ef5a6f" stroke="#000" strokeWidth="0.7" transform="rotate(25 33 32) translate(3 0)" /></g>
      {[[58, 34, '#f7a440', '6'], [80, 24, '#5cc37a', '8'], [70, 48, '#a77be0', '9']].map(([x, y, f, w], i) => (
        <g key={i}><circle cx={x as number} cy={y as number} r="8" fill={f as string} stroke="#000" strokeWidth="0.8" /><rect x={(x as number) - 4} y={(y as number) - 3.2} width="8" height="6" rx="2" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" /><text x={x as number} y={(y as number) + 1.8} textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">{w}</text></g>
      ))}
      <circle cx="31" cy="29" r="1.6" fill="#ffd9a0" /><circle cx="36" cy="24" r="1.2" fill="#ffd9a0" />
    </svg>
  );
}

const def: LabDef = {
  id: 'fruit-fling',
  name: 'Fruit Fling',
  description: 'Fruits with answers fly up in arcs. Slice the right one and dodge the rubber chickens.',
  ways: ['solo', 'teams'],
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Read the question at the top' },
    { icon: <HandSwipeRight weight="fill" />, text: 'Swipe or tap the right fruit' },
    { icon: <Knife weight="fill" />, text: 'Rubber chickens just squawk' },
    { icon: <Timer weight="fill" />, text: 'Slice as many as you can in time' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Fruit stand wall', hint: 'The wooden wall behind the fruit' },
    { id: 'awning', label: 'Awning', hint: 'The striped awning along the top' },
    ...FRUITS.map((f) => ({ id: `fruit-${f.id}`, label: `Fruit: ${f.id}`, hint: 'A whole fruit and its two cut halves' })),
    { id: 'chicken', label: 'Rubber chicken', hint: 'The silly thing to dodge' },
    { id: 'splat', label: 'Juice splat', hint: 'The splash left on the wall' },
    { id: 'jar', label: 'Star jar', hint: 'The jar that fills with stars' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
