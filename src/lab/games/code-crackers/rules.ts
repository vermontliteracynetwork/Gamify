// Code Crackers rules, kept apart so they can be tested. A right answer
// opens a data box: crystals most of the time, sometimes a hack, where you
// guess another team's three-symbol password to borrow some of theirs.

export const SYMBOLS = ['star', 'heart', 'moon', 'bolt', 'drop', 'leaf'] as const;
export type Sym = (typeof SYMBOLS)[number];
export type Code = [Sym, Sym, Sym];

export type DataBox =
  | { kind: 'crystals'; n: number }
  | { kind: 'mega'; n: number }
  | { kind: 'hack' }
  | { kind: 'virus' }
  | { kind: 'empty' };

const pick = <T,>(list: readonly T[], rand: () => number) => list[Math.floor(rand() * list.length)];

// Three different symbols.
export function makeCode(rand: () => number = Math.random): Code {
  const left = [...SYMBOLS];
  const out: Sym[] = [];
  for (let i = 0; i < 3; i++) { const k = Math.floor(rand() * left.length); out.push(left[k]); left.splice(k, 1); }
  return out as Code;
}
export const sameCode = (a: Code, b: Code) => a.every((s, i) => s === b[i]);

// The real code among decoys, in a shuffled order. Decoys share a symbol or
// two with the real one, so it takes a careful look.
export function codeChoices(real: Code, n = 4, rand: () => number = Math.random): Code[] {
  const out: Code[] = [real];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const c = [...real] as Code;
    const swaps = 1 + Math.floor(rand() * 2);
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(rand() * 3);
      const free = SYMBOLS.filter((x) => !c.includes(x));
      if (rand() < 0.4) { const j = (i + 1) % 3; [c[i], c[j]] = [c[j], c[i]]; } else c[i] = pick(free, rand);
    }
    if (!out.some((o) => sameCode(o, c))) out.push(c);
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export interface RollOpts { others: boolean; mine: number }
export function rollBox(o: RollOpts, rand: () => number = Math.random): DataBox {
  const list: [number, () => DataBox][] = [
    [56, () => ({ kind: 'crystals', n: 10 + 5 * Math.floor(rand() * 7) })],
    [8, () => ({ kind: 'mega', n: 60 + 10 * Math.floor(rand() * 4) })],
    [o.others ? 20 : 0, () => ({ kind: 'hack' })],
    [o.mine > 0 ? 6 : 0, () => ({ kind: 'virus' })],
    [10, () => ({ kind: 'empty' })],
  ];
  const total = list.reduce((s, [w]) => s + w, 0);
  let r = rand() * total;
  for (const [w, make] of list) { if (w && r < w) return make(); r -= w; }
  return { kind: 'crystals', n: 20 };
}
export const rollBoxes = (o: RollOpts, count = 5, rand: () => number = Math.random) => Array.from({ length: count }, () => rollBox(o, rand));

// A hack borrows a quarter of the target's crystals (fives, at least 5).
export const borrowOf = (theirs: number) => Math.min(theirs, Math.max(5, Math.round(theirs / 4 / 5) * 5));
// A virus nibbles a tenth of yours (at least 5).
export const virusOf = (mine: number) => Math.min(mine, Math.max(5, Math.round(mine / 10 / 5) * 5));
