import type { GameManifest } from '../games/types';
import type { GameTheme } from '../theme/types';
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

// A student's avatar: their own (picked or uploaded), else their first picture.
export const avatarOf = (s: { avatar?: string; picturePassword: [string, string] }) => s.avatar ?? s.picturePassword[0];
export const isUploadedAvatar = (a: string) => a.startsWith('data:');

// A 4-digit PIN nobody else on the list has (teacher, 2026-10-26).
export function newPin(taken: string[], rand: () => number = Math.random): string {
  const used = new Set(taken);
  for (let tries = 0; tries < 500; tries++) {
    const pin = String(Math.floor(rand() * 10000)).padStart(4, '0');
    if (!used.has(pin)) return pin;
  }
  return String(Math.floor(rand() * 10000)).padStart(4, '0');
}
export const PIN_RULE = /^\d{4}$/;

// Sign-in pictures can be redrawn in the Theme Builder like a game theme
// (teacher request, 2026-10-24); a class picks which design it signs in with.
export const signInManifest: GameManifest = {
  id: 'sign-in',
  name: 'Sign-in pictures',
  description: 'The pictures students tap to sign in.',
  modes: [],
  questionKinds: [],
  hasCpu: false,
  themePieces: PICTURES.map((p) => ({ id: `pic-${p.id}`, label: `${p.id[0].toUpperCase()}${p.id.slice(1)} picture`, width: 256, height: 256, hint: `Draw a ${p.id} students will know is theirs`, color: p.color })),
};

export const pictureArt = (theme: GameTheme | undefined, id: string) => theme?.pieces[`pic-${id}`]?.image;
