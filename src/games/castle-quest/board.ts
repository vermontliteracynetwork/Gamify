// Castle Quest board (teacher design, 2026-10-31): a winding path of hexagon
// tiles from the start (bottom left) to the castle (top left). Roll one die
// and hop that many tiles; bridges carry you ahead like ladders; power-up
// tiles come often. All sizes are in tile pixels (Kenney hexagon tiles).

export const COLS = 9;
export const ROWS = 6;
export const TILES = COLS * ROWS; // tiles 0..53; reaching 54 is the castle
export const FINISH = TILES;
export const HEX_W = 65; // a tile picture is 65 x 89 (the top face plus its side)
export const HEX_H = 89;
export const ROW_STEP = 56.3; // pointy-top hexagons, 3/4 of the face height
export const PAD_TOP = 104; // room for the castle above the last row
export const PAD_X = 10;
export const BOARD_W = COLS * HEX_W + HEX_W / 2 + PAD_X * 2;
export const BOARD_H = PAD_TOP + (ROWS - 1) * ROW_STEP + HEX_H + 6;

export interface Spot { row: number; col: number; x: number; y: number } // x, y: the middle of the tile's top face

export function spotOf(i: number): Spot {
  if (i >= FINISH) return { row: ROWS, col: 0, ...CASTLE };
  const row = Math.floor(i / COLS);
  const c = i % COLS;
  const col = row % 2 === 0 ? c : COLS - 1 - c;
  const x = PAD_X + col * HEX_W + (row % 2 ? HEX_W / 2 : 0) + HEX_W / 2;
  const top = PAD_TOP + (ROWS - 1 - row) * ROW_STEP;
  return { row, col, x, y: top + 37 };
}
// The castle sits above the last tile (row 5 runs right to left and ends at the left).
export const CASTLE = { x: PAD_X + HEX_W, y: 52 };

// Bridges: from a tile up to one two rows higher, like ladders.
export const BRIDGES: [number, number][] = [[2, 20], [11, 29], [25, 43], [32, 50]];
export const bridgeFrom = (i: number) => BRIDGES.find(([a]) => a === i)?.[1] ?? null;

export type Power = 'magnet' | 'tornado' | 'time' | 'potion' | 'chest' | 'shield' | 'lightning';
export const POWERS: Power[] = ['magnet', 'tornado', 'time', 'potion', 'chest', 'shield', 'lightning'];
const POWER_WEIGHTS: Record<Power, number> = { chest: 5, magnet: 3, potion: 3, lightning: 3, time: 2, shield: 2, tornado: 1 };

function pick<T extends string>(weights: Record<T, number>, rand: () => number): T {
  const keys = Object.keys(weights) as T[];
  let r = rand() * keys.reduce((n, k) => n + weights[k], 0);
  for (const k of keys) { r -= weights[k]; if (r < 0) return k; }
  return keys[keys.length - 1];
}

// Power-up tiles come often (teacher, 2026-10-31): about one tile in three,
// never on the start, a bridge end or the last few tiles, never two in a row.
export function placePowers(rand: () => number = Math.random): Map<number, Power> {
  const out = new Map<number, Power>();
  const blocked = new Set(BRIDGES.flat());
  for (let i = 1; i < TILES - 2; i++) {
    if (blocked.has(i) || out.has(i - 1)) continue;
    if (rand() < 0.42) out.set(i, pick(POWER_WEIGHTS, rand));
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

export const roll = (rand: () => number = Math.random) => 1 + Math.floor(rand() * 6);
export const clampPos = (n: number) => Math.max(0, Math.min(FINISH, n));

// The castle grows as the leader nears it: ruins, a tower, open walls, a
// small castle, then the big castle (built when someone arrives).
export const CASTLE_STAGES = ['medieval_ruins', 'medieval_tower', 'medieval_openCastle', 'medieval_smallCastle', 'medieval_largeCastle'];
export const castleStage = (best: number) => (best >= FINISH ? 4 : Math.min(3, Math.floor((best / FINISH) * 4)));
