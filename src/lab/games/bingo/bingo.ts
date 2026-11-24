// Bingo rules, kept apart so they can be tested. A card is 25 answers in
// reading order; the middle (12) is the free star.
export const FREE = 12;
export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const LINES: number[][] = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

function shuffle<T>(a: T[], rand: () => number): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// A card from the set's answers. With 24 or more answers every square is
// different; a small set repeats its answers evenly (any matching square
// counts), never twice side by side in a row when it can help it.
export function makeCard(answers: string[], rand: () => number = Math.random): string[] {
  const uniq = [...new Map(answers.map((a) => [norm(a), a.trim()])).values()];
  if (!uniq.length) return Array(25).fill('');
  let cells: string[];
  if (uniq.length >= 24) cells = shuffle(uniq, rand).slice(0, 24);
  else {
    cells = [];
    while (cells.length < 24) cells.push(...shuffle(uniq, rand));
    cells = cells.slice(0, 24);
    for (let tries = 0; tries < 60; tries++) {
      const i = cells.findIndex((v, k) => k % 5 !== 4 && k + 1 < 24 && norm(v) === norm(cells[k + 1]));
      if (i < 0) break;
      const j = Math.floor(rand() * 24); [cells[i], cells[j]] = [cells[j], cells[i]];
    }
  }
  return [...cells.slice(0, FREE), '', ...cells.slice(FREE)];
}

export const freshMarks = () => Array.from({ length: 25 }, (_, i) => i === FREE);

// Unmarked squares that match an answer.
export function matches(card: string[], marks: boolean[], answer: string): number[] {
  const a = norm(answer);
  return card.map((v, i) => (!marks[i] && i !== FREE && norm(v) === a ? i : -1)).filter((i) => i >= 0);
}

// Lines just finished (indexes into LINES) that were not counted before.
export function newLines(marks: boolean[], counted: number[]): number[] {
  return LINES.map((l, i) => (l.every((k) => marks[k]) && !counted.includes(i) ? i : -1)).filter((i) => i >= 0);
}

// The square that brings a line closest to done (the computer's free daub).
export function bestSquare(marks: boolean[], rand: () => number = Math.random): number {
  let best = -1, score = -1;
  for (const i of shuffle([...Array(25).keys()], rand)) {
    if (marks[i]) continue;
    const s = Math.max(...LINES.filter((l) => l.includes(i)).map((l) => l.filter((k) => marks[k]).length));
    if (s > score) { score = s; best = i; }
  }
  return best;
}

// The unmarked squares of the line closest to done, for a lucky call.
export function nearSquares(marks: boolean[]): number[] {
  let best: number[] = [], most = -1;
  for (const l of LINES) {
    const have = l.filter((k) => marks[k]).length;
    if (have < 5 && have > most) { most = have; best = l.filter((k) => !marks[k]); }
  }
  return best;
}

// Card Shuffle: the unmarked answers jump to new squares; marks stay put.
export function shuffleOpen(card: string[], marks: boolean[], rand: () => number = Math.random): string[] {
  const spots = card.map((_, i) => i).filter((i) => !marks[i] && i !== FREE);
  const vals = shuffle(spots.map((i) => card[i]), rand);
  const out = [...card];
  spots.forEach((s, k) => { out[s] = vals[k]; });
  return out;
}

export function neighbors(i: number): number[] {
  const r = Math.floor(i / 5), c = i % 5;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && a < 5 && b >= 0 && b < 5).map(([a, b]) => a * 5 + b);
}
