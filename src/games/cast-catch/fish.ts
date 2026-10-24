// The fish in Cast and Catch (logic borrowed from the Dashboard's Doc
// Fishing: a better cast means rarer fish), drawn in code, each with a
// true, kid-sized fact. Rarity 0 common, 1 uncommon, 2 rare, 3 legendary.
export interface FishKind { id: string; name: string; rarity: 0 | 1 | 2 | 3; cm: [number, number]; body: string; fin: string; stripe?: string; fact: string }

export const FISH: FishKind[] = [
  { id: 'perch', name: 'Yellow Perch', rarity: 0, cm: [15, 30], body: '#f2d16b', fin: '#e07a3a', stripe: '#5b6b2e', fact: 'Perch have stripes to hide among water plants.' },
  { id: 'bluegill', name: 'Bluegill', rarity: 0, cm: [10, 25], body: '#7fa7d9', fin: '#e8a24a', fact: 'Bluegills make nests in the sand for their eggs.' },
  { id: 'sunfish', name: 'Pumpkinseed Sunfish', rarity: 0, cm: [8, 20], body: '#f5b04c', fin: '#3e8e7e', fact: 'A sunfish guards its nest and chases away bigger fish.' },
  { id: 'guppy', name: 'Guppy', rarity: 0, cm: [2, 5], body: '#f59ac0', fin: '#7b6cf0', fact: 'A guppy is so small it could sit on your fingertip.' },
  { id: 'trout', name: 'Rainbow Trout', rarity: 1, cm: [30, 60], body: '#b8c7a9', fin: '#7d8f6a', stripe: '#e57aa5', fact: 'Rainbow trout have a pink stripe along each side.' },
  { id: 'brooktrout', name: 'Brook Trout', rarity: 1, cm: [20, 40], body: '#6f8b5e', fin: '#e46a3d', fact: 'Brook trout love cold, clean streams, like the ones in Vermont.' },
  { id: 'bass', name: 'Bigmouth Bass', rarity: 1, cm: [25, 60], body: '#7fa36a', fin: '#4b6b3c', stripe: '#3a5230', fact: 'A bass can open its mouth wide enough to gulp a frog.' },
  { id: 'puffer', name: 'Pufferfish', rarity: 1, cm: [10, 35], body: '#e8d58a', fin: '#a88c3a', fact: 'A pufferfish blows itself up like a balloon when it is scared.' },
  { id: 'clown', name: 'Clownfish', rarity: 2, cm: [6, 11], body: '#f3803a', fin: '#ffffff', stripe: '#ffffff', fact: 'Clownfish live safely inside stinging sea anemones.' },
  { id: 'tang', name: 'Blue Tang', rarity: 2, cm: [12, 30], body: '#3f6fd6', fin: '#f2d14b', fact: 'A blue tang can change to a lighter color when it is resting.' },
  { id: 'swordfish', name: 'Swordfish', rarity: 3, cm: [120, 300], body: '#5b6fa3', fin: '#33406b', fact: 'A swordfish uses its long bill to swipe at its food.' },
  { id: 'goldfish', name: 'Golden Koi', rarity: 3, cm: [40, 90], body: '#f6c544', fin: '#f08a2e', stripe: '#ffffff', fact: 'Koi can live for more than 50 years in a pond.' },
];

export const RARITY_POINTS = [10, 25, 50, 100];

// How good a cast was: the meter's sweet spot sits in the middle.
export function castQuality(power: number): 0 | 1 | 2 | 3 {
  const off = Math.abs(power - 0.62);
  return off < 0.05 ? 3 : off < 0.12 ? 2 : off < 0.24 ? 1 : 0;
}

// Better casts pull from rarer fish.
export function catchFish(quality: 0 | 1 | 2 | 3, rand: () => number = Math.random): { fish: FishKind; cm: number } {
  const r = rand();
  const table: number[][] = [[0.8, 0.2, 0, 0], [0.55, 0.38, 0.07, 0], [0.3, 0.45, 0.2, 0.05], [0.1, 0.4, 0.35, 0.15]];
  const odds = table[quality];
  let acc = 0, rarity = 0;
  for (let i = 0; i < 4; i++) { acc += odds[i]; if (r < acc) { rarity = i; break; } }
  const pool = FISH.filter((f) => f.rarity === rarity);
  const fish = pool[Math.floor(rand() * pool.length)];
  const cm = Math.round(fish.cm[0] + rand() * (fish.cm[1] - fish.cm[0]));
  return { fish, cm };
}

export const pointsFor = (fish: FishKind, cm: number) => RARITY_POINTS[fish.rarity] + Math.round(cm / 5);
