// Word Scramble rules, kept apart so they can be tested.

// The letters of a word in a new order that never spells the word itself
// (unless every letter is the same).
export function scramble(word: string, rand: () => number = Math.random): number[] {
  const idx = [...word].map((_, i) => i);
  if (new Set(word).size < 2) return idx;
  for (let tries = 0; tries < 50; tries++) {
    const o = [...idx];
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    if (o.map((i) => word[i]).join('') !== word) return o;
  }
  return [...idx.slice(1), idx[0]];
}

// The tile (by index) that holds the next letter the word needs, given the
// letters already in the slots, or -1. Tiles already placed are skipped.
export function nextTile(word: string, slots: (number | null)[], letters: string[]): number {
  const at = slots.findIndex((s) => s === null);
  if (at < 0) return -1;
  const used = new Set(slots.filter((s): s is number => s !== null));
  return letters.findIndex((l, i) => !used.has(i) && l === word[at]);
}

export const spelled = (slots: (number | null)[], letters: string[]) => slots.map((s) => (s === null ? '' : letters[s])).join('');

// Every finished word scores the same 3 points: effort pays, not word length.
export const wordPoints = (_word: string) => 3;
