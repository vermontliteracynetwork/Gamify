import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AirplaneTilt, ArrowFatDown, ArrowFatUp, CheckCircle, Cloud, Timer } from '@phosphor-icons/react';
import type { LabCtx, LabDef } from '../../types';
import { ArcadeFrame, Rain, StarJar, arcadePowers, clip, labelSize, rand, shuffle, useArcade, worldPoint, type Arcade } from '../balloon-pop/arcade';
import { inCloud, lanes, steer } from './rules';

// Sky Flyer (Game Lab, inspired by the classic classroom airplane game): a
// little plane flies over rolling hills while waves of answer clouds come
// at it. Climb or dive (hold the arrows, hold above or below the plane, or
// tap a cloud) to fly into the right one: it bursts into puffs and the
// plane does a loop, trailing smoke.

const POWERS = arcadePowers('sky-flyer', {
  slow: { name: 'Slow-mo', desc: 'The clouds drift in slowly for a while.' },
  magnet: { name: 'Magnet', desc: 'For two questions the right cloud puffs up big and easy to hit.' },
  shield: { name: 'Shield', desc: 'Your next wrong cloud costs nothing.' },
  double: { name: 'Double Points', desc: 'Every right cloud scores two for a while.' },
  time: { name: 'Extra Time', desc: 'Five more seconds on the clock.' },
  giant: { name: 'Giant Clouds', desc: 'The clouds puff up big and easy to hit.' },
  flip: { name: 'Upside Down', desc: 'Whoops! The sky flips over. Keep flying!' },
  chickens: { name: 'Rubber Chicken Rain', desc: 'Squawk! Rubber chickens fall from the sky.' },
});

const PLANE_X = 0.2;
interface CloudT { id: number; choice: number; lane: number; x: number; bob: number; hit: boolean; hitAt: number }
interface Puff { x: number; y: number; t: number }

function Play({ ctx }: { ctx: LabCtx }) {
  const plane = useRef({ y: 58, vy: 0, loop: -9, wob: -9 });
  const input = useRef(0);
  const target = useRef<number | null>(null);
  const clouds = useRef<CloudT[]>([]);
  const nid = useRef(1);
  const waveIn = useRef(0);
  const smoke = useRef<Puff[]>([]);
  const smokeIn = useRef(0);
  const scroll = useRef(0);
  const cpuLane = useRef<number | null>(null);
  const world = useRef<HTMLDivElement>(null);
  const holding = useRef(false);
  const [, setK] = useState(0);

  function wave(a: Arcade) {
    if (!a.q) return;
    const ls = lanes(a.q.choices.length);
    const order = shuffle([...a.q.choices.keys()]);
    order.forEach((choice, i) => clouds.current.push({ id: nid.current++, choice, lane: ls[i], x: a.W + 14 + rand(0, 6), bob: rand(0, 6.28), hit: false, hitAt: -9 }));
    cpuLane.current = null;
  }

  const { ar, box, floaters, bits, flash } = useArcade(ctx, {
    onReset: () => { clouds.current = []; },
    onStart: () => { clouds.current = []; plane.current = { y: 58, vy: 0, loop: -9, wob: -9 }; smoke.current = []; },
    onQuestion: () => {
      for (const c of clouds.current) c.choice = -1;
      waveIn.current = 0.2;
    },
    step: (dt, real, a) => {
      const p = plane.current;
      const px = a.W * PLANE_X;
      scroll.current += dt * 10;
      const speed = 26;
      for (const c of clouds.current) c.x -= speed * dt * (c.choice < 0 ? 2.2 : 1);
      clouds.current = clouds.current.filter((c) => c.x > -20);
      const live = clouds.current.filter((c) => c.choice >= 0 && !c.hit && c.x > px - 10);
      waveIn.current -= dt;
      if (!live.length && waveIn.current <= 0) { wave(a); waveIn.current = 1.2; }
      // Steering: keys and buttons first, then a held finger, a tapped cloud,
      // or the computer.
      let tgt = target.current;
      if (a.ctx.cpu && live.length) {
        if (cpuLane.current === null) {
          const ok = a.ctx.cpuRight();
          const pool = live.filter((c) => (ok ? c.choice === a.q?.correctIndex : c.choice !== a.q?.correctIndex));
          cpuLane.current = (pool[0] ?? live[0]).lane;
        }
        tgt = cpuLane.current;
      }
      const dir = a.on('flip') ? -input.current : input.current;
      const n = steer(p.y, p.vy, real * (a.speed === 0 ? 0 : 1), dir, tgt);
      p.y = n.y; p.vy = n.vy;
      // Into a cloud?
      const giant = a.on('giant') ? 1.45 : 1;
      for (const c of clouds.current) {
        if (c.hit || c.choice < 0) continue;
        const cy = c.lane + Math.sin(a.t * 2 + c.bob) * 1.2;
        const big = giant * (a.magnet && c.choice === a.q?.correctIndex ? 1.3 : 1);
        if (inCloud(px + 6, p.y, c.x, cy, 9 * big, 6.5 * big)) {
          c.hit = true; c.hitAt = a.t;
          const res = a.answer(c.choice, c.x, cy);
          if (res === 'right') {
            p.loop = a.t; target.current = null;
            clip('/lab/sky-flyer/whoosh.mp3', ctx.settings, 0.7);
            a.bits(c.x, cy, 12, 'puff', ['#ffffff', '#f3f6ff', '#e6ecff']);
          } else if (res === 'wrong' || res === 'shielded') {
            p.wob = a.t; a.bits(c.x, cy, 6, 'puff', ['#d9dcef']);
          }
          break;
        }
      }
      // A puff of smoke every few frames.
      if ((smokeIn.current -= real) <= 0 && !a.ctx.still) {
        smokeIn.current = 0.07;
        smoke.current = [...smoke.current.filter((s) => a.t - s.t < 1.1), { x: px - 7, y: p.y + rand(-0.8, 0.8), t: a.t }];
      }
      for (const s of smoke.current) s.x -= speed * 0.9 * dt;
    },
  });

  // Keys: arrows or W and S climb and dive while held.
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (ctx.cpu) return;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { input.current = -1; target.current = null; e.preventDefault(); }
      if (['ArrowDown', 's', 'S'].includes(e.key)) { input.current = 1; target.current = null; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => { if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) input.current = 0; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [ctx.cpu]);

  function hold(e: RPointerEvent) {
    if (ctx.cpu || !world.current || (!e.clientX && !e.clientY)) return;
    const [, y] = worldPoint(e, world.current, ar);
    target.current = y;
  }
  // A keyboard press (Enter or Space) on a pad nudges the plane a lane's worth.
  const nudge = (d: number) => { if (ctx.cpu) return; target.current = Math.max(20, Math.min(95, plane.current.y + d * 16)); };
  const btn = (d: number) => ({
    onClick: (e: { detail: number }) => { if (e.detail === 0) nudge(d); },
    onPointerDown: (e: RPointerEvent) => { e.stopPropagation(); input.current = d; target.current = null; setK((k) => k + 1); },
    onPointerUp: () => { input.current = 0; }, onPointerLeave: () => { input.current = 0; }, onPointerCancel: () => { input.current = 0; },
  });

  const p = plane.current;
  const px = ar.W * PLANE_X;
  const giant = ar.on('giant') ? 1.45 : 1;
  const loopT = ar.t - p.loop;
  const looping = loopT >= 0 && loopT < 0.9;
  const wobT = ar.t - p.wob;
  const tilt = Math.max(-28, Math.min(28, p.vy * 0.6)) + (looping ? -360 * (loopT / 0.9) : 0) + (wobT < 0.6 ? Math.sin(wobT * 30) * 14 * (1 - wobT / 0.6) : 0);
  const loopLift = looping ? Math.sin((loopT / 0.9) * Math.PI) * -9 : 0;
  const flip = ar.on('flip');
  return (
    <ArcadeFrame ar={ar} box={box} floaters={floaters} bits={bits} flash={flash} label="Sky Flyer sky" bg="linear-gradient(#7fb2ff, #bcd4ff 55%, #ffe9c9)"
      hint={<><AirplaneTilt weight="fill" aria-hidden="true" /> Fly into the right cloud</>}
      extra={<>
        <StarJar ar={ar} style={{ left: 'calc(var(--u) * 2.5)', bottom: 'calc(var(--u) * 3)' }} />
        {!ctx.cpu && ar.phase === 'play' && (
          <div className="absolute right-[1.5%] bottom-[4%] grid gap-3 z-10">
            {([-1, 1] as const).map((d) => (
              <button key={d} type="button" aria-label={d < 0 ? 'Fly up' : 'Fly down'} {...btn(d)}
                className="rounded-full border-heavy border-border bg-accent grid place-items-center content-center gap-0.5 font-bold leading-none motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform"
                style={{ width: 'max(3.6rem, calc(var(--u) * 13))', height: 'max(3.6rem, calc(var(--u) * 13))', boxShadow: '0 4px 0 #000', fontSize: 'max(0.8125rem, calc(var(--u) * 2.8))' }}>
                {d < 0 ? <ArrowFatUp weight="fill" size="45%" aria-hidden="true" /> : <ArrowFatDown weight="fill" size="45%" aria-hidden="true" />}
                <span>{d < 0 ? 'Up' : 'Down'}</span>
              </button>
            ))}
          </div>
        )}
      </>}>
      <div ref={world} className="absolute inset-0" onPointerDown={(e) => { holding.current = true; hold(e); }} onPointerMove={(e) => { if (holding.current) hold(e); }}
        onPointerUp={() => { holding.current = false; }} onPointerLeave={() => { holding.current = false; }}>
        <Scenery ar={ar} scroll={scroll.current} />
        <Rain ar={ar} />
        {smoke.current.map((s, i) => {
          const age = ar.t - s.t;
          const r = 1.4 + age * 3.2;
          return <span key={i} className="absolute rounded-full pointer-events-none" style={{ left: `${((s.x - r) / ar.W) * 100}%`, top: `${s.y - r}%`, width: `calc(var(--u) * ${r * 2})`, height: `calc(var(--u) * ${r * 2})`, background: '#fff', opacity: Math.max(0, 0.75 - age * 0.7), border: '1px solid rgba(36,28,61,0.25)' }} />;
        })}
        {clouds.current.map((c) => {
          const cy = c.lane + (ctx.still ? 0 : Math.sin(ar.t * 2 + c.bob) * 1.2);
          const big = giant * (ar.magnet && c.choice === ar.q?.correctIndex && !c.hit ? 1.3 : 1);
          const w = 20 * big, h = 13 * big;
          const text = c.choice >= 0 ? ar.q?.choices[c.choice] ?? '' : '';
          const hitT = ar.t - c.hitAt;
          const burst = c.hit && hitT < 0.5 && c.choice === ar.q?.correctIndex;
          return (
            <button key={c.id} type="button" disabled={ctx.cpu || !ar.running || c.choice < 0 || c.hit} aria-label={text ? `Cloud: ${text}` : 'Cloud'}
              onPointerDown={(e) => { e.stopPropagation(); if (!ctx.cpu) { target.current = c.lane; holding.current = false; } }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); target.current = c.lane; } }}
              className="absolute group disabled:cursor-default focus-visible:outline-4 focus-visible:outline-black rounded-[40%]"
              style={{ left: `${((c.x - w / 2) / ar.W) * 100}%`, top: `${cy - h / 2}%`, width: `calc(var(--u) * ${w})`, height: `calc(var(--u) * ${h})`, opacity: c.choice < 0 ? 0.45 : c.hit && !burst ? 0.6 : 1, transition: 'width .3s, height .3s, opacity .3s' }}>
              <span className="absolute inset-0 block motion-safe:group-hover:scale-105 motion-safe:transition-transform" style={{ transform: c.hit && hitT < 0.4 ? `scale(${1.2 - hitT}, ${0.8 + hitT})` : undefined }}>
                <CloudArt />
              </span>
              {text && (
                <span className="absolute inset-[18%_12%_14%] grid place-items-center text-center font-bold leading-[1.05] break-words"
                  style={{ fontSize: `calc(var(--u) * ${labelSize(text, w * 0.75, 4.8)})`, color: '#241c3d', transform: flip ? 'rotate(180deg)' : undefined }}>{text}</span>
              )}
            </button>
          );
        })}
        <span className="absolute pointer-events-none" style={{ left: `${((px - 8) / ar.W) * 100}%`, top: `${p.y - 6 + loopLift}%`, width: 'calc(var(--u) * 16)', height: 'calc(var(--u) * 12)', transform: `rotate(${tilt}deg)` }}>
          {ar.shield && <span className="absolute -inset-[20%] rounded-full border-4 border-[#7fd6e3] bg-[#7fd6e3]/20" />}
          <PlaneArt color={['#ef7d96', '#f6c544', '#5cc3a0', '#6aa9e9', '#f39a6b', '#c58ce8'][ctx.player.colorIndex % 6]} t={ar.t} still={ctx.still} />
        </span>
      </div>
    </ArcadeFrame>
  );
}

// The little plane: a round body in the player's color, a spinning
// propeller, a pilot with goggles.
export function PlaneArt({ color, t, still }: { color: string; t: number; still: boolean }) {
  const blade = still ? 1 : Math.abs(Math.sin(t * 40));
  return (
    <svg viewBox="0 0 120 90" className="w-full h-full overflow-visible" aria-hidden="true">
      <path d="M20 40 L4 22 L16 20 L32 36Z" fill={color} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M18 44 Q20 30 50 30 L92 34 Q108 38 106 48 Q104 58 90 60 L40 62 Q18 60 18 44Z" fill={color} stroke="#000" strokeWidth="4" />
      <path d="M50 30 Q56 16 70 18 Q76 24 74 32" fill="#b4f0ff" stroke="#000" strokeWidth="3.5" />
      <circle cx="63" cy="25" r="6" fill="#f5c9a0" stroke="#000" strokeWidth="2.5" />
      <rect x="57" y="20" width="12" height="4" rx="2" fill="#241c3d" />
      <path d="M44 48 L78 46 L70 70 L48 72Z" fill="#fbfcf8" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="108" cy="47" r="5" fill="#241c3d" />
      <ellipse cx="111" cy="47" rx="3" ry={18 * blade + 3} fill="#241c3d" opacity="0.75" />
      <path d="M30 44 h12" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function CloudArt() {
  const gold = false;
  return (
    <svg viewBox="0 0 100 64" className="w-full h-full overflow-visible" aria-hidden="true">
      <path d="M14 60 Q-2 60 2 44 Q6 30 20 32 Q20 10 42 12 Q54 -2 70 10 Q90 6 92 26 Q102 30 98 46 Q96 60 82 60Z" fill={gold ? '#fff8c0' : '#fbfcf8'} stroke="#241c3d" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M20 54 Q50 60 82 54" stroke="#c9d2ff" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Parallax: far hills, near hills and the meadow slide by at three speeds.
function Scenery({ ar, scroll }: { ar: Arcade; scroll: number }) {
  const layer = (speed: number, fill: string, d: string, h: string, z = 0) => (
    <div className="absolute bottom-0 left-0 h-full pointer-events-none" style={{ width: '200%', transform: `translateX(${-((scroll * speed) % 50)}%)`, zIndex: z }}>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute bottom-0 w-full" style={{ height: h }}>
        <path d={d} fill={fill} stroke="#241c3d" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute rounded-full" style={{ right: '14%', top: '20%', width: 'calc(var(--u) * 14)', height: 'calc(var(--u) * 14)', background: 'radial-gradient(circle, #fffbd0 35%, #fdfd94 60%, rgba(253,253,148,0) 72%)' }} />
      {[{ y: 30, s: 0.6, k: 0.08 }, { y: 46, s: 0.45, k: 0.12 }].map((c, i) => (
        <span key={i} className="absolute opacity-60" style={{ top: `${c.y}%`, left: `${100 - (((scroll * c.k * 10) + i * 47) % 130)}%`, width: `calc(var(--u) * ${26 * c.s})`, height: `calc(var(--u) * ${16 * c.s})` }}><CloudArt /></span>
      ))}
      {layer(0.15, '#b9c9f5', 'M0 60 Q25 30 50 55 T100 50 T150 40 T200 60 T250 30 T300 55 T350 45 T400 60 V100 H0Z', '40%')}
      {layer(0.4, '#a8e6b0', 'M0 50 Q30 20 60 45 T120 40 T200 50 T260 25 T320 45 T400 50 V100 H0Z', '26%')}
      {layer(0.9, '#8fe3a0', 'M0 50 Q50 30 100 50 T200 50 T300 50 T400 50 V100 H0Z', '13%', 1)}
      {ar.W > 0 && Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="absolute" style={{ bottom: '6%', left: `${((i * 37 - scroll * 9) % 120 + 120) % 120 - 10}%`, width: 'calc(var(--u) * 5)', height: 'calc(var(--u) * 7)', zIndex: 1 }}>
          <svg viewBox="0 0 20 28" className="w-full h-full"><rect x="8.5" y="16" width="3" height="12" fill="#8a5a2a" stroke="#241c3d" strokeWidth="1" /><circle cx="10" cy="11" r="9" fill="#5cc37a" stroke="#241c3d" strokeWidth="1.4" /></svg>
        </span>
      ))}
    </div>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(#7fb2ff, #ffe9c9)' }}>
      <path d="M0 48 Q20 36 40 46 T80 44 T100 46 V62 H0Z" fill="#a8e6b0" stroke="#241c3d" strokeWidth="0.5" />
      <path d="M0 55 Q30 48 60 55 T100 54 V62 H0Z" fill="#8fe3a0" stroke="#241c3d" strokeWidth="0.5" />
      <rect x="4" y="3" width="70" height="9" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <text x="39" y="9.5" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#241c3d">Which animal can fly?</text>
      {[[70, 20, 'bird'], [76, 34, 'fish'], [70, 48, 'cow']].map(([x, y, w], i) => (
        <g key={i}><path d={`M${(x as number) - 9} ${(y as number) + 4} q-3 0 -2 -4 q1 -4 5 -3 q1 -5 6 -4 q4 -3 7 0 q5 -1 5 4 q3 1 2 4 q0 3 -3 3z`} fill="#fbfcf8" stroke="#241c3d" strokeWidth="0.6" /><text x={(x as number) + 1} y={(y as number) + 2} textAnchor="middle" fontSize="3.6" fontWeight="700" fill="#241c3d">{w}</text></g>
      ))}
      {[[18, 24, 1.2], [13, 26, 1.6], [8, 28, 2]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.8" />)}
      <g transform="translate(22 16) rotate(-12)"><path d="M2 8 Q3 4 10 4 L19 5 Q22 6 22 8 Q21 10 18 10 L7 11 Q2 11 2 8Z" fill="#ef7d96" stroke="#000" strokeWidth="0.7" /><path d="M9 8 L16 8 L14 13 L10 13Z" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" /><path d="M3 7 L0 3 L3 3 L6 6Z" fill="#ef7d96" stroke="#000" strokeWidth="0.6" /></g>
      <path d="M26 30 q10 -14 24 -10" stroke="#fdfd94" strokeWidth="0.8" fill="none" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

const def: LabDef = {
  id: 'sky-flyer',
  name: 'Sky Flyer',
  description: 'Fly the little plane up and down into the cloud with the right answer.',
  ways: ['solo', 'teams'],
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Read the question at the top' },
    { icon: <ArrowFatUp weight="fill" />, text: 'Fly up and down with the arrows' },
    { icon: <Cloud weight="fill" />, text: 'Fly into the right cloud for a loop' },
    { icon: <Timer weight="fill" />, text: 'Catch as many as you can in time' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Sky', hint: 'The sky behind everything' },
    { id: 'hills-far', label: 'Far hills', hint: 'The slowest hills, far away' },
    { id: 'hills-near', label: 'Near hills', hint: 'The closer hills' },
    { id: 'meadow', label: 'Meadow and trees', hint: 'The ground rushing by' },
    { id: 'plane', label: 'Plane', hint: 'The little plane and its pilot' },
    { id: 'cloud', label: 'Answer cloud', hint: 'A cloud an answer sits on' },
    { id: 'smoke', label: 'Smoke puff', hint: 'One puff of the smoke trail' },
    { id: 'jar', label: 'Star jar', hint: 'The jar that fills with stars' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
