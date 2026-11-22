// Tower Guard rules, kept apart so they can be tested: the meadow path,
// the tower spots, towers, blob waves and one step of the wave.

export const W = 1000, H = 600;
export type Pt = [number, number];
export const PATH: Pt[] = [[-50, 120], [220, 120], [220, 460], [480, 460], [480, 160], [760, 160], [760, 420], [900, 420]];
export const CAKE: Pt = [935, 420];
export const SPOTS: Pt[] = [[110, 225], [110, 380], [340, 70], [340, 300], [350, 552], [600, 300], [620, 62], [620, 535], [872, 280], [872, 535]];

const segs = PATH.slice(1).map((p, i) => { const a = PATH[i]; return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) }; });
export const PATH_LEN = segs.reduce((s, g) => s + g.len, 0);

export function pointAt(d: number): Pt {
  let left = Math.max(0, d);
  for (const g of segs) {
    if (left <= g.len) { const k = left / g.len; return [g.a[0] + (g.b[0] - g.a[0]) * k, g.a[1] + (g.b[1] - g.a[1]) * k]; }
    left -= g.len;
  }
  return PATH[PATH.length - 1];
}

export type TowerType = 'bubble' | 'catapult' | 'ice';
export const TOWERS: Record<TowerType, { name: string; short: string; cost: number; range: number; rate: number; dmg: number; splash: number; slow: number; flight: number }> = {
  bubble: { name: 'Bubble Blower', short: 'Bubble', cost: 20, range: 160, rate: 1.5, dmg: 1, splash: 0, slow: 0, flight: 0.35 },
  catapult: { name: 'Catapult', short: 'Catapult', cost: 30, range: 200, rate: 0.6, dmg: 2, splash: 70, slow: 0, flight: 0.7 },
  ice: { name: 'Ice Cannon', short: 'Ice', cost: 25, range: 140, rate: 0.9, dmg: 0.5, splash: 0, slow: 1.6, flight: 0.4 },
};
export const MAX_LEVEL = 3;
export const upgradeCost = (level: number) => (level === 1 ? 30 : 45);
export const towerStats = (type: TowerType, level: number) => {
  const t = TOWERS[type];
  return { ...t, dmg: t.dmg * 1.6 ** (level - 1), range: t.range * (1 + 0.15 * (level - 1)), rate: t.rate * (1 + 0.15 * (level - 1)) };
};

// Blob kinds: small green, blue, big pink, and a king blob now and then.
export const BLOBS = [
  { hp: 2, speed: 150, points: 1, size: 26, bite: 1, color: '#8fe3a0' },
  { hp: 4, speed: 125, points: 2, size: 30, bite: 1, color: '#7fd6e3' },
  { hp: 8, speed: 95, points: 3, size: 38, bite: 2, color: '#ef7d96' },
  { hp: 22, speed: 70, points: 10, size: 50, bite: 3, color: '#c58ce8' },
];

// The blobs of wave n (1, 2, 3...), in marching order.
export function waveOf(n: number, rand: () => number = Math.random): number[] {
  const count = 3 + Math.floor(n * 0.6);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand();
    out.push(n >= 3 && r < 0.12 + n * 0.02 ? 2 : n >= 2 && r < 0.45 ? 1 : 0);
  }
  if (n >= 5 && n % 3 === 2) out.push(3);
  return out;
}
// Blobs march a little quicker so a wave stays short.
export const MARCH = 1.25;
export const hpScale = (n: number) => 1 + (n - 1) * 0.1;

export interface Blob { id: number; kind: number; hp: number; max: number; d: number; slowUntil: number; phase: number }
export interface Tower { id: number; spot: number; type: TowerType; level: number; owner: string; cool: number; fired: number }
export interface Shot { id: number; type: TowerType; from: Pt; to: Pt; target: number; t0: number; dur: number; dmg: number; owner: string; splash: number; slow: number }
export interface Poof { id: number; at: Pt; t0: number; size: number; points: number }
export interface Sim {
  t: number; blobs: Blob[]; towers: Tower[]; shots: Shot[]; poofs: Poof[];
  queue: { at: number; kind: number }[];
  wave: number; nextId: number;
  // Wave effects from power-ups.
  freezeUntil: number; partyUntil: number; speed: number; turbo: string | null;
  mega: { d: number; owner: string } | null; tornadoAt: number | null;
}

export function newSim(): Sim {
  return { t: 0, blobs: [], towers: [], shots: [], poofs: [], queue: [], wave: 0, nextId: 1, freezeUntil: 0, partyUntil: 0, speed: 1, turbo: null, mega: null, tornadoAt: null };
}

export function startWave(s: Sim, n: number, rand: () => number = Math.random) {
  s.t = 0; s.wave = n; s.shots = []; s.blobs = []; s.poofs = [];
  s.queue = waveOf(n, rand).map((kind, i) => ({ at: 0.3 + i * (0.6 + rand() * 0.4), kind }));
}

export interface StepOut { pops: { owner: string; points: number; at: Pt }[]; bites: number; fired: TowerType[]; done: boolean; tornado: boolean }

// One step of a wave (dt in seconds).
export function step(s: Sim, dt: number, rand: () => number = Math.random): StepOut {
  const out: StepOut = { pops: [], bites: 0, fired: [], done: false, tornado: false };
  s.t += dt;
  while (s.queue.length && s.queue[0].at <= s.t) {
    const q = s.queue.shift()!;
    const k = BLOBS[q.kind];
    const hp = k.hp * hpScale(s.wave);
    s.blobs.push({ id: s.nextId++, kind: q.kind, hp, max: hp, d: 0, slowUntil: 0, phase: rand() * 6 });
  }
  if (s.tornadoAt !== null && s.t >= s.tornadoAt) { s.tornadoAt = null; out.tornado = true; for (const b of s.blobs) b.d *= 0.15; }
  const still = s.t < s.freezeUntil || s.t < s.partyUntil;
  for (const b of s.blobs) {
    if (still) continue;
    const k = BLOBS[b.kind];
    b.d += k.speed * MARCH * s.speed * (b.slowUntil > s.t ? 0.45 : 1) * dt;
  }
  const pop = (b: Blob, owner: string) => { b.hp = 0; out.pops.push({ owner, points: BLOBS[b.kind].points, at: pointAt(b.d) }); s.poofs.push({ id: s.nextId++, at: pointAt(b.d), t0: s.t, size: BLOBS[b.kind].size, points: BLOBS[b.kind].points }); };
  // The mega bubble rolls down the path and pops what it touches.
  if (s.mega) {
    s.mega.d += 420 * dt;
    for (const b of s.blobs) if (b.hp > 0 && Math.abs(b.d - s.mega.d) < 60) pop(b, s.mega.owner);
    if (s.mega.d > PATH_LEN + 60) s.mega = null;
  }
  // Blobs that reach the cake take a bite and hop away.
  for (const b of s.blobs) if (b.hp > 0 && b.d >= PATH_LEN) { b.hp = -1; out.bites += BLOBS[b.kind].bite; }
  // Towers aim at the blob closest to the cake in range.
  for (const tw of s.towers) {
    const st = towerStats(tw.type, tw.level);
    tw.cool -= dt * (s.turbo === tw.owner ? 2 : 1);
    if (tw.cool > 0) continue;
    const at = SPOTS[tw.spot];
    let best: Blob | null = null;
    for (const b of s.blobs) {
      if (b.hp <= 0) continue;
      const p = pointAt(b.d);
      if (Math.hypot(p[0] - at[0], p[1] - at[1]) <= st.range && (!best || b.d > best.d)) best = b;
    }
    if (!best) { tw.cool = 0.1; continue; }
    tw.cool = 1 / st.rate; tw.fired = s.t;
    const lead = pointAt(best.d + BLOBS[best.kind].speed * MARCH * s.speed * st.flight * (still ? 0 : 1) * (best.slowUntil > s.t ? 0.45 : 1));
    s.shots.push({ id: s.nextId++, type: tw.type, from: at, to: lead, target: best.id, t0: s.t, dur: st.flight, dmg: st.dmg, owner: tw.owner, splash: st.splash, slow: st.slow });
    out.fired.push(tw.type);
  }
  // Shots land.
  for (const sh of s.shots) {
    if (s.t < sh.t0 + sh.dur) continue;
    sh.dur = -1;
    const hit = (b: Blob) => { b.hp -= sh.dmg; if (sh.slow) b.slowUntil = s.t + sh.slow; if (b.hp <= 0) pop(b, sh.owner); };
    if (sh.splash) { for (const b of s.blobs) { if (b.hp <= 0) continue; const p = pointAt(b.d); if (Math.hypot(p[0] - sh.to[0], p[1] - sh.to[1]) <= sh.splash) hit(b); } }
    else { const b = s.blobs.find((x) => x.id === sh.target && x.hp > 0); if (b) hit(b); }
  }
  s.shots = s.shots.filter((sh) => sh.dur > 0);
  s.blobs = s.blobs.filter((b) => b.hp > 0);
  s.poofs = s.poofs.filter((p) => s.t - p.t0 < 1.2);
  out.done = !s.queue.length && !s.blobs.length && !s.mega && s.t > 1;
  return out;
}

// The computer builds: upgrade a tower now and then, else place a new one.
export function cpuBuild(s: Sim, me: string, coins: number, rand: () => number = Math.random): { kind: 'place'; spot: number; type: TowerType } | { kind: 'upgrade'; id: number } | null {
  const mine = s.towers.filter((t) => t.owner === me && t.level < MAX_LEVEL && upgradeCost(t.level) <= coins);
  const free = SPOTS.map((_, i) => i).filter((i) => !s.towers.some((t) => t.spot === i));
  if (mine.length && (rand() < 0.4 || !free.length)) return { kind: 'upgrade', id: mine[Math.floor(rand() * mine.length)].id };
  const types = (Object.keys(TOWERS) as TowerType[]).filter((t) => TOWERS[t].cost <= coins);
  if (!free.length || !types.length) return null;
  return { kind: 'place', spot: free[Math.floor(rand() * free.length)], type: types[Math.floor(rand() * types.length)] };
}
