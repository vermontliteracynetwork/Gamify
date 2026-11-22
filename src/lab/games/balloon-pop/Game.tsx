import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Confetti, HandTap, Timer } from '@phosphor-icons/react';
import type { LabCtx, LabDef } from '../../types';
import { ArcadeFrame, Rain, StarJar, arcadePowers, clip, labelSize, pick, rand, useArcade, type Arcade } from './arcade';
import { balloonKind, makeBag, spawnX } from './rules';

// Balloon Pop (Game Lab, inspired by the classic classroom balloon game):
// answer balloons float up from the hills with a sway, in different sizes
// and speeds. Pop the one with the right answer: a pop, confetti, its string
// tumbling down, and a star dropping into the jar.

const COLORS = ['#ef7d96', '#f5a08c', '#fdfd94', '#8fe3a0', '#b4c4fb', '#7fd6e3', '#c58ce8'];

const POWERS = arcadePowers('balloon-pop', {
  slow: { name: 'Slow-mo', desc: 'Balloons drift up extra slowly for a while.' },
  magnet: { name: 'Magnet', desc: 'For two questions the right balloon puffs up big and floats slowly.' },
  shield: { name: 'Shield', desc: 'Your next wrong pop costs nothing.' },
  double: { name: 'Double Points', desc: 'Every right pop scores two for a while.' },
  time: { name: 'Extra Time', desc: 'Five more seconds on the clock.' },
  giant: { name: 'Giant Balloons', desc: 'Balloons puff up big and easy to tap.' },
  flip: { name: 'Upside Down', desc: 'Whoops! The sky flips and balloons float down.' },
  wobble: { name: 'Wobble Screen', desc: 'Wibble wobble! The whole sky jiggles.' },
});

interface Balloon { id: number; choice: number; x0: number; x: number; y: number; r: number; speed: number; amp: number; ph: number; color: string; leave: boolean; hitAt: number; text: string }
interface Drop { id: number; x: number; y: number; color: string; spin: number }

function Play({ ctx }: { ctx: LabCtx }) {
  const list = useRef<Balloon[]>([]);
  const bag = useRef<() => number>(() => 0);
  const spawnIn = useRef(0);
  const cpu = useRef<{ id: number; at: number } | null>(null);
  const cpuWait = useRef(1.5);
  const [drops, setDrops] = useState<Drop[]>([]);
  const nid = useRef(1);

  function spawn(ar: Arcade, y?: number) {
    const choice = bag.current();
    const { r, speed } = balloonKind();
    // The spot farthest from the balloons already low in the sky.
    const low = list.current.filter((b) => !b.leave && b.y > 55);
    let x0 = spawnX(ar.W, r), best = -1;
    for (let k = 0; k < 6; k++) { const x = spawnX(ar.W, r); const d = Math.min(99, ...low.map((b) => Math.abs(b.x0 - x))); if (d > best) { best = d; x0 = x; } }
    list.current.push({ id: nid.current++, choice, text: ar.q?.choices[choice] ?? '', x0, x: x0, y: y ?? 100 + r * 1.3, r, speed, amp: rand(1.5, 4.5), ph: rand(0, 6.28), color: pick(COLORS), leave: false, hitAt: -9 });
  }

  const { ar, box, floaters, bits, flash } = useArcade(ctx, {
    onReset: () => { list.current = []; },
    onStart: () => { list.current = []; },
    onQuestion: (q, a) => {
      for (const b of list.current) b.leave = true;
      bag.current = makeBag(q.choices.length);
      a = { ...a, q };
      const n = Math.min(4, q.choices.length + 1);
      for (let i = 0; i < n; i++) spawn(a, 62 + i * 14 + rand(-4, 4));
      spawnIn.current = 1.1;
    },
    step: (dt, _real, a) => {
      const t = a.t;
      for (const b of list.current) {
        const right = a.q && b.choice === a.q.correctIndex && !b.leave;
        const mag = a.magnet && right;
        b.y -= (b.leave ? 70 : b.speed * (mag ? 0.55 : 1)) * (b.leave ? _real : dt);
        b.x = b.x0 + (a.ctx.still ? 0 : Math.sin(t * 1.3 + b.ph) * b.amp);
      }
      list.current = list.current.filter((b) => b.y > (b.leave ? -30 : 14));
      spawnIn.current -= dt;
      const live = list.current.filter((b) => !b.leave).length;
      if (spawnIn.current <= 0 && live < 7) { spawn(a); spawnIn.current = rand(0.7, 1.3); }
      // The computer picks a balloon, its hand glides over, then it pops.
      if (a.ctx.cpu && a.running) {
        if (cpu.current) {
          const b = list.current.find((v) => v.id === cpu.current!.id);
          if (!b || b.leave) cpu.current = null;
          else if (a.t >= cpu.current.at) { cpu.current = null; tap(b); }
        } else if ((cpuWait.current -= _real) <= 0) {
          const ok = a.ctx.cpuRight();
          const pool = list.current.filter((b) => !b.leave && b.y < 92 && b.y > 26 && (ok ? b.choice === a.q?.correctIndex : b.choice !== a.q?.correctIndex));
          if (pool.length) { cpu.current = { id: pick(pool).id, at: a.t + 0.7 }; cpuWait.current = rand(1.2, 2.2); }
        }
      }
    },
  });

  function tap(b: Balloon) {
    if (b.leave) return;
    const res = ar.answer(b.choice, b.x, b.y, b.id);
    if (res === 'right') {
      clip(Math.random() < 0.5 ? '/lab/balloon-pop/pop.mp3' : '/lab/balloon-pop/pop2.mp3', ctx.settings, 0.8);
      ar.bits(b.x, b.y, 18, 'confetti', [b.color, '#fff', '#fdfd94']);
      const d = { id: b.id, x: b.x, y: b.y, color: b.color, spin: rand(-90, 90) };
      b.leave = true; b.y = -999;
      setDrops((l) => [...l, d]);
      window.setTimeout(() => setDrops((l) => l.filter((v) => v !== d)), 1600);
    } else if (res === 'wrong' || res === 'shielded') {
      b.hitAt = ar.t;
    }
  }
  // Right pops are taken off the list (the drop and confetti play on).
  list.current = list.current.filter((b) => b.y > -900);

  const giant = ar.on('giant') ? 1.4 : 1;
  const flip = ar.on('flip');
  const cpuB = cpu.current ? list.current.find((b) => b.id === cpu.current!.id) : null;
  return (
    <ArcadeFrame ar={ar} box={box} floaters={floaters} bits={bits} flash={flash} label="Balloon Pop sky" bg="linear-gradient(#8fb0ff, #c9d6ff 55%, #eef2ff)"
      hint={<><HandTap weight="fill" aria-hidden="true" /> Pop the right balloon</>}
      extra={<StarJar ar={ar} style={{ left: 'calc(var(--u) * 2.5)', bottom: 'calc(var(--u) * 3)' }} />}>
      <Sky ar={ar} />
      <Rain ar={ar} />
      {list.current.map((b) => {
        const r = b.r * giant * (ar.magnet && b.choice === ar.q?.correctIndex && !b.leave ? 1.25 : 1);
        const rest = ar.locked(b.id);
        const hit = ar.t - b.hitAt < 0.5;
        const text = b.text;
        return (
          <button key={b.id} type="button" disabled={ctx.cpu || b.leave || !ar.running || rest}
            onPointerDown={(e) => { e.preventDefault(); tap(b); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(b); } }}
            aria-label={`Balloon: ${text}`}
            className="absolute group focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black rounded-full disabled:cursor-default"
            style={{ left: `${((b.x - r) / ar.W) * 100}%`, top: `${b.y - r * 1.15}%`, width: `calc(var(--u) * ${r * 2})`, height: `calc(var(--u) * ${r * 3.3})`, opacity: b.leave ? 0.5 : rest ? 0.45 : 1, transition: 'width .4s, height .4s' }}>
            <motion.span className="absolute inset-0 block" animate={hit && !ctx.still ? { rotate: [0, -14, 12, -6, 0], scaleX: [1, 1.15, 0.92, 1], scaleY: [1, 0.85, 1.08, 1] } : { rotate: 0 }} transition={{ duration: 0.5 }}>
              <span className="absolute inset-0 block motion-safe:group-hover:scale-105 motion-safe:transition-transform origin-top">
                <BalloonArt color={b.color} sway={ctx.still ? 0 : Math.sin(ar.t * 1.3 + b.ph) * 6} />
              </span>
              <span className="absolute left-[8%] right-[8%] top-[6%] h-[56%] grid place-items-center text-center font-bold leading-[1.05] break-words"
                style={{ fontSize: `calc(var(--u) * ${labelSize(text, r * 1.7)})`, color: '#241c3d', transform: flip ? 'rotate(180deg)' : undefined, transition: 'transform .5s' }}>{text}</span>
            </motion.span>
          </button>
        );
      })}
      <AnimatePresence>
        {drops.map((d) => (
          <motion.svg key={d.id} viewBox="0 0 20 60" className="absolute pointer-events-none" style={{ left: `${(d.x / ar.W) * 100}%`, top: `${d.y + 8}%`, width: 'calc(var(--u) * 3)', height: 'calc(var(--u) * 12)' }}
            initial={{ y: 0, rotate: 0, opacity: 1 }} animate={{ y: '220%', rotate: d.spin, opacity: [1, 1, 0] }} transition={{ duration: 1.5, ease: 'easeIn' }}>
            <path d="M10 0 Q2 15 10 30 T10 60" stroke="#241c3d" strokeWidth="2.4" fill="none" />
          </motion.svg>
        ))}
      </AnimatePresence>
      {cpuB && <CpuHand x={cpuB.x} y={cpuB.y} W={ar.W} />}
    </ArcadeFrame>
  );
}

function CpuHand({ x, y, W }: { x: number; y: number; W: number }) {
  return (
    <motion.span className="absolute pointer-events-none z-10 text-[#241c3d]" style={{ width: 'calc(var(--u) * 9)', height: 'calc(var(--u) * 9)' }}
      initial={{ left: '50%', top: '100%' }} animate={{ left: `${(x / W) * 100}%`, top: `${y}%` }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
      <HandTap weight="fill" className="w-full h-full drop-shadow-[0_3px_0_#fff]" />
    </motion.span>
  );
}

// One balloon: a round body with a shine, a knot and a curly string.
export function BalloonArt({ color, sway = 0 }: { color: string; sway?: number }) {
  const glow = false;
  return (
    <svg viewBox="0 0 60 100" className="w-full h-full overflow-visible" aria-hidden="true">
      <path d={`M30 62 Q${24 + sway} 72 30 80 T${30 - sway} 98`} stroke="#241c3d" strokeWidth="1.6" fill="none" />
      <path d="M30 2 C50 2 58 18 58 30 C58 46 44 58 30 60 C16 58 2 46 2 30 C2 18 10 2 30 2Z" fill={glow ? '#f6c544' : color} stroke="#000" strokeWidth="2.6" />
      <path d="M26 60 L34 60 L32 65 L28 65Z" fill={glow ? '#f6c544' : color} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="17" cy="18" rx="5" ry="9" fill="#fff" opacity="0.65" transform="rotate(25 17 18)" />
      <ellipse cx="44" cy="48" rx="10" ry="6" fill="#000" opacity="0.08" />
    </svg>
  );
}

// The Classic sky: soft sun, drifting clouds, two layers of rolling hills.
function Sky({ ar }: { ar: Arcade }) {
  const still = ar.ctx.still;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style>{'@keyframes bp-drift { from { left: -22%; } to { left: 108%; } }'}</style>
      <div className="absolute rounded-full" style={{ right: '9%', top: '22%', width: 'calc(var(--u) * 16)', height: 'calc(var(--u) * 16)', background: 'radial-gradient(circle, #fffbd0 30%, #fdfd94 60%, rgba(253,253,148,0) 72%)' }} />
      {[{ y: 26, s: 1, d: 70 }, { y: 40, s: 0.7, d: 95 }, { y: 54, s: 0.85, d: 80 }].map((c, i) => (
        <span key={i} className="absolute" style={{ top: `${c.y}%`, left: `${20 + i * 30}%`, width: `calc(var(--u) * ${26 * c.s})`, height: `calc(var(--u) * ${12 * c.s})`, animation: still ? undefined : `bp-drift ${c.d}s linear ${-i * 25 - 10}s infinite` }}>
          <svg viewBox="0 0 100 46" className="w-full h-full"><path d="M12 44 Q0 44 2 32 Q4 20 18 22 Q20 6 38 8 Q50 -4 64 8 Q82 4 84 20 Q100 22 98 34 Q96 44 84 44Z" fill="#fbfcf8" stroke="#241c3d" strokeWidth="2.5" opacity="0.95" /></svg>
        </span>
      ))}
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full" style={{ height: '24%' }}>
        <path d="M0 22 Q30 6 60 18 T120 14 T200 16 V40 H0Z" fill="#a8e6b0" stroke="#241c3d" strokeWidth="1.2" />
        <path d="M0 30 Q40 18 80 28 T150 26 T200 28 V40 H0Z" fill="#8fe3a0" stroke="#241c3d" strokeWidth="1.2" />
      </svg>
      {[12, 30, 58, 74, 90].map((x, i) => (
        <span key={x} className="absolute" style={{ left: `${x}%`, bottom: `${3 + (i % 2) * 3}%`, width: 'calc(var(--u) * 3)', height: 'calc(var(--u) * 3)' }}>
          <svg viewBox="0 0 10 10" className="w-full h-full"><circle cx="5" cy="5" r="3" fill={['#ef7d96', '#fdfd94', '#fbfcf8'][i % 3]} stroke="#241c3d" strokeWidth="1" /><circle cx="5" cy="5" r="1" fill="#f6a623" /></svg>
        </span>
      ))}
    </div>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#8fb0ff, #dfe6ff)' }}>
      <path d="M0 50 Q25 40 50 48 T100 46 V62 H0Z" fill="#8fe3a0" stroke="#241c3d" strokeWidth="0.6" />
      <rect x="4" y="3" width="70" height="9" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <text x="39" y="9.5" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">Which word rhymes with cat?</text>
      {[[22, 30, '#ef7d96', 'hat'], [44, 22, '#fdfd94', 'sun'], [64, 34, '#8fe3a0', 'dog'], [82, 24, '#b4c4fb', 'map']].map(([x, y, f, w], i) => (
        <g key={i}>
          <path d={`M${x} ${(y as number) + 10} q-2 6 0 12`} stroke="#241c3d" strokeWidth="0.5" fill="none" />
          <ellipse cx={x as number} cy={y as number} rx="8" ry="10" fill={f as string} stroke="#000" strokeWidth="0.8" />
          <ellipse cx={(x as number) - 3} cy={(y as number) - 4} rx="1.6" ry="3" fill="#fff" opacity="0.6" />
          <text x={x as number} y={(y as number) + 1.5} textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#241c3d">{w}</text>
        </g>
      ))}
      {[[16, 18], [24, 16], [20, 24], [14, 26], [26, 25]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#fdfd94" stroke="#000" strokeWidth="0.4" />)}
      <rect x="83" y="3" width="10" height="10" rx="5" fill="#8fe3a0" stroke="#000" strokeWidth="0.8" />
    </svg>
  );
}

const def: LabDef = {
  id: 'balloon-pop',
  name: 'Balloon Pop',
  description: 'Answer balloons float up from the hills. Pop the right one before it drifts away.',
  ways: ['solo', 'teams'],
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Read the question at the top' },
    { icon: <HandTap weight="fill" />, text: 'Tap the balloon with the right answer' },
    { icon: <Timer weight="fill" />, text: 'Pop as many as you can before time is up' },
    { icon: <Confetti weight="fill" />, text: 'Fill your jar with stars' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Sky', hint: 'The sky behind the balloons' },
    { id: 'hills', label: 'Hills', hint: 'The hills along the bottom' },
    { id: 'cloud', label: 'Cloud', hint: 'A cloud drifting by' },
    { id: 'balloon', label: 'Balloon', hint: 'One balloon (any color), the answer sits on it' },
    { id: 'string', label: 'String', hint: 'The string that falls when a balloon pops' },
    { id: 'jar', label: 'Star jar', hint: 'The jar that fills with stars' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
