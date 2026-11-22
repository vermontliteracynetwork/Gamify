// Letter Lock rules, kept apart so they can be tested: a five-letter word,
// green for the right letter in the right spot, yellow for a letter that is
// in the word somewhere else, gray for a letter that is not in it.

export type Mark = 'g' | 'y' | 'x';

export function grade(guess: string, target: string): Mark[] {
  const out: Mark[] = Array(guess.length).fill('x');
  const left: Record<string, number> = {};
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) out[i] = 'g';
    else left[target[i]] = (left[target[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (out[i] === 'g') continue;
    if (left[guess[i]]) { out[i] = 'y'; left[guess[i]]--; }
  }
  return out;
}

// The color each keyboard key earns: green beats yellow beats gray.
export function keyMarks(rows: { word: string; marks: Mark[] }[]): Record<string, Mark> {
  const rank = { g: 3, y: 2, x: 1 } as const;
  const out: Record<string, Mark> = {};
  for (const r of rows) [...r.word].forEach((l, i) => { const m = r.marks[i]; if (!out[l] || rank[m] > rank[out[l]]) out[l] = m; });
  return out;
}

// A word that would have earned the same colors on every guess so far.
export const fits = (word: string, rows: { word: string; marks: Mark[] }[]) => rows.every((r) => grade(r.word, word).join('') === r.marks.join(''));

// Fewer tries score more: 6 for the first row down to 1.
export const crackPoints = (tries: number) => Math.max(1, 7 - tries);
