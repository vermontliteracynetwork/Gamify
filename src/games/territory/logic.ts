// Territory (teacher, 2026-11-24): an invasion game for the class screen.
// The pieces are named by their job, not their look, so a theme can turn the
// cats and mice into anything (spaceships and aliens next):
//   defender: the class's side in Together (cats)
//   invader: comes in through the entrance (mice out of the mouse hole)
// Everything here is pure, so it is tested (logic.test.ts).

export type Side = 'defender' | 'invader';
export type Pace = 'slow' | 'normal' | 'fast';
// Compete (teacher's words: "for every correct answer that the mice team
// makes, there's a mouse added ... and if an answer is answered correctly by
// the cat team, they defeat a mouse, and vice versa"). Default 'both': a right
// answer adds one of yours AND sends one of theirs away. 'add': only adds
// yours. 'chase': only sends one of theirs away.
export type CompeteRule = 'both' | 'add' | 'chase';

// How often a new invader comes in during Together (the teacher picks; slow
// is the default, teacher 2026-11-24 "slow everything down").
export const SPAWN_MS: Record<Pace, number> = { slow: 15000, normal: 10000, fast: 6000 };
// Together never floods the room: at most this many invaders wait in it.
// Nothing bad happens at the cap (no losing screen); the bar just shows it.
export const MAX_INVADERS = 10;
// A caught piece stays on screen this long for its chase and poof.
export const LEAVE_MS = 3200;
// Compete starts with a few of each, so both sides have something to defend.
export const COMPETE_START = 3;

export interface Piece {
  id: number;
  side: Side;
  // Which look (cat style, mouse color) this piece wears.
  look: number;
  // A spot on the floor (index into SPOTS).
  spot: number;
  born: number;
  // Set when the piece is sent away: by which piece, and when.
  leaving?: { by: number | null; at: number };
}

export interface Room {
  pieces: Piece[];
  nextId: number;
  lastSpawn: number;
  // Together: invaders caught by the class (the class goal counts these).
  caught: number;
  // Compete: defenders sent away by the invaders.
  scared: number;
  // Together: right answers that came in while the room was empty. The next
  // invader to peek out is caught straight away, so no right answer is lost.
  waiting: number;
}

// Spots on the floor in % of the room (x, y = where the feet stand). Spread
// out with a steady gap, front rows larger on screen (the stage scales by y).
export const SPOTS: [number, number][] = (() => {
  // The back and front rows have 7 spots on one step (wider than a cat's
  // footprint) and never overlap each other: 14 animals fit with no body
  // overlapping another. The two middle rows (6 spots, offset half a step)
  // take the rest. 26 spots, room for the stage cap on both sides.
  const rows = [64, 71, 79, 87];
  const step = 88 / 6;
  const out: [number, number][] = [];
  rows.forEach((y, r) => {
    const n = r === 0 || r === 3 ? 7 : 6;
    for (let i = 0; i < n; i++) out.push([6 + (i + (n === 6 ? 0.5 : 0)) * step, y]);
  });
  return out;
})();
// The floor rows (their y), back to front, and whether a spot has a close neighbour.
const ROW_YS = [...new Set(SPOTS.map((s) => s[1]))];
export function crowded(i: number, used: Set<number>): boolean {
  const [x, y] = SPOTS[i];
  const r = ROW_YS.indexOf(y);
  if ([i - 1, i + 1].some((j) => used.has(j) && SPOTS[j]?.[1] === y)) return true;
  return [...used].some((j) => {
    const [jx, jy] = SPOTS[j];
    return Math.abs(ROW_YS.indexOf(jy) - r) === 1 && Math.abs(jx - x) < 9;
  });
}

// A piece's footprint in logic % (width, height), and the gap between two
// pieces: 1 or more means their bodies do not overlap.
const FOOT_W: Record<Side, number> = { defender: 13, invader: 10 };
const FOOT_H: Record<Side, number> = { defender: 20, invader: 15 };
export function gap(i: number, side: Side, j: number, sideJ: Side): number {
  const [x, y] = SPOTS[i]; const [jx, jy] = SPOTS[j];
  const front = y >= jy ? side : sideJ;
  return Math.max(Math.abs(x - jx) / ((FOOT_W[side] + FOOT_W[sideJ]) / 2), Math.abs(y - jy) / FOOT_H[front]);
}

// The stage shows at most this many animals per side, so the room never turns
// into a pile (Art Director, 2026-11-24; teacher to confirm the number). The
// score strip still shows the true count. When a 13th arrives, the oldest one
// on show leaves (a mouse in a poof, a cat out the window).
export const STAGE_CAP = 12;
// The pieces to draw at `now`: everything still leaving, plus each side's
// newest STAGE_CAP; older ones pushed off the stage leave from the moment the
// piece that pushed them arrived, and are gone after LEAVE_MS.
export function stagePieces(pieces: Piece[], now: number, cap = STAGE_CAP): Piece[] {
  const out: Piece[] = [];
  for (const side of ['defender', 'invader'] as const) {
    const mine = pieces.filter((p) => p.side === side);
    const on = mine.filter((p) => !p.leaving).sort((a, b) => a.born - b.born || a.id - b.id);
    const over = Math.max(0, on.length - cap);
    on.forEach((p, k) => {
      if (k >= over) { out.push(p); return; }
      const at = on[k + cap].born;
      if (now - at < LEAVE_MS) out.push({ ...p, leaving: { by: null, at } });
    });
    out.push(...mine.filter((p) => p.leaving && now - p.leaving.at < LEAVE_MS));
  }
  return out;
}

// Where invaders come in (the mouse hole) and where sent-away defenders leave
// (the window), in % of the room.
export const ENTRANCE: [number, number] = [80, 59];
export const EXIT: [number, number] = [18, 22];

export const active = (r: Room, side?: Side) => r.pieces.filter((p) => !p.leaving && (!side || p.side === side));
export const count = (r: Room, side: Side) => active(r, side).length;
export const other = (s: Side): Side => (s === 'defender' ? 'invader' : 'defender');

export function newRoom(mode: 'together' | 'compete', now: number, defenders = 3, rand = Math.random): Room {
  let r: Room = { pieces: [], nextId: 1, lastSpawn: now, caught: 0, scared: 0, waiting: 0 };
  const cats = mode === 'compete' ? COMPETE_START : Math.max(2, Math.min(6, defenders));
  for (let i = 0; i < cats; i++) r = add(r, 'defender', now, rand);
  if (mode === 'compete') for (let i = 0; i < COMPETE_START; i++) r = add(r, 'invader', now, rand);
  return r;
}

// Adds one piece on a free spot (any spot once the floor is full).
export function add(r: Room, side: Side, now: number, rand = Math.random, look?: number): Room {
  // Spots taken by what is on show (the stage cap leaves the rest off screen).
  const shown = stagePieces(r.pieces, now);
  const used = new Set(shown.filter((p) => !p.leaving).map((p) => p.spot));
  const free = SPOTS.map((_, i) => i).filter((i) => !used.has(i));
  // Keep every piece's footprint clear of the others (Art Director,
  // 2026-11-24): score each free spot by its smallest footprint gap to what is
  // on show, keep the clear ones (gap >= 1) if any, pick among the best three.
  // A mouse never takes a spot that overlaps a cat unless nothing else is left.
  const on = shown.filter((p) => !p.leaving);
  const score = (i: number, only?: Side) => Math.min(Infinity, ...on.filter((p) => !only || p.side === only).map((p) => gap(i, side, p.spot, p.side)));
  const clear = free.filter((i) => score(i) >= 1);
  const noCat = side === 'invader' ? free.filter((i) => score(i, 'defender') >= 1) : free;
  // The back and front rows first: every clear spot there stays clear of the rest.
  const outer = clear.filter((i) => SPOTS[i][1] === SPOTS[0][1] || SPOTS[i][1] === SPOTS[SPOTS.length - 1][1]);
  const pool = outer.length ? outer : clear.length ? clear : noCat.length ? noCat : free.length ? free : SPOTS.map((_, i) => i);
  const best = on.length ? [...pool].sort((x, y) => score(y) - score(x)).slice(0, 3) : pool;
  const spot = best[Math.floor(rand() * best.length) % best.length];
  const looks = 3; // three defenders, three invaders (teacher, 2026-11-24)
  const piece: Piece = { id: r.nextId, side, look: look ?? Math.floor(rand() * looks) % looks, spot, born: now };
  return { ...r, pieces: [...r.pieces, piece], nextId: r.nextId + 1, lastSpawn: side === 'invader' ? now : r.lastSpawn };
}

// `side` sends one of the other side away: the oldest one in the room, chased
// by the nearest piece of `side` (or nobody, if `side` has none).
export function send(r: Room, side: Side, now: number): Room {
  const targets = active(r, other(side)).sort((a, b) => a.born - b.born || a.id - b.id);
  const target = targets[0];
  if (!target) return r;
  const [tx, ty] = SPOTS[target.spot];
  const busy = new Set(r.pieces.filter((p) => p.leaving && now - p.leaving.at < LEAVE_MS).map((p) => p.leaving!.by));
  const chasers = active(r, side).filter((p) => !busy.has(p.id));
  const chaser = (chasers.length ? chasers : active(r, side))
    .map((p) => ({ p, d: Math.hypot(SPOTS[p.spot][0] - tx, SPOTS[p.spot][1] - ty) }))
    .sort((a, b) => a.d - b.d)[0]?.p;
  return {
    ...r,
    pieces: r.pieces.map((p) => (p.id === target.id ? { ...p, leaving: { by: chaser?.id ?? null, at: now } } : p)),
    caught: r.caught + (side === 'defender' ? 1 : 0),
    scared: r.scared + (side === 'invader' ? 1 : 0),
  };
}

// Together: a right answer from any student sends a cat after a mouse. With
// no mouse in the room yet, the catch waits for the next one.
export function togetherRight(r: Room, now: number): Room {
  if (count(r, 'invader') === 0) return { ...r, waiting: r.waiting + 1 };
  return send(r, 'defender', now);
}

// Compete: a right answer from a team member, under the teacher's rule.
export function competeRight(r: Room, side: Side, rule: CompeteRule, now: number, rand = Math.random): Room {
  let next = r;
  if (rule !== 'add') next = send(next, side, now);
  if (rule !== 'chase') next = add(next, side, now, rand);
  return next;
}

// Is a new invader due? Only in Together, at the teacher's pace, under the cap.
export function spawnDue(r: Room, now: number, pace: Pace): boolean {
  return now - r.lastSpawn >= SPAWN_MS[pace] && count(r, 'invader') < MAX_INVADERS;
}

// One step of the Together clock: a new invader when due, a waiting catch as
// soon as an invader has had a moment to peek out, and old leavers cleared.
export const PEEK_MS = 1800;
export function tick(r: Room, now: number, pace: Pace, rand = Math.random): Room {
  let next = sweep(r, now);
  if (spawnDue(next, now, pace)) next = add(next, 'invader', now, rand);
  if (next.waiting > 0 && active(next, 'invader').some((p) => now - p.born >= PEEK_MS)) next = { ...send(next, 'defender', now), waiting: next.waiting - 1 };
  return next;
}

// Pieces whose chase and poof are over leave the list.
export function sweep(r: Room, now: number): Room {
  const keep = r.pieces.filter((p) => !p.leaving || now - p.leaving.at < LEAVE_MS);
  return keep.length === r.pieces.length ? r : { ...r, pieces: keep };
}

// Together ends at the class goal (or when the teacher stops it).
export const togetherDone = (r: Room, goal: number) => r.caught >= goal;

// Compete: the side with more in the room wins its territory.
export function winner(r: Room): Side | 'tie' {
  const d = count(r, 'defender'), i = count(r, 'invader');
  return d === i ? 'tie' : d > i ? 'defender' : 'invader';
}

// Teams for Compete: every student in the room gets a side, the smaller side
// first, so the teams stay even (ties go to the defenders). Students already
// on a side keep it; students who left drop off.
export function balanceTeams(pids: string[], teams: Record<string, Side> = {}): Record<string, Side> {
  const out: Record<string, Side> = {};
  for (const pid of pids) if (teams[pid]) out[pid] = teams[pid];
  for (const pid of pids) {
    if (out[pid]) continue;
    const d = Object.values(out).filter((s) => s === 'defender').length;
    const i = Object.values(out).length - d;
    out[pid] = d <= i ? 'defender' : 'invader';
  }
  return out;
}
export const swapTeam = (teams: Record<string, Side>, pid: string): Record<string, Side> => ({ ...teams, [pid]: other(teams[pid] ?? 'invader') });

// Each student's own animal look (stays the same all game).
export function lookFor(pid: string, _side?: Side): number {
  let h = 0;
  for (const c of pid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 3;
}

// New right answers since the last look, per student (the host watches each
// student's count of right answers; a lower count means a new round).
export function newRights(prev: Record<string, number>, players: { pid: string; right: number }[]): { gains: string[]; seen: Record<string, number> } {
  const gains: string[] = [];
  const seen: Record<string, number> = { ...prev };
  for (const p of players) {
    const was = prev[p.pid] ?? 0;
    for (let k = was; k < p.right; k++) gains.push(p.pid);
    seen[p.pid] = p.right;
  }
  return { gains, seen };
}
