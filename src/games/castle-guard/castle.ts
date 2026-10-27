// Castle Guard (roster Stage 9), rebuilt from the Dashboard's Castle Defense
// logic with code-drawn art: answer questions to earn gems, build towers
// beside the road, then watch the wave. Towers toss bubbles that send the
// sneaky critters home (nobody is hurt). No fail state: a critter that gets
// in just makes the castle wobble.

export type TowerKind = 'bubble' | 'splash' | 'snow';
export interface TowerDef { cost: [number, number, number]; power: [number, number, number]; cooldown: number; range: number; splash?: boolean; slow?: number }
export const TOWERS: Record<TowerKind, TowerDef> = {
  bubble: { cost: [3, 3, 4], power: [3, 5, 8], cooldown: 0.9, range: 15 },
  splash: { cost: [4, 4, 5], power: [1, 2, 4], cooldown: 1.1, range: 12, splash: true },
  snow: { cost: [3, 3, 4], power: [1, 2, 3], cooldown: 1, range: 14, slow: 1.5 },
};
export const TOWER_KINDS = Object.keys(TOWERS) as TowerKind[];
export const GEMS_PER_RIGHT = 3;

// The road on a 100 x 64 board, from the woods to the castle gate.
export const W = 100, H = 64;
export const PATH: [number, number][] = [[-4, 14], [30, 14], [30, 42], [58, 42], [58, 18], [84, 18], [84, 50]];
export const CASTLE: [number, number] = [84, 56];
export const SLOTS: [number, number][] = [[18, 26], [42, 30], [42, 54], [70, 30], [70, 8], [94, 32]];

const segs = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const total = segs.reduce((a, b) => a + b, 0);
export function pointAt(t: number): [number, number] {
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const k = d / segs[i]; return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k]; }
    d -= segs[i];
  }
  return PATH[PATH.length - 1];
}

export interface Tower { slot: number; kind: TowerKind; tier: 1 | 2 | 3; wait: number }
export interface Critter { id: number; look: number; t: number; hp: number; max: number; speed: number; slow: number; delay: number }
export interface Wave { critters: Critter[]; home: number; snuck: number; shots: { from: [number, number]; to: [number, number]; kind: TowerKind }[] }

// Wave n (1-based): more and sturdier critters each time.
export function makeWave(n: number, slower = false): Wave {
  const count = 4 + 2 * n, hp = 4 + 3 * n;
  return {
    critters: Array.from({ length: count }, (_, i) => ({ id: n * 100 + i, look: i % 3, t: 0, hp, max: hp, speed: (0.07 + 0.005 * n) * (slower ? 0.6 : 1), slow: 0, delay: i * 1.1 })),
    home: 0, snuck: 0, shots: [],
  };
}

// One step of the wave, dt seconds. Returns new state (pure).
export function step(wave: Wave, towers: Tower[], dt: number): { wave: Wave; towers: Tower[] } {
  let home = wave.home, snuck = wave.snuck;
  const crit = wave.critters.map((c) => ({ ...c }));
  for (const c of crit) {
    if (c.delay > 0) { c.delay -= dt; continue; }
    c.t += c.speed * dt * (c.slow > 0 ? 0.5 : 1);
    if (c.slow > 0) c.slow -= dt;
  }
  const shots: Wave['shots'] = [];
  const nextTowers = towers.map((tw) => {
    const def = TOWERS[tw.kind];
    let wait = tw.wait - dt;
    if (wait > 0) return { ...tw, wait };
    const at = SLOTS[tw.slot];
    const inRange = crit.filter((c) => c.delay <= 0 && c.hp > 0 && c.t < 1).filter((c) => { const p = pointAt(c.t); return Math.hypot(p[0] - at[0], p[1] - at[1]) <= def.range; });
    if (!inRange.length) return { ...tw, wait: 0 };
    const targets = def.splash ? inRange : [inRange.sort((a, b) => b.t - a.t)[0]];
    for (const c of targets) {
      c.hp -= def.power[tw.tier - 1];
      if (def.slow) c.slow = def.slow;
      shots.push({ from: at, to: pointAt(c.t), kind: tw.kind });
    }
    wait = def.cooldown;
    return { ...tw, wait };
  });
  const left: Critter[] = [];
  for (const c of crit) {
    if (c.hp <= 0) home++;
    else if (c.t >= 1) snuck++;
    else left.push(c);
  }
  return { wave: { critters: left, home, snuck, shots }, towers: nextTowers };
}

export const waveDone = (w: Wave) => w.critters.length === 0;
