// Survey Showdown rules, kept apart so they can be tested.
export interface Slot { text: string; points: number; top: boolean }
export interface Pick { text: string; real: boolean }

const norm = (s: string) => s.trim().toLowerCase();

// A board from one question: its choices are the hidden answers, the right
// answer is the top answer, and the rest are worth less (random, falling),
// all adding up to 100 ("we asked 100 kids").
export function buildBoard(choices: string[], correct: number, rand: () => number = Math.random): Slot[] {
  const seen = new Set<string>();
  const list = choices.map((text, i) => ({ text: text.trim(), top: i === correct })).filter((c) => c.text && !seen.has(norm(c.text)) && seen.add(norm(c.text)));
  const rest = list.filter((c) => !c.top);
  const n = rest.length;
  const top = n === 0 ? 100 : Math.round(38 + rand() * 14 + (4 - Math.min(4, n)) * 8);
  // Random falling shares of what is left.
  const weights = rest.map(() => 0.6 + rand()).sort((a, b) => b - a);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let left = 100 - top;
  const pts = weights.map((w, i) => (i === n - 1 ? left : Math.max(2, Math.round(((100 - top) * w) / sum))));
  for (let i = 0; i < n - 1; i++) left -= pts[i];
  pts[n - 1] = Math.max(1, left);
  for (let i = 1; i < n; i++) if (pts[i] >= pts[i - 1]) pts[i] = Math.max(1, pts[i - 1] - 1);
  const topSlot = list.find((c) => c.top);
  const board: Slot[] = [];
  if (topSlot) board.push({ text: topSlot.text, points: top, top: true });
  rest.forEach((c, i) => board.push({ text: c.text, points: Math.min(pts[i], top - 1 - i), top: false }));
  return board.sort((a, b) => b.points - a.points);
}

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

// The computer: a sharp pick is a hidden answer (often the top one),
// otherwise anything still on the list.
export function cpuPick(list: Pick[], used: string[], board: Slot[], open: boolean[], sharp: boolean, rand: () => number = Math.random): string {
  const left = list.filter((p) => !used.includes(p.text));
  if (sharp) {
    const hidden = board.filter((_, i) => !open[i]);
    if (hidden.length) return (rand() < 0.6 ? hidden[0] : hidden[Math.floor(rand() * hidden.length)]).text;
  }
  return left[Math.floor(rand() * left.length)]?.text ?? '';
}
