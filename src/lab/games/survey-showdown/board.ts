// Top Answers rules, kept apart so they can be tested.
export interface Slot { text: string; top: boolean }
export interface Pick { text: string; real: boolean }

const norm = (s: string) => s.trim().toLowerCase();

// A board from one question: its choices hide behind panels. Only the right
// answer (the top answer) scores; the rest flip over as "Not this one".
export function buildBoard(choices: string[], correct: number, rand: () => number = Math.random): Slot[] {
  const seen = new Set<string>();
  const list = choices.map((text, i) => ({ text: text.trim(), top: i === correct })).filter((c) => c.text && !seen.has(norm(c.text)) && seen.add(norm(c.text)));
  return shuffle(list, rand);
}

// Points for finding the top answer: 5 on the first pick, one less for
// every miss on this board, never below 1; Double Board makes it x2.
export const topPoints = (misses: number, double = false) => Math.max(1, 5 - misses) * (double ? 2 : 1);

// Decoys: answers from other questions that are not on this board.
export function decoys(others: string[], board: Slot[], n = 2, rand: () => number = Math.random): string[] {
  const taken = new Set(board.map((s) => norm(s.text)));
  const pool = [...new Set(others.map((o) => o.trim()).filter((o) => o && !taken.has(norm(o))))];
  const out: string[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

export function shuffle<T>(list: T[], rand: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// The computer: right (its level decides) picks the top answer, otherwise
// anything else still on the list.
export function cpuPick(list: Pick[], used: string[], board: Slot[], right: boolean, rand: () => number = Math.random): string {
  const top = board.find((s) => s.top)?.text ?? '';
  if (right && !used.includes(top)) return top;
  const left = list.filter((p) => !used.includes(p.text) && p.text !== top);
  return left[Math.floor(rand() * left.length)]?.text ?? top;
}
