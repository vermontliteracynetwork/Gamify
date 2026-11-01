// Board Game (teacher design 2026-10-31, overhauled the same day after her
// review): ONE winding path through a hexagon wilderness, like her reference
// boards (a long S-shaped trail from Start to the finish, bridges that cut
// across the bends). No numbers on the spaces. The castle at the end is built
// from the stacking Kenney hexagon building pieces she supplied, and it rises
// as the leader gets closer. Roll one die, hop that many spaces.

export const W = 65; // a Kenney hexagon tile picture is 65 x 89: top face 66 high, side 22
export const STEP = 51; // row spacing of the pointy-top grid
export const SIDE = 22; // height of one stacked block
export const ROWS = 13;
export const COLS = 15;
export const TOP = 146; // sky above the first row, for the castle towers
export const LEFT = 18;
export const WORLD_W = LEFT * 2 + COLS * W + 33;
export const WORLD_H = TOP + (ROWS - 1) * STEP + 89 + 8;

export type Cell = readonly [number, number]; // [row, col], odd rows sit half a tile right

export const tileXY = (r: number, c: number) => ({ x: LEFT + c * W + (r % 2 ? 32.5 : 0), y: TOP + r * STEP });
// The middle of a tile's top face, where a piece stands.
export const centerOf = (r: number, c: number) => { const p = tileXY(r, c); return { x: p.x + 32.5, y: p.y + 33 }; };

// The trail, start to castle gate (traced from a smooth S curve over the grid,
// so it winds like the reference boards and never touches itself).
export const PATH: Cell[] = [
  [12, 1], [12, 2], [12, 3], [11, 3], [11, 4], [10, 5], [10, 6], [11, 6], [11, 7], [12, 8], [12, 9], [12, 10], [11, 10], [11, 11], [10, 12], [10, 13], [10, 14],
  [9, 14], [8, 14], [7, 13], [7, 12], [7, 11], [8, 11], [8, 10], [8, 9], [8, 8], [7, 7], [7, 6], [7, 5], [7, 4], [8, 4], [8, 3], [8, 2], [7, 1], [6, 1],
  [5, 0], [4, 1], [3, 1], [3, 2], [3, 3], [3, 4], [4, 5], [4, 6], [4, 7], [3, 7], [2, 8], [2, 9], [2, 10], [2, 11], [3, 11], [3, 12], [3, 13], [2, 14],
];
export const FINISH = PATH.length; // stepping past the last space reaches the castle gate
export const GATE: Cell = [1, 13];
export const spotOf = (i: number) => (i >= FINISH ? centerOf(GATE[0], GATE[1]) : centerOf(PATH[i][0], PATH[i][1]));

// Bridges carry you ahead like ladders (teacher, 2026-10-31): land on the
// foot of one and walk across the planks to a later bend of the trail.
export interface Bridge { from: number; to: number; over: Cell[] }
export const BRIDGES: Bridge[] = [
  // Short and long ones, none so long it decides the game (Claudia review, 2026-10-31).
  { from: 14, to: 22, over: [[9, 11]] },
  { from: 26, to: 43, over: [[6, 7], [5, 7]] },
  { from: 29, to: 41, over: [[6, 4], [5, 4]] },
];
export const bridgeFrom = (i: number) => BRIDGES.find((b) => b.from === i) ?? null;

export type Power = 'magnet' | 'tornado' | 'time' | 'potion' | 'chest' | 'shield' | 'lightning';
export const POWERS: Power[] = ['magnet', 'tornado', 'time', 'potion', 'chest', 'shield', 'lightning'];
const POWER_WEIGHTS: Record<Power, number> = { chest: 5, magnet: 3, potion: 3, lightning: 3, time: 2, shield: 2, tornado: 1 };

function pick<T extends string>(weights: Record<T, number>, rand: () => number): T {
  const keys = Object.keys(weights) as T[];
  let r = rand() * keys.reduce((n, k) => n + weights[k], 0);
  for (const k of keys) { r -= weights[k]; if (r < 0) return k; }
  return keys[keys.length - 1];
}

// Power-up spaces come often (teacher, 2026-10-31): about one space in three,
// never on Start, a bridge end or the last few spaces, never two in a row.
// A short trail for big classes (Claudia review, 2026-10-31): everyone starts
// at the second bend, about a third of the way along.
export const SHORT_START = 17;

// `allowed`: the power-ups the teacher left on (2026-11-01); none means none.
export function placePowers(rand: () => number = Math.random, from = 0, allowed: Power[] = POWERS): Map<number, Power> {
  const out = new Map<number, Power>();
  if (!allowed.length) return out;
  const weights = Object.fromEntries(allowed.map((p) => [p, POWER_WEIGHTS[p]])) as Record<Power, number>;
  const blocked = new Set(BRIDGES.flatMap((b) => [b.from, b.to]));
  for (let i = from + 2; i < FINISH - 2; i++) {
    if (blocked.has(i) || out.has(i - 1)) continue;
    if (rand() < 0.4) out.set(i, pick(weights, rand));
  }
  // Never a quiet board: top up to at least 11 power-up spaces.
  const want = Math.round(11 * ((FINISH - from) / FINISH));
  for (let tries = 0; out.size < want && tries < 400; tries++) {
    const i = from + 2 + Math.floor(rand() * (FINISH - from - 4));
    if (blocked.has(i) || out.has(i) || out.has(i - 1) || out.has(i + 1)) continue;
    out.set(i, pick(weights, rand));
  }
  return out;
}

// What a treasure chest holds (teacher, 2026-10-31).
export type ChestPrize = { kind: 'move'; n: number } | { kind: 'start' } | { kind: 'swap' } | { kind: 'potion' } | { kind: 'reroll' } | { kind: 'mystery' };
const CHEST: [ChestPrize, number][] = [
  [{ kind: 'move', n: 2 }, 10], [{ kind: 'move', n: 3 }, 10], [{ kind: 'move', n: 5 }, 7],
  [{ kind: 'move', n: -2 }, 8], [{ kind: 'move', n: -3 }, 6], [{ kind: 'move', n: -5 }, 4],
  [{ kind: 'start' }, 2], [{ kind: 'swap' }, 6], [{ kind: 'potion' }, 8], [{ kind: 'reroll' }, 8], [{ kind: 'mystery' }, 10],
];
export function openChest(rand: () => number = Math.random): ChestPrize {
  let r = rand() * CHEST.reduce((n, [, w]) => n + w, 0);
  for (const [p, w] of CHEST) { r -= w; if (r < 0) return p; }
  return CHEST[0][0];
}
export const isBad = (p: ChestPrize) => p.kind === 'start' || (p.kind === 'move' && p.n < 0);

export const roll = (rand: () => number = Math.random, sides = 6) => 1 + Math.floor(rand() * sides);

// Trail lengths (teacher, 2026-11-01): about 10, 15, 20 or 25 rounds for
// each player. Short starts at the second bend; long and extra long use a
// smaller die (1 to 4, 1 to 3), so the walk to the castle takes longer.
export type TrailLength = 'short' | 'medium' | 'long' | 'xlong';
export const TRAILS: TrailLength[] = ['short', 'medium', 'long', 'xlong'];
export const trailOf = (v: string | undefined): TrailLength => (v === 'full' || !v ? 'medium' : (TRAILS as string[]).includes(v) ? v as TrailLength : 'medium');
export const trailStart = (tr: TrailLength) => (tr === 'short' ? SHORT_START : 0);
export const dieSides = (tr: TrailLength) => (tr === 'long' ? 4 : tr === 'xlong' ? 3 : 6);
export const clampPos = (n: number) => Math.max(0, Math.min(FINISH, n));

// ---- The world around the trail -------------------------------------------

function seeded(seed: number) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type Ground = 'grass' | 'grassFull' | 'water' | 'stone' | 'path';
export interface Prop { img: string; x: number; y: number; w: number; h: number; row: number; sway?: boolean }
export interface WorldCell { r: number; c: number; ground: Ground; i?: number }

const key = (r: number, c: number) => `${r},${c}`;
const PATH_AT = new Map(PATH.map(([r, c], i) => [key(r, c), i]));
export const pathIndexAt = (r: number, c: number) => PATH_AT.get(key(r, c));

// The castle stands on six tiles at the top right (stone, built in layers).
export const CASTLE_CELLS: Record<string, 'towerL' | 'keep' | 'towerR' | 'wallL' | 'gate' | 'wallR'> = {
  '0,12': 'towerL', '0,13': 'keep', '0,14': 'towerR', '1,12': 'wallL', '1,13': 'gate', '1,14': 'wallR',
};
const BRIDGE_CELLS = new Set(BRIDGES.flatMap((b) => b.over.map(([r, c]) => key(r, c))));

const isWater = (r: number, c: number) => r === 9 || ((r === 5 || r === 6) && c >= 2 && c <= 12);

// Sizes of the Kenney decoration pictures (scaled down so the trail stays clear).
const SIZES: Record<string, [number, number]> = {
  pineGreen_high: [30, 99], pineGreen_mid: [30, 80], pineGreen_low: [30, 64], treeGreen_high: [28, 99], treeGreen_mid: [28, 80], treeGreen_low: [28, 64],
  pineBlue_mid: [30, 80], pineBlue_high: [30, 99], treeAutumn_mid: [28, 80], treeAutumn_low: [28, 64], pineAutumn_mid: [30, 80],
  flowerRed: [8, 7], flowerYellow: [8, 7], flowerWhite: [8, 7], flowerBlue: [8, 7], bushGrass: [24, 14], bushAutumn: [24, 14], bushMagic: [24, 14],
  smallRockGrass: [14, 12], smallRockStone: [14, 12],
};

export function buildWorld() {
  const rand = seeded(7);
  const cells: WorldCell[] = [];
  const props: Prop[] = [];
  const one = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const put = (img: string, cx: number, base: number, row: number, scale = 0.62, sway = false) => {
    const [w, h] = SIZES[img]; props.push({ img, x: cx - (w * scale) / 2, y: base - h * scale, w: w * scale, h: h * scale, row, sway });
  };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = pathIndexAt(r, c);
      const { x: cx, y: cy } = centerOf(r, c);
      if (i !== undefined) { cells.push({ r, c, ground: 'path', i }); continue; }
      if (CASTLE_CELLS[key(r, c)]) { cells.push({ r, c, ground: 'stone' }); continue; }
      if (isWater(r, c) || BRIDGE_CELLS.has(key(r, c))) { cells.push({ r, c, ground: 'water' }); continue; }
      const wild = r <= 1 || (r === 2 && c < 8) || ((r === 5 || r === 6) && c > 12) || (r >= 11 && c >= 11) || (r === 12 && c >= 4 && c <= 7);
      cells.push({ r, c, ground: rand() < 0.2 ? 'grassFull' : 'grass' });
      if (wild) {
        const kind = r <= 1 && c >= 9 ? 'meadow' : one(['forest', 'forest', 'forest', 'pines', 'autumn', 'meadow']);
        if (kind === 'meadow') { for (let k = 0; k < 4; k++) put(one(['flowerRed', 'flowerYellow', 'flowerWhite', 'flowerBlue']), cx - 18 + rand() * 36, cy - 10 + rand() * 22, r, 1); if (rand() < 0.6) put(one(['bushGrass', 'bushMagic']), cx + (rand() - 0.5) * 20, cy + 8, r, 0.9); continue; }
        const trees = kind === 'pines' ? ['pineGreen_high', 'pineGreen_mid', 'pineBlue_mid', 'pineBlue_high'] : kind === 'autumn' ? ['treeAutumn_mid', 'pineAutumn_mid', 'treeAutumn_low', 'treeGreen_mid'] : ['pineGreen_high', 'treeGreen_high', 'pineGreen_mid', 'treeGreen_mid', 'pineGreen_low'];
        const spots = [[-14, -8], [12, -10], [-2, 4], [16, 8], [-16, 10]].slice(0, 2 + Math.floor(rand() * 3));
        spots.sort((a, b) => a[1] - b[1]).forEach(([dx, dy]) => put(one(trees), cx + dx + (rand() - 0.5) * 4, cy + dy + 10, r, 0.6 + rand() * 0.12, true));
        continue;
      }
      // Open meadow beside the trail: a few flowers, a bush, a pebble.
      const roll6 = rand();
      if (roll6 < 0.35) for (let k = 0; k < 3; k++) put(one(['flowerRed', 'flowerYellow', 'flowerWhite', 'flowerBlue']), cx - 16 + rand() * 32, cy - 8 + rand() * 20, r, 1);
      else if (roll6 < 0.55) put(one(['bushGrass', 'bushAutumn']), cx + (rand() - 0.5) * 16, cy + 8, r, 0.9);
      else if (roll6 < 0.65) put(one(['smallRockGrass', 'smallRockStone']), cx + (rand() - 0.5) * 16, cy + 6, r, 1);
    }
  }
  return { cells, props };
}

// ---- The castle, built in layers ------------------------------------------

export interface Block { r: number; c: number; img: string; x: number; y: number; w: number; h: number; stage: number; order: number }
const STACKS: Record<string, string[]> = {
  towerL: ['stoneWindows', 'stoneWindowLeft', 'stoneWindows'],
  keep: ['stoneDoorWindow', 'stoneWindows', 'stoneWindowBlinds', 'stoneWindows'],
  towerR: ['stoneWindows', 'stoneWindowRight', 'stoneWindows'],
  wallL: ['stoneWindowLeft', 'stoneWindows'],
  gate: ['stoneGateLeft'],
  wallR: ['stoneWindowRight', 'stoneWindows'],
};
const TOPS: Record<string, string> = { towerL: 'stoneRoofTall', keep: 'stoneRoofPointy', towerR: 'stoneRoofTall', wallL: 'stoneRing', gate: 'stoneRing', wallR: 'stoneRing' };

// Stage 1: the first layer; 2: the second; 3: the tall towers; 4: roofs and
// battlements; 5 (someone arrives): banners fly.
export function castleBlocks(): Block[] {
  const out: Block[] = [];
  let order = 0;
  for (const [k, kind] of Object.entries(CASTLE_CELLS)) {
    const [r, c] = k.split(',').map(Number);
    const { x, y } = tileXY(r, c);
    let by = y;
    STACKS[kind].forEach((img, level) => { by -= SIDE; out.push({ r, c, img, x, y: by, w: 65, h: 89, stage: level === 0 ? 1 : level === 1 ? 2 : 3, order: order++ }); });
    const top = TOPS[kind];
    if (top === 'stoneRing') out.push({ r, c, img: top, x, y: by - 9, w: 65, h: 76, stage: 4, order: order++ });
    else out.push({ r, c, img: top, x, y: by - 25, w: 65, h: 92, stage: 4, order: order++ });
    if (kind === 'towerL' || kind === 'towerR' || kind === 'keep') out.push({ r, c, img: 'banner', x: x + 23.5, y: by - 25 - 30, w: 18, h: 38, stage: 5, order: order++ });
  }
  return out;
}
// The castle rises as the leader nears it.
export const castleStage = (best: number) => (best >= FINISH ? 5 : Math.min(4, Math.floor((best / FINISH) * 5)));

// ---- The countryside around the board (teacher, 2026-11-01) ---------------
// "Make the whole purple view the board game": the world goes on past the
// trail in every direction (lakes, forests, a little village, farms, hills),
// so the board fills the whole screen and the menus float over countryside,
// never over the trail. Irregular on purpose: clumps, lakes and villages land
// where a seeded roll puts them, not in rows.
export const MARGIN = { top: 5, bottom: 4, left: 9, right: 9 };
export const COUNTRY = {
  x: LEFT - MARGIN.left * W - 40,
  y: TOP - MARGIN.top * STEP - 60,
  w: (COLS + MARGIN.left + MARGIN.right) * W + 120,
  h: (ROWS + MARGIN.top + MARGIN.bottom) * STEP + 200,
};
const VSIZE: Record<string, [number, number]> = {
  windmill_complete: [52, 66], house: [88, 70], house_small: [52, 56], tavern: [82, 76], well: [24, 30], hay: [32, 30], campingTent: [38, 42],
  logPile: [36, 32], treeRound_large: [20, 46], treeRound_small: [14, 32], rockGrey_large: [74, 92], rockBrown_large: [30, 44], tinyBuilding: [24, 26],
  fountain: [46, 46], farmland: [56, 49], sign: [14, 38], fence: [22, 32],
};
export interface CountryCell { r: number; c: number; ground: Ground | 'dirt' | 'magic' | 'sand'; lift: number }
export interface CountryProp extends Prop { village?: boolean }

export function buildCountry() {
  const rand = seeded(29);
  const one = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const cells: CountryCell[] = [];
  const props: CountryProp[] = [];
  // Blobs: lakes, forests and villages scattered around the board.
  const blobs: { r: number; c: number; rad: number; kind: 'lake' | 'forest' | 'village' | 'farm' | 'hills' | 'magic' }[] = [];
  const kinds = ['lake', 'forest', 'forest', 'village', 'farm', 'hills', 'forest', 'lake', 'magic', 'village', 'forest', 'farm'] as const;
  for (let k = 0; k < 22; k++) {
    const side = k % 4;
    const r = side === 0 ? -MARGIN.top + rand() * (MARGIN.top - 0.5) : side === 1 ? ROWS + rand() * MARGIN.bottom : -MARGIN.top + rand() * (ROWS + MARGIN.top + MARGIN.bottom);
    const c = side === 2 ? -MARGIN.left + rand() * (MARGIN.left - 0.5) : side === 3 ? COLS + rand() * MARGIN.right : -MARGIN.left + rand() * (COLS + MARGIN.left + MARGIN.right);
    blobs.push({ r, c, rad: 1.2 + rand() * 1.8, kind: kinds[k % kinds.length] });
  }
  const put = (img: string, cx: number, base: number, row: number, scale: number, sway = false, village = false) => {
    const [w, h] = VSIZE[img] ?? SIZES[img];
    const dir = VSIZE[img] ? 'village' : 'world';
    props.push({ img: `${dir}/${img}`, x: cx - (w * scale) / 2, y: base - h * scale, w: w * scale, h: h * scale, row, sway, village });
  };
  for (let r = -MARGIN.top; r < ROWS + MARGIN.bottom; r++) {
    for (let c = -MARGIN.left; c < COLS + MARGIN.right; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) continue; // the board itself
      const near = blobs.map((b) => ({ b, d: Math.hypot((b.r - r) * 0.87, b.c - c) / b.rad })).sort((a, z) => a.d - z.d)[0];
      const kind = near && near.d < 1 ? near.b.kind : null;
      const { x: cx, y: cy } = centerOf(r, c);
      // Hills lift a few tiles, so the land is not flat everywhere.
      const lift = kind === 'hills' ? Math.round((1 - near.d) * 2) : rand() < 0.06 ? 1 : 0;
      const ground = kind === 'lake' ? 'water' : kind === 'magic' ? (rand() < 0.5 ? 'magic' : 'grassFull') : kind === 'farm' && rand() < 0.4 ? 'dirt' : rand() < 0.3 ? 'grassFull' : 'grass';
      cells.push({ r, c, ground, lift });
      const base = cy + 10 - lift * SIDE;
      if (ground === 'water') continue;
      if (kind === 'forest') {
        const trees = ['pineGreen_high', 'treeGreen_high', 'pineGreen_mid', 'treeGreen_mid', 'pineBlue_high', 'treeAutumn_mid', 'pineAutumn_mid'];
        const n = 2 + Math.floor(rand() * 3);
        const spots = [[-14, -8], [12, -10], [-2, 4], [16, 8], [-16, 10]].slice(0, n).sort((a, z) => a[1] - z[1]);
        spots.forEach(([dx, dy]) => put(one(trees), cx + dx + (rand() - 0.5) * 6, base + dy, r, 0.58 + rand() * 0.16, true));
      } else if (kind === 'village') {
        const roll = rand();
        if (roll < 0.22) put(one(['house', 'tavern']), cx, base + 6, r, 0.62, false, true);
        else if (roll < 0.36) put('windmill_complete', cx, base + 4, r, 1.05, false, true);
        else if (roll < 0.5) put(one(['house_small', 'tinyBuilding']), cx + (rand() - 0.5) * 10, base + 4, r, 0.95, false, true);
        else if (roll < 0.62) put(one(['well', 'hay', 'logPile', 'campingTent', 'fountain']), cx + (rand() - 0.5) * 16, base + 4, r, 0.9, false, true);
        else put(one(['flowerRed', 'flowerYellow', 'flowerBlue']), cx + (rand() - 0.5) * 24, base, r, 1);
      } else if (kind === 'farm') {
        put(one(['hay', 'hay', 'fence', 'logPile', 'treeRound_small', 'house_small']), cx + (rand() - 0.5) * 14, base + 4, r, 0.9, false, true);
      } else if (kind === 'hills') {
        if (rand() < 0.4) put(one(['rockGrey_large', 'rockBrown_large']), cx, base + 6, r, 0.42, false, true);
        else if (rand() < 0.5) put(one(['pineGreen_mid', 'pineGreen_low']), cx + (rand() - 0.5) * 14, base, r, 0.6, true);
      } else {
        const roll = rand();
        if (roll < 0.28) for (let k = 0; k < 3; k++) put(one(['flowerRed', 'flowerYellow', 'flowerWhite', 'flowerBlue']), cx - 16 + rand() * 32, base - 14 + rand() * 18, r, 1);
        else if (roll < 0.44) put(one(['bushGrass', 'bushAutumn', 'bushMagic']), cx + (rand() - 0.5) * 16, base, r, 0.9);
        else if (roll < 0.58) put(one(['treeRound_large', 'treeRound_small', 'pineGreen_low']), cx + (rand() - 0.5) * 18, base + 2, r, 0.75, true);
        else if (roll < 0.64) put(one(['smallRockGrass', 'smallRockStone']), cx + (rand() - 0.5) * 16, base - 2, r, 1);
      }
    }
  }
  return { cells, props };
}
