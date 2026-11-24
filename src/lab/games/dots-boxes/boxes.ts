// Box Builder (dots and boxes) rules, kept apart so they can be tested.
// A board is R rows by C columns of boxes. Lines are named 'h-r-c' (the top
// edge of box r,c; r runs 0..R) and 'v-r-c' (the left edge; c runs 0..C).
export type Lines = Record<string, string>; // line id -> the player who drew it
export interface Size { R: number; C: number }

export function sizeFor(teams: number): Size {
  return teams <= 2 ? { R: 3, C: 4 } : teams === 3 ? { R: 4, C: 4 } : { R: 4, C: 5 };
}

export function allLines({ R, C }: Size): string[] {
  const out: string[] = [];
  for (let r = 0; r <= R; r++) for (let c = 0; c < C; c++) out.push(`h-${r}-${c}`);
  for (let r = 0; r < R; r++) for (let c = 0; c <= C; c++) out.push(`v-${r}-${c}`);
  return out;
}
export const allBoxes = ({ R, C }: Size) => Array.from({ length: R * C }, (_, i) => `${Math.floor(i / C)}-${i % C}`);

export function sides(box: string): string[] {
  const [r, c] = box.split('-').map(Number);
  return [`h-${r}-${c}`, `h-${r + 1}-${c}`, `v-${r}-${c}`, `v-${r}-${c + 1}`];
}

// The (one or two) boxes a line borders.
export function boxesOf(line: string, { R, C }: Size): string[] {
  const [k, rs, cs] = line.split('-'); const r = +rs, c = +cs;
  const out: string[] = [];
  if (k === 'h') { if (r > 0) out.push(`${r - 1}-${c}`); if (r < R) out.push(`${r}-${c}`); }
  else { if (c > 0) out.push(`${r}-${c - 1}`); if (c < C) out.push(`${r}-${c}`); }
  return out;
}

export const count = (lines: Lines, box: string) => sides(box).filter((s) => lines[s]).length;

// Boxes this line would close.
export function closes(lines: Lines, line: string, size: Size): string[] {
  if (lines[line]) return [];
  return boxesOf(line, size).filter((b) => count(lines, b) === 3);
}

export const open = (lines: Lines, size: Size) => allLines(size).filter((l) => !lines[l]);

// Unclaimed boxes with three sides drawn (for the paint bucket).
export const threeSided = (lines: Lines, claimed: Record<string, unknown>, size: Size) => allBoxes(size).filter((b) => !claimed[b] && count(lines, b) === 3);

// Unclaimed boxes with two or three sides drawn (for the paint bucket).
export const paintable = (lines: Lines, claimed: Record<string, unknown>, size: Size) => allBoxes(size).filter((b) => !claimed[b] && count(lines, b) >= 2 && count(lines, b) < 4);

// A line that hands nobody a box: it closes none and leaves no box with three sides.
export const safe = (lines: Lines, l: string, size: Size) => !closes(lines, l, size).length && boxesOf(l, size).every((b) => count(lines, b) < 2);

// Lines that can be erased or shaken: drawn, and not the side of a claimed box.
export function loose(lines: Lines, claimed: Record<string, unknown>, size: Size): string[] {
  return Object.keys(lines).filter((l) => boxesOf(l, size).every((b) => !claimed[b]));
}

// The computer: close a box if it can; else a line that hands nobody a box;
// else whatever gives away the least. `sharp` false sometimes plays at random.
export function cpuLine(lines: Lines, size: Size, sharp = true, rand: () => number = Math.random): string | null {
  const o = open(lines, size);
  if (!o.length) return null;
  const pick = (a: string[]) => a[Math.floor(rand() * a.length)];
  if (!sharp && rand() < 0.5) return pick(o);
  const win = o.filter((l) => closes(lines, l, size).length);
  if (win.length) return pick(win);
  const safe = o.filter((l) => boxesOf(l, size).every((b) => count(lines, b) < 2));
  if (safe.length) return pick(safe);
  return pick(o);
}

// Earthquake: move up to `n` loose lines to empty gaps that close no box.
export function quake(lines: Lines, claimed: Record<string, unknown>, size: Size, n = 3, rand: () => number = Math.random): { lines: Lines; moved: [string, string][] } {
  const next = { ...lines };
  const moved: [string, string][] = [];
  const from = loose(next, claimed, size).sort(() => rand() - 0.5).slice(0, n);
  for (const l of from) {
    const owner = next[l]; delete next[l];
    const spots = open(next, size).filter((s) => s !== l && safe(next, s, size));
    if (!spots.length) { next[l] = owner; continue; }
    const to = spots[Math.floor(rand() * spots.length)];
    next[to] = owner; moved.push([l, to]);
  }
  return { lines: next, moved };
}
