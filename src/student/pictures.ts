import { Bicycle, Cat, Dog, Fish, Flower, Heart, Moon, Rocket, Star, Sun, Tree, Umbrella, type Icon } from '@phosphor-icons/react';

// Picture sign-in for young students: each student has two pictures, tapped
// in order. Icons only, so pre-readers can sign in.
export const PICTURES: { id: string; icon: Icon; color: string }[] = [
  { id: 'cat', icon: Cat, color: '#fdfd94' }, { id: 'dog', icon: Dog, color: '#ed9d75' }, { id: 'fish', icon: Fish, color: '#b4c4fb' },
  { id: 'star', icon: Star, color: '#fdfd94' }, { id: 'heart', icon: Heart, color: '#e5635f' }, { id: 'sun', icon: Sun, color: '#ffd166' },
  { id: 'moon', icon: Moon, color: '#cdd7fb' }, { id: 'tree', icon: Tree, color: '#ddfcc6' }, { id: 'bike', icon: Bicycle, color: '#ed9d75' },
  { id: 'rocket', icon: Rocket, color: '#b4c4fb' }, { id: 'flower', icon: Flower, color: '#f6a5c0' }, { id: 'umbrella', icon: Umbrella, color: '#ddfcc6' },
];
export const picture = (id: string) => PICTURES.find((p) => p.id === id) ?? PICTURES[0];

// Two different pictures, preferring pairs nobody in the class has yet.
export function newPicturePassword(taken: [string, string][], rand: () => number = Math.random): [string, string] {
  const used = new Set(taken.map((p) => p.join('+')));
  for (let tries = 0; tries < 200; tries++) {
    const a = PICTURES[Math.floor(rand() * PICTURES.length)].id;
    const b = PICTURES[Math.floor(rand() * PICTURES.length)].id;
    if (a !== b && !used.has(`${a}+${b}`)) return [a, b];
  }
  return [PICTURES[0].id, PICTURES[1].id];
}
