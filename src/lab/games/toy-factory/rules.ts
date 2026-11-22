// Toy Factory rules, kept apart so they can be tested: machine types,
// the three cards offered after a right answer, adding and upgrading
// machines, and what a shift makes.

export type MachineType = 'duck' | 'yoyo' | 'blocks' | 'teddy' | 'ball' | 'robot' | 'rocket';
export type Rarity = 'common' | 'rare' | 'epic';
export const MACHINES: Record<MachineType, { name: string; coins: number; every: number; rarity: Rarity; color: string }> = {
  duck: { name: 'Duck Press', coins: 3, every: 1, rarity: 'common', color: '#fdfd94' },
  yoyo: { name: 'Yo-yo Spinner', coins: 4, every: 1.2, rarity: 'common', color: '#f5a08c' },
  blocks: { name: 'Block Stacker', coins: 5, every: 1.5, rarity: 'common', color: '#b4c4fb' },
  teddy: { name: 'Teddy Stitcher', coins: 7, every: 2, rarity: 'rare', color: '#d8a46b' },
  ball: { name: 'Ball Bouncer', coins: 8, every: 2, rarity: 'rare', color: '#8fe3a0' },
  robot: { name: 'Robot Builder', coins: 12, every: 2.5, rarity: 'rare', color: '#7fd6e3' },
  rocket: { name: 'Rocket Maker', coins: 22, every: 3, rarity: 'epic', color: '#ef7d96' },
};
export const SLOTS = 5;
export const MAX_LEVEL = 3;
export const SHIFT = 6; // seconds

export interface Machine { id: number; type: MachineType; level: number }
export type Card = { kind: 'new'; type: MachineType } | { kind: 'upgrade'; id: number; type: MachineType };

export const levelMult = (level: number) => 1 + 0.6 * (level - 1);
export const coinsPerTick = (m: Machine, surge = 1) => Math.round(MACHINES[m.type].coins * levelMult(m.level) * surge);

const byRarity = (r: Rarity) => (Object.keys(MACHINES) as MachineType[]).filter((t) => MACHINES[t].rarity === r);
export function randomType(rand: () => number = Math.random, min: Rarity = 'common'): MachineType {
  const r = rand();
  const rarity: Rarity = min === 'epic' || r < 0.1 ? 'epic' : min === 'rare' || r < 0.4 ? 'rare' : 'common';
  const list = byRarity(rarity);
  return list[Math.floor(rand() * list.length)];
}

// Three cards: new machines while there is room, and level-ups for
// machines already on the floor (a full floor only offers level-ups).
export function drawCards(floor: Machine[], rand: () => number = Math.random): Card[] {
  const ups = floor.filter((m) => m.level < MAX_LEVEL);
  const out: Card[] = [];
  let guard = 0;
  while (out.length < 3 && guard++ < 50) {
    const full = floor.length >= SLOTS;
    if ((full || (ups.length && rand() < 0.3)) && ups.length) {
      const m = ups[Math.floor(rand() * ups.length)];
      if (!out.some((c) => c.kind === 'upgrade' && c.id === m.id)) out.push({ kind: 'upgrade', id: m.id, type: m.type });
    } else if (!full) {
      const t = randomType(rand);
      if (!out.some((c) => c.kind === 'new' && c.type === t)) out.push({ kind: 'new', type: t });
    } else break;
  }
  return out;
}

export function applyCard(floor: Machine[], card: Card, nextId: number): Machine[] {
  if (card.kind === 'upgrade') return floor.map((m) => (m.id === card.id ? { ...m, level: Math.min(MAX_LEVEL, m.level + 1) } : m));
  if (floor.length >= SLOTS) return floor;
  return [...floor, { id: nextId, type: card.type, level: 1 }];
}

// What one machine makes in a shift of `secs` seconds.
export const shiftCoins = (m: Machine, secs: number, speed = 1, surge = 1) => Math.floor((secs * speed) / MACHINES[m.type].every) * coinsPerTick(m, surge);

// How much a card adds to a shift (the computer picks the best).
export function cardValue(floor: Machine[], card: Card): number {
  if (card.kind === 'new') return shiftCoins({ id: 0, type: card.type, level: 1 }, SHIFT);
  const m = floor.find((x) => x.id === card.id);
  return m ? shiftCoins({ ...m, level: m.level + 1 }, SHIFT) - shiftCoins(m, SHIFT) : 0;
}
export const bestCard = (floor: Machine[], cards: Card[]) => cards.reduce((b, c) => (cardValue(floor, c) > cardValue(floor, b) ? c : b), cards[0]);
