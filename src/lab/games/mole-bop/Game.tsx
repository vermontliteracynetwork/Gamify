import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Hammer, HandTap, Timer, CheckCircle } from '@phosphor-icons/react';
import type { LabCtx, LabDef } from '../../types';
import { ArcadeFrame, Rain, StarJar, arcadePowers, clip, labelSize, rand, squeak, synth, useArcade, type Arcade } from '../balloon-pop/arcade';
import { makeBag } from '../balloon-pop/rules';
import { holeGrid, maxUp, pickHole, upTime } from './rules';

// Mole Bop (Game Lab, inspired by the fairground whack-a-mole game): moles
// pop up and down out of a garden of holes, each holding up a sign with an
// answer. Bop the right one with the squeaky hammer: it squashes flat, stars
// spin round its head, and it sinks back down dizzy.

const POWERS = arcadePowers('mole-bop', {
  slow: { name: 'Slow-mo', desc: 'Moles move in slow motion for a while.' },
  magnet: { name: 'Magnet', desc: 'For two questions the right mole stays up longer and looks bigger.' },
  shield: { name: 'Shield', desc: 'Your next wrong bop costs nothing.' },
  double: { name: 'Double Points', desc: 'Every right bop scores two for a while.' },
  time: { name: 'Extra Time', desc: 'Five more seconds on the clock.' },
  freeze: { name: 'Freeze', desc: 'Every mole freezes in place, easy to bop.' },
  giant: { name: 'Giant Hammer', desc: 'A huge hammer and big moles for a while.' },
  chickens: { name: 'Rubber Chicken Rain', desc: 'Squawk! Rubber chickens rain on the garden.' },
});

type State = 'down' | 'up' | 'bonk' | 'giggle';
interface Mole { state: State; choice: number; until: number; key: number; text: string }
interface Swing { id: number; x: number; y: number }

function Play({ ctx }: { ctx: LabCtx }) {
  const moles = useRef<Mole[]>([]);
  const bag = useRef<() => number>(() => 0);
  const popIn = useRef(0.4);
  const last = useRef(-1);
  const cpu = useRef(1.6);
  const key = useRef(1);
  const [swings, setSwings] = useState<Swing[]>([]);

  const { ar, box, floaters, bits, flash } = useArcade(ctx, {
    onReset: () => { moles.current = []; popIn.current = 0.3; },
    onStart: () => { moles.current = []; popIn.current = 0.3; },
    onQuestion: (q) => {
      bag.current = makeBag(q.choices.length);
      for (const m of moles.current) if (m.state === 'up' || m.state === 'giggle') { m.state = 'down'; m.until = 0; }
      popIn.current = 0.35;
    },
    step: (dt, real, a) => {
      const holes = holeGrid(a.W);
      if (moles.current.length !== holes.length) moles.current = holes.map(() => ({ state: 'down' as State, choice: 0, until: 0, key: 0, text: '' }));
      const ms = moles.current;
      for (const m of ms) {
        if (m.state === 'down') continue;
        m.until -= m.state === 'bonk' ? real : dt;
        if (m.until <= 0) {
          if (m.state === 'giggle') { m.state = 'up'; m.until = 1.2; }
          else m.state = 'down';
        }
      }
      const up = ms.filter((m) => m.state === 'up' || m.state === 'giggle').length;
      popIn.current -= up === 0 ? real : dt;
      if (popIn.current <= 0 && a.q && up < maxUp(a.q.choices.length, ms.length)) {
        const h = pickHole(ms.map((m) => m.state !== 'down'), last.current);
        if (h >= 0) {
          last.current = h;
          const choice = bag.current();
          const help = a.magnet && choice === a.q.correctIndex ? 1.6 : 1;
          ms[h] = { state: 'up', choice, until: upTime(a.t) * help, key: key.current++, text: a.q.choices[choice] ?? '' };
          synth(a.ctx.settings, [{ f: 300, to: 620, len: 0.12, gain: 0.35 }]);
        }
        popIn.current = rand(0.45, 1.0);
      }
      // The computer swings at a mole of its choosing.
      if (a.ctx.cpu && a.running && (cpu.current -= real) <= 0) {
        cpu.current = rand(1.3, 2.3);
        const ok = a.ctx.cpuRight();
        const pool = ms.map((m, i) => ({ m, i })).filter(({ m }) => m.state === 'up' && (ok ? m.choice === a.q?.correctIndex : m.choice !== a.q?.correctIndex));
        if (pool.length) bop(pool[Math.floor(Math.random() * pool.length)].i, a);
      }
    },
  });

  function bop(i: number, a: Arcade = ar) {
    const m = moles.current[i];
    if (!m || m.state !== 'up' && m.state !== 'giggle') return;
    const h = holeGrid(a.W)[i];
    const sw = { id: Date.now() + Math.random(), x: h.x, y: h.y - h.size * 0.55 };
    setSwings((l) => [...l.slice(-3), sw]);
    window.setTimeout(() => setSwings((l) => l.filter((v) => v !== sw)), 650);
    squeak(ctx.settings);
    const res = a.answer(m.choice, h.x, h.y - h.size * 0.9, m.key);
    if (res === 'ignored') return;
    if (res === 'right') {
      clip('/lab/mole-bop/bonk.mp3', ctx.settings, 0.7);
      m.state = 'bonk'; m.until = 1.3;
      a.bits(h.x, h.y - h.size * 0.5, 10, 'star', ['#fdfd94', '#fff', '#f6c544']);
    } else if (res === 'wrong' || res === 'shielded') {
      m.state = 'giggle'; m.until = 0.8;
      synth(ctx.settings, [{ f: 700, to: 900, len: 0.08, at: 0, gain: 0.3 }, { f: 700, to: 900, len: 0.08, at: 0.12, gain: 0.3 }, { f: 760, to: 980, len: 0.1, at: 0.24, gain: 0.3 }]);
    }
  }

  const holes = holeGrid(ar.W);
  const giant = ar.on('giant');
  return (
    <ArcadeFrame ar={ar} box={box} floaters={floaters} bits={bits} flash={flash} label="Mole Bop garden" bg="linear-gradient(#9fd8ff 0 18%, #b8e8a8 18% 100%)"
      hint={<><Hammer weight="fill" aria-hidden="true" /> Bop the right mole</>}
      extra={<>
        <StarJar ar={ar} style={{ left: 'calc(var(--u) * 2)', bottom: 'calc(var(--u) * 2.5)' }} />
        <AnimatePresence>{swings.map((s) => <HammerSwing key={s.id} s={s} ar={ar} giant={giant} />)}</AnimatePresence>
      </>}>
      <Garden ar={ar} />
      <Rain ar={ar} />
      {holes.map((h, i) => {
        const m = moles.current[i] ?? { state: 'down', choice: 0, until: 0, key: 0, text: '' };
        const text = m.text;
        const rest = ar.locked(m.key) && m.state !== 'bonk';
        const scale = giant ? 1.22 : 1;
        const sz = h.size * scale;
        const upNow = m.state !== 'down';
        const gold = false;
        const help = ar.magnet && m.choice === ar.q?.correctIndex && m.state === 'up' ? 1.15 : 1;
        // Units: the hole line is at h.y; the mole and its sign rise 1.1 sizes above it.
        const top = h.y - sz * 1.1;
        return (
          <div key={i} className="absolute" style={{ left: `${((h.x - sz * 0.6) / ar.W) * 100}%`, top: `${top}%`, width: `calc(var(--u) * ${sz * 1.2})`, height: `calc(var(--u) * ${sz * 1.32})`, transition: 'all .35s' }}>
            {/* The hole: a dark dip with a dirt rim. */}
            <svg viewBox="0 0 100 40" className="absolute left-[4%] w-[92%]" style={{ top: `${(1.1 - 0.22) / 1.32 * 100}%` }} aria-hidden="true">
              <ellipse cx="50" cy="20" rx="49" ry="18" fill="#a7744a" stroke="#241c3d" strokeWidth="2.5" />
              <ellipse cx="50" cy="18" rx="40" ry="12" fill="#3a2418" />
            </svg>
            {/* The mole rises out of the hole (clipped at the hole's middle). */}
            <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: `${(1.1 / 1.32) * 100}%` }}>
              <motion.button type="button" disabled={ctx.cpu || !ar.running || rest || !(m.state === 'up' || m.state === 'giggle')} aria-label={upNow ? `Mole: ${text}` : 'Empty hole'}
                onPointerDown={(e) => { e.preventDefault(); bop(i); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bop(i); } }}
                className="absolute inset-0 group disabled:cursor-default focus-visible:outline-4 focus-visible:outline-black rounded-xl"
                initial={false}
                animate={m.state === 'down' ? { y: '105%' } : m.state === 'bonk' ? { y: ['0%', '0%', '105%'], scaleY: [0.55, 0.62, 0.8], scaleX: [1.25, 1.18, 1] } : m.state === 'giggle' && !ctx.still ? { y: '0%', rotate: [0, -8, 8, -6, 6, 0], scaleY: 1, scaleX: 1 } : { y: '0%', rotate: 0, scaleY: 1, scaleX: 1 }}
                transition={m.state === 'bonk' ? { duration: 1.3, times: [0, 0.55, 1] } : m.state === 'down' ? { duration: 0.3, ease: 'easeIn' } : m.state === 'giggle' ? { duration: 0.7 } : { type: 'spring', stiffness: 300, damping: 14 }}
                style={{ originY: 1 }}>
                <span className="absolute inset-0 block motion-safe:group-hover:scale-105 motion-safe:transition-transform origin-bottom" style={{ opacity: rest ? 0.45 : 1, scale: help, transition: 'opacity .3s, scale .3s' }}>
                  <span className="absolute left-0 right-0 top-0 h-[30%] z-[1] grid place-items-center bg-[#fbfcf8] border-std border-border rounded-lg px-1 text-center font-bold leading-[1.05]"
                    style={{ fontSize: `calc(var(--u) * ${labelSize(text, sz * 1.1, 4.8)})`, color: '#241c3d', boxShadow: '0 3px 0 #000', transform: `rotate(${(m.key % 5) - 2}deg)` }}>{upNow ? text : ''}</span>
                  <span className="absolute left-[28%] right-[28%] top-[28%] h-[12%] block" aria-hidden="true"><svg viewBox="0 0 40 20" preserveAspectRatio="none" className="w-full h-full"><rect x="2" y="0" width="5" height="20" fill="#c58f5a" stroke="#000" strokeWidth="1.5" /><rect x="33" y="0" width="5" height="20" fill="#c58f5a" stroke="#000" strokeWidth="1.5" /></svg></span>
                  <span className="absolute left-[12%] right-[12%] top-[36%] bottom-0 block"><MoleArt state={m.state} gold={gold} /></span>
                </span>
              </motion.button>
            </div>
            {m.state === 'bonk' && !ctx.still && <DizzyStars />}
          </div>
        );
      })}
    </ArcadeFrame>
  );
}

function DizzyStars() {
  return (
    <motion.div className="absolute left-1/2 top-[40%] pointer-events-none" style={{ width: '70%', height: '22%', x: '-50%' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
      {[0, 120, 240].map((a) => (
        <span key={a} className="absolute" style={{ left: `${50 + Math.cos((a * Math.PI) / 180) * 45}%`, top: `${50 + Math.sin((a * Math.PI) / 180) * 45}%`, width: 'calc(var(--u) * 3.4)', height: 'calc(var(--u) * 3.4)', margin: 'calc(var(--u) * -1.7)' }}>
          <svg viewBox="0 0 20 20" className="w-full h-full"><path d="M10 1l2.6 6 6.4.6-4.9 4.2 1.5 6.3L10 14.8 4.4 18.1l1.5-6.3L1 7.6l6.4-.6z" fill="#fdfd94" stroke="#000" strokeWidth="1.5" /></svg>
        </span>
      ))}
    </motion.div>
  );
}

function HammerSwing({ s, ar, giant }: { s: Swing; ar: Arcade; giant: boolean }) {
  const size = giant ? 26 : 16;
  return (
    <motion.span className="absolute pointer-events-none z-20" style={{ left: `${(s.x / ar.W) * 100}%`, top: `${s.y}%`, width: `calc(var(--u) * ${size})`, height: `calc(var(--u) * ${size})`, marginLeft: `calc(var(--u) * ${-size * 0.15})`, marginTop: `calc(var(--u) * ${-size * 0.85})`, originX: 0.85, originY: 0.9 }}
      initial={{ rotate: -70, opacity: 0 }} animate={{ rotate: [-70, 12, 0], opacity: 1, scaleY: [1, 0.9, 1] }} exit={{ opacity: 0, rotate: -30 }} transition={{ duration: 0.28, ease: 'easeIn' }}>
      <HammerArt />
    </motion.span>
  );
}

// The squeaky hammer: a red and yellow toy hammer.
export function HammerArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
      <rect x="54" y="38" width="12" height="58" rx="5" fill="#f6c544" stroke="#000" strokeWidth="4" transform="rotate(-35 60 67)" />
      <g transform="rotate(-35 40 30)">
        <rect x="8" y="14" width="64" height="34" rx="14" fill="#ef7d96" stroke="#000" strokeWidth="4" />
        <rect x="2" y="18" width="12" height="26" rx="5" fill="#f5a08c" stroke="#000" strokeWidth="4" />
        <rect x="66" y="18" width="12" height="26" rx="5" fill="#f5a08c" stroke="#000" strokeWidth="4" />
        <path d="M20 22 h30" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

// A round friendly mole: brown fur, pink nose, two teeth; dizzy spiral eyes
// when bopped and a cheeky grin when the answer was not right.
export function MoleArt({ state, gold }: { state: State; gold?: boolean }) {
  const dizzy = state === 'bonk';
  const cheeky = state === 'giggle';
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <path d="M8 80 Q6 20 40 14 Q74 20 72 80Z" fill="#9b6a43" stroke="#000" strokeWidth="3.5" />
      <path d="M22 80 Q22 50 40 48 Q58 50 58 80Z" fill="#d9a77a" />
      {gold && <path d="M20 22 Q40 -6 60 22 Z" fill="#f6c544" stroke="#000" strokeWidth="3" />}
      {gold && <rect x="16" y="19" width="48" height="7" rx="3" fill="#f6c544" stroke="#000" strokeWidth="3" />}
      {dizzy ? <>
        <path d="M27 36 m-5 0 a5 5 0 1 1 10 0 a3 3 0 1 1 -6 0" stroke="#000" strokeWidth="2.4" fill="none" />
        <path d="M53 36 m-5 0 a5 5 0 1 1 10 0 a3 3 0 1 1 -6 0" stroke="#000" strokeWidth="2.4" fill="none" />
      </> : cheeky ? <>
        <path d="M22 36 q5 -5 10 0 M48 36 q5 -5 10 0" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
      </> : <>
        <circle cx="28" cy="35" r="4.5" fill="#000" /><circle cx="52" cy="35" r="4.5" fill="#000" />
        <circle cx="29.5" cy="33.5" r="1.5" fill="#fff" /><circle cx="53.5" cy="33.5" r="1.5" fill="#fff" />
      </>}
      <ellipse cx="40" cy="45" rx="7" ry="5" fill="#ef7d96" stroke="#000" strokeWidth="2.5" />
      {cheeky ? <path d="M33 53 Q40 62 47 53 Z" fill="#ef7d96" stroke="#000" strokeWidth="2.4" /> : <rect x="36" y="51" width="8" height="6" rx="1.5" fill="#fff" stroke="#000" strokeWidth="2" />}
      <circle cx="18" cy="46" r="4" fill="#f5a08c" opacity="0.6" /><circle cx="62" cy="46" r="4" fill="#f5a08c" opacity="0.6" />
      <ellipse cx="14" cy="72" rx="8" ry="6" fill="#c58f63" stroke="#000" strokeWidth="2.5" />
      <ellipse cx="66" cy="72" rx="8" ry="6" fill="#c58f63" stroke="#000" strokeWidth="2.5" />
    </svg>
  );
}

// The Classic garden: blue sky, a hedge and picket fence along the back, a
// lawn with stripes, flowers and a few stones.
function Garden({ ar }: { ar: Arcade }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x="0" y={24 + i * 10} width="200" height="5" fill="#a9df98" />)}
        <path d="M0 18 Q10 12 20 18 T40 18 T60 18 T80 18 T100 18 T120 18 T140 18 T160 18 T180 18 T200 18 V24 H0Z" fill="#6fc28a" stroke="#241c3d" strokeWidth="0.6" />
      </svg>
      <div className="absolute inset-x-0 flex justify-around" style={{ top: '13%', height: '7%' }}>
        {Array.from({ length: Math.round(ar.W / 7) }, (_, i) => <span key={i} className="block h-full bg-[#fbfcf8] border-std border-border" style={{ width: 'calc(var(--u) * 2.4)', clipPath: 'polygon(0 22%, 50% 0, 100% 22%, 100% 100%, 0 100%)' }} />)}
      </div>
      {[[6, 30], [94, 44], [9, 62], [97, 80], [50, 98]].map(([x, y], i) => (
        <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: 'calc(var(--u) * 4)', height: 'calc(var(--u) * 4)', transform: 'translate(-50%,-50%)' }}>
          <svg viewBox="0 0 10 10" className="w-full h-full"><g fill={['#ef7d96', '#fdfd94', '#fbfcf8', '#f5a08c', '#c58ce8'][i]} stroke="#241c3d" strokeWidth="0.7">{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={5 + Math.cos((a * Math.PI) / 180) * 2.4} cy={5 + Math.sin((a * Math.PI) / 180) * 2.4} r="1.7" />)}</g><circle cx="5" cy="5" r="1.4" fill="#f6a623" stroke="#241c3d" strokeWidth="0.6" /></svg>
        </span>
      ))}
    </div>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#9fd8ff 0 22%, #b8e8a8 22%)' }}>
      <rect x="4" y="3" width="70" height="9" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <text x="39" y="9.5" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">Which one is a noun?</text>
      {[[22, 34, 'dog', true], [50, 30, 'run', false], [78, 34, 'big', false], [36, 54, '', false], [64, 54, '', false]].map(([x, y, w, up], i) => (
        <g key={i}>
          <ellipse cx={x as number} cy={(y as number) + 2} rx="10" ry="3.4" fill="#3a2418" stroke="#241c3d" strokeWidth="0.6" />
          {w && <>
            <path d={`M${(x as number) - 7} ${(y as number) + 2} Q${(x as number) - 7} ${(y as number) - 10} ${x} ${(y as number) - 10} Q${(x as number) + 7} ${(y as number) - 10} ${(x as number) + 7} ${(y as number) + 2}Z`} fill="#9b6a43" stroke="#000" strokeWidth="0.7" />
            <circle cx={(x as number) - 2.5} cy={(y as number) - 5} r="0.9" /><circle cx={(x as number) + 2.5} cy={(y as number) - 5} r="0.9" />
            <ellipse cx={x as number} cy={(y as number) - 3} rx="1.4" ry="1" fill="#ef7d96" />
            <rect x={(x as number) - 8} y={(y as number) - 19} width="16" height="7" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" />
            <text x={x as number} y={(y as number) - 14} textAnchor="middle" fontSize="4" fontWeight="700" fill="#241c3d">{w}</text>
          </>}
          {up && <g transform={`translate(${(x as number) + 6} ${(y as number) - 26}) rotate(-30)`}><rect x="0" y="0" width="12" height="6" rx="2" fill="#ef7d96" stroke="#000" strokeWidth="0.6" /><rect x="5" y="5" width="2.5" height="10" fill="#f6c544" stroke="#000" strokeWidth="0.5" /></g>}
        </g>
      ))}
    </svg>
  );
}

const def: LabDef = {
  id: 'mole-bop',
  name: 'Mole Bop',
  description: 'Moles pop up holding answers. Bop the right one with the squeaky hammer.',
  ways: ['solo', 'teams'],
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Read the question at the top' },
    { icon: <HandTap weight="fill" />, text: 'Tap the mole holding the right answer' },
    { icon: <Hammer weight="fill" />, text: 'Bop! Stars spin round its head' },
    { icon: <Timer weight="fill" />, text: 'Bop as many as you can in time' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Garden', hint: 'The lawn behind the holes' },
    { id: 'fence', label: 'Fence and hedge', hint: 'Along the back of the garden' },
    { id: 'hole', label: 'Hole', hint: 'One hole in the ground' },
    { id: 'mole', label: 'Mole', hint: 'The mole that pops up (awake, dizzy and cheeky faces)' },
    { id: 'sign', label: 'Answer sign', hint: 'The sign the mole holds up' },
    { id: 'hammer', label: 'Hammer', hint: 'The squeaky hammer' },
    { id: 'jar', label: 'Star jar', hint: 'The jar that fills with stars' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
