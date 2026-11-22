// Save the Snow Pal rules, kept apart so they can be tested.
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
// Pieces a look can lose before it is all melted.
export const PIECES = 6;

export const shown = (word: string, guessed: string[]): (string | null)[] => Array.from(word, (ch) => (guessed.includes(ch) ? ch : null));
export const solved = (word: string, guessed: string[]) => Array.from(word).every((ch) => guessed.includes(ch));
export const missCount = (word: string, guessed: string[]) => guessed.filter((g) => !word.includes(g)).length;
export const hits = (word: string, letter: string) => Array.from(word).filter((ch) => ch === letter).length;
export const hidden = (word: string, guessed: string[]) => [...new Set(Array.from(word).filter((ch) => !guessed.includes(ch)))];
// Pieces gone: misses, less the ones Hot Cocoa froze back on.
export const lost = (word: string, guessed: string[], refrozen: number) => Math.max(0, Math.min(PIECES, missCount(word, guessed) - refrozen));

// The computer's letter: a sharp guess picks a letter of the word, most
// common first; otherwise any letter it has not tried (it may still hit).
export function cpuLetter(word: string, guessed: string[], sharp: boolean, rand: () => number = Math.random): string {
  const left = hidden(word, guessed);
  if (sharp && left.length) {
    left.sort((a, b) => hits(word, b) - hits(word, a));
    return left[0];
  }
  const open = ALPHABET.filter((l) => !guessed.includes(l));
  return open[Math.floor(rand() * open.length)] ?? left[0];
}
