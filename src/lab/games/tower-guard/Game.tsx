import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowFatUp, CheckCircle, Play as PlayIcon, Trophy, X } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import {
  BLOBS, CAKE, cpuBuild, H, MAX_LEVEL, newSim, PATH, pointAt, SPOTS, startWave, step, TOWERS, upgradeCost, W,
  type Pt, type Sim, type Tower, type TowerType,
} from './rules';

// Tower Guard (Game Lab, inspired by the general idea of tower defense
// quiz games): silly slime blobs march along a meadow path toward a cake.
// Right answers earn coins; spend them on catapults, ice cannons and bubble
// blowers by the path. After each turn a wave marches; towers pop blobs
// into bubbles (nobody is ever hurt) and every pop scores for the tower's team.

const A = '/lab/tower-guard';
const COIN = `${A}/coin.webp`;
const EARN = 30;
const START_COINS = 40;
const CAKE_HP = 20;
const MISS_COINS = 10;

const POWERS: LabPower[] = [
  { id: 'freeze', name: 'Snow Globe', desc: 'Every blob is frozen for the start of the next wave.', enter: 'drop', art: <Art kind="freeze" /> },
  { id: 'coins', name: 'Coin Shower', desc: '40 extra coins to build with.', enter: 'spin', art: <Art kind="coins" /> },
  { id: 'free', name: 'Free Tower', desc: 'Your next tower costs nothing.', enter: 'drop', art: <Art kind="free" /> },
  { id: 'mega', name: 'Mega Bubble', desc: 'A giant bubble rolls down the path and pops blobs.', enter: 'zoom', art: <Art kind="mega" /> },
  { id: 'turbo', name: 'Turbo Towers', desc: 'Your towers fire twice as fast this wave.', enter: 'zoom', art: <ImgArt src={`${A}/lightning.webp`} ring="#fff6b0" /> },
  { id: 'shield', name: 'Sprinkle Shield', desc: 'The cake ignores the next 3 bites.', enter: 'drop', art: <ImgArt src={`${A}/shield.webp`} ring="#ffd9e6" /> },
  { id: 'tornado', name: 'Tornado', desc: 'Blows the blobs back to the start of the path.', enter: 'spin', art: <ImgArt src={`${A}/tornado.webp`} ring="#e2e8f5" /> },
  { id: 'party', name: 'Blob Party', desc: 'The blobs put on party hats and dance for a while.', silly: true, art: <Art kind="party" /> },
  { id: 'sugar', name: 'Sugar Rush', desc: 'Oops! The blobs ate candy and march faster this wave.', silly: true, art: <Art kind="sugar" /> },
];

type Phase = 'ask' | 'build' | 'wave' | 'busy';
type Menu = { kind: 'place'; spot: number } | { kind: 'upgrade'; tower: Tower } | null;
interface Flags { freeze: boolean; mega: boolean; turbo: boolean; tornado: boolean; party: boolean; sugar: boolean }
const noFlags = (): Flags => ({ freeze: false, mega: false, turbo: false, tornado: false, party: false, sugar: false });

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

// The app's page transition starts with initial={false}, which skips every
// mount animation on a freshly loaded game page (a code or a link opens one
// straight away); a fresh presence scope lets every piece animate in.
function Play({ ctx }: { ctx: LabCtx }) {
  return <AnimatePresence><Board key="board" ctx={ctx} /></AnimatePresence>;
}

function Board({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [ref, size] = useBox();
  const tall = size.h > size.w * 1.1;
  const VW = tall ? H : W, VH = tall ? W : H;
  const tp = (p: Pt): Pt => (tall ? [p[1], p[0]] : p);
  const sim = useRef<Sim>(newSim());
  const [, setTick] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [menu, setMenu] = useState<Menu>(null);
  const [coins, setCoins] = useState<Record<string, number>>(() => Object.fromEntries(ctx.turns.players.map((p) => [p.id, START_COINS])));
  const coinsRef = useRef(coins); coinsRef.current = coins;
  const [cake, setCake] = useState(CAKE_HP);
  const cakeRef = useRef(cake); cakeRef.current = cake;
  const [shield, setShield] = useState(0);
  const shieldRef = useRef(0); shieldRef.current = shield;
  const [fx, setFx] = useState<{ id: number; kind: string } | null>(null);
  const [rain, setRain] = useState(0);
  const [bite, setBite] = useState(0);
  const flags = useRef<Flags>(noFlags());
  const free = useRef(new Set<string>());
  const turn = useRef(0);
  const goRef = useRef<(() => void) | null>(null);
  const lastPop = useRef(0);
  const lastShot = useRef(0);
  const me = ctx.player;
  const players = ctx.turns.players;
  const color = (id: string) => TEAM_COLORS[(players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];
  const alive = (t: number) => turn.current === t;
  useEffect(() => () => { turn.current = -1; }, []);
  const myCoins = coins[me.id] ?? 0;

  useEffect(() => {
    ctx.setStatus(<span className="flex items-center justify-center gap-3"><span className="inline-flex items-center gap-1"><Art kind="cakeMini" />{Math.max(0, cake)}</span><span className="inline-flex items-center gap-1"><img src={COIN} alt="Coins" className="w-6 h-6" />{myCoins}</span></span>);
  }, [cake, myCoins]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCoins = (id: string, n: number) => setCoins((m) => ({ ...m, [id]: Math.max(0, (m[id] ?? 0) + n) }));

  // Every turn: a question (coins if right), maybe a power-up, building, then a wave.
  useEffect(() => {
    const t = ++turn.current;
    const x = c.current;
    flags.current = noFlags(); setMenu(null); setPhase('ask');
    void x.ask().then(async (ok) => {
      if (!alive(t)) return;
      if (ok) {
        addCoins(x.player.id, EARN); x.sfx.coin(); setRain((r) => r + 1); x.say(`+${EARN} coins`);
        await sleep(900); if (!alive(t)) return;
        const p = await c.current.power(0.45);
        if (!alive(t)) return;
        if (p) await fire(p, t);
        if (!alive(t)) return;
        setPhase('build');
        await new Promise<void>((r) => { goRef.current = r; });
        if (!alive(t)) return;
      } else {
        // A comeback: a few coins after a miss, so nobody falls too far behind.
        c.current.sfx.wrong(); await sleep(600); if (!alive(t)) return;
        addCoins(c.current.player.id, MISS_COINS); c.current.sfx.coin(); c.current.say(`+${MISS_COINS} coins to help`, 'good'); await sleep(1200);
      }
      if (!alive(t)) return;
      setMenu(null); setPhase('wave');
      await runWave(t);
      if (!alive(t)) return;
      setPhase('busy');
      await sleep(700);
      if (alive(t)) c.current.next();
    });
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(p: LabPower, t: number) {
    const x = c.current, id = x.player.id;
    setFx({ id: Date.now(), kind: p.id });
    const f = flags.current;
    if (p.id === 'freeze') { f.freeze = true; x.sfx.freeze(); }
    if (p.id === 'coins') { x.sfx.coin(); setRain((r) => r + 1); await sleep(500); addCoins(id, 40); x.sfx.coin(); }
    if (p.id === 'free') { free.current.add(id); x.sfx.build(); }
    if (p.id === 'mega') { f.mega = true; x.sfx.boing(); }
    if (p.id === 'turbo') { f.turbo = true; x.sfx.zap(); }
    if (p.id === 'shield') { setShield((s) => s + 3); x.sfx.bell(); }
    if (p.id === 'tornado') { f.tornado = true; x.sfx.wind(); }
    if (p.id === 'party') { f.party = true; x.sfx.note(0); await sleep(150); x.sfx.note(2); await sleep(150); x.sfx.note(4); }
    if (p.id === 'sugar') { f.sugar = true; x.sfx.oops(); }
    await sleep(1500);
    if (!alive(t)) return;
    setFx(null);
  }

  // A wave marches; the loop runs until every blob is popped or has bitten.
  function runWave(t: number) {
    return new Promise<void>((resolve) => {
      const s = sim.current, x = c.current, f = flags.current;
      const n = Math.floor(x.taken / Math.max(1, x.turns.players.length)) + 1;
      startWave(s, n);
      s.freezeUntil = f.freeze ? 4 : 0; s.partyUntil = f.party ? 3.5 : 0; s.speed = f.sugar ? 1.3 : 1;
      s.turbo = f.turbo ? x.player.id : null; s.mega = f.mega ? { d: -300, owner: x.player.id } : null; s.tornadoAt = f.tornado ? 5 : null;
      x.sfx.whistle(); x.say(`Wave ${n}!`, 'big');
      let last = performance.now(), raf = 0, bitten = 0;
      const loop = (now: number) => {
        if (!alive(t)) { cancelAnimationFrame(raf); resolve(); return; }
        // Relaxed timers march the blobs more slowly.
        const dt = Math.min(0.05, (now - last) / 1000) / (c.current.timeScale > 1 ? c.current.timeScale : 1); last = now;
        const o = step(s, dt);
        const cc = c.current;
        const pts: Record<string, number> = {};
        for (const pp of o.pops) pts[pp.owner] = (pts[pp.owner] ?? 0) + pp.points;
        for (const [owner, k] of Object.entries(pts)) cc.points(k, owner);
        if (o.pops.length && now - lastPop.current > 70) { lastPop.current = now; playClip(`${A}/pop.mp3`, cc.settings, 0.35); }
        if (o.fired.length && now - lastShot.current > 160) { lastShot.current = now; if (o.fired.includes('catapult')) cc.sfx.thud(); else if (o.fired.includes('ice')) cc.sfx.blip(12); else cc.sfx.blip(5); }
        if (o.tornado) { cc.sfx.wind(); setFx({ id: Date.now(), kind: 'tornadoRun' }); }
        if (o.bites) {
          let b = o.bites;
          if (shieldRef.current > 0) { const used = Math.min(shieldRef.current, b); b -= used; setShield((v) => v - used); cc.sfx.bell(); }
          if (b > 0) { bitten += b; cc.sfx.chomp(); setBite((k) => k + 1); setCake((h) => h - b); }
        }
        setTick((k) => k + 1);
        if (o.done || s.t > 70) {
          if (!bitten) { cc.say('Cake saved!', 'good'); cc.sfx.cheer(); cc.burst(tall ? 0.5 : 0.75, 0.6); }
          if (cakeRef.current <= 0) { cc.say('Yum! A brand new cake!', 'oops'); setCake(CAKE_HP); }
          resolve(); return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
  }

  function place(spot: number, type: TowerType) {
    const x = c.current, id = x.player.id;
    const cost = free.current.has(id) ? 0 : TOWERS[type].cost;
    if ((coinsRef.current[id] ?? 0) < cost || sim.current.towers.some((tw) => tw.spot === spot)) return;
    free.current.delete(id);
    addCoins(id, -cost);
    const s = sim.current;
    s.towers = [...s.towers, { id: s.nextId++, spot, type, level: 1, owner: id, cool: 0, fired: 0 }];
    setMenu(null); x.sfx.build(); x.burst(...burstAt(spot), 'small'); setTick((k) => k + 1);
  }
  function upgrade(towerId: number) {
    const x = c.current, id = x.player.id;
    const tw = sim.current.towers.find((v) => v.id === towerId);
    if (!tw || tw.level >= MAX_LEVEL || (coinsRef.current[id] ?? 0) < upgradeCost(tw.level)) return;
    addCoins(id, -upgradeCost(tw.level));
    sim.current.towers = sim.current.towers.map((v) => (v.id === towerId ? { ...v, level: v.level + 1 } : v));
    setMenu(null); x.sfx.power(); x.burst(...burstAt(tw.spot), 'small'); setTick((k) => k + 1);
  }
  const burstAt = (spot: number): [number, number] => {
    const r = ref.current?.getBoundingClientRect(); const [px, py] = tp(SPOTS[spot]);
    if (!r) return [0.5, 0.5];
    const scale = Math.min(r.width / VW, r.height / VH);
    const ox = r.left + (r.width - VW * scale) / 2, oy = r.top + (r.height - VH * scale) / 2;
    return [(ox + px * scale) / window.innerWidth, (oy + py * scale) / window.innerHeight];
  };
  function go() { const r = goRef.current; goRef.current = null; setMenu(null); c.current.sfx.whoosh(); r?.(); }

  // The computer builds on its own, one thing at a time, then starts the wave.
  useEffect(() => {
    if (!ctx.cpu || phase !== 'build') return;
    const tid = window.setTimeout(() => {
      const x = c.current, id = x.player.id;
      const coinsNow = free.current.has(id) ? 99 : coinsRef.current[id] ?? 0;
      const move = cpuBuild(sim.current, id, coinsNow);
      if (!move) { go(); return; }
      if (move.kind === 'place') { setMenu({ kind: 'place', spot: move.spot }); window.setTimeout(() => place(move.spot, move.type), 700); }
      else upgrade(move.id);
    }, 1500);
    return () => window.clearTimeout(tid);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const s = sim.current;
  const build = phase === 'build' && !ctx.cpu;
  const isFree = free.current.has(me.id);
  const pct = (p: Pt) => { const [x, y] = tp(p); return { left: `${(x / VW) * 100}%`, top: `${(y / VH) * 100}%` }; };
  const pathD = PATH.map((p, i) => `${i ? 'L' : 'M'}${tp(p)[0]} ${tp(p)[1]}`).join(' ');

  return (
    <div ref={ref} className="absolute inset-0 rounded-panel border-heavy border-border overflow-clip grid place-items-center" style={{ background: '#7cc96a', boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      <div className="relative" style={{ width: `min(100%, ${(VW / VH) * size.h}px)`, aspectRatio: `${VW} / ${VH}` }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 w-full h-full" aria-label="Meadow path with towers and slime blobs">
          <Meadow tall={tall} VW={VW} VH={VH} />
          {/* The path. */}
          <path d={pathD} stroke="#000" strokeWidth="92" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathD} stroke="#e8c483" strokeWidth="80" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathD} stroke="#f4dca8" strokeWidth="12" strokeDasharray="2 34" fill="none" strokeLinecap="round" />
          {/* The blob cave where the path starts. */}
          <g transform={`translate(${tp([16, 120])[0]} ${tp([16, 120])[1]})`}>
            <ellipse rx="58" ry="62" fill="#5c4a3a" stroke="#000" strokeWidth="6" />
            <ellipse rx="40" ry="44" fill="#241c3d" />
            <circle cx="-12" cy="-6" r="5" fill="#8fe3a0" /><circle cx="10" cy="-6" r="5" fill="#8fe3a0" />
          </g>
          {/* Tower spots. */}
          {SPOTS.map((sp, i) => {
            const [x, y] = tp(sp); const used = s.towers.some((tw) => tw.spot === i);
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <ellipse cy="14" rx="44" ry="20" fill="#000" opacity="0.18" />
                <circle r="40" fill="#c8c2b4" stroke="#000" strokeWidth="5" />
                <circle r="30" fill="#ddd8cc" />
                {!used && build && <motion.circle r="44" fill="none" stroke="#fdfd94" strokeWidth="6" strokeDasharray="12 10" animate={ctx.still ? undefined : { rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />}
              </g>
            );
          })}
          {/* The cake at the end of the path. */}
          <Cake at={tp(CAKE)} hp={cake} shield={shield} bite={bite} still={!ctx.shake} />
          {/* Towers. */}
          {s.towers.map((tw) => <TowerArt key={tw.id} tw={tw} at={tp(SPOTS[tw.spot])} color={color(tw.owner)} recoil={s.t - tw.fired < 0.2 && phase === 'wave'} still={ctx.still} />)}
          {/* Blobs. */}
          {s.blobs.map((b) => {
            const [x, y] = tp(pointAt(b.d)); const k = BLOBS[b.kind];
            const frozen = s.t < s.freezeUntil, party = s.t < s.partyUntil;
            const sq = ctx.still || frozen ? 1 : 1 + 0.14 * Math.sin(s.t * (party ? 18 : 11) + b.phase);
            return <BlobArt key={b.id} x={x} y={y} r={k.size} color={k.color} sq={sq} hp={b.hp / b.max} frozen={frozen} slow={b.slowUntil > s.t} party={party} king={b.kind === 3} tilt={party && !ctx.still ? Math.sin(s.t * 9 + b.phase) * 14 : 0} />;
          })}
          {/* The mega bubble. */}
          {s.mega && s.mega.d > 0 && (() => { const [x, y] = tp(pointAt(s.mega.d)); return <g transform={`translate(${x} ${y})`}><circle r="62" fill="#bfefff" fillOpacity="0.55" stroke="#000" strokeWidth="5" /><ellipse cx="-20" cy="-24" rx="16" ry="9" fill="#fff" opacity="0.9" /></g>; })()}
          {/* Shots in the air. */}
          {s.shots.map((sh) => {
            const k = Math.min(1, (s.t - sh.t0) / sh.dur);
            const [fx0, fy0] = tp(sh.from), [tx, ty] = tp(sh.to);
            const x = fx0 + (tx - fx0) * k, y = fy0 + (ty - fy0) * k - (sh.type === 'catapult' ? Math.sin(k * Math.PI) * 90 : 0);
            if (sh.type === 'bubble') return <circle key={sh.id} cx={x} cy={y} r="11" fill="#bfefff" stroke="#000" strokeWidth="3" />;
            if (sh.type === 'ice') return <g key={sh.id} transform={`translate(${x} ${y}) rotate(${k * 360})`}><path d="M0-13V13M-11-6.5L11 6.5M-11 6.5L11-6.5" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><path d="M0-13V13M-11-6.5L11 6.5M-11 6.5L11-6.5" stroke="#6aa9e9" strokeWidth="2.5" strokeLinecap="round" /></g>;
            return <circle key={sh.id} cx={x} cy={y} r="15" fill="#ef7d96" stroke="#000" strokeWidth="4" />;
          })}
          {/* Pops: blobs turn into bubbles that float away. */}
          {s.poofs.map((p) => {
            const k = (s.t - p.t0) / 1.2; const [x, y] = tp(p.at);
            return (
              <g key={p.id} transform={`translate(${x} ${y - k * 60})`} opacity={1 - k}>
                {[[-18, -6, 0.5], [14, -14, 0.38], [0, 10, 0.6], [-6, -26, 0.3]].map(([dx, dy, r], i) => <circle key={i} cx={dx * (1 + k)} cy={dy * (1 + k)} r={p.size * (r as number) * (0.6 + k)} fill="#e6f8ff" fillOpacity="0.5" stroke="#000" strokeWidth="3" />)}
                <text y={-p.size - 10} textAnchor="middle" fontSize="34" fontWeight="900" fill="#fdfd94" stroke="#000" strokeWidth="7" paintOrder="stroke" style={{ fontFamily: 'var(--font-display, inherit)' }}>+{p.points}</text>
              </g>
            );
          })}
        </svg>
        {/* Each tower wears its team's badge (shape and color, not color alone). */}
        {s.towers.map((tw) => {
          const owner = players.find((p) => p.id === tw.owner);
          return owner ? <span key={`b${tw.id}`} className="absolute pointer-events-none" style={{ ...pct(SPOTS[tw.spot]), translate: "-10% 10%" }} aria-hidden="true"><TeamBadge colorIndex={owner.colorIndex} size={Math.round(Math.max(20, Math.min(34, size.w / 40)))} /></span> : null;
        })}
        {/* Tap targets for building. */}
        {build && SPOTS.map((sp, i) => {
          const tw = s.towers.find((v) => v.spot === i);
          const mine = tw?.owner === me.id;
          if (tw && (!mine || tw.level >= MAX_LEVEL)) return null;
          return (
            <button key={i} type="button" onClick={() => { c.current.sfx.tap(); setMenu(tw ? { kind: 'upgrade', tower: tw } : { kind: 'place', spot: i }); }}
              aria-label={tw ? `Upgrade your ${TOWERS[tw.type].name}` : `Build on spot ${i + 1}`}
              className="absolute w-[9%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:hover:scale-110 motion-safe:transition-transform focus-visible:outline-4 focus-visible:outline-[#241c3d]" style={pct(sp)}>
              {tw && <span className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-accent border-std border-border grid place-items-center"><ArrowFatUp weight="fill" size={20} /></span>}
            </button>
          );
        })}
        <AnimatePresence>
          {menu && (
            <BuildMenu key={menu.kind === 'place' ? `p${menu.spot}` : `u${menu.tower.id}`} menu={menu} pos={pct(SPOTS[menu.kind === 'place' ? menu.spot : menu.tower.spot])} coins={myCoins} free={isFree} still={ctx.still} cpu={ctx.cpu}
              flip={tp(SPOTS[menu.kind === 'place' ? menu.spot : menu.tower.spot])[1] < VH * 0.35} onPlace={(type) => menu.kind === 'place' && place(menu.spot, type)} onUpgrade={() => menu.kind === 'upgrade' && upgrade(menu.tower.id)} onClose={() => setMenu(null)} />
          )}
        </AnimatePresence>
        {/* Coins and the Go button. */}
        <div className="absolute left-[1.5%] top-[2%] flex items-center gap-2 rounded-full border-std border-border bg-surface px-3 py-1 font-display text-2xl" style={{ boxShadow: '0 3px 0 #000' }}>
          <img src={COIN} alt="Coins" className="w-8 h-8" />
          <motion.span key={myCoins} initial={ctx.still ? false : { scale: 1.5 }} animate={{ scale: 1 }}>{myCoins}</motion.span>
          {isFree && <span className="text-base rounded-full bg-accent border-std border-border px-2">Free tower</span>}
        </div>
        <AnimatePresence>
          {build && (
            <motion.button type="button" onClick={go} aria-label="Start the wave"
              className="absolute left-1/2 -translate-x-1/2 bottom-[3%] min-h-14 px-7 rounded-full border-heavy border-border bg-[#8fe3a0] font-display text-3xl inline-flex items-center gap-2 motion-safe:hover:scale-105 motion-safe:transition-transform"
              style={{ boxShadow: '0 5px 0 #000' }} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
              <PlayIcon weight="fill" size={28} aria-hidden="true" />Go!
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {rain > 0 && !ctx.still && <CoinRain key={rain} />}
        </AnimatePresence>
        <AnimatePresence>{fx && <PowerFx key={fx.id} kind={fx.kind} still={ctx.still} cakePos={pct(CAKE)} />}</AnimatePresence>
      </div>
    </div>
  );
}

function BuildMenu({ menu, pos, coins, free, still, cpu, flip, onPlace, onUpgrade, onClose }: {
  menu: NonNullable<Menu>; pos: { left: string; top: string }; coins: number; free: boolean; still: boolean; cpu: boolean; flip: boolean; onPlace: (t: TowerType) => void; onUpgrade: () => void; onClose: () => void;
}) {
  const types = Object.keys(TOWERS) as TowerType[];
  return (
    <motion.div className="absolute z-10" style={{ left: `clamp(9rem, ${pos.left}, calc(100% - 9rem))`, top: pos.top, translate: flip ? '-50% 3.2rem' : '-50% calc(-100% - 3.2rem)' }}
      initial={still ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
      <div className="relative flex gap-2 rounded-panel border-heavy border-border bg-surface p-2" style={{ boxShadow: '0 5px 0 #000' }}>
        {menu.kind === 'place' ? types.map((t) => {
          const cost = free ? 0 : TOWERS[t].cost;
          return (
            <button key={t} type="button" disabled={cpu || coins < cost} onClick={() => onPlace(t)} aria-label={`${TOWERS[t].name}, ${cost} coins`} title={TOWERS[t].name}
              className="w-[5.2rem] rounded-2xl border-std border-border bg-white p-1 grid justify-items-center gap-0.5 disabled:opacity-40 motion-safe:hover:scale-105 motion-safe:transition-transform">
              <svg viewBox="-50 -70 100 110" className="w-14 h-14"><TowerBody type={t} level={1} color="#b4c4fb" /></svg>
              <span className="font-bold text-sm leading-none">{TOWERS[t].short}</span>
              <span className="inline-flex items-center gap-1 font-display text-lg"><img src={COIN} alt="" className="w-5 h-5" />{cost}</span>
            </button>
          );
        }) : (
          <button type="button" disabled={cpu || coins < upgradeCost(menu.tower.level)} onClick={onUpgrade} aria-label={`Upgrade, ${upgradeCost(menu.tower.level)} coins`}
            className="rounded-2xl border-std border-border bg-accent px-3 py-1 flex items-center gap-2 disabled:opacity-40 motion-safe:hover:scale-105 motion-safe:transition-transform">
            <svg viewBox="-50 -70 100 110" className="w-14 h-14"><TowerBody type={menu.tower.type} level={menu.tower.level + 1} color="#b4c4fb" /></svg>
            <span className="grid justify-items-start"><span className="font-bold text-sm leading-none inline-flex items-center gap-1"><ArrowFatUp weight="fill" size={18} aria-hidden="true" />Upgrade</span>
            <span className="inline-flex items-center gap-1 font-display text-xl"><img src={COIN} alt="" className="w-6 h-6" />{upgradeCost(menu.tower.level)}</span></span>
          </button>
        )}
        <button type="button" onClick={onClose} className="self-stretch min-w-[3.4rem] rounded-2xl border-std border-border bg-surface-2 grid place-items-center content-center gap-0.5 px-2 font-bold text-sm motion-safe:hover:scale-105 motion-safe:transition-transform"><X weight="bold" size={20} aria-hidden="true" />Close</button>
      </div>
    </motion.div>
  );
}

function CoinRain() {
  const [coins] = useState(() => Array.from({ length: 12 }, (_, i) => ({ x: 4 + Math.random() * 20, d: i * 0.05, r: Math.random() * 360 })));
  return (
    <motion.div className="absolute inset-0 pointer-events-none" exit={{ opacity: 0 }}>
      {coins.map((k, i) => <motion.img key={i} src={COIN} alt="" className="absolute w-[4%]" style={{ left: `${k.x}%` }} initial={{ top: '-8%', rotate: 0 }} animate={{ top: '3%', rotate: k.r, opacity: [1, 1, 0] }} transition={{ delay: k.d, duration: 0.7, ease: 'easeIn' }} />)}
    </motion.div>
  );
}

// A tower on its spot: bubble blower, catapult or ice cannon; taller each level.
function TowerArt({ tw, at, color, recoil, still }: { tw: Tower; at: Pt; color: string; recoil: boolean; still: boolean }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <motion.g initial={still ? false : { y: -260, scaleY: 1.3 }} animate={{ y: 0, scaleY: recoil && !still ? 0.9 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 13 }}>
        <TowerBody type={tw.type} level={tw.level} color={color} />
      </motion.g>
    </g>
  );
}
function TowerBody({ type, level, color }: { type: TowerType; level: number; color: string }) {
  const h = 26 + level * 8;
  return (
    <g>
      <rect x="-26" y={-h} width="52" height={h + 14} rx="8" fill={type === 'ice' ? '#d7ecff' : type === 'bubble' ? '#ffe3ef' : '#e0c49a'} stroke="#000" strokeWidth="5" />
      <path d={`M-26 ${-h + 14}h52`} stroke="#000" strokeWidth="3" opacity="0.3" />
      {/* Team flag. */}
      <path d={`M14 ${-h}v-30`} stroke="#000" strokeWidth="4" />
      <path d={`M14 ${-h - 30}l22 8-22 8z`} fill={color} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
      {type === 'bubble' && <><circle cy={-h - 8} r="17" fill="#bfefff" stroke="#000" strokeWidth="4" /><ellipse cx="-6" cy={-h - 14} rx="5" ry="3" fill="#fff" /><path d={`M-8 ${-h + 4}q8 8 16 0`} stroke="#000" strokeWidth="4" fill="none" /></>}
      {type === 'catapult' && <><path d={`M-18 ${-h - 2}L22 ${-h - 30}`} stroke="#8a5a33" strokeWidth="9" strokeLinecap="round" /><path d={`M-18 ${-h - 2}L22 ${-h - 30}`} stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.4" /><circle cx="24" cy={-h - 34} r="11" fill="#ef7d96" stroke="#000" strokeWidth="4" /></>}
      {type === 'ice' && <><rect x="-10" y={-h - 26} width="20" height="30" rx="6" fill="#6aa9e9" stroke="#000" strokeWidth="4" transform={`rotate(-20 0 ${-h})`} /><path d={`M-6 ${-h - 8}l6-8 6 8`} stroke="#fff" strokeWidth="3" fill="none" /></>}
      {/* Level stars. */}
      {Array.from({ length: level }, (_, i) => <path key={i} transform={`translate(${(i - (level - 1) / 2) * 16} ${-8}) scale(0.9)`} d="M0-7l2 4.6 5 .4-3.8 3.2 1.2 5L0 2.6-4.6 5.2l1.2-5L-7.2-3l5-.4z" fill="#fdfd94" stroke="#000" strokeWidth="1.6" />)}
    </g>
  );
}

function BlobArt({ x, y, r, color, sq, hp, frozen, slow, party, king, tilt }: { x: number; y: number; r: number; color: string; sq: number; hp: number; frozen: boolean; slow: boolean; party: boolean; king: boolean; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <ellipse cy={r * 0.75} rx={r * 0.9} ry={r * 0.25} fill="#000" opacity="0.2" />
      <g transform={`translate(0 ${r * 0.7}) scale(${2 - sq} ${sq}) translate(0 ${-r * 0.7})`}>
        <path d={`M${-r} ${r * 0.7}Q${-r} ${-r} 0 ${-r}Q${r} ${-r} ${r} ${r * 0.7}Z`} fill={frozen ? '#cfe8ff' : color} stroke="#000" strokeWidth="4" />
        <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.18} ry={r * 0.1} fill="#fff" opacity="0.7" />
        <circle cx={-r * 0.32} cy={-r * 0.05} r={r * 0.16} fill="#fff" stroke="#000" strokeWidth="2.5" /><circle cx={r * 0.32} cy={-r * 0.05} r={r * 0.16} fill="#fff" stroke="#000" strokeWidth="2.5" />
        <circle cx={-r * 0.28} cy={-r * 0.02} r={r * 0.07} fill="#000" /><circle cx={r * 0.36} cy={-r * 0.02} r={r * 0.07} fill="#000" />
        <path d={`M${-r * 0.2} ${r * 0.28}q${r * 0.2} ${r * 0.18} ${r * 0.4} 0`} stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        {(frozen || slow) && <path d={`M${-r * 0.7} ${r * 0.4}l${r * 0.2} ${-r * 0.3}M${r * 0.5} ${r * 0.5}l${r * 0.2} ${-r * 0.3}`} stroke="#fff" strokeWidth="4" strokeLinecap="round" />}
        {king && <path d={`M${-r * 0.5} ${-r * 0.85}l${r * 0.2} ${-r * 0.45} ${r * 0.3} ${r * 0.3} ${r * 0.3} ${-r * 0.3} ${r * 0.2} ${r * 0.45}z`} fill="#fdfd94" stroke="#000" strokeWidth="3" strokeLinejoin="round" />}
        {party && !king && <><path d={`M${-r * 0.35} ${-r * 0.85}L0 ${-r * 1.75}L${r * 0.35} ${-r * 0.85}Z`} fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" /><circle cy={-r * 1.78} r={r * 0.14} fill="#ef7d96" stroke="#000" strokeWidth="2" /></>}
      </g>
      {hp < 1 && <><rect x={-r * 0.7} y={-r - 16} width={r * 1.4} height="8" rx="4" fill="#fff" stroke="#000" strokeWidth="2.5" /><rect x={-r * 0.7} y={-r - 16} width={r * 1.4 * Math.max(0, hp)} height="8" rx="4" fill="#5cc3a0" /></>}
    </g>
  );
}

// The cake: three layers that shrink with each bite; a sprinkle dome when shielded.
function Cake({ at, hp, shield, bite, still }: { at: Pt; hp: number; shield: number; bite: number; still: boolean }) {
  const k = Math.max(0.25, hp / CAKE_HP);
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <ellipse cy="40" rx="66" ry="16" fill="#000" opacity="0.2" />
      <ellipse cy="36" rx="62" ry="14" fill="#fbfcf8" stroke="#000" strokeWidth="5" />
      <motion.g key={bite} initial={still ? false : { x: -6 }} animate={{ x: [6, -4, 2, 0] }} transition={{ duration: 0.4 }}>
        <g transform={`scale(1 ${0.5 + k * 0.5}) translate(0 ${(1 - k) * 30})`}>
          <rect x="-48" y="-6" width="96" height="40" rx="8" fill="#f5a08c" stroke="#000" strokeWidth="5" />
          <path d="M-48 6q12 10 24 0t24 0 24 0 24 0" fill="#fbfcf8" stroke="#000" strokeWidth="3" />
          {hp > CAKE_HP / 3 && <><rect x="-34" y="-38" width="68" height="34" rx="7" fill="#ef7d96" stroke="#000" strokeWidth="5" /><path d="M-34 -28q9 8 17 0t17 0 17 0 17 0" fill="#fbfcf8" stroke="#000" strokeWidth="3" /></>}
          {hp > (CAKE_HP * 2) / 3 && <><rect x="-20" y="-64" width="40" height="28" rx="6" fill="#fdfd94" stroke="#000" strokeWidth="5" /><path d="M0 -64v-16" stroke="#000" strokeWidth="5" /><motion.path d="M0 -92q-6 6 0 12 6-6 0-12z" fill="#f6c544" stroke="#000" strokeWidth="2.5" animate={still ? undefined : { scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /></>}
        </g>
      </motion.g>
      {shield > 0 && <><path d="M-72 34A72 82 0 0 1 72 34" fill="#ffd9e6" fillOpacity="0.45" stroke="#000" strokeWidth="4" />{[[-40, -20, '#5cc3a0'], [20, -50, '#6aa9e9'], [44, 4, '#f6c544'], [-10, -64, '#ef7d96'], [-56, 12, '#c58ce8']].map(([x, y, f], i) => <rect key={i} x={x as number} y={y as number} width="12" height="5" rx="2.5" fill={f as string} transform={`rotate(${i * 40} ${x} ${y})`} />)}</>}
    </g>
  );
}

// The meadow: grass, patches, flowers, bushes and a little pond.
function Meadow({ tall, VW, VH }: { tall: boolean; VW: number; VH: number }) {
  const tp = (x: number, y: number): Pt => (tall ? [y, x] : [x, y]);
  const trees: Pt[] = [[40, 300], [40, 540], [300, 200], [420, 300], [560, 420], [680, 300], [930, 80], [700, 70], [960, 300], [420, 50]];
  const flowers: Pt[] = [[150, 320], [270, 560], [400, 380], [540, 230], [650, 450], [820, 520], [880, 200], [160, 40], [560, 70], [980, 560], [60, 460], [300, 480]];
  return (
    <g>
      <rect width={VW} height={VH} fill="#8fd77a" />
      {[[120, 520, 120], [600, 340, 160], [880, 120, 110], [330, 220, 100]].map(([x, y, r], i) => { const [a, b] = tp(x, y); return <ellipse key={i} cx={a} cy={b} rx={r} ry={r * 0.6} fill="#7cc96a" />; })}
      {(() => { const [a, b] = tp(620, 430); return <g transform={`translate(${a} ${b})`}><ellipse rx="54" ry="26" fill="#6aa9e9" stroke="#000" strokeWidth="4" /><ellipse cx="-14" cy="-6" rx="16" ry="5" fill="#fff" opacity="0.6" /></g>; })()}
      {trees.map(([x, y], i) => { const [a, b] = tp(x, y); return <g key={i} transform={`translate(${a} ${b}) scale(${0.8 + (i % 3) * 0.15})`}><ellipse cy="22" rx="30" ry="9" fill="#000" opacity="0.18" /><circle cx="-14" cy="0" r="22" fill="#5cc3a0" stroke="#000" strokeWidth="4" /><circle cx="14" cy="-4" r="24" fill="#5cc3a0" stroke="#000" strokeWidth="4" /><circle cx="0" cy="-18" r="22" fill="#6fd1ae" stroke="#000" strokeWidth="4" /></g>; })}
      {flowers.map(([x, y], i) => { const [a, b] = tp(x, y); const f = ['#fdfd94', '#ef7d96', '#fbfcf8', '#c58ce8'][i % 4]; return <g key={i} transform={`translate(${a} ${b})`}>{[0, 72, 144, 216, 288].map((r) => <circle key={r} cx={Math.cos((r * Math.PI) / 180) * 7} cy={Math.sin((r * Math.PI) / 180) * 7} r="6" fill={f} stroke="#000" strokeWidth="2" />)}<circle r="4" fill="#f6c544" stroke="#000" strokeWidth="1.5" /></g>; })}
    </g>
  );
}

function PowerFx({ kind, still, cakePos }: { kind: string; still: boolean; cakePos: { left: string; top: string } }) {
  const art = POWERS.find((p) => p.id === kind)?.art;
  const base = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: 'absolute inset-0 pointer-events-none' };
  const center = 'absolute left-1/2 top-1/2 w-[24cqmin] h-[24cqmin] -ml-[12cqmin] -mt-[12cqmin]';
  if (still) return <motion.div {...base}>{art && <div className={center}>{art}</div>}</motion.div>;
  if (kind === 'freeze') return <motion.div {...base}><motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(191,239,255,0.8))' }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1.4 }} />{Array.from({ length: 18 }, (_, i) => <motion.span key={i} className="absolute text-white text-3xl font-black" style={{ left: `${(i * 5.5) % 100}%`, WebkitTextStroke: '1px #6aa9e9' }} initial={{ top: '-5%', rotate: 0 }} animate={{ top: '100%', rotate: 360 }} transition={{ delay: (i % 6) * 0.12, duration: 1.4 }}>*</motion.span>)}</motion.div>;
  if (kind === 'coins') return <motion.div {...base}>{Array.from({ length: 18 }, (_, i) => <motion.img key={i} src={COIN} alt="" className="absolute w-[5%]" style={{ left: `${(i * 5.7) % 96}%` }} initial={{ top: '-8%' }} animate={{ top: '105%', rotate: 540 }} transition={{ delay: (i % 6) * 0.1, duration: 1.1, ease: 'easeIn' }} />)}</motion.div>;
  if (kind === 'free') return <motion.div {...base}><motion.svg viewBox="-50 -80 100 120" className={center} initial={{ y: -400 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 11 }}><TowerBody type="bubble" level={2} color="#fdfd94" /></motion.svg></motion.div>;
  if (kind === 'mega') return <motion.div {...base}><motion.div className={center} animate={{ scale: [0.2, 1.3, 1], rotate: [0, 20, 0] }} transition={{ duration: 1 }}>{art}</motion.div></motion.div>;
  if (kind === 'turbo') return <motion.div {...base}><motion.div className="absolute inset-0 bg-white" animate={{ opacity: [0, 0.8, 0, 0.5, 0] }} transition={{ duration: 0.6 }} /><motion.div className={center} animate={{ y: [-300, 0], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.7 }}>{art}</motion.div></motion.div>;
  if (kind === 'shield') return <motion.div {...base}><motion.div className="absolute w-[18%] aspect-square -translate-x-1/2 -translate-y-1/2" style={cakePos} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>{art}</motion.div></motion.div>;
  if (kind === 'tornado' || kind === 'tornadoRun') return <motion.div {...base}><motion.img src={`${A}/tornado.webp`} alt="" className="absolute top-[20%] h-[50%]" initial={{ left: '100%' }} animate={{ left: '-30%', rotate: [0, -8, 8, -8, 0] }} transition={{ duration: 1.5, ease: 'easeInOut' }} /></motion.div>;
  if (kind === 'party') return <motion.div {...base}>{Array.from({ length: 24 }, (_, i) => <motion.span key={i} className="absolute w-3 h-5 rounded-sm" style={{ left: `${(i * 4.3) % 100}%`, background: ['#fdfd94', '#ef7d96', '#8fe3a0', '#b4c4fb'][i % 4] }} initial={{ top: '-5%' }} animate={{ top: '100%', rotate: 720 }} transition={{ delay: (i % 8) * 0.08, duration: 1.5 }} />)}<motion.div className={center} animate={{ rotate: [0, -15, 15, -15, 15, 0], scale: [0.5, 1.1, 1] }} transition={{ duration: 1.2 }}>{art}</motion.div></motion.div>;
  if (kind === 'sugar') return <motion.div {...base}><motion.div className={center} animate={{ x: [-200, 200, -100, 0], rotate: [0, 360, 720] }} transition={{ duration: 1.2 }}>{art}</motion.div></motion.div>;
  return null;
}

function ImgArt({ src, ring }: { src: string; ring: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={ring} stroke="#000" strokeWidth="5" />
      <image href={src} x="20" y="18" width="60" height="64" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  if (kind === 'cakeMini') return <svg viewBox="0 0 40 40" className="w-6 h-6" aria-label="Cake"><rect x="6" y="18" width="28" height="16" rx="3" fill="#f5a08c" stroke="#000" strokeWidth="2.5" /><rect x="11" y="8" width="18" height="11" rx="3" fill="#ef7d96" stroke="#000" strokeWidth="2.5" /><path d="M20 8V3" stroke="#000" strokeWidth="2.5" /></svg>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full overflow-visible">
      {kind === 'freeze' && <>{ring('#e3f4ff')}<circle cx="50" cy="46" r="26" fill="#bfefff" fillOpacity="0.7" stroke="#000" strokeWidth="4" /><rect x="30" y="68" width="40" height="12" rx="4" fill="#8a5a33" stroke="#000" strokeWidth="4" /><path d="M50 30v32M36 38l28 16M36 54l28-16" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'coins' && <>{ring('#fff6b0')}<path d="M24 40q4-16 20-14 6-12 20-4 14 0 12 16z" fill="#fff" stroke="#000" strokeWidth="4" />{[[34, 60], [52, 70], [66, 56]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#f6c544" stroke="#000" strokeWidth="3" />)}</>}
      {kind === 'free' && <>{ring('#dff7e4')}<rect x="32" y="40" width="36" height="36" rx="6" fill="#ffe3ef" stroke="#000" strokeWidth="4" /><circle cx="50" cy="32" r="13" fill="#bfefff" stroke="#000" strokeWidth="4" /><rect x="22" y="58" width="56" height="16" rx="8" fill="#fdfd94" stroke="#000" strokeWidth="4" /><text x="50" y="71" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000">FREE</text></>}
      {kind === 'mega' && <>{ring('#d7f3ff')}<circle cx="50" cy="50" r="30" fill="#bfefff" fillOpacity="0.8" stroke="#000" strokeWidth="5" /><ellipse cx="40" cy="38" rx="9" ry="5" fill="#fff" /></>}
      {kind === 'party' && <>{ring('#ffe0d8')}<path d="M24 76Q24 36 50 36Q76 36 76 76Z" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><path d="M40 38L50 10L60 38Z" fill="#f6c544" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" /><circle cx="50" cy="10" r="5" fill="#ef7d96" stroke="#000" strokeWidth="2.5" /><circle cx="41" cy="56" r="4" fill="#000" /><circle cx="59" cy="56" r="4" fill="#000" /><path d="M42 66q8 6 16 0" stroke="#000" strokeWidth="3" fill="none" /></>}
      {kind === 'sugar' && <>{ring('#ffe0ec')}<circle cx="50" cy="50" r="18" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M50 32a18 18 0 0 1 0 36M36 40q14 4 28 20" stroke="#fff" strokeWidth="4" fill="none" /><path d="M32 50l-14-8v16zM68 50l14-8v16z" fill="#fdfd94" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#8fd77a" />
      <path d="M-5 14H24V48H50V18H78V44H92" stroke="#000" strokeWidth="9.5" fill="none" strokeLinejoin="round" />
      <path d="M-5 14H24V48H50V18H78V44H92" stroke="#e8c483" strokeWidth="8" fill="none" strokeLinejoin="round" />
      {[[12, 26, '#e0c49a'], [37, 33, '#ffe3ef'], [64, 31, '#d7ecff']].map(([x, y, f], i) => <g key={i} transform={`translate(${x} ${y})`}><rect x="-4" y="-7" width="8" height="10" rx="1.5" fill={f as string} stroke="#000" strokeWidth="0.8" /><path d="M2-7v-5l4 1.5-4 1.5" fill="#f6c544" stroke="#000" strokeWidth="0.6" /></g>)}
      {[[20, 14, '#8fe3a0', 3.2], [24, 30, '#7fd6e3', 3.6], [50, 30, '#ef7d96', 4.4]].map(([x, y, f, r], i) => <g key={i} transform={`translate(${x} ${y})`}><path d={`M${-(r as number)} 2Q${-(r as number)} ${-(r as number) * 1.2} 0 ${-(r as number) * 1.2}Q${r} ${-(r as number) * 1.2} ${r} 2Z`} fill={f as string} stroke="#000" strokeWidth="0.6" /><circle cx="-1.2" cy="-1" r="0.7" fill="#000" /><circle cx="1.2" cy="-1" r="0.7" fill="#000" /></g>)}
      {[[44, 22, 3], [47, 25, 2]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#e6f8ff" fillOpacity="0.7" stroke="#000" strokeWidth="0.5" />)}
      <g transform="translate(92 44)"><rect x="-6" y="-3" width="12" height="6" rx="1.5" fill="#f5a08c" stroke="#000" strokeWidth="0.7" /><rect x="-4" y="-7.5" width="8" height="5" rx="1" fill="#ef7d96" stroke="#000" strokeWidth="0.7" /><rect x="-2.4" y="-11" width="4.8" height="4" rx="1" fill="#fdfd94" stroke="#000" strokeWidth="0.7" /></g>
    </svg>
  );
}

const def: LabDef = {
  id: 'tower-guard',
  name: 'Tower Guard',
  description: 'Answer right to earn coins. Build towers by the path so the silly slime blobs never reach the cake.',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to earn coins' },
    { icon: <ArrowFatUp weight="fill" />, text: 'Build towers by the path' },
    { icon: <Trophy weight="fill" />, text: 'Pop the most blobs to win' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 15, default: 6 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #cfeec0 0%, #9fd88a 60%, #7cc96a 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Meadow', hint: 'The grass, trees and flowers' },
    { id: 'path', label: 'Path', hint: 'The dirt path the blobs follow' },
    { id: 'cake', label: 'Cake', hint: 'The base to protect (three layers)' },
    { id: 'spot', label: 'Tower spot', hint: 'A round stone pad to build on' },
    { id: 'tower-bubble', label: 'Bubble Blower', hint: 'Fast tower that blows bubbles' },
    { id: 'tower-catapult', label: 'Catapult', hint: 'Slow tower that splashes jelly balls' },
    { id: 'tower-ice', label: 'Ice Cannon', hint: 'Tower that slows blobs down' },
    { id: 'blob', label: 'Slime blob', hint: 'The silly blobs (small, medium, big, king)' },
    { id: 'cave', label: 'Blob cave', hint: 'Where the blobs come from' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
