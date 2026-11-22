// Spot the Match rules, kept apart so they can be tested.
export interface Tile { id: number; text: string; right: boolean }
export interface PairTile { id: number; pair: string; kind: 'q' | 'a'; text: string }

const norm = (s: string) => s.trim().toLowerCase();

export function shuffle<T>(list: T[], rand: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// The ring around a question: its right answer, its other choices, then
// answers from other questions until there are `count`, all different.
export function ringTiles(choices: string[], correct: number, others: string[], count = 6, rand: () => number = Math.random): Tile[] {
  const seen = new Set<string>();
  const out: Tile[] = [];
  const add = (text: string, right: boolean) => { const t = text.trim(); if (!t || seen.has(norm(t)) || out.length >= count) return; seen.add(norm(t)); out.push({ id: out.length, text: t, right }); };
  add(choices[correct] ?? '', true);
  choices.forEach((ch, i) => i !== correct && add(ch, false));
  shuffle(others, rand).forEach((o) => add(o, false));
  return shuffle(out, rand).map((t, i) => ({ ...t, id: i }));
}

// Pairs: a sign for each question and a pad for its answer, mixed up.
export function pairTiles(qs: { id: string; prompt: string; answer: string }[], rand: () => number = Math.random): PairTile[] {
  const tiles: PairTile[] = [];
  qs.forEach((q) => { tiles.push({ id: 0, pair: q.id, kind: 'q', text: q.prompt }); tiles.push({ id: 0, pair: q.id, kind: 'a', text: q.answer }); });
  return shuffle(tiles, rand).map((t, i) => ({ ...t, id: i }));
}
export const isPair = (a: PairTile, b: PairTile) => a.pair === b.pair && a.kind !== b.kind;

// A quick tap earns up to two bonus points.
export const speedBonus = (left: number, total: number) => (total <= 0 ? 0 : left / total > 0.66 ? 2 : left / total > 0.33 ? 1 : 0);

// Spots around an oval for a ring of tiles (0..1 of the board), starting at the top.
export function ringSpots(n: number, rx = 0.36, ry = 0.36, turn = 0): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + turn + (i / n) * Math.PI * 2; return { x: 0.5 + Math.cos(a) * rx, y: 0.5 + Math.sin(a) * ry }; });
}
