import type { PoolSet } from '../engine/picker';
import { isPlayable } from '../engine/questions';

// Word games use the picked sets' answers as their words, with the question
// as the clue. Answers that are not one plain word (numbers, phrases) are
// left out; when too few are left, a starter list of early-reader words
// fills in so a game never stalls.

export interface WordPair { word: string; clue: string }

export const STARTER_WORDS: WordPair[] = [
  ['CAT', 'A pet that says meow'], ['DOG', 'A pet that barks'], ['SUN', 'It shines in the sky in the day'], ['MOON', 'It shines in the sky at night'],
  ['FISH', 'It swims and has fins'], ['FROG', 'It hops and says ribbit'], ['TREE', 'It has a trunk and leaves'], ['STAR', 'It twinkles at night'],
  ['CAKE', 'A sweet treat for a birthday'], ['BOOK', 'You read it'], ['DUCK', 'A bird that quacks'], ['RAIN', 'Water falling from clouds'],
  ['SNOW', 'Cold white flakes'], ['BEAR', 'A big furry animal that sleeps in winter'], ['BIRD', 'It has wings and feathers'], ['SHIP', 'A big boat'],
  ['APPLE', 'A red or green fruit'], ['HOUSE', 'A home to live in'], ['TRAIN', 'It runs on tracks'], ['CLOUD', 'White and fluffy in the sky'],
  ['HORSE', 'An animal you can ride'], ['PLANT', 'It grows in soil'], ['SMILE', 'A happy face'], ['BREAD', 'You make toast with it'],
  ['CHAIR', 'You sit on it'], ['GRASS', 'Green and grows on the ground'], ['LIGHT', 'It helps you see in the dark'], ['TIGER', 'A big cat with stripes'],
  ['WHALE', 'The biggest animal in the sea'], ['ZEBRA', 'A horse-like animal with stripes'], ['PIZZA', 'A round food with cheese'], ['MUSIC', 'Songs and sounds'],
  ['RIVER', 'Water that flows to the sea'], ['BEACH', 'Sand by the sea'], ['PAPER', 'You write on it'], ['TRUCK', 'A big car that carries things'],
  ['GARDEN', 'Where flowers and vegetables grow'], ['ROCKET', 'It flies to space'], ['FRIEND', 'Someone you like to play with'], ['SCHOOL', 'Where you learn'],
  ['PENCIL', 'You write and draw with it'], ['RABBIT', 'It has long ears and hops'], ['TURTLE', 'It carries its shell'], ['PLANET', 'Earth is one'],
].map(([word, clue]) => ({ word, clue }));

export const clean = (s: string) => s.trim().toUpperCase().replace(/[^A-Z]/g, '');

export function wordsFrom(pool: PoolSet[], { min = 3, max = 10, length }: { min?: number; max?: number; length?: number } = {}, need = 8): WordPair[] {
  const fits = (w: string) => (length ? w.length === length : w.length >= min && w.length <= max);
  const seen = new Set<string>();
  const out: WordPair[] = [];
  for (const p of pool) for (const q of p.set.questions) {
    if (q.kind !== 'mc' || !isPlayable(q)) continue;
    const raw = q.choices[q.correctIndex] ?? '';
    if (!/^[A-Za-z][A-Za-z'-]*$/.test(raw.trim())) continue;
    const w = clean(raw);
    if (!fits(w) || seen.has(w)) continue;
    seen.add(w); out.push({ word: w, clue: q.prompt });
  }
  if (out.length < need) for (const s of STARTER_WORDS) if (fits(s.word) && !seen.has(s.word)) { seen.add(s.word); out.push(s); }
  // Shuffled so every game is different.
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
